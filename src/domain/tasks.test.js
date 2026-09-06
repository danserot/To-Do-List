import {
  createTask,
  getTaskCounts,
  getNextRecurringDate,
  getSnoozeDate,
  getViewTasks,
  normalizeTask,
  TASK_VIEWS,
  toDateKey,
} from "./tasks";
import { parseNaturalTaskInput } from "./naturalLanguage";
import { getTaskAnalytics } from "./analytics";
import { parseImportedTasks, serializeTasksCsv, serializeTasksJson } from "./dataPortability";

describe("task domain", () => {
  it("creates a normalized active task", () => {
    const task = createTask({
      text: "  Подготовить отчет  ",
      dueDate: "2026-09-02",
      priority: "high",
    });

    expect(task.text).toBe("Подготовить отчет");
    expect(task.completed).toBe(false);
    expect(task.due_date).toBe("2026-09-02");
    expect(task.priority).toBe("high");
  });

  it("filters and counts task views consistently", () => {
    const today = toDateKey();
    const tasks = [
      normalizeTask({ id: 1, text: "Сегодня", due_date: today, priority: "high" }),
      normalizeTask({ id: 2, text: "Без срока" }),
      normalizeTask({ id: 3, text: "Готово", completed: true }),
    ];

    expect(getViewTasks(tasks, TASK_VIEWS.today)).toHaveLength(1);
    expect(getViewTasks(tasks, TASK_VIEWS.important)).toHaveLength(1);
    expect(getViewTasks(tasks, TASK_VIEWS.completed)).toHaveLength(1);
    expect(getViewTasks(tasks, TASK_VIEWS.inbox, "срок")).toHaveLength(1);
    expect(getTaskCounts(tasks)).toMatchObject({
      inbox: 2,
      today: 1,
      important: 1,
      completed: 1,
    });
  });

  it("normalizes advanced task fields without breaking old tasks", () => {
    const task = normalizeTask({
      id: "advanced",
      text: "Подготовить релиз",
      recurrence: "weekdays",
      pinned: true,
      subtasks: [{ id: "one", text: "Проверить сборку", completed: true }],
    });
    expect(task.recurrence).toBe("weekdays");
    expect(task.pinned).toBe(true);
    expect(task.subtasks).toHaveLength(1);
  });

  it("calculates recurrence and snooze dates", () => {
    expect(getNextRecurringDate("2026-09-04", "weekdays")).toBe("2026-09-07");
    expect(getNextRecurringDate("2026-09-01", "weekly")).toBe("2026-09-08");
    expect(getSnoozeDate("tomorrow", new Date("2026-09-01T12:00:00"))).toBe("2026-09-02");
  });

  it("parses a Russian natural-language due date", () => {
    const parsed = parseNaturalTaskInput(
      "Позвонить завтра в 18:00 #дом",
      new Date("2026-09-01T10:00:00"),
    );
    expect(parsed.text).toBe("Позвонить");
    expect(parsed.dueDate).toBe("2026-09-02");
    expect(parsed.dueTime).toBe("18:00");
    expect(parsed.tags).toEqual(["дом"]);
  });

  it("summarizes productivity analytics", () => {
    const tasks = [
      normalizeTask({ id: "1", text: "Сегодня", due_date: "2026-09-06" }),
      normalizeTask({ id: "2", text: "Просрочено", due_date: "2026-09-05" }),
      normalizeTask({
        id: "3",
        text: "Готово",
        completed: true,
        completed_at: "2026-09-06T08:00:00.000Z",
      }),
    ];

    expect(getTaskAnalytics(tasks, new Date("2026-09-06T12:00:00"))).toMatchObject({
      active: 2,
      completed: 1,
      completedThisWeek: 1,
      dueToday: 1,
      overdue: 1,
      streak: 1,
    });
  });

  it("exports and imports JSON and CSV tasks", () => {
    const tasks = [
      normalizeTask({ id: "one", text: "Купить молоко", tags: ["дом"], notes: "2%" }),
    ];

    expect(parseImportedTasks(serializeTasksJson({ tasks }), "tasks.json")).toHaveLength(1);
    expect(parseImportedTasks(serializeTasksCsv(tasks), "tasks.csv")[0]).toMatchObject({
      text: "Купить молоко",
      tags: ["дом"],
      notes: "2%",
    });
  });
});
