import { useEffect, useMemo, useRef, useState } from "react";
import { CheckSquare2, CircleHelp, Inbox, Plus, Search, Star, Sun, X } from "lucide-react";

export default function CommandPalette({ open, onClose, onNavigate, onNewTask, onSelectionMode }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const commands = useMemo(() => [
    { label: "Создать задачу", hint: "Q", icon: Plus, action: onNewTask },
    { label: "Открыть входящие", hint: "G I", icon: Inbox, action: () => onNavigate("inbox") },
    { label: "Открыть сегодня", hint: "G T", icon: Sun, action: () => onNavigate("today") },
    { label: "Открыть важные", hint: "G V", icon: Star, action: () => onNavigate("important") },
    { label: "Выбрать несколько задач", hint: "X", icon: CheckSquare2, action: onSelectionMode },
    { label: "Горячие клавиши: Ctrl+K, Q, /, X, Esc", hint: "?", icon: CircleHelp, action: () => {} },
  ], [onNavigate, onNewTask, onSelectionMode]);
  const visible = commands.filter((command) => command.label.toLocaleLowerCase("ru").includes(query.toLocaleLowerCase("ru")));

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
    const close = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose, open]);
  if (!open) return null;

  const run = (action) => { action(); onClose(); };
  return <div className="commandLayer" role="presentation" onMouseDown={onClose}><section className="commandPalette" role="dialog" aria-modal="true" aria-label="Командная панель" onMouseDown={(event) => event.stopPropagation()}><header><Search size={18} /><input ref={inputRef} aria-label="Найти команду" placeholder="Введите команду" value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, visible.length - 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); } if (event.key === "Enter" && visible[activeIndex]) run(visible[activeIndex].action); }} /><button aria-label="Закрыть" onClick={onClose}><X size={18} /></button></header><div className="commandList">{visible.map(({ label, hint, icon: Icon, action }, index) => <button className={index === activeIndex ? "active" : ""} key={label} onMouseEnter={() => setActiveIndex(index)} onClick={() => run(action)}><Icon size={18} /><span>{label}</span><kbd>{hint}</kbd></button>)}{!visible.length && <p>Команды не найдены</p>}</div></section></div>;
}
