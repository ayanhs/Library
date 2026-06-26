import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url, anonKey } = assertSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

export { getSupabaseEnv } from "@/lib/supabase/env";
