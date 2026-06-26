"use client";

import { ArrowLeft, BookPlus, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BookFormField,
  BookFormInput,
  BookFormSelect,
  BookFormTextarea,
  FormSection,
} from "@/components/books/form-fields";
import { ErrorAlert, SuccessAlert } from "@/components/auth/auth-card";
import {
  createBook,
  finalizeBook,
  saveBookDraft,
  updateBookDraft,
} from "@/lib/books/actions";
import { AUDIENCES, GENRES } from "@/lib/books/constants";
import type { BookFormData } from "@/lib/books/types";
import { cn } from "@/lib/utils";

const emptyFormData: BookFormData = {
  title: "",
  genre: "",
  audience: "",
  mainCharacter: "",
  characterAge: "",
  characterDescription: "",
  setting: "",
  storyPrompt: "",
};

interface BookFormProps {
  mode: "create" | "edit";
  bookId?: string;
  initialData?: BookFormData;
  backHref?: string;
}

export function BookForm({
  mode,
  bookId,
  initialData = emptyFormData,
  backHref = "/dashboard",
}: BookFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<BookFormData>(initialData);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof BookFormData, string>>
  >({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<"draft" | "create" | null>(
    null
  );

  const isEdit = mode === "edit";

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError("");
    setSuccessMessage("");
  };

  const handleSubmit = (action: "draft" | "create") => {
    setServerError("");
    setSuccessMessage("");
    setFieldErrors({});
    setPendingAction(action);

    startTransition(async () => {
      try {
        let result;

        if (isEdit && bookId) {
          result =
            action === "draft"
              ? await updateBookDraft(bookId, formData)
              : await finalizeBook(bookId, formData);
        } else {
          result =
            action === "draft"
              ? await saveBookDraft(formData)
              : await createBook(formData);
        }

        if (!result.success) {
          if (result.message) setServerError(result.message);
          if (result.errors) {
            setFieldErrors(
              result.errors as Partial<Record<keyof BookFormData, string>>
            );
          }
          return;
        }

        if (result.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
          return;
        }

        if (action === "draft" && isEdit) {
          setSuccessMessage("Draft saved successfully.");
          router.refresh();
        }
      } catch {
        setServerError("Something went wrong. Please try again.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple/15 text-purple-light">
            {isEdit ? (
              <Pencil className="h-6 w-6" />
            ) : (
              <BookPlus className="h-6 w-6" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {isEdit ? "Continue Book Setup" : "Create New Book"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {isEdit
                ? "Fill in the remaining details before generating your story blueprint."
                : "Set up your story foundation — character, setting, and prompt"}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card gradient-border rounded-2xl p-6 sm:p-8">
        {serverError && (
          <div className="mb-6">
            <ErrorAlert message={serverError} />
          </div>
        )}
        {successMessage && (
          <div className="mb-6">
            <SuccessAlert message={successMessage} />
          </div>
        )}

        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-10"
          noValidate
        >
          <FormSection
            title="Basic Information"
            description="Define the core details of your book"
          >
            <BookFormField
              label="Book Title"
              htmlFor="title"
              error={fieldErrors.title}
            >
              <BookFormInput
                id="title"
                name="title"
                placeholder="The Chronicles of..."
                value={formData.title}
                onChange={handleChange}
                disabled={isPending}
              />
            </BookFormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <BookFormField label="Genre" htmlFor="genre">
                <BookFormSelect
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  disabled={isPending}
                >
                  <option value="">Select a genre</option>
                  {GENRES.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </BookFormSelect>
              </BookFormField>

              <BookFormField label="Target Audience" htmlFor="audience">
                <BookFormSelect
                  id="audience"
                  name="audience"
                  value={formData.audience}
                  onChange={handleChange}
                  disabled={isPending}
                >
                  <option value="">Select audience</option>
                  {AUDIENCES.map((audience) => (
                    <option key={audience} value={audience}>
                      {audience}
                    </option>
                  ))}
                </BookFormSelect>
              </BookFormField>
            </div>
          </FormSection>

          <FormSection
            title="Character Information"
            description="Who is at the heart of your story?"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <BookFormField
                label="Main Character Name"
                htmlFor="mainCharacter"
                error={fieldErrors.mainCharacter}
              >
                <BookFormInput
                  id="mainCharacter"
                  name="mainCharacter"
                  placeholder="Elena Rivers"
                  value={formData.mainCharacter}
                  onChange={handleChange}
                  disabled={isPending}
                />
              </BookFormField>

              <BookFormField label="Main Character Age" htmlFor="characterAge">
                <BookFormInput
                  id="characterAge"
                  name="characterAge"
                  placeholder="e.g. 28 or Teen"
                  value={formData.characterAge}
                  onChange={handleChange}
                  disabled={isPending}
                />
              </BookFormField>
            </div>

            <BookFormField
              label="Character Description"
              htmlFor="characterDescription"
            >
              <BookFormTextarea
                id="characterDescription"
                name="characterDescription"
                placeholder="Describe your protagonist's personality, goals, and flaws..."
                value={formData.characterDescription}
                onChange={handleChange}
                disabled={isPending}
                className="min-h-[100px]"
              />
            </BookFormField>
          </FormSection>

          <FormSection
            title="Story Information"
            description="Build the world and creative direction"
          >
            <BookFormField label="Setting" htmlFor="setting">
              <BookFormInput
                id="setting"
                name="setting"
                placeholder="A coastal city in 2042, after the climate reset..."
                value={formData.setting}
                onChange={handleChange}
                disabled={isPending}
              />
            </BookFormField>

            <BookFormField
              label="Story Prompt"
              htmlFor="storyPrompt"
              error={fieldErrors.storyPrompt}
            >
              <BookFormTextarea
                id="storyPrompt"
                name="storyPrompt"
                placeholder="Describe the plot, themes, tone, and key story beats you want the AI to explore..."
                value={formData.storyPrompt}
                onChange={handleChange}
                disabled={isPending}
                className="min-h-[160px]"
              />
            </BookFormField>
          </FormSection>

          <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted sm:max-w-xs">
              <span className="font-medium text-foreground/80">Save Draft</span>{" "}
              stores incomplete work anytime.{" "}
              <span className="font-medium text-foreground/80">Create Book</span>{" "}
              requires title, main character, and story prompt.
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleSubmit("draft")}
                disabled={isPending}
                className={cn(
                  "inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-foreground",
                  "transition-all hover:border-white/15 hover:bg-white/10",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {isPending && pendingAction === "draft" ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </span>
                ) : (
                  "Save Draft"
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSubmit("create")}
                disabled={isPending}
                className={cn(
                  "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white",
                  "bg-gradient-to-r from-purple to-blue",
                  "transition-all hover:from-purple-light hover:to-blue-light hover:shadow-lg hover:shadow-purple/25",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {isPending && pendingAction === "create" ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating...
                  </span>
                ) : (
                  "Create Book"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
