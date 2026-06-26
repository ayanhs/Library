"use client";

import { BookOpen, LogOut, Plus, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AdminHeaderProps {
  displayName: string;
}

export function AdminHeader({ displayName }: AdminHeaderProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
          <Shield className="h-3.5 w-3.5" />
          Admin Console
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-amber-50 sm:text-3xl">
          Welcome, {displayName}
        </h1>
        <p className="mt-1 text-sm text-amber-200/50">
          Platform-wide statistics and publishing tools
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-100 transition-all hover:bg-amber-500/20"
        >
          <BookOpen className="h-4 w-4" />
          My Books
        </Link>
        <Link
          href="/dashboard/new-book"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-amber-500 hover:to-amber-400"
        >
          <Plus className="h-4 w-4" />
          New Book
        </Link>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-muted transition-all hover:bg-white/5 hover:text-foreground disabled:opacity-50"
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
