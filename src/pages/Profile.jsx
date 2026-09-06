import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  CircleUserRound,
  Flame,
  Menu,
  Settings2,
  Sparkles,
  Target,
  Trash2,
  Trophy,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";
import {
  getCurrentUser,
  getOfflineProfile,
  isOfflineUser,
  saveOfflineProfile,
} from "../lib/offlineAuth";
import { getTaskCounts, toDateKey } from "../domain/tasks";
import { taskRepository } from "../services/taskRepository";
import { socialProfileRepository } from "../services/socialProfileRepository";
import { processProfileImage } from "../platform/imageProcessor";

const coverOptions = [
  { id: "coral", label: "Коралловый" },
  { id: "teal", label: "Бирюзовый" },
  { id: "blue", label: "Синий" },
  { id: "charcoal", label: "Графитовый" },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState({ full_name: "", avatar_url: "" });
  const [socialProfile, setSocialProfile] = useState({
    username: "",
    bio: "",
    cover: "coral",
    avatarImage: "",
    coverImage: "",
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState("");
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const currentUser = await getCurrentUser();
      if (!active || !currentUser) return;
      setUser(currentUser);
      setSocialProfile(await socialProfileRepository.sync(currentUser));
      setTasks(await taskRepository.list(currentUser));
      setProfile({
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "",
        avatar_url: "",
      });

      if (isOfflineUser(currentUser)) {
        const data = getOfflineProfile();
        setProfile({
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || "",
        });
        return;
      }

      const { data } = await supabase
        .from("focus_profiles")
        .select("full_name")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (active && data) {
        setProfile({
          full_name: data.full_name || currentUser.user_metadata?.full_name || "",
          avatar_url: "",
        });
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!saved) return undefined;
    const timer = window.setTimeout(() => setSaved(false), 2600);
    return () => window.clearTimeout(timer);
  }, [saved]);

  useEffect(() => {
    if (!uploadError) return undefined;
    const timer = window.setTimeout(() => setUploadError(""), 4000);
    return () => window.clearTimeout(timer);
  }, [uploadError]);

  const counts = useMemo(() => getTaskCounts(tasks), [tasks]);
  const total = tasks.length;
  const completed = counts.completed;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const todayCompleted = tasks.filter(
    (task) => task.completed && task.due_date === toDateKey(),
  ).length;
  const displayName = profile.full_name || "Пользователь Focus";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const achievements = [
    { icon: Sparkles, title: "Первый шаг", detail: "Создана первая задача", unlocked: total > 0 },
    { icon: Flame, title: "В ритме", detail: "Выполнено 3 задачи", unlocked: completed >= 3 },
    { icon: Trophy, title: "Финишер", detail: "Выполнено 10 задач", unlocked: completed >= 10 },
  ];

  const saveProfile = async () => {
    if (!user || !profile.full_name.trim()) return;

    const cleanProfile = {
      full_name: profile.full_name.trim(),
      avatar_url: profile.avatar_url.trim(),
    };

    if (isOfflineUser(user)) {
      saveOfflineProfile(cleanProfile);
    }

    setProfile(cleanProfile);
    const savedSocialProfile = socialProfileRepository.save(user, socialProfile);
    setSocialProfile(savedSocialProfile);
    await socialProfileRepository.saveCloud(
      user,
      savedSocialProfile,
      cleanProfile.full_name,
    );
    setSaved(true);
  };

  const uploadImage = async (kind, file) => {
    if (!user || !file) return;
    setUploadError("");
    setUploading(kind);

    try {
      const image = await processProfileImage(
        file,
        kind === "avatar"
          ? { maxWidth: 512, maxHeight: 512, quality: 0.84 }
          : { maxWidth: 1600, maxHeight: 900, quality: 0.82 },
      );
      const key = kind === "avatar" ? "avatarImage" : "coverImage";
      const next = { ...socialProfile, [key]: image };
      setSocialProfile(socialProfileRepository.save(user, next));
      setAvatarError(false);
      setSaved(true);
    } catch (error) {
      setUploadError(error.message || "Не удалось загрузить изображение");
    } finally {
      setUploading("");
    }
  };

  const removeImage = (kind) => {
    if (!user) return;
    const key = kind === "avatar" ? "avatarImage" : "coverImage";
    const next = { ...socialProfile, [key]: "" };
    setSocialProfile(socialProfileRepository.save(user, next));
    setAvatarError(false);
    setSaved(true);
  };

  return (
    <div className="layout profileLayout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      {sidebarOpen && (
        <button className="sidebarBackdrop" aria-label="Закрыть меню" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="profileWorkspace">
        <div className="profileMobileHeader">
          <button className="iconButton menuButton" aria-label="Открыть меню" onClick={() => setSidebarOpen(true)}>
            <Menu size={21} />
          </button>
          <strong>Профиль</strong>
        </div>

        <div className="profileCanvas">
          <section className="socialProfileHeader">
            <div className={`profileCover cover-${socialProfile.cover}`}>
              {socialProfile.coverImage ? (
                <img className="profileCoverImage" src={socialProfile.coverImage} alt="Обложка профиля" />
              ) : (
                <Target size={42} strokeWidth={1.5} />
              )}
              <button className="coverUploadButton" disabled={uploading === "cover"} onClick={() => coverInputRef.current?.click()}>
                <Camera size={16} />{uploading === "cover" ? "Загрузка" : "Загрузить обложку"}
              </button>
            </div>

            <div className="profileIdentity">
              <div className="socialAvatar">
                {(socialProfile.avatarImage || profile.avatar_url) && !avatarError ? (
                  <img src={socialProfile.avatarImage || profile.avatar_url} alt={`Аватар ${displayName}`} onError={() => setAvatarError(true)} />
                ) : (
                  <span>{initials || "F"}</span>
                )}
              </div>

              <button className="avatarEditButton" aria-label="Загрузить аватар" title="Загрузить аватар" disabled={uploading === "avatar"} onClick={() => avatarInputRef.current?.click()}>
                <Camera size={15} />
              </button>

              <div className="identityCopy">
                <h1>{displayName}</h1>
                <p className="profileHandle">@{socialProfile.username || "focus-user"}</p>
                <p className="profileBio">{socialProfile.bio || "Добавьте короткий статус о себе"}</p>
              </div>

            </div>

            <div className="socialStats">
              <div><strong>{total}</strong><span>Всего задач</span></div>
              <div><strong>{counts.inbox}</strong><span>Активные</span></div>
              <div><strong>{completed}</strong><span>Выполнено</span></div>
              <div><strong>{progress}%</strong><span>Прогресс</span></div>
            </div>
          </section>

          <div className="profileTabs" role="tablist" aria-label="Разделы профиля">
            <button role="tab" aria-selected={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
              <CircleUserRound size={17} />Обзор
            </button>
            <button role="tab" aria-selected={activeTab === "settings"} onClick={() => setActiveTab("settings")}>
              <Settings2 size={17} />Настройки
            </button>
          </div>

          {activeTab === "overview" ? (
            <div className="profileOverview">
              <section className="progressSection">
                <div className="sectionTitle">
                  <div><span>Личная эффективность</span><h2>Ваш прогресс</h2></div>
                  <Target size={22} />
                </div>
                <div className="progressSummary">
                  <strong>{progress}%</strong>
                  <div>
                    <div className="profileProgressTrack"><span style={{ width: `${progress}%` }} /></div>
                    <p>{completed} из {total} задач выполнено</p>
                  </div>
                </div>
                <div className="activityFacts">
                  <div><CheckCircle2 size={18} /><span><strong>{todayCompleted}</strong> сегодня</span></div>
                  <div><Flame size={18} /><span><strong>{counts.important}</strong> важных</span></div>
                  <div><Target size={18} /><span><strong>{counts.today}</strong> в плане</span></div>
                </div>
              </section>

              <section className="achievementsSection">
                <div className="sectionTitle">
                  <div><span>Коллекция</span><h2>Достижения</h2></div>
                  <Trophy size={22} />
                </div>
                <div className="achievementList">
                  {achievements.map(({ icon: Icon, title, detail, unlocked }) => (
                    <div className={unlocked ? "unlocked" : "locked"} key={title}>
                      <span><Icon size={19} /></span>
                      <div><strong>{title}</strong><small>{detail}</small></div>
                      <em>{unlocked ? "Получено" : "Закрыто"}</em>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="profileSettingsView">
              <section className="profileEditSection">
                <div className="sectionTitle">
                  <div><span>Публичный профиль</span><h2>О себе</h2></div>
                  <CircleUserRound size={22} />
                </div>

                <div className="profileEditGrid">
                  <label><span>Имя</span><input maxLength={60} value={profile.full_name} onChange={(event) => setProfile((current) => ({ ...current, full_name: event.target.value }))} /></label>
                  <label><span>Никнейм</span><div className="usernameField"><span>@</span><input maxLength={32} value={socialProfile.username} onChange={(event) => setSocialProfile((current) => ({ ...current, username: event.target.value }))} /></div></label>
                  <label className="wideField"><span>Статус</span><textarea maxLength={160} rows="3" value={socialProfile.bio} onChange={(event) => setSocialProfile((current) => ({ ...current, bio: event.target.value }))} /></label>
                </div>

                <div className="profileUploadActions">
                  <button onClick={() => avatarInputRef.current?.click()}><Camera size={17} />Загрузить аватар</button>
                  <button onClick={() => coverInputRef.current?.click()}><Camera size={17} />Загрузить обложку</button>
                  {socialProfile.avatarImage && (
                    <button className="removeProfileImage" onClick={() => removeImage("avatar")}><Trash2 size={17} />Убрать аватар</button>
                  )}
                  {socialProfile.coverImage && (
                    <button className="removeProfileImage" onClick={() => removeImage("cover")}><Trash2 size={17} />Убрать обложку</button>
                  )}
                </div>

                <div className="coverPicker">
                  <span>Цвет обложки</span>
                  <div>
                    {coverOptions.map((option) => (
                      <button
                        className={`coverSwatch cover-${option.id}`}
                        key={option.id}
                        aria-label={option.label}
                        aria-pressed={socialProfile.cover === option.id}
                        title={option.label}
                        onClick={() => setSocialProfile((current) => ({ ...current, cover: option.id, coverImage: "" }))}
                      />
                    ))}
                  </div>
                </div>

                <button className="saveSocialProfile" disabled={!profile.full_name.trim()} onClick={saveProfile}>
                  Сохранить профиль
                </button>
              </section>

            </div>
          )}
        </div>
      </main>

      <input
        ref={avatarInputRef}
        className="visuallyHidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          uploadImage("avatar", event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={coverInputRef}
        className="visuallyHidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          uploadImage("cover", event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {saved && <div className="profileSavedToast" role="status"><CheckCircle2 size={18} />Профиль сохранен</div>}
      {uploadError && <div className="profileErrorToast" role="alert">{uploadError}</div>}
    </div>
  );
}
