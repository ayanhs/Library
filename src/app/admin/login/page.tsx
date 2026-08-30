import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { getSupabaseEnv } from "@/lib/supabase/env";

export default function AdminLoginPage() {
  const { isConfigured } = getSupabaseEnv();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            AI Publishing Studio
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Administrator Access
          </h1>
        </div>

        {!isConfigured && (
          <div className="mb-6">
            <SupabaseSetupNotice />
          </div>
        )}

        <AdminLoginForm />

        <p className="mt-8 text-center text-xs text-muted">
          Not an admin?{" "}
          <Link
            href="/login"
            className="text-accent-soft underline-offset-2 hover:text-primary hover:underline"
          >
            User sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
