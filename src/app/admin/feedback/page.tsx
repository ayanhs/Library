import { redirect } from "next/navigation";
import { AdminFeedbackList } from "@/components/admin/admin-feedback-list";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { isAdminUser } from "@/lib/admin/auth";
import { getFeedbackCountForAdmin, getFeedbackForAdmin } from "@/lib/feedback/queries";
import { createClient, getSupabaseEnv } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/utils";

export default async function AdminFeedbackPage() {
  const { isConfigured } = getSupabaseEnv();
  if (!isConfigured) redirect("/admin/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  if (!isAdminUser(user)) redirect("/dashboard");

  const displayName = getDisplayName(user.user_metadata, user.email);
  const [{ items, error }, totalCount] = await Promise.all([
    getFeedbackForAdmin(),
    getFeedbackCountForAdmin(),
  ]);

  return (
    <div className="relative min-h-screen bg-[#070605] px-4 py-8 sm:px-6 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-amber-600/8 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-orange-700/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl animate-fade-in">
        <AdminHeader displayName={displayName} />
        <AdminNav />

        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80">
              User feedback
            </h2>
            <p className="mt-1 text-xs text-amber-200/40">
              {totalCount} message{totalCount === 1 ? "" : "s"} from users
            </p>
          </div>
          <AdminFeedbackList items={items} error={error} />
        </section>
      </div>
    </div>
  );
}
