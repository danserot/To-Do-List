import { CalendarDays, ChevronRight, Flag, Trash2 } from "lucide-react";
import { formatTaskDate, toDateKey } from "../domain/tasks";

export default function TaskItem({ task, onDelete, onOpen, onToggle }) {
  const isOverdue = task.due_date && task.due_date < toDateKey() && !task.completed;
  const priorityLabel = {
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  }[task.priority];

  return (
    <article className={`taskItem priority-${task.priority} ${task.completed ? "completed" : ""}`}>
      <button
        className="taskCheckbox"
        aria-label={task.completed ? "Вернуть задачу" : "Выполнить задачу"}
        aria-pressed={task.completed}
        onClick={onToggle}
      >
        {task.completed && <span>✓</span>}
      </button>

      <button className="taskBody" onClick={onOpen}>
        <span className="taskTitle">{task.text}</span>
        <span className="taskMeta">
          {task.due_date && (
            <span className={isOverdue ? "overdue" : ""}>
              <CalendarDays size={14} />{formatTaskDate(task.due_date)}
            </span>
          )}
          {priorityLabel && <span><Flag size={14} />{priorityLabel}</span>}
          {task.notes && <span className="notesPreview">{task.notes}</span>}
        </span>
      </button>

      <div className="taskActions">
        <button aria-label="Удалить задачу" onClick={() => onDelete(task)}><Trash2 size={17} /></button>
        <button aria-label="Открыть задачу" onClick={onOpen}><ChevronRight size={19} /></button>
      </div>
    </article>
  );
}
