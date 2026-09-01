import { useEffect, useState } from "react";
import { CalendarDays, Flag, Trash2, X } from "lucide-react";

export default function TaskDetails({ task, onClose, onDelete, onUpdate }) {
  const [draft, setDraft] = useState(task);
  const updateDueDate = (event) => {
    const value = event.currentTarget.value;
    setDraft((current) => ({ ...current, due_date: value }));
  };

  useEffect(() => setDraft(task), [task]);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const save = () => {
    const text = draft.text.trim();
    if (!text) return;
    onUpdate({
      text,
      notes: draft.notes.trim(),
      due_date: draft.due_date,
      priority: draft.priority,
    });
    onClose();
  };

  return (
    <div className="detailsLayer" role="presentation" onMouseDown={onClose}>
      <aside className="taskDetails" role="dialog" aria-modal="true" aria-label="Редактирование задачи" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <span>Детали задачи</span>
          <button className="iconButton" aria-label="Закрыть" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="detailsContent">
          <label className="fieldGroup">
            <span>Название</span>
            <input autoFocus maxLength={160} value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} />
          </label>
          <label className="fieldGroup">
            <span>Заметка</span>
            <textarea rows="6" maxLength={1000} placeholder="Добавьте детали" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
          </label>
          <label className="fieldGroup fieldWithIcon">
            <span><CalendarDays size={17} />Срок</span>
            <input
              type="date"
              value={draft.due_date}
              onChange={updateDueDate}
              onInput={updateDueDate}
            />
          </label>
          <label className="fieldGroup fieldWithIcon">
            <span><Flag size={17} />Приоритет</span>
            <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>
              <option value="none">Без приоритета</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </label>
        </div>

        <footer>
          <button className="deleteDetailButton" onClick={onDelete}><Trash2 size={17} />Удалить</button>
          <div>
            <button className="secondaryButton" onClick={onClose}>Отмена</button>
            <button className="primaryButton" disabled={!draft.text.trim()} onClick={save}>Сохранить</button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
