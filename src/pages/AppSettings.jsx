import { useEffect, useState } from "react";
import { Menu, Settings2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Settings from "../components/Settings";
import { getCurrentUser } from "../lib/offlineAuth";

export default function AppSettings() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      {sidebarOpen && (
        <button className="sidebarBackdrop" aria-label="Закрыть меню" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="settingsWorkspace">
        <div className="profileMobileHeader">
          <button className="iconButton menuButton" aria-label="Открыть меню" onClick={() => setSidebarOpen(true)}>
            <Menu size={21} />
          </button>
          <strong>Настройки</strong>
        </div>

        <div className="appSettingsPage">
          <header className="appSettingsHeader">
            <span><Settings2 size={18} /></span>
            <div><h1>Настройки приложения</h1><p>Аккаунт, внешний вид, уведомления и регион</p></div>
          </header>
          <Settings embedded />
        </div>
      </main>
    </div>
  );
}
