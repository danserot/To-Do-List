import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bell, CalendarCheck, CheckCircle2, Flag, ListTodo, X } from "lucide-react";
import { toDateKey } from "../domain/tasks";

export default function NotificationCenter({ tasks, settings }) {
  const [open, setOpen] = useState(false);
  const centerRef = useRef(null);

  useEffect(() => {
    const closeOutside = (event) => {
      if (!centerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  const notifications = useMemo(() => {
    if (!settings) return [];
    const today = toDateKey();
    const active = tasks.filter((task) => !task.completed);
    const overdue = active.filter((task) => task.due_date && task.due_date < today);
    const dueToday = active.filter((task) => task.due_date === today);
    const important = active.filter((task) => task.priority === "high");
    const items = [];

    if (settings.notifications.taskReminders && overdue.length) {
      items.push({ id: "overdue", icon: AlertTriangle, tone: "danger", title: "Есть просроченные задачи", text: `${overdue.length} требуют внимания` });
    }
    if (settings.notifications.taskReminders && dueToday.length) {
      items.push({ id: "today", icon: CalendarCheck, tone: "accent", title: "План на сегодня", text: `${dueToday.length} задач запланировано` });
    }
    if (settings.notifications.importantTasks && important.length) {
      items.push({ id: "important", icon: Flag, tone: "warning", title: "Важные задачи", text: `${important.length} с высоким приоритетом` });
    }
    if (settings.notifications.dailySummary && active.length) {
      items.push({ id: "daily", icon: ListTodo, tone: "info", title: "Ежедневная сводка", text: `${active.length} активных задач осталось` });
    }
    if (settings.notifications.weeklySummary && new Date().getDay() === 1) {
      const completed = tasks.filter((task) => task.completed).length;
      items.push({ id: "weekly", icon: CheckCircle2, tone: "success", title: "Недельный итог", text: `${completed} задач выполнено всего` });
    }
    return items;
  }, [settings, tasks]);

  return (
    <div className="notificationCenter" ref={centerRef}>
      <button className="notificationButton" aria-label="Уведомления" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <Bell size={19} />
        {notifications.length > 0 && <span>{notifications.length}</span>}
      </button>

      {open && (
        <div className="notificationPanel" role="dialog" aria-label="Центр уведомлений">
          <header><div><h2>Уведомления</h2><span>{notifications.length ? `${notifications.length} новых` : "Новых нет"}</span></div><button className="iconButton" aria-label="Закрыть" onClick={() => setOpen(false)}><X size={18} /></button></header>
          <div className="notificationList">
            {notifications.length ? notifications.map(({ id, icon: Icon, tone, title, text }) => (
              <div className={`notificationItem tone-${tone}`} key={id}>
                <span><Icon size={18} /></span>
                <div><strong>{title}</strong><p>{text}</p></div>
              </div>
            )) : (
              <div className="notificationEmpty"><CheckCircle2 size={26} /><strong>Все спокойно</strong><p>Новых напоминаний нет</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
