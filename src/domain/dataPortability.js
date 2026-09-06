import { createTask, normalizeTask } from "./tasks";

const escapeCsv = (value) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const parseCsvLine = (line) => {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }

  cells.push(cell);
  return cells;
};

export const serializeTasksJson = ({ tasks, lists = [] }) =>
  JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: tasks.map(normalizeTask),
      lists,
    },
    null,
    2,
  );

export const serializeTasksCsv = (tasks) => {
  const header = ["text", "completed", "due_date", "due_time", "priority", "recurrence", "tags", "notes"];
  const rows = tasks.map((task) => [
    task.text,
    task.completed ? "true" : "false",
    task.due_date,
    task.due_time,
    task.priority,
    task.recurrence,
    task.tags.join("|"),
    task.notes,
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
};

export const parseImportedTasks = (content, filename = "") => {
  const trimmed = String(content || "").trim();
  if (!trimmed) return [];

  if (filename.toLowerCase().endsWith(".csv")) {
    const [headerLine, ...lines] = trimmed.split(/\r?\n/).filter(Boolean);
    const headers = parseCsvLine(headerLine);
    return lines.map((line) => {
      const values = parseCsvLine(line);
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
      return normalizeTask({
        ...createTask({
          text: row.text || "Импортированная задача",
          dueDate: row.due_date,
          dueTime: row.due_time,
          priority: row.priority,
          recurrence: row.recurrence,
          tags: row.tags ? row.tags.split("|") : [],
        }),
        completed: row.completed === "true",
        notes: row.notes || "",
      });
    });
  }

  const parsed = JSON.parse(trimmed);
  const tasks = Array.isArray(parsed) ? parsed : parsed.tasks;
  if (!Array.isArray(tasks)) throw new Error("Файл не содержит список задач");
  return tasks.map(normalizeTask);
};
