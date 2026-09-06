const EVENT = "focus-sync-status";
let currentStatus = "saved";

export const setSyncStatus = (status) => {
  currentStatus = status;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: status }));
};

export const syncStatus = {
  get: () => currentStatus,
  subscribe(callback) {
    if (typeof window === "undefined") return () => {};
    const handler = (event) => callback(event.detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  },
};
