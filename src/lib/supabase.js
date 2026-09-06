import { createClient } from "@supabase/supabase-js";
import { storage } from "../platform/storage";

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || "";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const hasOfflineSession = Boolean(storage.getItem("todo_offline_session"));
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://not-configured.supabase.co",
  supabaseAnonKey || "not-configured",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: !hasOfflineSession,
      detectSessionInUrl: !hasOfflineSession,
    },
  },
);
