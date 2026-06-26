"use client";

import { Loader2, Power } from "lucide-react";
import { useState } from "react";
import { ErrorAlert, SuccessAlert } from "@/components/auth/auth-card";
import { setAiGenerationEnabled } from "@/lib/ai-usage/actions";
import { cn } from "@/lib/utils";

interface AdminKillSwitchProps {
  initialEnabled: boolean;
}

export function AdminKillSwitch({ initialEnabled }: AdminKillSwitchProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleToggle = async () => {
    setError("");
    setSuccess("");
    setIsSaving(true);
    const next = !enabled;

    try {
      const result = await setAiGenerationEnabled(next);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setEnabled(next);
      setSuccess(next ? "AI generation enabled." : "AI generation disabled.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-[#0f0c08]/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Power className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-amber-50">AI Generation</h3>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                enabled
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-red-500/20 text-red-300"
              )}
            >
              {enabled ? "ON" : "OFF"}
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-200/50">
            Emergency kill switch — instantly stops all AI endpoints when off.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isSaving}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50",
            enabled
              ? "border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
              : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400"
          )}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {enabled ? "Turn OFF" : "Turn ON"}
        </button>
      </div>

      {error && (
        <div className="mt-3">
          <ErrorAlert message={error} />
        </div>
      )}
      {success && (
        <div className="mt-3">
          <SuccessAlert message={success} />
        </div>
      )}

      {!enabled && (
        <p className="mt-3 text-sm text-red-300">
          Users will see: &quot;AI generation is temporarily unavailable.&quot;
        </p>
      )}
    </div>
  );
}
