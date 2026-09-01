import {
  createTask,
  getTaskCounts,
  getViewTasks,
  normalizeTask,
  TASK_VIEWS,
  toDateKey,
} from "./tasks";

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
});
