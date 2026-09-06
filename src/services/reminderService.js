import { storage } from "../platform/storage";
import { toDateKey } from "../domain/tasks";

const STORAGE_KEY = "focus_browser_reminders_v1";

const readSent = () => {
  try {
    return JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeSent = (value) => storage.setItem(STORAGE_KEY, JSON.stringify(value));

export const getNotificationPermission = () => {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (getNotificationPermission() === "unsupported") return "unsupported";
  return Notification.requestPermission();
};

export const sendDueTaskReminders = (tasks, settings, now = new Date()) => {
  if (!settings?.notifications?.taskReminders) return 0;
  if (getNotificationPermission() !== "granted") return 0;

  const today = toDateKey(now);
  const sent = readSent();
  let count = 0;

  tasks
    .filter((task) => !task.completed && task.due_date && task.due_date <= today)
    .forEach((task) => {
      const key = `${today}:${task.id}:${task.due_date}:${task.due_time || "day"}`;
      if (sent[key]) return;

      const overdue = task.due_date < today;
      new Notification(overdue ? "Просроченная задача" : "Задача на сегодня", {
        body: task.due_time ? `${task.text} в ${task.due_time}` : task.text,
        icon: "/images/android-chrome-192x192.png",
        tag: key,
      });
      sent[key] = true;
      count += 1;
    });

  if (count) writeSent(sent);
  return count;
};
