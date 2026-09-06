import { supabase } from "../lib/supabase";
import { isOfflineUser } from "../lib/offlineAuth";
import {
  createTask,
  getNextRecurringDate,
  normalizeTask,
} from "../domain/tasks";
import { storage } from "../platform/storage";
import {
  cloudRepository,
  isCloudSyncEnabled,
} from "./cloudRepository";

const STORAGE_PREFIX = "focus_tasks_v2";
const LEGACY_OFFLINE_KEY = "todo_offline_tasks";
const TOMBSTONE_PREFIX = "focus_task_tombstones_v1";

const keyFor = (user) => `${STORAGE_PREFIX}:${user.id}`;
const tombstoneKeyFor = (user) => `${TOMBSTONE_PREFIX}:${user.id}`;

const readTombstones = (user) => {
  try {
    return JSON.parse(storage.getItem(tombstoneKeyFor(user)) || "[]");
  } catch {
    return [];
  }
};

const writeTombstones = (user, tombstones) =>
  storage.setItem(tombstoneKeyFor(user), JSON.stringify(tombstones));

const readTasks = (user) => {
  try {
    const stored = JSON.parse(storage.getItem(keyFor(user)) || "[]");
    if (stored.length) return stored.map(normalizeTask);

    if (isOfflineUser(user)) {
      const legacy = JSON.parse(storage.getItem(LEGACY_OFFLINE_KEY) || "[]");
      if (legacy.length) {
        const migrated = legacy.map(normalizeTask);
        writeTasks(user, migrated);
        return migrated;
      }
    }
  } catch {
    return [];
  }

  return [];
};

const writeTasks = (user, tasks) => {
  storage.setItem(keyFor(user), JSON.stringify(tasks));
  return tasks;
};

const mergeRemoteTasks = (localTasks, remoteTasks) => {
  const localByRemoteId = new Map(
    localTasks
      .filter((task) => task.remote_id !== undefined)
      .map((task) => [String(task.remote_id), task]),
  );
  const mergedRemoteIds = new Set(remoteTasks.map((task) => String(task.id)));

  const remote = remoteTasks.map((task) => {
    const local = localByRemoteId.get(String(task.id));
    return normalizeTask({
      ...local,
      ...task,
      id: local?.id || `remote-${task.id}`,
      remote_id: task.id,
      due_date: local?.due_date || "",
      priority: local?.priority || "none",
      notes: local?.notes || "",
      tags: local?.tags || [],
      completed_at: local?.completed_at || "",
    });
  });

  const localOnly = localTasks.filter(
    (task) =>
      task.remote_id === undefined || !mergedRemoteIds.has(String(task.remote_id)),
  );

  return [...remote, ...localOnly];
};

const mergeCloudTasks = (localTasks, remoteTasks) => {
  const localById = new Map(localTasks.map((task) => [task.id, task]));
  const merged = remoteTasks.map((remoteTask) => {
    const local = localById.get(remoteTask.client_id);
    localById.delete(remoteTask.client_id);
    const remote = normalizeTask({
      ...remoteTask,
      id: remoteTask.client_id,
      remote_id: remoteTask.id,
      due_date: remoteTask.due_date || "",
    });

    if (!local) return remote;
    return local.updated_at > remote.updated_at
      ? { ...local, remote_id: remoteTask.id }
      : remote;
  });

  return [...merged, ...localById.values()];
};

const flushCloudDeletes = async (user) => {
  const tombstones = readTombstones(user);
  if (!tombstones.length) return [];

  const remaining = [];
  for (const task of tombstones) {
    try {
      await cloudRepository.deleteTask(user, task);
    } catch {
      remaining.push(task);
    }
  }
  writeTombstones(user, remaining);
  return remaining;
};

export const taskRepository = {
  localList(user) {
    return readTasks(user);
  },

  async list(user) {
    const localTasks = readTasks(user);
    if (isOfflineUser(user)) return localTasks;

    if (isCloudSyncEnabled(user)) {
      try {
        const remainingDeletes = await flushCloudDeletes(user);
        const deletedIds = new Set(remainingDeletes.map((task) => task.id));
        const remoteTasks = (await cloudRepository.listTasks(user)).filter(
          (task) => !deletedIds.has(task.client_id),
        );
        const tasks = mergeCloudTasks(localTasks, remoteTasks);
        await Promise.allSettled(
          tasks.map((task) => cloudRepository.upsertTask(user, task)),
        );
        return writeTasks(user, tasks);
      } catch {
        return localTasks;
      }
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, user_id, text, completed, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return writeTasks(user, mergeRemoteTasks(localTasks, data || []));
    } catch {
      return localTasks;
    }
  },

  async create(user, input) {
    let task = createTask(input);
    let tasks = writeTasks(user, [task, ...readTasks(user)]);

    if (isCloudSyncEnabled(user)) {
      try {
        const data = await cloudRepository.upsertTask(user, task);
        task = { ...task, remote_id: data.id };
        tasks = tasks.map((item) => (item.id === task.id ? task : item));
        writeTasks(user, tasks);
      } catch {
        // The task remains local and will be uploaded on the next sync.
      }
    } else if (!isOfflineUser(user)) {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            user_id: user.id,
            text: task.text,
            completed: false,
          })
          .select("id")
          .single();

        if (error) throw error;
        task = { ...task, remote_id: data.id };
        tasks = tasks.map((item) => (item.id === task.id ? task : item));
        writeTasks(user, tasks);
      } catch {
        // Local data is authoritative while the network is unavailable.
      }
    }

    return tasks;
  },

  async update(user, id, changes) {
    const updatedAt = new Date().toISOString();
    const previousTask = readTasks(user).find((task) => task.id === id);
    const normalizedChanges = { ...changes };
    if (changes.completed === true && !previousTask?.completed) {
      normalizedChanges.completed_at = updatedAt;
    }
    if (changes.completed === false) {
      normalizedChanges.completed_at = "";
    }
    let tasks = readTasks(user).map((task) =>
      task.id === id
        ? normalizeTask({ ...task, ...normalizedChanges, updated_at: updatedAt })
        : task,
    );

    if (
      previousTask &&
      !previousTask.completed &&
      changes.completed === true &&
      previousTask.recurrence !== "none" &&
      previousTask.due_date
    ) {
      const nextTask = normalizeTask({
        ...createTask({
          text: previousTask.text,
          dueDate: getNextRecurringDate(
            previousTask.due_date,
            previousTask.recurrence,
          ),
          dueTime: previousTask.due_time,
          priority: previousTask.priority,
          recurrence: previousTask.recurrence,
          listId: previousTask.list_id,
          tags: previousTask.tags,
        }),
        notes: previousTask.notes,
        subtasks: previousTask.subtasks.map((subtask) => ({
          ...subtask,
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          completed: false,
        })),
      });
      tasks = [nextTask, ...tasks];
    }
    writeTasks(user, tasks);

    const task = tasks.find((item) => item.id === id);
    if (!task || isOfflineUser(user)) return tasks;

    if (isCloudSyncEnabled(user)) {
      try {
        await cloudRepository.upsertTask(user, task);
      } catch {
        // The local version is newer and will be retried on the next sync.
      }
      return tasks;
    }

    const remoteId = task.remote_id;
    if (remoteId === undefined) return tasks;

    const remoteChanges = {};
    if (Object.prototype.hasOwnProperty.call(changes, "text")) {
      remoteChanges.text = task.text;
    }
    if (Object.prototype.hasOwnProperty.call(changes, "completed")) {
      remoteChanges.completed = task.completed;
    }

    if (Object.keys(remoteChanges).length) {
      try {
        await supabase.from("tasks").update(remoteChanges).eq("id", remoteId);
      } catch {
        // The local update is kept and can be retried in a later session.
      }
    }

    return tasks;
  },

  async remove(user, id) {
    const existing = readTasks(user).find((task) => task.id === id);
    const tasks = writeTasks(
      user,
      readTasks(user).filter((task) => task.id !== id),
    );

    if (!existing || isOfflineUser(user)) {
      return tasks;
    }

    if (isCloudSyncEnabled(user)) {
      try {
        await cloudRepository.deleteTask(user, existing);
      } catch {
        writeTombstones(user, [...readTombstones(user), existing]);
      }
      return tasks;
    }

    if (existing.remote_id === undefined) return tasks;

    try {
      await supabase.from("tasks").delete().eq("id", existing.remote_id);
    } catch {
      // The task stays deleted locally even if the remote service is offline.
    }

    return tasks;
  },

  restore(user, task) {
    const tasks = [normalizeTask(task), ...readTasks(user)];
    return writeTasks(user, tasks);
  },

  replace(user, task) {
    const normalized = normalizeTask(task);
    const tasks = readTasks(user).map((item) =>
      item.id === normalized.id ? normalized : item,
    );
    writeTasks(user, tasks);
    if (isCloudSyncEnabled(user)) {
      cloudRepository.upsertTask(user, normalized).catch(() => {});
    }
    return tasks;
  },

  replaceAll(user, snapshot) {
    const previous = readTasks(user);
    const tasks = snapshot.map(normalizeTask);
    writeTasks(user, tasks);
    if (isCloudSyncEnabled(user)) {
      const restoredIds = new Set(tasks.map((task) => task.id));
      Promise.allSettled([
        ...tasks.map((task) => cloudRepository.upsertTask(user, task)),
        ...previous.filter((task) => !restoredIds.has(task.id)).map((task) => cloudRepository.deleteTask(user, task)),
      ]);
    }
    return tasks;
  },

  reorder(user, orderedIds) {
    const positions = new Map(orderedIds.map((id, index) => [id, index]));
    const tasks = readTasks(user).map((task) =>
      positions.has(task.id)
        ? normalizeTask({ ...task, position: positions.get(task.id) })
        : task,
    );
    writeTasks(user, tasks);
    if (isCloudSyncEnabled(user)) {
      Promise.allSettled(
        tasks
          .filter((task) => positions.has(task.id))
          .map((task) => cloudRepository.upsertTask(user, task)),
      );
    }
    return tasks;
  },
};
