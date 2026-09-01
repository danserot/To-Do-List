import { useEffect, useState } from "react";
import { Plus, RotateCcw, Settings2, Sparkles, Trash2, X } from "lucide-react";
import {
  defaultQuickTasks,
  quickTaskRepository,
  quickTaskToInput,
} from "../services/quickTaskRepository";

export default function QuickTasks({ user, onCreate }) {
  const [templates, setTemplates] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createdText, setCreatedText] = useState("");
  const [creatingId, setCreatingId] = useState(null);

  useEffect(() => {
    let active = true;
    if (user) {
      quickTaskRepository.sync(user).then((items) => {
        if (active) setTemplates(items);
      });
    }
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!createdText) return undefined;
    const timer = window.setTimeout(() => setCreatedText(""), 2600);
    return () => window.clearTimeout(timer);
  }, [createdText]);

  useEffect(() => {
    if (!settingsOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setSettingsOpen(false);
      setDrafts([]);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [settingsOpen]);

  const openSettings = () => {
    setDrafts(templates.map((item) => ({ ...item })));
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    setDrafts([]);
  };

  const createFromTemplate = async (template) => {
    if (creatingId) return;
    setCreatingId(template.id);
    try {
      await onCreate(quickTaskToInput(template));
      setCreatedText(template.text);
    } finally {
      setCreatingId(null);
    }
  };

  const updateDraft = (id, changes) => {
    setDrafts((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  };

  const saveSettings = async () => {
    if (!user) return;
    const savedTemplates = quickTaskRepository.save(user, drafts);
    setTemplates(savedTemplates);
    await quickTaskRepository.saveCloud(user, savedTemplates);
    closeSettings();
  };

  const resetSettings = () => {
    const defaults = defaultQuickTasks.map((item) => ({ ...item }));
    setDrafts(defaults.map((item) => ({ ...item })));
  };

  return (
    <section className="quickTasks" aria-label="Быстрые задачи">
      <div className="quickTasksHeader">
        <span><Sparkles size={15} />Быстрые задачи</span>
        <button className="iconButton" aria-label="Настроить быстрые задачи" title="Настроить" onClick={openSettings}>
          <Settings2 size={17} />
        </button>
      </div>

      <div className="quickTaskButtons">
        {templates.map((template) => (
          <button
            key={template.id}
            disabled={creatingId === template.id}
            onClick={() => createFromTemplate(template)}
          >
            <Plus size={15} />
            <span>{template.text}</span>
          </button>
        ))}
        {!templates.length && (
          <button className="emptyQuickTaskButton" onClick={openSettings}>
            <Plus size={15} />Добавить шаблон
          </button>
        )}
      </div>

      {createdText && (
        <div className="quickCreatedToast" role="status">
          <span>✓</span>Задача «{createdText}» добавлена
        </div>
      )}

      {settingsOpen && (
        <div className="quickSettingsLayer" role="presentation" onMouseDown={closeSettings}>
          <div className="quickSettingsDialog" role="dialog" aria-modal="true" aria-labelledby="quick-settings-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <h2 id="quick-settings-title">Быстрые задачи</h2>
                <p>Настройте шаблоны для добавления в один клик</p>
              </div>
              <button className="iconButton" aria-label="Закрыть" onClick={closeSettings}><X size={20} /></button>
            </header>

            <div className="quickSettingsList">
              {drafts.map((template) => (
                <div className="quickSettingsRow" key={template.id}>
                  <input
                    aria-label="Название быстрой задачи"
                    maxLength={80}
                    placeholder="Название"
                    value={template.text}
                    onChange={(event) => updateDraft(template.id, { text: event.target.value })}
                  />
                  <select aria-label="Срок быстрой задачи" value={template.dueRule} onChange={(event) => updateDraft(template.id, { dueRule: event.target.value })}>
                    <option value="none">Без срока</option>
                    <option value="today">Сегодня</option>
                    <option value="tomorrow">Завтра</option>
                  </select>
                  <select aria-label="Приоритет быстрой задачи" value={template.priority} onChange={(event) => updateDraft(template.id, { priority: event.target.value })}>
                    <option value="none">Без приоритета</option>
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                  <button className="removeQuickTask" aria-label={`Удалить шаблон ${template.text || "без названия"}`} onClick={() => setDrafts((current) => current.filter((item) => item.id !== template.id))}>
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}

              {drafts.length < 12 && (
                <button className="addQuickTemplate" onClick={() => setDrafts((current) => [...current, quickTaskRepository.createDraft()])}>
                  <Plus size={17} />Добавить шаблон
                </button>
              )}
            </div>

            <footer>
              <button className="resetQuickTasks" onClick={resetSettings}><RotateCcw size={16} />По умолчанию</button>
              <div>
                <button className="secondaryButton" onClick={closeSettings}>Отмена</button>
                <button className="primaryButton" onClick={saveSettings}>Сохранить</button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
