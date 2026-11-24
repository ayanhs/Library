import { Sparkles } from "lucide-react";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { getSupabaseEnv } from "@/lib/supabase/env";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isConfigured } = getSupabaseEnv();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[rgba(168,199,250,0.16)] px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
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
