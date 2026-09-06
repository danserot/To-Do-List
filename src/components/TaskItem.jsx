import { useState } from "react";
import { CalendarDays, CheckSquare2, ChevronRight, Clock3, Flag, GripVertical, Pin, PinOff, Repeat2, Trash2 } from "lucide-react";
import { formatTaskDate, toDateKey } from "../domain/tasks";

export default function TaskItem({ task, selected = false, selectionMode = false, dragDisabled = false, dragHandleProps = {}, onDelete, onOpen, onPin, onSelect, onSnooze, onToggle }) {
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const isOverdue = task.due_date && task.due_date < toDateKey() && !task.completed;
  const priorityLabel = { high: "Высокий", medium: "Средний", low: "Низкий" }[task.priority];
  const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;

  return (
    <article className={`taskItem priority-${task.priority} ${task.completed ? "completed" : ""} ${selected ? "selected" : ""}`} aria-label={task.text}>
      <button className="dragHandle" disabled={dragDisabled} aria-label={`Перетащить задачу ${task.text}`} title="Изменить порядок" {...dragHandleProps}><GripVertical size={17} /></button>
      {selectionMode ? <button className="taskSelect" aria-label={selected ? "Убрать из выбранных" : "Выбрать задачу"} aria-pressed={selected} onClick={() => onSelect(task.id)}>{selected && <CheckSquare2 size={15} />}</button> : <button className="taskCheckbox" aria-label={task.completed ? "Вернуть задачу" : "Выполнить задачу"} aria-pressed={task.completed} onClick={onToggle}>{task.completed && <span>✓</span>}</button>}

      <button className="taskBody" onClick={onOpen}>
        <span className="taskTitle">{task.pinned && <Pin size={13} aria-label="Закреплена" />}{task.text}</span>
        <span className="taskMeta">
          {task.due_date && <span className={isOverdue ? "overdue" : ""}><CalendarDays size={14} />{formatTaskDate(task.due_date)}{task.due_time && `, ${task.due_time}`}</span>}
          {priorityLabel && <span><Flag size={14} />{priorityLabel}</span>}
          {task.recurrence !== "none" && <span><Repeat2 size={14} />Повторяется</span>}
          {task.subtasks.length > 0 && <span><CheckSquare2 size={14} />{completedSubtasks}/{task.subtasks.length}</span>}
          {task.notes && <span className="notesPreview">{task.notes}</span>}
        </span>
        {task.subtasks.length > 0 && <span className="subtaskProgress"><span style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }} /></span>}
      </button>

      <div className="taskActions">
        {!task.completed && <div className="snoozeAction"><button aria-label="Отложить задачу" title="Отложить" onClick={() => setSnoozeOpen((value) => !value)}><Clock3 size={17} /></button>{snoozeOpen && <div className="snoozeMenu"><button onClick={() => { onSnooze("tomorrow"); setSnoozeOpen(false); }}>На завтра</button><button onClick={() => { onSnooze("weekend"); setSnoozeOpen(false); }}>На выходные</button><button onClick={() => { onSnooze("nextWeek"); setSnoozeOpen(false); }}>На следующую неделю</button></div>}</div>}
        <button aria-label={task.pinned ? "Открепить задачу" : "Закрепить задачу"} title={task.pinned ? "Открепить" : "Закрепить"} onClick={onPin}>{task.pinned ? <PinOff size={17} /> : <Pin size={17} />}</button>
        <button aria-label="Удалить задачу" title="Удалить" onClick={() => onDelete(task)}><Trash2 size={17} /></button>
        <button aria-label="Открыть задачу" title="Открыть" onClick={onOpen}><ChevronRight size={19} /></button>
      </div>
    </article>
  );
}
