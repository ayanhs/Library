"use client";

import { LogOut, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function DashboardHeader({
  displayName,
  isAdmin = false,
}: {
  displayName: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 text-sm text-muted">
          <Sparkles className="h-4 w-4 text-purple-light" />
          <span>AI Publishing Studio</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back,{" "}
          <span className="gradient-text">{displayName}</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s an overview of your publishing activity
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-200 transition-all hover:bg-amber-500/20"
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-muted transition-all hover:border-white/15 hover:bg-white/10 hover:text-foreground disabled:opacity-50"
        >
        {isSigningOut ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        Sign Out
        </button>
      </div>
    </header>
  );
}
