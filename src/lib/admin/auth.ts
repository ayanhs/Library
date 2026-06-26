import { isAdminEmail } from "@/lib/admin/constants";
import type { User } from "@supabase/supabase-js";

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return isAdminEmail(user.email);
}

export async function requireAdminUser() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) {
    return null;
  }

  return user;
}
