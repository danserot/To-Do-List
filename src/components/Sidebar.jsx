import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, CheckCircle2, CircleUserRound, Folder, Inbox, LogOut, Plus, Settings, Star, Sun, Trash2, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { signOutOffline } from "../lib/offlineAuth";

const navigation = [
  { id: "inbox", label: "Входящие", icon: Inbox },
  { id: "today", label: "Сегодня", icon: Sun },
  { id: "upcoming", label: "Предстоящие", icon: CalendarDays },
  { id: "important", label: "Важные", icon: Star },
  { id: "completed", label: "Выполненные", icon: CheckCircle2 },
];

export default function Sidebar({ activeView, counts = {}, customLists = [], isOpen = false, onClose, onCreateList, onDeleteList, onViewChange, user }) {
  const navigate = useNavigate();
  const [creatingList, setCreatingList] = useState(false);
  const [listName, setListName] = useState("");

  const handleViewChange = (id) => {
    if (onViewChange) onViewChange(id);
    else navigate("/dashboard");
  };

  const handleLogout = async () => {
    signOutOffline();
    await supabase.auth.signOut();
    navigate("/login");
  };

  const createList = () => {
    const name = listName.trim();
    if (!name || !onCreateList) return;
    onCreateList(name);
    setListName("");
    setCreatingList(false);
  };

  const displayName = user?.user_metadata?.full_name || user?.email || "Пользователь";

  return (
    <aside className={`sidebar ${isOpen ? "isOpen" : ""}`}>
      <div className="sidebarHeader">
        <Link className="brand" to="/dashboard" aria-label="Focus"><span className="brandMark">F</span><span>Focus</span></Link>
        <button className="iconButton closeSidebar" aria-label="Закрыть" onClick={onClose}><X size={20} /></button>
      </div>

      <nav className="sidebarNav" aria-label="Основные списки задач">
        <p className="navLabel">Задачи</p>
        {navigation.map(({ id, label, icon: Icon }) => <button className={activeView === id ? "active" : ""} key={id} onClick={() => handleViewChange(id)}><Icon size={19} strokeWidth={2} /><span>{label}</span><span className="navCount">{counts[id] === undefined ? "" : counts[id]}</span></button>)}
      </nav>

      <nav className="sidebarNav customListsNav" aria-label="Пользовательские списки">
        <div className="navSectionTitle"><p className="navLabel">Списки</p><button aria-label="Создать список" title="Создать список" onClick={() => setCreatingList(true)}><Plus size={16} /></button></div>
        {customLists.map((list) => <div className="customListItem" key={list.id}><button className={activeView === `list:${list.id}` ? "active" : ""} onClick={() => handleViewChange(`list:${list.id}`)}><Folder size={18} /><span>{list.name}</span><span className="navCount">{counts[`list:${list.id}`] || ""}</span></button><button className="deleteListButton" aria-label={`Удалить список ${list.name}`} title="Удалить список" onClick={() => onDeleteList?.(list.id)}><Trash2 size={14} /></button></div>)}
        {creatingList && <div className="createListRow"><input autoFocus aria-label="Название списка" placeholder="Название списка" maxLength={40} value={listName} onChange={(event) => setListName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") createList(); if (event.key === "Escape") setCreatingList(false); }} /><button disabled={!listName.trim()} aria-label="Добавить список" onClick={createList}><Plus size={15} /></button></div>}
      </nav>

      <div className="sidebarFooter">
        <Link className="profileLink" to="/profile"><span className="avatarSmall">{displayName.trim().charAt(0).toUpperCase()}</span><span className="profileCopy"><strong>{displayName}</strong><small>{user?.email === "admin@local.test" ? "Локальный режим" : "Профиль"}</small></span><CircleUserRound size={18} /></Link>
        <Link className="settingsNavLink" to="/settings"><Settings size={18} /><span>Настройки приложения</span></Link>
        <button className="logoutButton" onClick={handleLogout}><LogOut size={18} /><span>Выйти</span></button>
      </div>
    </aside>
  );
}
