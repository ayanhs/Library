const PLACEHOLDER_VALUES = new Set([
  "your_supabase_project_url",
  "your_supabase_anon_key",
]);

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  const isConfigured =
    url.length > 0 &&
    anonKey.length > 0 &&
    !PLACEHOLDER_VALUES.has(url) &&
    !PLACEHOLDER_VALUES.has(anonKey);

  return { url, anonKey, isConfigured };
}

export const SUPABASE_SETUP_MESSAGE =
  "Supabase is not configured. Add your Project URL and anon key to .env.local, then restart the dev server.";

export function assertSupabaseEnv() {
  const env = getSupabaseEnv();
  if (!env.isConfigured) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }
  return env;
}
