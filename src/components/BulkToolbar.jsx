import { CalendarClock, CheckCircle2, Trash2, X } from "lucide-react";

export default function BulkToolbar({ count, onCancel, onComplete, onDelete, onSnooze }) {
  return <div className="bulkToolbar" role="toolbar" aria-label={`Выбрано задач: ${count}`}><strong>Выбрано: {count}</strong><button onClick={onComplete}><CheckCircle2 size={16} />Выполнить</button><button onClick={onSnooze}><CalendarClock size={16} />На завтра</button><button className="danger" onClick={onDelete}><Trash2 size={16} />Удалить</button><button className="iconButton" aria-label="Отменить выбор" onClick={onCancel}><X size={18} /></button></div>;
}
