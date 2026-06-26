import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { getSupabaseEnv } from "@/lib/supabase/env";

export default function AdminLoginPage() {
  const { isConfigured } = getSupabaseEnv();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#070605] px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-orange-700/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.06),_transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/80">
            AI Publishing Studio
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-amber-50">
            Administrator Access
          </h1>
        </div>

        {!isConfigured && (
          <div className="mb-6">
            <SupabaseSetupNotice />
          </div>
        )}

        <AdminLoginForm />

        <p className="mt-8 text-center text-xs text-amber-200/40">
          Not an admin?{" "}
          <Link
            href="/login"
            className="text-amber-400/80 underline-offset-2 hover:text-amber-300 hover:underline"
          >
            User sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
