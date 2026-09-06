import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Languages,
  Mail,
  Monitor,
  Moon,
  Phone,
  Save,
  Sun,
  UserRound,
} from "lucide-react";
import {
  getCurrentUser,
  getOfflineProfile,
  isOfflineUser,
  saveOfflineProfile,
} from "../lib/offlineAuth";
import { settingsRepository } from "../services/settingsRepository";
import { applyTheme } from "../platform/theme";

const timezones = [
  "Europe/Istanbul",
  "Europe/Moscow",
  "Europe/Berlin",
  "Asia/Almaty",
  "Asia/Tbilisi",
  "Asia/Tashkent",
  "UTC",
];

function Toggle({ checked, label, description, onChange }) {
  return (
    <label className="settingsToggleRow">
      <span><strong>{label}</strong><small>{description}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="toggleTrack" aria-hidden="true"><span /></span>
    </label>
  );
}

export default function Settings({ embedded = false }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const activeTheme = settings?.theme;

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;
      setUser(currentUser);
      setSettings(await settingsRepository.sync(currentUser, getOfflineProfile()));
    };
    load();
  }, []);

  useEffect(() => {
    if (!activeTheme) return;
    applyTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    if (!saved) return undefined;
    const timer = window.setTimeout(() => setSaved(false), 2800);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const timezoneOptions = useMemo(() => {
    if (!settings?.timezone || timezones.includes(settings.timezone)) return timezones;
    return [settings.timezone, ...timezones];
  }, [settings?.timezone]);

  const update = (changes) => {
    setSettings((current) => ({ ...current, ...changes }));
    setErrors({});
  };

  const updateNotification = (key, value) => {
    setSettings((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: value },
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(settings.contactEmail)) {
      nextErrors.contactEmail = "Введите корректную электронную почту";
    }
    if (settings.phone && !/^\+?[0-9 ()-]{7,24}$/.test(settings.phone)) {
      nextErrors.phone = "Используйте цифры, пробелы и знак +";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveSettings = async () => {
    if (!user || !settings || !validate()) return;
    setSaving(true);
    const savedSettings = settingsRepository.save(user, settings);
    setSettings(savedSettings);
    await settingsRepository.saveCloud(user, savedSettings);

    if (isOfflineUser(user)) {
      saveOfflineProfile({
        language: savedSettings.language,
        theme: savedSettings.theme,
      });
    }

    setSaving(false);
    setSaved(true);
  };

  if (!settings) {
    return <div className="settingsLoading">Загрузка настроек...</div>;
  }

  return (
    <section className={`productSettings ${embedded ? "embeddedSettings" : ""}`}>
      <div className="settingsSection">
        <div className="settingsSectionIntro">
          <span><UserRound size={18} /></span>
          <div><h2>Данные аккаунта</h2><p>Контакты для связи и восстановления доступа</p></div>
        </div>
        <div className="settingsFields">
          <label>
            <span>Электронная почта</span>
            <div className={errors.contactEmail ? "settingsInput hasError" : "settingsInput"}>
              <Mail size={17} />
              <input type="email" value={settings.contactEmail} onChange={(event) => update({ contactEmail: event.target.value })} />
            </div>
            {errors.contactEmail && <small className="fieldError">{errors.contactEmail}</small>}
          </label>
          <label>
            <span>Номер телефона</span>
            <div className={errors.phone ? "settingsInput hasError" : "settingsInput"}>
              <Phone size={17} />
              <input type="tel" placeholder="+7 999 000-00-00" value={settings.phone} onChange={(event) => update({ phone: event.target.value })} />
            </div>
            {errors.phone && <small className="fieldError">{errors.phone}</small>}
          </label>
        </div>
      </div>

      <div className="settingsSection">
        <div className="settingsSectionIntro">
          <span><Sun size={18} /></span>
          <div><h2>Внешний вид</h2><p>Тема применяется ко всему приложению</p></div>
        </div>
        <div className="themeChoices" role="radiogroup" aria-label="Тема приложения">
          {[
            { id: "light", label: "Светлая", icon: Sun },
            { id: "dark", label: "Темная", icon: Moon },
            { id: "system", label: "Системная", icon: Monitor },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} role="radio" aria-checked={settings.theme === id} onClick={() => update({ theme: id })}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settingsSection">
        <div className="settingsSectionIntro">
          <span><Bell size={18} /></span>
          <div><h2>Уведомления</h2><p>Выберите события для центра уведомлений</p></div>
        </div>
        <div className="settingsToggles">
          <Toggle checked={settings.notifications.taskReminders} label="Сроки задач" description="Сегодняшние и просроченные задачи" onChange={(value) => updateNotification("taskReminders", value)} />
          <Toggle checked={settings.notifications.importantTasks} label="Важные задачи" description="Задачи с высоким приоритетом" onChange={(value) => updateNotification("importantTasks", value)} />
          <Toggle checked={settings.notifications.dailySummary} label="Ежедневная сводка" description="Краткий план активных задач" onChange={(value) => updateNotification("dailySummary", value)} />
          <Toggle checked={settings.notifications.weeklySummary} label="Недельный итог" description="Сводка по понедельникам" onChange={(value) => updateNotification("weeklySummary", value)} />
        </div>
      </div>

      <div className="settingsSection">
        <div className="settingsSectionIntro">
          <span><Languages size={18} /></span>
          <div><h2>Язык и регион</h2><p>Формат дат и часовой пояс</p></div>
        </div>
        <div className="settingsFields">
          <label><span>Язык</span><select value={settings.language} onChange={(event) => update({ language: event.target.value })}><option value="ru">Русский</option><option value="en">English</option></select></label>
          <label><span>Часовой пояс</span><div className="settingsInput"><Clock3 size={17} /><select value={settings.timezone} onChange={(event) => update({ timezone: event.target.value })}>{timezoneOptions.map((timezone) => <option value={timezone} key={timezone}>{timezone}</option>)}</select></div></label>
        </div>
      </div>

      <footer className="settingsSaveBar">
        <div><strong>Локальное хранение</strong><span>Контактные данные остаются на этом устройстве</span></div>
        <button disabled={saving} onClick={saveSettings}><Save size={17} />{saving ? "Сохраняем" : "Сохранить изменения"}</button>
      </footer>

      {saved && <div className="settingsSavedToast" role="status"><CheckCircle2 size={18} />Настройки сохранены</div>}
    </section>
  );
}
