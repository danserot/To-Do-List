import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Plus, Search, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import QuickAdd from "../components/QuickAdd";
import QuickTasks from "../components/QuickTasks";
import TaskDetails from "../components/TaskDetails";
import TaskItem from "../components/TaskItem";
import NotificationCenter from "../components/NotificationCenter";
import { getCurrentUser, getOfflineProfile } from "../lib/offlineAuth";
import {
  getTaskCounts,
  getViewTasks,
  TASK_VIEWS,
  toDateKey,
} from "../domain/tasks";
import { taskRepository } from "../services/taskRepository";
import { settingsRepository } from "../services/settingsRepository";

const viewCopy = {
  inbox: { title: "Входящие", subtitle: "Все активные задачи в одном месте" },
  today: { title: "Сегодня", subtitle: "Сосредоточьтесь на текущем дне" },
  upcoming: { title: "Предстоящие", subtitle: "Планы на ближайшее время" },
  important: { title: "Важные", subtitle: "Задачи с высоким приоритетом" },
  completed: { title: "Выполненные", subtitle: "То, что уже сделано" },
};

const formatTaskTotal = (count) => {
  const lastTwo = count % 100;
  const last = count % 10;
  const word =
    lastTwo >= 11 && lastTwo <= 14
      ? "задач"
      : last === 1
        ? "задача"
        : last >= 2 && last <= 4
          ? "задачи"
          : "задач";
  return `${count} ${word}`;
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [view, setView] = useState(TASK_VIEWS.inbox);
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletedTask, setDeletedTask] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
  const undoTimer = useRef(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const currentUser = await getCurrentUser();
      if (!active || !currentUser) return;
      setUser(currentUser);
      setAppSettings(settingsRepository.get(currentUser, getOfflineProfile()));
      setTasks(await taskRepository.list(currentUser));
      setLoading(false);
    };

    load();
    return () => {
      active = false;
      window.clearTimeout(undoTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    return settingsRepository.subscribe(() =>
      setAppSettings(settingsRepository.get(user, getOfflineProfile())),
    );
  }, [user]);

  const visibleTasks = useMemo(
    () => getViewTasks(tasks, view, search),
    [search, tasks, view],
  );
  const counts = useMemo(() => getTaskCounts(tasks), [tasks]);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const hasSearch = Boolean(search.trim());

  const handleCreate = async (input) => {
    if (!user) return;
    setTasks(await taskRepository.create(user, input));
  };

  const handleCreateFromSearch = async () => {
    const text = search.trim();
    if (!text) return;

    await handleCreate({ text, dueDate: defaultDueDate, priority: "none" });
    setSearch("");
    if (view === TASK_VIEWS.completed) setView(TASK_VIEWS.inbox);
  };

  const handleUpdate = async (id, changes) => {
    if (!user) return;
    setTasks(await taskRepository.update(user, id, changes));
  };

  const handleDelete = async (task) => {
    if (!user) return;
    setSelectedTaskId(null);
    setDeletedTask(task);
    setTasks(await taskRepository.remove(user, task.id));
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setDeletedTask(null), 6000);
  };

  const handleUndo = () => {
    if (!user || !deletedTask) return;
    setTasks(taskRepository.restore(user, deletedTask));
    setDeletedTask(null);
    window.clearTimeout(undoTimer.current);
  };

  const changeView = (nextView) => {
    setView(nextView);
    setSearch("");
    setSidebarOpen(false);
  };

  const defaultDueDate =
    view === TASK_VIEWS.today
      ? toDateKey()
      : view === TASK_VIEWS.upcoming
        ? toDateKey(new Date(Date.now() + 86400000))
        : "";
  const defaultPriority = view === TASK_VIEWS.important ? "high" : "none";

  return (
    <div className="appShell">
      <Sidebar
        activeView={view}
        counts={counts}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onViewChange={changeView}
        user={user}
      />

      {sidebarOpen && (
        <button
          className="sidebarBackdrop"
          aria-label="Закрыть меню"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="workspace">
        <header className="topbar">
          <button
            className="iconButton menuButton"
            aria-label="Открыть меню"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="searchBox">
            <Search size={18} />
            <input
              aria-label="Поиск задач"
              placeholder="Поиск"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button aria-label="Очистить поиск" onClick={() => setSearch("")}>
                <X size={16} />
              </button>
            )}
          </div>

          <NotificationCenter tasks={tasks} settings={appSettings} />

          <div className="topbarDate">
            {new Intl.DateTimeFormat("ru-RU", {
              weekday: "short",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </div>
        </header>

        <div className="taskPage">
          <div className="taskPageHeader">
            <div>
              <h1>{viewCopy[view].title}</h1>
              <p>{viewCopy[view].subtitle}</p>
            </div>
            <span className="taskCountBadge">{visibleTasks.length}</span>
          </div>

          {view !== TASK_VIEWS.completed && (
            <>
              <QuickAdd
                defaultDueDate={defaultDueDate}
                defaultPriority={defaultPriority}
                onAdd={handleCreate}
              />
              <QuickTasks user={user} onCreate={handleCreate} />
            </>
          )}

          <section className="taskList" aria-live="polite">
            {loading ? (
              <div className="loadingList"><span /><span /><span /></div>
            ) : visibleTasks.length ? (
              visibleTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onDelete={handleDelete}
                  onOpen={() => setSelectedTaskId(task.id)}
                  onToggle={() => handleUpdate(task.id, { completed: !task.completed })}
                />
              ))
            ) : (
              <div className="emptyState">
                <div className="emptyCheck">✓</div>
                <h2>{hasSearch ? "Ничего не найдено" : "Здесь пока пусто"}</h2>
                <p>
                  {hasSearch
                    ? `У вас ${formatTaskTotal(tasks.length)}, но среди них нет «${search.trim()}». Создайте ее.`
                    : view === TASK_VIEWS.completed
                      ? "Выполненные задачи появятся здесь"
                      : "Добавьте первую задачу и начните с малого"}
                </p>
                {hasSearch && (
                  <button className="emptyCreateButton" onClick={handleCreateFromSearch}>
                    <Plus size={17} />Создать эту задачу
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onDelete={() => handleDelete(selectedTask)}
          onUpdate={(changes) => handleUpdate(selectedTask.id, changes)}
        />
      )}

      {deletedTask && (
        <div className="undoToast" role="status">
          <span>Задача удалена</span>
          <button onClick={handleUndo}>Вернуть</button>
          <button aria-label="Закрыть" onClick={() => setDeletedTask(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
