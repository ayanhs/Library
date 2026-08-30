import { UserPlus } from "lucide-react";
import type { AdminRecentUser } from "@/lib/admin/queries";

interface AdminRecentUsersProps {
  users: AdminRecentUser[];
  error?: string | null;
  days?: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminRecentUsers({
  users,
  error,
  days = 30,
}: AdminRecentUsersProps) {
  if (error) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-8 text-center text-sm text-amber-200/70">
        <UserPlus className="mx-auto mb-3 h-8 w-8 text-amber-400/50" />
        <p className="font-medium text-amber-100">Could not load new users</p>
        <p className="mt-1 text-xs">{error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-500/20 px-6 py-12 text-center text-sm text-amber-200/50">
        <UserPlus className="mx-auto mb-3 h-8 w-8 opacity-40" />
        <p>No new registrations in the last {days} days.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/8 text-xs uppercase tracking-wider text-muted">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Registered</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.03]"
              >
                <td className="px-5 py-4 font-medium">
                  {user.fullName}
                </td>
                <td className="px-5 py-4 text-muted">{user.email}</td>
                <td className="px-5 py-4 text-muted">
                  <time dateTime={user.createdAt}>
                    {formatDate(user.createdAt)}
                  </time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
