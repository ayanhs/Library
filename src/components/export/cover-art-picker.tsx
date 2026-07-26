"use client";

import { ImageIcon, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ErrorAlert } from "@/components/auth/auth-card";
import { useAiUsageSummary } from "@/components/ai-usage/ai-usage-panel";
import type { BookCoverPreview } from "@/lib/covers/types";
import { cn } from "@/lib/utils";

interface CoverArtPickerProps {
  bookId: string;
  initialCovers: BookCoverPreview[];
  selectedCoverId: string | null;
  canGenerate: boolean;
  onSelectionChange?: (coverId: string | null) => void;
}

interface CoverOptionSpec {
  style: string;
  prompt: string;
  fullPrompt: string;
}

const GENERATION_TIMEOUT_MS = 240_000;

export function CoverArtPicker({
  bookId,
  initialCovers,
  selectedCoverId,
  canGenerate,
  onSelectionChange,
}: CoverArtPickerProps) {
  const [covers, setCovers] = useState(initialCovers);
  const [selectedId, setSelectedId] = useState<string | null>(selectedCoverId);
  const [savedId, setSavedId] = useState<string | null>(selectedCoverId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingSelection, setIsSavingSelection] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [progress, setProgress] = useState("");
  const { summary, refresh: refreshUsage } = useAiUsageSummary();
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const coverRemaining = summary?.remaining.find((r) => r.feature === "cover");
  const coverLimitReached = coverRemaining?.remaining === 0;
  const aiDisabled = summary?.aiEnabled === false;

  useEffect(() => {
    setCooldownSeconds(summary?.coverCooldownSeconds ?? 0);
  }, [summary?.coverCooldownSeconds]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((s) => {
        if (s <= 1) {
          refreshUsage();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds > 0, refreshUsage]);

  const generateDisabled =
    !canGenerate ||
    isGenerating ||
    isSavingSelection ||
    aiDisabled ||
    coverLimitReached ||
    cooldownSeconds > 0;

  const handleGenerate = async () => {
    setError("");
    setWarning("");
    setProgress("");
    setIsGenerating(true);
    setCovers([]);
    setSelectedId(null);
    setSavedId(null);
    onSelectionChange?.(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

    try {
      setProgress("Writing cover concepts…");

      const promptsRes = await fetch(`/api/book/${bookId}/covers/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "prompts" }),
        signal: controller.signal,
      });

      const promptsBody = await promptsRes.json().catch(() => ({}));
      if (!promptsRes.ok) {
        if (promptsBody.coverCooldownSeconds) {
          setCooldownSeconds(promptsBody.coverCooldownSeconds);
        }
        refreshUsage();
        throw new Error(promptsBody.error || "Failed to create cover prompts.");
      }

      const batchId = promptsBody.batchId as string;
      const options = promptsBody.options as CoverOptionSpec[];
      const requestDelayMs =
        typeof promptsBody.requestDelayMs === "number"
          ? promptsBody.requestDelayMs
          : 8_000;

      if (promptsBody.warning) {
        setWarning(promptsBody.warning as string);
      }

      if (promptsBody.pollinationsConfigured === false && promptsBody.warning) {
        throw new Error(promptsBody.warning as string);
      }

      const generated: BookCoverPreview[] = [];
      let fallbackCount = 0;
      let lastFallbackWarning = "";

      for (let index = 0; index < options.length; index++) {
        if (index > 0) {
          setProgress(`Waiting before cover ${index + 1} of ${options.length}…`);
          await new Promise((resolve) => setTimeout(resolve, requestDelayMs));
        }

        setProgress(`Generating cover ${index + 1} of ${options.length}…`);

        const imageRes = await fetch(`/api/book/${bookId}/covers/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase: "image",
            batchId,
            index,
            style: options[index].style,
            prompt: options[index].prompt,
            fullPrompt: options[index].fullPrompt,
          }),
          signal: controller.signal,
        });

        const imageBody = await imageRes.json().catch(() => ({}));
        if (!imageRes.ok) {
          throw new Error(
            imageBody.error || `Failed to generate cover ${index + 1}.`
          );
        }

        if (imageBody.usedFallback) {
          fallbackCount += 1;
        }
        if (imageBody.warning) {
          lastFallbackWarning = imageBody.warning as string;
          setWarning(lastFallbackWarning);
        }

        generated.push(imageBody.cover as BookCoverPreview);
        setCovers([...generated]);
      }

      if (fallbackCount === options.length) {
        setWarning(
          lastFallbackWarning ||
            "No AI cover images were generated. Your daily cover credit was not used — try again after Pollinations credits refresh or top up at enter.pollinations.ai."
        );
      } else if (fallbackCount > 0) {
        setWarning(
          lastFallbackWarning ||
            `${fallbackCount} cover(s) used a placeholder because the image service was busy.`
        );
      }

      const realImageCount = options.length - fallbackCount;
      await fetch(`/api/book/${bookId}/covers/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "complete",
          batchId,
          realImageCount,
        }),
        signal: controller.signal,
      });

      refreshUsage();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError(
          "Cover generation timed out. Add POLLINATIONS_API_KEY in Vercel for faster, reliable cover art (enter.pollinations.ai/keys)."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Cover generation failed."
        );
      }
    } finally {
      clearTimeout(timeout);
      setIsGenerating(false);
      setProgress("");
    }
  };

  const handleCheckboxChange = (coverId: string) => {
    setError("");
    setSelectedId(coverId);
  };

  const handleConfirmSelection = async () => {
    if (!selectedId || isSavingSelection || isGenerating) return;

    setError("");
    setIsSavingSelection(true);

    try {
      const response = await fetch(`/api/book/${bookId}/covers/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverId: selectedId }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "Failed to save cover selection.");
      }

      setSavedId(selectedId);
      onSelectionChange?.(selectedId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save cover selection."
      );
    } finally {
      setIsSavingSelection(false);
    }
  };

  const selectionDirty = selectedId !== savedId && selectedId !== null;
  const hasConfirmedSelection = savedId !== null;

  return (
    <section className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Cover art</h2>
          <p className="mt-1 text-xs text-muted">
            Generate 3 options, check the one you want, then confirm your
            selection before exporting.
            {coverRemaining && (
              <span className="ml-1 text-purple-light">
                ({coverRemaining.remaining}/{coverRemaining.limit} batches left today)
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted/80">
            Each batch creates 3 images. Pollinations Pollen credits are separate
            from this daily limit.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generateDisabled}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
            !generateDisabled
              ? "bg-purple/20 text-purple-light hover:bg-purple/30"
              : "cursor-not-allowed bg-white/5 text-muted opacity-50"
          )}
        >
          {cooldownSeconds > 0 ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Wait {cooldownSeconds}s
            </>
          ) : isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : covers.length > 0 ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate covers
            </>
          )}
        </button>
      </div>

      {!canGenerate && (
        <p className="text-xs text-amber-200/80">
          Approve your blueprint to generate cover art.
        </p>
      )}

      {coverLimitReached && (
        <p className="text-xs text-red-300">
          Daily cover limit reached. Please try again tomorrow.
        </p>
      )}

      {cooldownSeconds > 0 && !isGenerating && (
        <p className="text-xs text-amber-200/80">
          Cover cooldown active — wait {cooldownSeconds}s before generating again.
        </p>
      )}

      {aiDisabled && (
        <p className="text-xs text-red-300">
          AI generation is temporarily unavailable.
        </p>
      )}

      {error && <ErrorAlert message={error} />}

      {warning && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {warning}
        </p>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 py-10 text-sm text-muted">
          <Loader2 className="h-8 w-8 animate-spin text-purple-light" />
          <p>{progress || "Starting cover generation…"}</p>
          {covers.length > 0 && (
            <p className="text-xs text-emerald-200/80">
              {covers.length} of 3 ready — more coming…
            </p>
          )}
        </div>
      )}

      {covers.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {covers.map((cover, index) => {
              const isChecked = selectedId === cover.id;
              const isSaved = savedId === cover.id;

              return (
                <label
                  key={cover.id}
                  className={cn(
                    "relative cursor-pointer overflow-hidden rounded-xl border transition-all",
                    isChecked
                      ? "border-purple/50 ring-2 ring-purple/40"
                      : "border-white/10 hover:border-purple/30",
                    isGenerating && "pointer-events-none opacity-60"
                  )}
                >
                  <div className="aspect-[2/3] w-full bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover.imageUrl}
                      alt={`Cover option ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3">
                    <input
                      type="checkbox"
                      name="book-cover"
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(cover.id)}
                      disabled={isGenerating || isSavingSelection}
                      className="h-4 w-4 shrink-0 rounded border-white/20 accent-purple"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">Option {index + 1}</p>
                      {isSaved && (
                        <p className="text-xs text-emerald-200/80">
                          Selected for export
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}

            {isGenerating &&
              Array.from({ length: Math.max(0, 3 - covers.length) }).map(
                (_, index) => (
                  <div
                    key={`pending-${index}`}
                    className="flex aspect-[2/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-xs text-muted"
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-purple-light" />
                    <span>Cover {covers.length + index + 1}</span>
                  </div>
                )
              )}
          </div>

          {!isGenerating && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmSelection}
                disabled={
                  !selectedId || isSavingSelection || !selectionDirty
                }
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  selectedId && selectionDirty
                    ? "bg-purple text-white hover:bg-purple/90"
                    : "cursor-not-allowed bg-white/5 text-muted opacity-50"
                )}
              >
                {isSavingSelection ? "Saving…" : "Use this cover"}
              </button>
              {hasConfirmedSelection && !selectionDirty && (
                <p className="text-xs text-emerald-200/80">
                  Cover saved — your exports will include this artwork.
                </p>
              )}
              {selectedId && selectionDirty && (
                <p className="text-xs text-muted">
                  Click &quot;Use this cover&quot; to apply your choice.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {covers.length === 0 && !isGenerating && canGenerate && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-12 text-sm text-muted">
          <ImageIcon className="h-8 w-8 opacity-40" />
          <p>No cover art yet. Generate 3 options to get started.</p>
        </div>
      )}
    </section>
  );
}
