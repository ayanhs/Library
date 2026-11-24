import Link from "next/link";
import { Plus } from "lucide-react";
import { AiUsagePanel } from "@/components/ai-usage/ai-usage-panel";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RecentBooks } from "@/components/books/book-card";
import { isAdminUser } from "@/lib/admin/auth";
import { getBooksCount, getRecentBooks } from "@/lib/books/queries";
import { createClient, getSupabaseEnv } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = getDisplayName(user.user_metadata, user.email);
  const isAdmin = isAdminUser(user);
  const [booksCount, recentBooks] = await Promise.all([
    getBooksCount(user.id),
    getRecentBooks(user.id),
  ]);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl animate-fade-in">
        <DashboardHeader displayName={displayName} isAdmin={isAdmin} />
        <AiUsagePanel />

        <div className="mb-8 flex items-center justify-between">
          <div className="glass-card inline-flex items-center gap-4 rounded-3xl px-6 py-4">
            <div>
              <p className="text-sm text-muted">Total Books Created</p>
              <p className="text-3xl font-bold tracking-tight">{booksCount}</p>
            </div>
          </div>

          <Link href="/dashboard/new-book" className="btn-primary px-5 py-3">
            <Plus className="h-4 w-4" />
            New Book
          </Link>
        </div>

        <RecentBooks books={recentBooks} />
      </div>
    </div>
  );
}
