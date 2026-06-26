import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminStatsPanel } from "@/components/admin/admin-stats-panel";
import { isAdminUser } from "@/lib/admin/auth";
import { getAdminStats } from "@/lib/admin/queries";
import { getBooksCount, getRecentBooks } from "@/lib/books/queries";
import { RecentBooks } from "@/components/books/book-card";
import { createClient, getSupabaseEnv } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const { isConfigured } = getSupabaseEnv();
  if (!isConfigured) redirect("/admin/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  if (!isAdminUser(user)) redirect("/dashboard");

  const displayName = getDisplayName(user.user_metadata, user.email);
  const { stats, error: statsError } = await getAdminStats();
  const [myBooksCount, recentBooks] = await Promise.all([
    getBooksCount(user.id),
    getRecentBooks(user.id),
  ]);

  return (
    <div className="relative min-h-screen bg-[#070605] px-4 py-8 sm:px-6 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-amber-600/8 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-orange-700/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl animate-fade-in">
        <AdminHeader displayName={displayName} />
        <AdminNav />

        <section className="mb-10 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80">
            Platform overview
          </h2>
          <AdminStatsPanel stats={stats} error={statsError} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80">
                Your books
              </h2>
              <p className="mt-1 text-xs text-amber-200/40">
                You have {myBooksCount} book{myBooksCount === 1 ? "" : "s"} — admins
                can create and publish like any user.
              </p>
            </div>
          </div>
          <RecentBooks books={recentBooks} />
        </section>
      </div>
    </div>
  );
}
