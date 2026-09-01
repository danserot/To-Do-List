import { toDateKey } from "../domain/tasks";
import { storage } from "../platform/storage";
import { cloudRepository, isCloudSyncEnabled } from "./cloudRepository";

const STORAGE_PREFIX = "focus_quick_tasks_v1";

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const defaultQuickTasks = [
  { id: "clean-up", text: "Убраться", dueRule: "today", priority: "none" },
  { id: "groceries", text: "Купить продукты", dueRule: "today", priority: "medium" },
  { id: "workout", text: "Тренировка", dueRule: "today", priority: "none" },
  { id: "call-family", text: "Позвонить родным", dueRule: "today", priority: "low" },
  { id: "inbox-zero", text: "Разобрать почту", dueRule: "none", priority: "none" },
];

const keyFor = (user) => `${STORAGE_PREFIX}:${user.id}`;

const normalizeTemplate = (template) => ({
  id: String(template.id || createId()),
  text: String(template.text || "").trim().slice(0, 80),
  dueRule: ["none", "today", "tomorrow"].includes(template.dueRule)
    ? template.dueRule
    : "none",
  priority: ["none", "low", "medium", "high"].includes(template.priority)
    ? template.priority
    : "none",
});

const cloneDefaults = () => defaultQuickTasks.map((item) => ({ ...item }));

export const quickTaskRepository = {
  list(user) {
    try {
      const value = storage.getItem(keyFor(user));
      if (value === null) return cloneDefaults();
      return JSON.parse(value).map(normalizeTemplate).filter((item) => item.text);
    } catch {
      return cloneDefaults();
    }
  },

  save(user, templates) {
    const normalized = templates
      .slice(0, 12)
      .map(normalizeTemplate)
      .filter((item) => item.text);
    storage.setItem(keyFor(user), JSON.stringify(normalized));
    return normalized;
  },

  reset(user) {
    storage.removeItem(keyFor(user));
    return cloneDefaults();
  },

  createDraft() {
    return { id: createId(), text: "", dueRule: "today", priority: "none" };
  },

  async sync(user) {
    const local = this.list(user);
    if (!isCloudSyncEnabled(user)) return local;

    try {
      const remote = await cloudRepository.listQuickTasks(user);
      if (!remote.length) {
        await cloudRepository.replaceQuickTasks(user, local);
        return local;
      }
      const synced = remote.map((template) =>
        normalizeTemplate({
          id: template.client_id,
          text: template.text,
          dueRule: template.due_rule,
          priority: template.priority,
        }),
      );
      storage.setItem(keyFor(user), JSON.stringify(synced));
      return synced;
    } catch {
      return local;
    }
  },

  async saveCloud(user, templates) {
    if (!isCloudSyncEnabled(user)) return;
    try {
      await cloudRepository.replaceQuickTasks(user, templates);
    } catch {
      // Templates stay available locally until cloud sync succeeds.
    }
  },
};

export const quickTaskToInput = (template) => {
  const dueDate =
    template.dueRule === "today"
      ? toDateKey()
      : template.dueRule === "tomorrow"
        ? toDateKey(new Date(Date.now() + 86400000))
        : "";

  return {
    text: template.text,
    dueDate,
    priority: template.priority,
  };
};
