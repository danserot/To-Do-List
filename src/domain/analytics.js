import { toDateKey } from "./tasks";

const dayMs = 24 * 60 * 60 * 1000;

const lastDays = (days, now = new Date()) =>
  Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    return toDateKey(date);
  });

export const getTaskAnalytics = (tasks, now = new Date()) => {
  const today = toDateKey(now);
  const active = tasks.filter((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed);
  const overdue = active.filter((task) => task.due_date && task.due_date < today);
  const dueToday = active.filter((task) => task.due_date === today);
  const completedDays = new Set(
    completed.map((task) => toDateKey(new Date(task.completed_at || task.updated_at || task.created_at))),
  );

  let streak = 0;
  for (const dateKey of lastDays(365, now)) {
    if (!completedDays.has(dateKey)) break;
    streak += 1;
  }

  const weekKeys = new Set(lastDays(7, now));
  const completedThisWeek = completed.filter((task) =>
    weekKeys.has(toDateKey(new Date(task.completed_at || task.updated_at || task.created_at))),
  ).length;

  const busyDays = active
    .filter((task) => task.due_date)
    .reduce((acc, task) => ({ ...acc, [task.due_date]: (acc[task.due_date] || 0) + 1 }), {});
  const busiestDay = Object.entries(busyDays).sort((a, b) => b[1] - a[1])[0] || ["", 0];

  return {
    active: active.length,
    completed: completed.length,
    completedThisWeek,
    dueToday: dueToday.length,
    overdue: overdue.length,
    streak,
    busiestDay: busiestDay[0],
    busiestDayCount: busiestDay[1],
    completionRate: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
    dayMs,
  };
};
