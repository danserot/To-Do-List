const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const storage = {
  getItem(key) {
    if (!canUseStorage()) return null;

    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key, value) {
    if (!canUseStorage()) return;

    try {
      window.localStorage.setItem(key, value);
    } catch {
      // The app remains usable for the current session when storage is blocked.
    }
  },

  removeItem(key) {
    if (!canUseStorage()) return;

    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore browsers that block storage access.
    }
  },
};
