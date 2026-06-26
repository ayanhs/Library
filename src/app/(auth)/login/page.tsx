import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

function LoginFormFallback() {
  return (
    <div className="glass-card gradient-border animate-pulse rounded-2xl p-10">
      <div className="mb-8 space-y-3 text-center">
        <div className="mx-auto h-8 w-48 rounded-lg bg-white/10" />
        <div className="mx-auto h-4 w-64 rounded-lg bg-white/5" />
      </div>
      <div className="space-y-5">
        <div className="h-20 rounded-xl bg-white/5" />
        <div className="h-20 rounded-xl bg-white/5" />
        <div className="h-12 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
