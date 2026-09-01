import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Inbox,
  LogOut,
  CircleUserRound,
  Settings,
  Star,
  Sun,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { signOutOffline } from "../lib/offlineAuth";

const navigation = [
  { id: "inbox", label: "Входящие", icon: Inbox },
  { id: "today", label: "Сегодня", icon: Sun },
  { id: "upcoming", label: "Предстоящие", icon: CalendarDays },
  { id: "important", label: "Важные", icon: Star },
  { id: "completed", label: "Выполненные", icon: CheckCircle2 },
];

export default function Sidebar({ activeView, counts = {}, isOpen = false, onClose, onViewChange, user }) {
  const navigate = useNavigate();

  const handleViewChange = (id) => {
    if (onViewChange) {
      onViewChange(id);
      return;
    }
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    signOutOffline();
    await supabase.auth.signOut();
    navigate("/login");
  };

  const displayName = user?.user_metadata?.full_name || user?.email || "Пользователь";

  return (
    <aside className={`sidebar ${isOpen ? "isOpen" : ""}`}>
      <div className="sidebarHeader">
        <Link className="brand" to="/dashboard" aria-label="Focus">
          <span className="brandMark">F</span><span>Focus</span>
        </Link>
        <button className="iconButton closeSidebar" aria-label="Закрыть" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <nav className="sidebarNav" aria-label="Списки задач">
        <p className="navLabel">Задачи</p>
        {navigation.map(({ id, label, icon: Icon }) => (
          <button className={activeView === id ? "active" : ""} key={id} onClick={() => handleViewChange(id)}>
            <Icon size={19} strokeWidth={2} />
            <span>{label}</span>
            <span className="navCount">
              {counts[id] === undefined ? "" : counts[id]}
            </span>
          </button>
        ))}
      </nav>

      <div className="sidebarFooter">
        <Link className="profileLink" to="/profile">
          <span className="avatarSmall">{displayName.trim().charAt(0).toUpperCase()}</span>
          <span className="profileCopy">
            <strong>{displayName}</strong>
            <small>{user?.email === "admin@local.test" ? "Локальный режим" : "Профиль"}</small>
          </span>
          <CircleUserRound size={18} />
        </Link>
        <Link className="settingsNavLink" to="/settings">
          <Settings size={18} /><span>Настройки приложения</span>
        </Link>
        <button className="logoutButton" onClick={handleLogout}>
          <LogOut size={18} /><span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
