import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CalendarDays, Clock3, Flag, Plus, Repeat2 } from "lucide-react";
import { parseNaturalTaskInput } from "../domain/naturalLanguage";

export default function QuickAdd({
  defaultDueDate = "",
  defaultPriority = "none",
  listId = "",
  onAdd,
}) {
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [priority, setPriority] = useState(defaultPriority);
  const [showWarning, setShowWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  const parsedInput = useMemo(() => parseNaturalTaskInput(text), [text]);
  const updateDueDate = (event) => setDueDate(event.currentTarget.value);

  useEffect(() => setDueDate(defaultDueDate), [defaultDueDate]);
  useEffect(() => setPriority(defaultPriority), [defaultPriority]);

  useEffect(() => {
    if (!showWarning) return undefined;
    const timer = window.setTimeout(() => setShowWarning(false), 3200);
    return () => window.clearTimeout(timer);
  }, [showWarning]);

  useEffect(() => {
    const focusQuickAdd = (event) => {
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName,
      );
      if (event.key === "q" && !event.metaKey && !event.ctrlKey && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusQuickAdd);
    return () => window.removeEventListener("keydown", focusQuickAdd);
  }, []);

  const showEmptyWarning = () => {
    setShowWarning(false);
    window.setTimeout(() => setShowWarning(true), 0);
    inputRef.current?.focus();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim()) {
      showEmptyWarning();
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      await onAdd({
        text: parsedInput.text || text.trim(),
        dueDate: parsedInput.dueDate || dueDate,
        dueTime: parsedInput.dueTime,
        recurrence: parsedInput.recurrence,
        priority,
        listId,
      });
      setText("");
      setPriority(defaultPriority);
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="quickAdd" onSubmit={submit}>
      <button
        className="quickAddPlus"
        type="button"
        aria-label="Начать ввод задачи"
        onClick={() => {
          if (!text.trim()) showEmptyWarning();
          else inputRef.current?.focus();
        }}
      >
        <Plus size={20} />
      </button>
      <input
        ref={inputRef}
        aria-label="Новая задача"
        placeholder="Добавить задачу"
        maxLength={160}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          if (event.target.value.trim()) setShowWarning(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !text.trim()) {
            event.preventDefault();
            showEmptyWarning();
          }
        }}
      />
      <label className="compactControl" title="Срок">
        <CalendarDays size={18} />
        <input
          aria-label="Срок задачи"
          type="date"
          value={dueDate}
          onChange={updateDueDate}
          onInput={updateDueDate}
        />
      </label>
      <label className={`compactControl priority-${priority}`} title="Приоритет">
        <Flag size={18} />
        <select aria-label="Приоритет задачи" value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="none">Без приоритета</option>
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
      </label>
      <span
        className="addTaskButtonHitbox"
        onClick={() => !text.trim() && showEmptyWarning()}
      >
        <button
          className="addTaskButton"
          type="submit"
          disabled={!text.trim() || submitting}
        >
          <Plus size={18} /><span>{submitting ? "Добавляем" : "Добавить"}</span>
        </button>
      </span>

      {text.trim() && (parsedInput.dueDate || parsedInput.dueTime || parsedInput.recurrence !== "none") && (
        <div className="naturalPreview" role="status">
          {parsedInput.dueDate && <span><CalendarDays size={13} />{parsedInput.dueDate}</span>}
          {parsedInput.dueTime && <span><Clock3 size={13} />{parsedInput.dueTime}</span>}
          {parsedInput.recurrence !== "none" && <span><Repeat2 size={13} />Повтор</span>}
        </div>
      )}

      {showWarning && (
        <div className="quickWarningToast" role="alert">
          <AlertCircle size={19} />
          <span>Введите название задачи</span>
        </div>
      )}
    </form>
  );
}
