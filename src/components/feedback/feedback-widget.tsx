"use client";

import { MessageSquare, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorAlert, SuccessAlert } from "@/components/auth/auth-card";
import { submitFeedback } from "@/lib/feedback/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function FeedbackWidget() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });
  }, []);

  if (!isAuthenticated || pathname === "/admin/login") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const result = await submitFeedback(message, pathname);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setMessage("");
      setSuccess("Thanks! Your feedback was sent.");
      setTimeout(() => {
        setIsOpen(false);
        setSuccess("");
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className={cn(
            "w-[min(100vw-3rem,22rem)] animate-fade-in rounded-2xl border border-white/10",
            "bg-[#12121a]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
          )}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Send feedback</h3>
              <p className="mt-0.5 text-xs text-muted">
                Tell us what&apos;s working or what we can improve.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError("");
                setSuccess("");
              }}
              className="rounded-lg p-1 text-muted transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label="Close feedback"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && <div className="mb-3"><ErrorAlert message={error} /></div>}
          {success && <div className="mb-3"><SuccessAlert message={success} /></div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts…"
              rows={4}
              maxLength={5000}
              disabled={isSubmitting}
              className={cn(
                "w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm",
                "placeholder:text-muted/60 focus:border-purple/40 focus:outline-none focus:ring-2 focus:ring-purple/20"
              )}
            />
            <button
              type="submit"
              disabled={isSubmitting || message.trim().length < 3}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white",
                "bg-gradient-to-r from-purple to-blue transition-all",
                "hover:from-purple-light hover:to-blue-light disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send feedback
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
          "bg-gradient-to-br from-purple to-blue text-white",
          "hover:scale-105 hover:shadow-purple/30",
          isOpen && "ring-2 ring-purple/40"
        )}
        aria-label={isOpen ? "Close feedback" : "Open feedback"}
        title="Send feedback"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}
