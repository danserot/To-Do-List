import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CheckSquare2, Menu, Plus, Search, X } from "lucide-react";
import BulkToolbar from "../components/BulkToolbar";
import CommandPalette from "../components/CommandPalette";
import NotificationCenter from "../components/NotificationCenter";
import Onboarding from "../components/Onboarding";
import QuickAdd from "../components/QuickAdd";
import QuickTasks from "../components/QuickTasks";
import Sidebar from "../components/Sidebar";
import SortableTaskItem from "../components/SortableTaskItem";
import SyncIndicator from "../components/SyncIndicator";
import TaskDetails from "../components/TaskDetails";
import { getCurrentUser, getOfflineProfile } from "../lib/offlineAuth";
import { getSnoozeDate, getTaskCounts, getViewTasks, TASK_VIEWS, toDateKey } from "../domain/tasks";
import { listRepository } from "../services/listRepository";
import { settingsRepository } from "../services/settingsRepository";
import { taskRepository } from "../services/taskRepository";

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
  const word = lastTwo >= 11 && lastTwo <= 14 ? "задач" : last === 1 ? "задача" : last >= 2 && last <= 4 ? "задачи" : "задач";
  return `${count} ${word}`;
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [view, setView] = useState(TASK_VIEWS.inbox);
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [undoAction, setUndoAction] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
  const [customLists, setCustomLists] = useState([]);
  const undoTimer = useRef(null);
  const searchRef = useRef(null);
  const shortcutPrefix = useRef("");
  const shortcutTimer = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    let active = true;
    const load = async () => {
      const currentUser = await getCurrentUser();
      if (!active || !currentUser) return;
      setUser(currentUser);
      setAppSettings(settingsRepository.get(currentUser, getOfflineProfile()));
      setCustomLists(await listRepository.sync(currentUser));
      setTasks(await taskRepository.list(currentUser));
      setLoading(false);
    };
    load();
    return () => { active = false; window.clearTimeout(undoTimer.current); };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    return settingsRepository.subscribe(() => setAppSettings(settingsRepository.get(user, getOfflineProfile())));
  }, [user]);

  const changeView = useCallback((nextView) => {
    setView(nextView);
    setSearch("");
    setSelectionMode(false);
    setSelectedIds(new Set());
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const hotkeys = (event) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); return; }
      if (event.key === "/" && !typing) { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key.toLowerCase() === "x" && !typing) setSelectionMode((value) => !value);
      if (event.key === "?" && !typing) setCommandOpen(true);
      if (!typing && event.key.toLowerCase() === "g") {
        shortcutPrefix.current = "g";
        window.clearTimeout(shortcutTimer.current);
        shortcutTimer.current = window.setTimeout(() => { shortcutPrefix.current = ""; }, 1200);
        return;
      }
      if (!typing && shortcutPrefix.current === "g") {
        const destinations = { i: "inbox", t: "today", v: "important" };
        const destination = destinations[event.key.toLowerCase()];
        shortcutPrefix.current = "";
        if (destination) { event.preventDefault(); changeView(destination); }
      }
      if (event.key === "Escape") { setSelectionMode(false); setSelectedIds(new Set()); }
    };
    window.addEventListener("keydown", hotkeys);
    return () => {
      window.removeEventListener("keydown", hotkeys);
      window.clearTimeout(shortcutTimer.current);
    };
  }, [changeView]);

  const visibleTasks = useMemo(() => getViewTasks(tasks, view, search), [search, tasks, view]);
  const counts = useMemo(() => {
    const base = getTaskCounts(tasks);
    customLists.forEach((list) => { base[`list:${list.id}`] = tasks.filter((task) => !task.completed && task.list_id === list.id).length; });
    return base;
  }, [customLists, tasks]);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const currentList = view.startsWith("list:") ? customLists.find((list) => list.id === view.slice(5)) : null;
  const currentCopy = currentList ? { title: currentList.name, subtitle: "Ваш пользовательский список" } : viewCopy[view];
  const hasSearch = Boolean(search.trim());
  const defaultDueDate = view === TASK_VIEWS.today ? toDateKey() : view === TASK_VIEWS.upcoming ? toDateKey(new Date(Date.now() + 86400000)) : "";
  const defaultPriority = view === TASK_VIEWS.important ? "high" : "none";

  const showUndo = (message, snapshot) => {
    setUndoAction({ message, snapshot });
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndoAction(null), 6500);
  };

  const mutateWithUndo = async (message, operation) => {
    if (!user) return;
    const snapshot = tasks.map((task) => ({ ...task, subtasks: task.subtasks.map((subtask) => ({ ...subtask })) }));
    const next = await operation();
    setTasks(next);
    showUndo(message, snapshot);
  };

  const handleCreate = async (input) => {
    if (!user) return;
    setTasks(await taskRepository.create(user, input));
  };

  const handleUpdate = async (id, changes, message = "Изменения сохранены") => mutateWithUndo(message, () => taskRepository.update(user, id, changes));
  const handleDelete = async (task) => {
    setSelectedTaskId(null);
    await mutateWithUndo("Задача удалена", () => taskRepository.remove(user, task.id));
  };
  const handleUndo = () => {
    if (!user || !undoAction) return;
    setTasks(taskRepository.replaceAll(user, undoAction.snapshot));
    setUndoAction(null);
    window.clearTimeout(undoTimer.current);
  };

  const handleCreateFromSearch = async () => {
    const text = search.trim();
    if (!text) return;
    await handleCreate({ text, dueDate: defaultDueDate, priority: defaultPriority, listId: currentList?.id || "" });
    setSearch("");
    if (view === TASK_VIEWS.completed) setView(TASK_VIEWS.inbox);
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id || !user) return;
    const oldIndex = visibleTasks.findIndex((task) => task.id === active.id);
    const newIndex = visibleTasks.findIndex((task) => task.id === over.id);
    const reordered = arrayMove(visibleTasks, oldIndex, newIndex);
    const snapshot = tasks.map((task) => ({ ...task }));
    setTasks(taskRepository.reorder(user, reordered.map((task) => task.id)));
    showUndo("Порядок задач изменен", snapshot);
  };

  const toggleSelected = (id) => setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const runBulk = async (type) => {
    if (!selectedIds.size) return;
    await mutateWithUndo(type === "delete" ? "Задачи удалены" : "Задачи обновлены", async () => {
      let next = tasks;
      for (const id of selectedIds) {
        if (type === "delete") next = await taskRepository.remove(user, id);
        if (type === "complete") next = await taskRepository.update(user, id, { completed: true });
        if (type === "snooze") next = await taskRepository.update(user, id, { due_date: getSnoozeDate("tomorrow") });
      }
      return next;
    });
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const createCustomList = async (name) => {
    const lists = listRepository.create(user, name);
    setCustomLists(lists);
    await listRepository.saveCloud(user, lists);
    changeView(`list:${lists[lists.length - 1].id}`);
  };

  const deleteCustomList = async (id) => {
    if (!user) return;
    const affected = tasks.filter((task) => task.list_id === id);
    for (const task of affected) await taskRepository.update(user, task.id, { list_id: "" });
    setTasks(await taskRepository.list(user));
    const lists = listRepository.remove(user, id);
    setCustomLists(lists);
    await listRepository.saveCloud(user, lists);
    if (view === `list:${id}`) changeView(TASK_VIEWS.inbox);
  };

  return (
    <div className="appShell">
      <a className="skipLink" href="#task-content">Перейти к задачам</a>
      <Sidebar activeView={view} counts={counts} customLists={customLists} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onCreateList={createCustomList} onDeleteList={deleteCustomList} onViewChange={changeView} user={user} />
      {sidebarOpen && <button className="sidebarBackdrop" aria-label="Закрыть меню" onClick={() => setSidebarOpen(false)} />}

      <main className="workspace" id="task-content">
        <header className="topbar">
          <button className="iconButton menuButton" aria-label="Открыть меню" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div className="searchBox"><Search size={18} /><input ref={searchRef} aria-label="Поиск задач" placeholder="Поиск" value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button aria-label="Очистить поиск" onClick={() => setSearch("")}><X size={16} /></button>}</div>
          <button className="commandButton" onClick={() => setCommandOpen(true)} title="Командная панель"><span>Команды</span><kbd>Ctrl K</kbd></button>
          <SyncIndicator user={user} />
          <NotificationCenter tasks={tasks} settings={appSettings} />
          <div className="topbarDate">{new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long" }).format(new Date())}</div>
        </header>

        <div className="taskPage">
          <div className="taskPageHeader"><div><h1>{currentCopy.title}</h1><p>{currentCopy.subtitle}</p></div><div className="pageHeaderActions"><button className={selectionMode ? "selectionToggle active" : "selectionToggle"} aria-pressed={selectionMode} onClick={() => { setSelectionMode((value) => !value); setSelectedIds(new Set()); }}><CheckSquare2 size={17} /><span>Выбрать</span></button><span className="taskCountBadge">{visibleTasks.length}</span></div></div>

          {view !== TASK_VIEWS.completed && <><QuickAdd defaultDueDate={defaultDueDate} defaultPriority={defaultPriority} listId={currentList?.id || ""} onAdd={handleCreate} /><QuickTasks user={user} onCreate={handleCreate} /></>}
          {selectionMode && <BulkToolbar count={selectedIds.size} onCancel={() => { setSelectionMode(false); setSelectedIds(new Set()); }} onComplete={() => runBulk("complete")} onDelete={() => runBulk("delete")} onSnooze={() => runBulk("snooze")} />}

          <section className="taskList" aria-live="polite" aria-label="Список задач">
            {loading ? <div className="loadingList"><span /><span /><span /></div> : visibleTasks.length ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={visibleTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                  {visibleTasks.map((task) => <SortableTaskItem key={task.id} task={task} disabled={hasSearch || selectionMode} selected={selectedIds.has(task.id)} selectionMode={selectionMode} onDelete={handleDelete} onOpen={() => setSelectedTaskId(task.id)} onPin={() => handleUpdate(task.id, { pinned: !task.pinned }, task.pinned ? "Задача откреплена" : "Задача закреплена")} onSelect={toggleSelected} onSnooze={(option) => handleUpdate(task.id, { due_date: getSnoozeDate(option) }, "Срок задачи изменен")} onToggle={() => handleUpdate(task.id, { completed: !task.completed }, task.completed ? "Задача возвращена" : "Задача выполнена")} />)}
                </SortableContext>
              </DndContext>
            ) : <div className="emptyState"><div className="emptyCheck">✓</div><h2>{hasSearch ? "Ничего не найдено" : "Здесь пока пусто"}</h2><p>{hasSearch ? `У вас ${formatTaskTotal(tasks.length)}, но среди них нет «${search.trim()}». Создайте ее.` : view === TASK_VIEWS.completed ? "Выполненные задачи появятся здесь" : "Добавьте первую задачу и начните с малого"}</p>{hasSearch && <button className="emptyCreateButton" onClick={handleCreateFromSearch}><Plus size={17} />Создать эту задачу</button>}</div>}
          </section>
        </div>
      </main>

      {selectedTask && <TaskDetails task={selectedTask} lists={customLists} onClose={() => setSelectedTaskId(null)} onDelete={() => handleDelete(selectedTask)} onUpdate={(changes) => handleUpdate(selectedTask.id, changes)} />}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onNavigate={changeView} onNewTask={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }))} onSelectionMode={() => setSelectionMode(true)} />
      {user && !loading && <Onboarding user={user} taskCount={tasks.length} onCreate={handleCreate} />}
      {undoAction && <div className="undoToast" role="status"><span>{undoAction.message}</span><button onClick={handleUndo}>Отменить</button><button aria-label="Закрыть" onClick={() => setUndoAction(null)}><X size={16} /></button></div>}
    </div>
  );
}
