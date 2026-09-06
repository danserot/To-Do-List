import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { signOutOffline } from "../lib/offlineAuth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const authMessage = (error) => {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) {
    return "Неверная почта или пароль";
  }
  if (message.includes("email not confirmed")) {
    return "Подтвердите почту перед входом";
  }
  if (message.includes("already registered") || message.includes("already exists")) {
    return "Аккаунт с таким email уже существует. Войдите в него.";
  }
  if (message.includes("password")) {
    return "Пароль не подходит требованиям Supabase";
  }
  return error?.message || "Не удалось выполнить запрос";
};

export const validateLoginInput = ({ email, password }) => {
  const cleanEmail = normalizeEmail(email);
  if (!emailPattern.test(cleanEmail)) return "Введите корректную почту";
  if (!password) return "Введите пароль";
  return "";
};

export const validateRegisterInput = ({
  fullName,
  email,
  password,
  confirmPassword,
}) => {
  const cleanName = String(fullName || "").trim();
  const cleanEmail = normalizeEmail(email);
  if (cleanName.length < 2) return "Введите имя";
  if (!emailPattern.test(cleanEmail)) return "Введите корректную почту";
  if (password.length < 8) return "Пароль должен быть минимум 8 символов";
  if (password !== confirmPassword) return "Пароли не совпадают";
  return "";
};

export const ensureSupabaseAccountData = async (user, fullName = "") => {
  if (!user?.id) return;

  await Promise.allSettled([
    supabase.from("focus_profiles").upsert(
      {
        user_id: user.id,
        full_name: String(fullName || user.user_metadata?.full_name || "").trim(),
        username: normalizeEmail(user.email).split("@")[0] || "",
        bio: "",
        cover: "coral",
      },
      { onConflict: "user_id" },
    ),
    supabase.from("focus_settings").upsert(
      {
        user_id: user.id,
        contact_email: normalizeEmail(user.email),
        language: "ru",
        theme: "light",
        notifications: {
          taskReminders: true,
          dailySummary: true,
          importantTasks: true,
          weeklySummary: false,
        },
      },
      { onConflict: "user_id" },
    ),
  ]);
};

export const authRepository = {
  async login({ email, password }) {
    const validationError = validateLoginInput({ email, password });
    if (validationError) return { ok: false, message: validationError };
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        message: "Supabase не настроен. Добавьте REACT_APP_SUPABASE_URL и REACT_APP_SUPABASE_ANON_KEY.",
      };
    }

    signOutOffline();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (error) return { ok: false, message: authMessage(error) };
    await ensureSupabaseAccountData(data.user);
    return { ok: true };
  },

  async register({ fullName, email, password, confirmPassword }) {
    const validationError = validateRegisterInput({
      fullName,
      email,
      password,
      confirmPassword,
    });
    if (validationError) return { ok: false, message: validationError };
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        message: "Supabase не настроен. Добавьте REACT_APP_SUPABASE_URL и REACT_APP_SUPABASE_ANON_KEY.",
      };
    }

    signOutOffline();
    const cleanEmail = normalizeEmail(email);
    const cleanName = String(fullName).trim();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: cleanName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) return { ok: false, message: authMessage(error) };
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        ok: false,
        message: "Аккаунт с таким email уже существует. Войдите в него.",
      };
    }
    if (!data.session) {
      return {
        ok: true,
        needsConfirmation: true,
        message: "Проверьте почту и подтвердите регистрацию.",
      };
    }

    await ensureSupabaseAccountData(data.user, cleanName);
    return { ok: true };
  },
};
