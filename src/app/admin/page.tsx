import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminRecentUsers } from "@/components/admin/admin-recent-users";
import { AdminStatsPanel } from "@/components/admin/admin-stats-panel";
import { isAdminUser } from "@/lib/admin/auth";
import { getAdminRecentUsers, getAdminStats } from "@/lib/admin/queries";
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
  const recentUserDays = 30;
  const [{ stats, error: statsError }, { users: recentUsers, error: usersError }] =
    await Promise.all([getAdminStats(), getAdminRecentUsers(recentUserDays)]);
  const [myBooksCount, recentBooks] = await Promise.all([
    getBooksCount(user.id),
    getRecentBooks(user.id),
  ]);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl animate-fade-in">
        <AdminHeader displayName={displayName} />
        <AdminNav />

        <section className="mb-10 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Platform overview
          </h2>
          <AdminStatsPanel stats={stats} error={statsError} />
        </section>

        <section className="mb-10 space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
              New registrations
            </h2>
            <p className="mt-1 text-xs text-muted">
              Name and email for users who signed up in the last {recentUserDays}{" "}
              days.
            </p>
          </div>
          <AdminRecentUsers
            users={recentUsers}
            error={usersError}
            days={recentUserDays}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
                Your books
              </h2>
              <p className="mt-1 text-xs text-muted">
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
