import { supabase } from "../lib/supabase";
import { isOfflineUser } from "../lib/offlineAuth";
import { setSyncStatus } from "./syncStatus";

const cloudSyncEnabled = process.env.REACT_APP_CLOUD_SYNC === "true";

const toNullableDate = (value) => value || null;

const throwOnError = ({ data, error }) => {
  if (error) {
    setSyncStatus("error");
    throw error;
  }
  setSyncStatus("saved");
  return data;
};
const beginSync = () => setSyncStatus("syncing");

export const isCloudSyncEnabled = (user) =>
  cloudSyncEnabled && Boolean(user) && !isOfflineUser(user);

export const cloudRepository = {
  async listTasks(user) {
    beginSync();
    return throwOnError(
      await supabase
        .from("focus_tasks")
        .select("id, client_id, text, notes, completed, due_date, due_time, priority, recurrence, list_id, subtasks, pinned, position, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    );
  },

  async upsertTask(user, task) {
    beginSync();
    return throwOnError(
      await supabase
        .from("focus_tasks")
        .upsert(
          {
            user_id: user.id,
            client_id: task.id,
            text: task.text,
            notes: task.notes,
            completed: task.completed,
            due_date: toNullableDate(task.due_date),
            due_time: task.due_time || null,
            priority: task.priority,
            recurrence: task.recurrence,
            list_id: task.list_id || null,
            subtasks: task.subtasks,
            pinned: task.pinned,
            position: task.position,
            created_at: task.created_at,
            updated_at: task.updated_at,
          },
          { onConflict: "user_id,client_id" },
        )
        .select("id")
        .single(),
    );
  },

  async deleteTask(user, task) {
    beginSync();
    const query = supabase.from("focus_tasks").delete().eq("user_id", user.id);
    return throwOnError(
      task.remote_id
        ? await query.eq("id", task.remote_id)
        : await query.eq("client_id", task.id),
    );
  },

  async getSettings(user) {
    beginSync();
    return throwOnError(
      await supabase
        .from("focus_settings")
        .select("contact_email, phone, timezone, language, theme, notifications, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    );
  },

  async upsertSettings(user, settings) {
    beginSync();
    return throwOnError(
      await supabase.from("focus_settings").upsert({
        user_id: user.id,
        contact_email: settings.contactEmail,
        phone: settings.phone,
        timezone: settings.timezone,
        language: settings.language,
        theme: settings.theme,
        notifications: settings.notifications,
      }),
    );
  },

  async getProfile(user) {
    beginSync();
    return throwOnError(
      await supabase
        .from("focus_profiles")
        .select("full_name, username, bio, cover, avatar_path, cover_path, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    );
  },

  async upsertProfile(user, profile) {
    beginSync();
    return throwOnError(
      await supabase.from("focus_profiles").upsert({
        user_id: user.id,
        full_name: profile.fullName || "",
        username: profile.username,
        bio: profile.bio,
        cover: profile.cover,
        avatar_path: profile.avatarPath || null,
        cover_path: profile.coverPath || null,
      }),
    );
  },

  async listQuickTasks(user) {
    beginSync();
    return throwOnError(
      await supabase
        .from("focus_quick_tasks")
        .select("client_id, text, due_rule, priority, position, updated_at")
        .eq("user_id", user.id)
        .order("position"),
    );
  },

  async listCustomLists(user) {
    beginSync();
    return throwOnError(
      await supabase
        .from("focus_lists")
        .select("client_id, name, color, position")
        .eq("user_id", user.id)
        .order("position"),
    );
  },

  async replaceCustomLists(user, lists) {
    beginSync();
    const existing = await throwOnError(
      await supabase.from("focus_lists").select("client_id").eq("user_id", user.id),
    );
    const activeIds = new Set(lists.map((list) => list.id));
    const removedIds = (existing || []).map((item) => item.client_id).filter((id) => !activeIds.has(id));
    if (removedIds.length) {
      throwOnError(await supabase.from("focus_lists").delete().eq("user_id", user.id).in("client_id", removedIds));
    }
    if (!lists.length) return [];
    return throwOnError(
      await supabase.from("focus_lists").upsert(
        lists.map((list, position) => ({ user_id: user.id, client_id: list.id, name: list.name, color: list.color, position })),
        { onConflict: "user_id,client_id" },
      ),
    );
  },

  async replaceQuickTasks(user, templates) {
    beginSync();
    const existing = await throwOnError(
      await supabase
        .from("focus_quick_tasks")
        .select("client_id")
        .eq("user_id", user.id),
    );
    const activeIds = new Set(templates.map((template) => template.id));
    const removedIds = (existing || [])
      .map((item) => item.client_id)
      .filter((id) => !activeIds.has(id));

    if (removedIds.length) {
      throwOnError(
        await supabase
          .from("focus_quick_tasks")
          .delete()
          .eq("user_id", user.id)
          .in("client_id", removedIds),
      );
    }

    if (!templates.length) return [];
    return throwOnError(
      await supabase.from("focus_quick_tasks").upsert(
        templates.map((template, position) => ({
          user_id: user.id,
          client_id: template.id,
          text: template.text,
          due_rule: template.dueRule,
          priority: template.priority,
          position,
        })),
        { onConflict: "user_id,client_id" },
      ),
    );
  },
};
