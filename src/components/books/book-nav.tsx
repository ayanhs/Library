"use client";

import Link from "next/link";
import { BookOpen, Download, PenLine, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookNavProps {
  bookId: string;
  bookTitle: string;
  active: "project" | "story-bible" | "editor" | "export";
}

export function BookNav({ bookId, bookTitle, active }: BookNavProps) {
  const tabs = [
    {
      id: "project" as const,
      label: "Project",
      href: `/dashboard/book/${bookId}`,
      icon: BookOpen,
    },
    {
      id: "story-bible" as const,
      label: "Story Bible",
      href: `/dashboard/book/${bookId}/story-bible`,
      icon: ScrollText,
    },
    {
      id: "editor" as const,
      label: "AI Editor",
      href: `/dashboard/book/${bookId}/editor`,
      icon: PenLine,
    },
    {
      id: "export" as const,
      label: "Export",
      href: `/dashboard/book/${bookId}/export`,
      icon: Download,
    },
  ];

  return (
    <div className="mb-6">
      <p className="mb-3 text-sm text-muted">{bookTitle}</p>
      <nav className="inline-flex rounded-full border border-border bg-surface p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[rgba(168,199,250,0.16)] text-primary"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
