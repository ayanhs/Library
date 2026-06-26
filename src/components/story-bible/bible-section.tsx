"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BibleSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function BibleSection({
  title,
  icon,
  count,
  onAdd,
  addLabel,
  children,
  defaultOpen = true,
}: BibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-white/5 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple/15 text-purple-light">
            {icon}
          </span>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-xs text-muted">{count} entries</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        )}
      </button>

      {open && (
        <div className="space-y-3 border-t border-white/5 p-4 pt-3">
          {children}
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10",
              "py-2.5 text-sm text-muted transition-colors hover:border-white/20 hover:bg-white/[0.03] hover:text-foreground"
            )}
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </button>
        </div>
      )}
    </section>
  );
}
