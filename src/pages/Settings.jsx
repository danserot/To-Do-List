import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";

export default function Settings() {
  const [userId, setUserId] = useState(null);
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const loadSettings = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    if (!currentUser) return;

    setUserId(currentUser.id);

    const { data } = await supabase
      .from("profiles")
      .select("language, theme")
      .eq("id", currentUser.id)
      .single();

    if (data) {
      setLanguage(data.language || "en");
      setTheme(data.theme || "light");
    }
  };

  const saveSettings = async () => {
    if (!userId) return;

    await supabase
      .from("profiles")
      .update({
        language,
        theme,
      })
      .eq("id", userId);
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="pageContent">
        <div className="settingsCard">
          <h1>Settings</h1>

          <label>Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>

          <label>Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>

          <button onClick={saveSettings}>Save settings</button>
        </div>
      </main>
    </div>
  );
}
