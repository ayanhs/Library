import { redirect } from "next/navigation";
import { createClient, getSupabaseEnv } from "@/lib/supabase/server";

export default async function HomePage() {
  const { isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
