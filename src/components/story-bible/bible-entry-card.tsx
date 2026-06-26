"use client";

import { ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { BookFormInput, BookFormTextarea } from "@/components/books/form-fields";
import { cn } from "@/lib/utils";

export interface BibleField {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number";
  placeholder?: string;
}

interface BibleEntryCardProps {
  title: string;
  subtitle?: string;
  fields: BibleField[];
  values: Record<string, string | number>;
  onChange: (key: string, value: string | number) => void;
  onDelete: () => void;
  onSave: () => void;
  isSaving?: boolean;
  isNew?: boolean;
  searchQuery?: string;
}

function matchesSearch(
  query: string,
  title: string,
  values: Record<string, string | number>
): boolean {
  if (!query.trim()) return true;
  const haystack = [title, ...Object.values(values).map(String)]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function BibleEntryCard({
  title,
  subtitle,
  fields,
  values,
  onChange,
  onDelete,
  onSave,
  isSaving,
  isNew,
  searchQuery = "",
}: BibleEntryCardProps) {
  const [expanded, setExpanded] = useState(isNew ?? false);

  if (!matchesSearch(searchQuery, title, values)) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-white/5 bg-white/[0.02] transition-colors",
        expanded && "border-white/10 bg-white/[0.04]"
      )}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          {expanded ? (
            <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-muted" />
          ) : (
            <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{title || "Untitled"}</p>
            {subtitle && !expanded && (
              <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
            )}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {isSaving && (
            <Loader2 className="h-4 w-4 animate-spin text-purple-light" />
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
            aria-label="Delete entry"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-white/5 px-3 pb-3 pt-3">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-medium text-muted">
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <BookFormTextarea
                  value={String(values[field.key] ?? "")}
                  onChange={(e) => {
                    onChange(field.key, e.target.value);
                    onSave();
                  }}
                  placeholder={field.placeholder}
                  className="min-h-[72px] text-sm"
                />
              ) : (
                <BookFormInput
                  type={field.type === "number" ? "number" : "text"}
                  value={String(values[field.key] ?? "")}
                  onChange={(e) => {
                    const val =
                      field.type === "number"
                        ? Number(e.target.value) || 0
                        : e.target.value;
                    onChange(field.key, val);
                    onSave();
                  }}
                  placeholder={field.placeholder}
                  className="text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
