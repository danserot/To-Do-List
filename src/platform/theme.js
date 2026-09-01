export const resolveTheme = (theme) => {
  if (theme !== "system") return theme;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  document.body.classList.toggle("dark", resolved === "dark");
  document.body.dataset.theme = resolved;
  document.body.dataset.themePreference = theme;
};

export const subscribeSystemTheme = (callback) => {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener?.("change", callback);
  return () => media.removeEventListener?.("change", callback);
};
