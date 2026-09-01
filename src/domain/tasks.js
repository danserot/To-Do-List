export const TASK_VIEWS = {
  inbox: "inbox",
  today: "today",
  upcoming: "upcoming",
  important: "important",
  completed: "completed",
};

export const PRIORITIES = ["none", "low", "medium", "high"];

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const createTask = ({ text, dueDate = "", priority = "none" }) => {
  const now = new Date().toISOString();

  return {
    id: createId(),
    text: text.trim(),
    notes: "",
    completed: false,
    due_date: dueDate,
    priority,
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
  priority: PRIORITIES.includes(task.priority) ? task.priority : "none",
  created_at: task.created_at || new Date().toISOString(),
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
        const haystack = `${task.text} ${task.notes}`.toLocaleLowerCase("ru");
        if (!haystack.includes(query)) return false;
      }

      if (view === TASK_VIEWS.completed) return task.completed;
      if (task.completed) return false;
      if (view === TASK_VIEWS.today) return task.due_date === today;
      if (view === TASK_VIEWS.upcoming) return task.due_date > today;
      if (view === TASK_VIEWS.important) return task.priority === "high";
      return true;
    })
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
      const byPriority = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (byPriority !== 0) return byPriority;

      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return b.created_at.localeCompare(a.created_at);
    });
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
