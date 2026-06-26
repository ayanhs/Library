import { Sparkles } from "lucide-react";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { getSupabaseEnv } from "@/lib/supabase/env";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isConfigured } = getSupabaseEnv();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Background orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-purple/10 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-blue/10 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-purple/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-muted backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-purple-light" />
            <span>AI Publishing Studio</span>
          </div>
          <h1 className="gradient-text text-3xl font-bold tracking-tight sm:text-4xl">
            Write. Publish. Inspire.
          </h1>
        </div>

        {!isConfigured && (
          <div className="mb-6">
            <SupabaseSetupNotice />
          </div>
        )}

        <div className="animate-slide-up">{children}</div>
      </div>
    </div>
  );
}
