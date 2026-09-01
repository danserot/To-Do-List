import { supabase } from "../lib/supabase";
import { isOfflineUser } from "../lib/offlineAuth";

const cloudSyncEnabled = process.env.REACT_APP_CLOUD_SYNC === "true";

const toNullableDate = (value) => value || null;

const throwOnError = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const isCloudSyncEnabled = (user) =>
  cloudSyncEnabled && Boolean(user) && !isOfflineUser(user);

export const cloudRepository = {
  async listTasks(user) {
    return throwOnError(
      await supabase
        .from("focus_tasks")
        .select("id, client_id, text, notes, completed, due_date, priority, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    );
  },

  async upsertTask(user, task) {
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
            priority: task.priority,
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
    const query = supabase.from("focus_tasks").delete().eq("user_id", user.id);
    return throwOnError(
      task.remote_id
        ? await query.eq("id", task.remote_id)
        : await query.eq("client_id", task.id),
    );
  },

  async getSettings(user) {
    return throwOnError(
      await supabase
        .from("focus_settings")
        .select("contact_email, phone, timezone, language, theme, notifications, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    );
  },

  async upsertSettings(user, settings) {
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
    return throwOnError(
      await supabase
        .from("focus_profiles")
        .select("full_name, username, bio, cover, avatar_path, cover_path, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    );
  },

  async upsertProfile(user, profile) {
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
    return throwOnError(
      await supabase
        .from("focus_quick_tasks")
        .select("client_id, text, due_rule, priority, position, updated_at")
        .eq("user_id", user.id)
        .order("position"),
    );
  },

  async replaceQuickTasks(user, templates) {
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
