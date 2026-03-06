import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xyjawsltpttnizpgrucg.supabase.co";
const supabaseAnonKey = "sb_publishable_iFsFPAKyXlvTvCTJuuOWww_tZ3sIxdu";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
