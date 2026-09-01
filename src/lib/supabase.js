import { createClient } from "@supabase/supabase-js";
import { storage } from "../platform/storage";

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://xyjawsltpttnizpgrucg.supabase.co";
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "sb_publishable_iFsFPAKyXlvTvCTJuuOWww_tZ3sIxdu";
const hasOfflineSession = Boolean(storage.getItem("todo_offline_session"));

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: !hasOfflineSession,
    detectSessionInUrl: !hasOfflineSession,
  },
});
