import { storage } from "../platform/storage";
import { cloudRepository, isCloudSyncEnabled } from "./cloudRepository";

const STORAGE_PREFIX = "focus_app_settings_v2";
const SETTINGS_EVENT = "focus-settings-change";

const keyFor = (user) => `${STORAGE_PREFIX}:${user.id}`;

const getTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

const defaultsFor = (user, legacy = {}) => ({
  contactEmail: user.email || "",
  phone: "",
  timezone: getTimezone(),
  language: legacy.language || "ru",
  theme: legacy.theme || "light",
  notifications: {
    taskReminders: true,
    dailySummary: true,
    importantTasks: true,
    weeklySummary: false,
  },
});

const normalize = (user, value, legacy) => {
  const defaults = defaultsFor(user, legacy);
  return {
    contactEmail: String(value.contactEmail || defaults.contactEmail).trim().slice(0, 120),
    phone: String(value.phone || "").trim().slice(0, 24),
    timezone: String(value.timezone || defaults.timezone).slice(0, 64),
    language: ["ru", "en"].includes(value.language) ? value.language : defaults.language,
    theme: ["light", "dark", "system"].includes(value.theme) ? value.theme : defaults.theme,
    notifications: {
      taskReminders: value.notifications?.taskReminders !== false,
      dailySummary: value.notifications?.dailySummary !== false,
      importantTasks: value.notifications?.importantTasks !== false,
      weeklySummary: Boolean(value.notifications?.weeklySummary),
    },
  };
};

const notifyChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }
};

export const settingsRepository = {
  get(user, legacy = {}) {
    try {
      const value = storage.getItem(keyFor(user));
      return value
        ? normalize(user, JSON.parse(value), legacy)
        : defaultsFor(user, legacy);
    } catch {
      return defaultsFor(user, legacy);
    }
  },

  save(user, settings) {
    const normalized = normalize(user, settings);
    storage.setItem(keyFor(user), JSON.stringify(normalized));
    notifyChange();
    return normalized;
  },

  async sync(user, legacy = {}) {
    const local = this.get(user, legacy);
    if (!isCloudSyncEnabled(user)) return local;

    try {
      const remote = await cloudRepository.getSettings(user);
      if (!remote) {
        await cloudRepository.upsertSettings(user, local);
        return local;
      }
      const synced = normalize(user, {
        contactEmail: remote.contact_email,
        phone: remote.phone,
        timezone: remote.timezone,
        language: remote.language,
        theme: remote.theme,
        notifications: remote.notifications,
      });
      storage.setItem(keyFor(user), JSON.stringify(synced));
      notifyChange();
      return synced;
    } catch {
      return local;
    }
  },

  async saveCloud(user, settings) {
    if (!isCloudSyncEnabled(user)) return;
    try {
      await cloudRepository.upsertSettings(user, settings);
    } catch {
      // Local settings remain available and can be uploaded later.
    }
  },

  subscribe(callback) {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(SETTINGS_EVENT, callback);
    window.addEventListener("storage", callback);
    return () => {
      window.removeEventListener(SETTINGS_EVENT, callback);
      window.removeEventListener("storage", callback);
    };
  },
};
