export const TASK_VIEWS = {
  inbox: "inbox",
  today: "today",
  upcoming: "upcoming",
  important: "important",
  completed: "completed",
};

export const PRIORITIES = ["none", "low", "medium", "high"];
export const RECURRENCES = ["none", "daily", "weekdays", "weekly"];

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const normalizeTag = (tag) =>
  String(tag || "")
    .trim()
    .replace(/^#/, "")
    .toLocaleLowerCase("ru")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .slice(0, 24);

export const normalizeTags = (tags) =>
  [...new Set((Array.isArray(tags) ? tags : []).map(normalizeTag).filter(Boolean))].slice(0, 8);

export const createTask = ({
  text,
  dueDate = "",
  dueTime = "",
  priority = "none",
  recurrence = "none",
  listId = "",
  tags = [],
}) => {
  const now = new Date().toISOString();

  return {
    id: createId(),
    text: text.trim(),
    notes: "",
    completed: false,
    due_date: dueDate,
    due_time: dueTime,
    priority,
    recurrence: RECURRENCES.includes(recurrence) ? recurrence : "none",
    list_id: listId,
    tags: normalizeTags(tags),
    subtasks: [],
    pinned: false,
    position: Date.now(),
    created_at: now,
    updated_at: now,
  };
};

export const normalizeTask = (task) => ({
  ...task,
  id: String(task.id),
  text: task.text || "Без названия",
  notes: task.notes || "",
  completed: Boolean(task.completed),
  due_date: task.due_date || "",
  due_time: task.due_time || "",
  priority: PRIORITIES.includes(task.priority) ? task.priority : "none",
  recurrence: RECURRENCES.includes(task.recurrence) ? task.recurrence : "none",
  list_id: task.list_id || "",
  tags: normalizeTags(task.tags),
  subtasks: Array.isArray(task.subtasks)
    ? task.subtasks.map((subtask, index) => ({
        id: String(subtask.id || `${task.id}-subtask-${index}`),
        text: String(subtask.text || "").trim().slice(0, 160),
        completed: Boolean(subtask.completed),
      })).filter((subtask) => subtask.text)
    : [],
  pinned: Boolean(task.pinned),
  position: Number.isFinite(Number(task.position))
    ? Number(task.position)
    : new Date(task.created_at || Date.now()).getTime(),
  created_at: task.created_at || new Date().toISOString(),
  completed_at: task.completed
    ? task.completed_at || task.updated_at || task.created_at || new Date().toISOString()
    : "",
  updated_at: task.updated_at || task.created_at || new Date().toISOString(),
});

export const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getViewTasks = (tasks, view, search = "") => {
  const today = toDateKey();
  const query = search.trim().toLocaleLowerCase("ru");

  return tasks
    .filter((task) => {
      if (query) {
        const haystack = `${task.text} ${task.notes} ${task.tags.map((tag) => `#${tag}`).join(" ")}`.toLocaleLowerCase("ru");
        if (!haystack.includes(query)) return false;
      }

      if (view === TASK_VIEWS.completed) return task.completed;
      if (task.completed) return false;
      if (view === TASK_VIEWS.today) return task.due_date === today;
      if (view === TASK_VIEWS.upcoming) return task.due_date > today;
      if (view === TASK_VIEWS.important) return task.priority === "high";
      if (view.startsWith("list:")) return task.list_id === view.slice(5);
      return true;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.position !== b.position) return a.position - b.position;
      const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
      const byPriority = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (byPriority !== 0) return byPriority;

      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return b.created_at.localeCompare(a.created_at);
    });
};

export const getNextRecurringDate = (dateKey, recurrence) => {
  if (!dateKey || recurrence === "none") return "";
  const date = new Date(`${dateKey}T12:00:00`);
  if (recurrence === "weekly") date.setDate(date.getDate() + 7);
  else {
    date.setDate(date.getDate() + 1);
    if (recurrence === "weekdays") {
      while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() + 1);
      }
    }
  }
  return toDateKey(date);
};

export const getSnoozeDate = (option, now = new Date()) => {
  const date = new Date(now);
  if (option === "tomorrow") date.setDate(date.getDate() + 1);
  if (option === "weekend") {
    const daysUntilSaturday = (6 - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntilSaturday);
  }
  if (option === "nextWeek") {
    const daysUntilMonday = (8 - date.getDay()) % 7 || 7;
    date.setDate(date.getDate() + daysUntilMonday);
  }
  return toDateKey(date);
};

export const getTaskCounts = (tasks) => {
  const today = toDateKey();
  return {
    inbox: tasks.filter((task) => !task.completed).length,
    today: tasks.filter((task) => !task.completed && task.due_date === today)
      .length,
    upcoming: tasks.filter(
      (task) => !task.completed && task.due_date > today,
    ).length,
    important: tasks.filter(
      (task) => !task.completed && task.priority === "high",
    ).length,
    completed: tasks.filter((task) => task.completed).length,
  };
};

export const formatTaskDate = (dateKey) => {
  if (!dateKey) return "";
  const today = toDateKey();
  const tomorrow = toDateKey(new Date(Date.now() + 86400000));
  if (dateKey === today) return "Сегодня";
  if (dateKey === tomorrow) return "Завтра";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${dateKey}T12:00:00`));
};
