"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ErrorAlert, SuccessAlert } from "@/components/auth/auth-card";
import { BlueprintDisplay } from "@/components/blueprint/blueprint-display";
import { BlueprintEditor } from "@/components/blueprint/blueprint-editor";
import { BlueprintLoading } from "@/components/blueprint/blueprint-loading";
import { ChapterWriter } from "@/components/chapters/chapter-writer";
import {
  approveStoryBlueprint,
  generateStoryBlueprint,
  updateStoryBlueprint,
} from "@/lib/blueprint/actions";
import type { StoryBlueprint, StoryBlueprintRecord } from "@/lib/blueprint/types";
import type { BookChapter } from "@/lib/chapters/types";
import { cn } from "@/lib/utils";

interface PublishingWorkflowProps {
  bookId: string;
  blueprintRecord: StoryBlueprintRecord | null;
  chapters: BookChapter[];
}

export function PublishingWorkflow({
  bookId,
  blueprintRecord,
  chapters: initialChapters,
}: PublishingWorkflowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [blueprint, setBlueprint] = useState<StoryBlueprint | null>(
    blueprintRecord?.blueprint ?? null
  );
  const [status, setStatus] = useState(blueprintRecord?.status ?? "draft");
  const [chapters, setChapters] = useState(initialChapters);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<StoryBlueprint | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showBlueprint, setShowBlueprint] = useState(status !== "approved");

  const hasBlueprint = blueprint !== null;
  const isApproved = status === "approved";

  const runAction = (action: () => Promise<void>) => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      try {
        await action();
      } finally {
        router.refresh();
      }
    });
  };

  const handleGenerate = () =>
    runAction(async () => {
      const result = await generateStoryBlueprint(bookId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setBlueprint(result.data!.blueprint);
      setStatus("draft");
      setIsEditing(false);
      setShowBlueprint(true);
    });

  const handleStartEdit = () => {
    if (!blueprint) return;
    setEditDraft(structuredClone(blueprint));
    setIsEditing(true);
    setError("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditDraft(null);
  };

  const handleSaveEdit = () =>
    runAction(async () => {
      if (!editDraft) return;
      const result = await updateStoryBlueprint(bookId, editDraft);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setBlueprint(result.data!.blueprint);
      setStatus("draft");
      setIsEditing(false);
      setEditDraft(null);
      setSuccess("Blueprint updated.");
    });

  const handleApprove = () =>
    runAction(async () => {
      const result = await approveStoryBlueprint(bookId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setStatus("approved");
      setIsEditing(false);
      setShowBlueprint(false);
      setSuccess("Blueprint approved! Start writing Chapter 1 below.");
    });

  return (
    <div className="mt-8 space-y-8 border-t border-white/5 pt-8">
      {/* Blueprint section */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-light" />
              <h2 className="text-xl font-semibold">AI Story Architect</h2>
              {isApproved && (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                  Approved
                </span>
              )}
            </div>
            <p className="text-sm text-muted">
              {isApproved
                ? "Your story blueprint is locked. Continue writing chapters below."
                : "Generate, edit, and approve your story blueprint."}
            </p>
          </div>

          {!isApproved && (
            <div className="flex flex-wrap gap-2">
              {hasBlueprint && !isEditing && (
                <>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Blueprint
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate All
                  </button>
                </>
              )}
              {!hasBlueprint && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isPending}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white",
                    "bg-gradient-to-r from-purple to-blue hover:shadow-lg hover:shadow-purple/25"
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Blueprint
                </button>
              )}
            </div>
          )}
        </div>

        {error && <ErrorAlert message={error} />}
        {success && <SuccessAlert message={success} />}

        {isPending && !isEditing && <BlueprintLoading />}

        {hasBlueprint && isApproved && (
          <button
            type="button"
            onClick={() => setShowBlueprint((v) => !v)}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
          >
            {showBlueprint ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {showBlueprint ? "Hide" : "View"} approved blueprint
          </button>
        )}

        {!isPending && hasBlueprint && isEditing && editDraft && (
          <div className="space-y-4">
            <BlueprintEditor
              blueprint={editDraft}
              onChange={setEditDraft}
              disabled={isPending}
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-blue px-5 py-2.5 text-sm font-semibold text-white"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isPending}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!isPending &&
          hasBlueprint &&
          !isEditing &&
          showBlueprint &&
          blueprint && (
            <div className="space-y-4">
              <BlueprintDisplay blueprint={blueprint} />
              {!isApproved && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 sm:w-auto"
                >
                  <Check className="h-4 w-4" />
                  Approve Blueprint
                </button>
              )}
            </div>
          )}

        {!isPending && !hasBlueprint && !error && (
          <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted/50" />
            <p className="text-sm text-muted">
              Generate a blueprint to plan your story before writing chapters.
            </p>
          </div>
        )}
      </section>

      {/* Chapter writing — only after blueprint approved */}
      {isApproved && blueprint && (
        <ChapterWriter
          bookId={bookId}
          blueprint={blueprint}
          chapters={chapters}
          onChaptersChange={setChapters}
        />
      )}
    </div>
  );
}
