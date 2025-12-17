import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Lazy singleton for the public Supabase client.
 * Call getSupabasePublic() at runtime (e.g. inside a component) so we don't
 * create the GoTrue auth client until we actually need the public client.
 */
let _publicClient = null;
export function getSupabasePublic() {
  if (!_publicClient) {
    _publicClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return _publicClient;
}