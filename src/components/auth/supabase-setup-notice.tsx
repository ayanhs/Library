import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function SupabaseSetupNotice() {
  return (
    <div className="mb-6 animate-fade-in rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="space-y-2">
          <p className="font-medium text-amber-200">
            Supabase credentials are missing
          </p>
          <p className="text-amber-100/90">
            Create a{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">
              .env.local
            </code>{" "}
            file in the project root with your Project URL and anon key, then
            restart the dev server.
          </p>
          <Link
            href="https://supabase.com/dashboard/project/_/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-medium text-amber-300 underline underline-offset-2 hover:text-amber-200"
          >
            Open Supabase API settings →
          </Link>
        </div>
      </div>
    </div>
  );
}
