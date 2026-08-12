import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { createClient, getSupabaseEnv } from "@/lib/supabase/server";

export default async function HomePage() {
  const { isConfigured } = getSupabaseEnv();

  if (isConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return <LandingPage />;
}
