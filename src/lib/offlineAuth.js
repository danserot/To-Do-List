import { supabase } from "./supabase";
import { storage } from "../platform/storage";

const SESSION_KEY = "todo_offline_session";
const PROFILE_KEY = "todo_offline_profile";
const TASKS_KEY = "todo_offline_tasks";
const AUTH_EVENT = "todo-offline-auth-change";

export const offlineAccount = {
  id: "offline-user",
  email: "admin@local.test",
  password: "admin123",
  full_name: "Local Admin",
};

const defaultProfile = {
  full_name: offlineAccount.full_name,
  avatar_url: "",
  language: "en",
  theme: "light",
};

const offlineUser = {
  id: offlineAccount.id,
  email: offlineAccount.email,
  app_metadata: {},
  user_metadata: {
    full_name: offlineAccount.full_name,
  },
};

const readJson = (key, fallback) => {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  storage.setItem(key, JSON.stringify(value));
};

const notifyAuthChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};

export const isOfflineUser = (user) => user?.id === offlineAccount.id;

export const getOfflineSession = () => readJson(SESSION_KEY, null);

export const signInOffline = (email, password) => {
  const isValid =
    email.trim().toLowerCase() === offlineAccount.email &&
    password === offlineAccount.password;

  if (!isValid) return false;

  writeJson(SESSION_KEY, {
    access_token: "offline-session",
    user: offlineUser,
  });
  supabase.auth.stopAutoRefresh();
  supabase.auth.signOut({ scope: "local" }).catch(() => {});
  notifyAuthChange();
  return true;
};

export const signOutOffline = () => {
  storage.removeItem(SESSION_KEY);
  notifyAuthChange();
};

export const getCurrentSession = async () => {
  const offlineSession = getOfflineSession();
  if (offlineSession) return offlineSession;

  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
};

export const getCurrentUser = async () => {
  const offlineSession = getOfflineSession();
  if (offlineSession?.user) return offlineSession.user;

  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
};

export const subscribeOfflineAuthChange = (callback) => {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};

export const getOfflineProfile = () => readJson(PROFILE_KEY, defaultProfile);

export const saveOfflineProfile = (profile) => {
  const nextProfile = {
    ...getOfflineProfile(),
    ...profile,
  };
  writeJson(PROFILE_KEY, nextProfile);
  return nextProfile;
};

export const getOfflineTasks = () => readJson(TASKS_KEY, []);

export const addOfflineTask = (text) => {
  const task = {
    id: crypto.randomUUID(),
    user_id: offlineAccount.id,
    text,
    completed: false,
    created_at: new Date().toISOString(),
  };
  const tasks = [task, ...getOfflineTasks()];
  writeJson(TASKS_KEY, tasks);
  return tasks;
};

export const updateOfflineTask = (id, changes) => {
  const tasks = getOfflineTasks().map((task) =>
    task.id === id ? { ...task, ...changes } : task,
  );
  writeJson(TASKS_KEY, tasks);
  return tasks;
};

export const deleteOfflineTask = (id) => {
  const tasks = getOfflineTasks().filter((task) => task.id !== id);
  writeJson(TASKS_KEY, tasks);
  return tasks;
};
