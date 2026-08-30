import { redirect } from "next/navigation";
import { AdminAiMonitor } from "@/components/admin/admin-ai-monitor";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminKillSwitch } from "@/components/admin/admin-kill-switch";
import { AdminNav } from "@/components/admin/admin-nav";
import { isAdminUser } from "@/lib/admin/auth";
import { getAdminAiMonitorStats } from "@/lib/ai-usage/admin-queries";
import { createClient, getSupabaseEnv } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/utils";

export default async function AdminUsagePage() {
  const { isConfigured } = getSupabaseEnv();
  if (!isConfigured) redirect("/admin/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  if (!isAdminUser(user)) redirect("/dashboard");

  const displayName = getDisplayName(user.user_metadata, user.email);
  const { stats, error } = await getAdminAiMonitorStats();

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl animate-fade-in">
        <AdminHeader displayName={displayName} />
        <AdminNav />

        <section className="mb-8 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Emergency controls
          </h2>
          <AdminKillSwitch initialEnabled={stats?.aiEnabled ?? true} />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
            AI usage monitor
          </h2>
          <AdminAiMonitor stats={stats} error={error} />
        </section>
      </div>
    </div>
  );
}
