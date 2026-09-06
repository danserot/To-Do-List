import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, Flag, ListChecks, Plus, Repeat2, Trash2, X } from "lucide-react";
import { normalizeTags, toDateKey } from "../domain/tasks";

const createSubtask = () => ({ id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, text: "", completed: false });

export default function TaskDetails({ task, lists = [], onClose, onDelete, onUpdate }) {
  const [draft, setDraft] = useState(task);
  const [newSubtask, setNewSubtask] = useState("");
  const titleRef = useRef(null);

  useEffect(() => setDraft(task), [task]);
  useEffect(() => {
    titleRef.current?.focus();
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const addSubtask = () => {
    const text = newSubtask.trim();
    if (!text) return;
    setDraft((current) => ({ ...current, subtasks: [...current.subtasks, { ...createSubtask(), text }] }));
    setNewSubtask("");
  };

  const save = () => {
    const text = draft.text.trim();
    if (!text) return;
    onUpdate({
      text,
      notes: draft.notes.trim(),
      due_date: draft.recurrence !== "none" && !draft.due_date ? toDateKey() : draft.due_date,
      due_time: draft.due_time,
      priority: draft.priority,
      recurrence: draft.recurrence,
      list_id: draft.list_id,
      tags: normalizeTags(String(draft.tagsInput ?? draft.tags.join(", ")).split(/[,\s]+/)),
      subtasks: draft.subtasks.filter((subtask) => subtask.text.trim()),
    });
    onClose();
  };

  const completedSubtasks = draft.subtasks.filter((subtask) => subtask.completed).length;

  return (
    <div className="detailsLayer" role="presentation" onMouseDown={onClose}>
      <aside className="taskDetails" role="dialog" aria-modal="true" aria-labelledby="task-details-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><span id="task-details-title">Детали задачи</span><button className="iconButton" aria-label="Закрыть" onClick={onClose}><X size={20} /></button></header>
        <div className="detailsContent">
          <label className="fieldGroup"><span>Название</span><input ref={titleRef} maxLength={160} value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} /></label>

          <section className="subtaskEditor" aria-labelledby="subtasks-title">
            <div className="subtaskHeader"><span id="subtasks-title"><ListChecks size={17} />Чек-лист</span><small>{completedSubtasks}/{draft.subtasks.length}</small></div>
            <div className="subtaskList">
              {draft.subtasks.map((subtask) => (
                <div className="subtaskRow" key={subtask.id}>
                  <button aria-label={subtask.completed ? "Вернуть подзадачу" : "Выполнить подзадачу"} aria-pressed={subtask.completed} onClick={() => setDraft((current) => ({ ...current, subtasks: current.subtasks.map((item) => item.id === subtask.id ? { ...item, completed: !item.completed } : item) }))}>{subtask.completed && <Check size={13} />}</button>
                  <input aria-label="Текст подзадачи" className={subtask.completed ? "completed" : ""} value={subtask.text} maxLength={160} onChange={(event) => setDraft((current) => ({ ...current, subtasks: current.subtasks.map((item) => item.id === subtask.id ? { ...item, text: event.target.value } : item) }))} />
                  <button aria-label="Удалить подзадачу" onClick={() => setDraft((current) => ({ ...current, subtasks: current.subtasks.filter((item) => item.id !== subtask.id) }))}><X size={15} /></button>
                </div>
              ))}
            </div>
            <div className="addSubtaskRow">
              <Plus size={16} /><input aria-label="Новая подзадача" placeholder="Добавить пункт" value={newSubtask} maxLength={160} onChange={(event) => setNewSubtask(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSubtask(); } }} />
              <button disabled={!newSubtask.trim()} onClick={addSubtask}>Добавить</button>
            </div>
          </section>

          <label className="fieldGroup"><span>Заметка</span><textarea rows="4" maxLength={1000} placeholder="Добавьте детали" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
          <div className="detailsGrid">
            <label className="fieldGroup fieldWithIcon"><span><CalendarDays size={17} />Срок</span><input type="date" value={draft.due_date} onChange={(event) => setDraft({ ...draft, due_date: event.target.value })} /></label>
            <label className="fieldGroup"><span>Время</span><input type="time" value={draft.due_time} onChange={(event) => setDraft({ ...draft, due_time: event.target.value })} /></label>
            <label className="fieldGroup fieldWithIcon"><span><Flag size={17} />Приоритет</span><select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}><option value="none">Без приоритета</option><option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option></select></label>
            <label className="fieldGroup fieldWithIcon"><span><Repeat2 size={17} />Повтор</span><select value={draft.recurrence} onChange={(event) => setDraft({ ...draft, recurrence: event.target.value })}><option value="none">Не повторять</option><option value="daily">Каждый день</option><option value="weekdays">По будням</option><option value="weekly">Каждую неделю</option></select></label>
            <label className="fieldGroup detailsListField"><span>Список</span><select value={draft.list_id} onChange={(event) => setDraft({ ...draft, list_id: event.target.value })}><option value="">Без списка</option>{lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
            <label className="fieldGroup detailsTagsField"><span>Метки</span><input placeholder="дом, работа, срочно" value={draft.tagsInput ?? draft.tags.join(", ")} onChange={(event) => setDraft({ ...draft, tagsInput: event.target.value })} /></label>
          </div>
        </div>
        <footer><button className="deleteDetailButton" onClick={onDelete}><Trash2 size={17} />Удалить</button><div><button className="secondaryButton" onClick={onClose}>Отмена</button><button className="primaryButton" disabled={!draft.text.trim()} onClick={save}>Сохранить</button></div></footer>
      </aside>
    </div>
  );
}
