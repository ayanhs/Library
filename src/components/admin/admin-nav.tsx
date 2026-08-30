"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Cpu, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      href: "/admin",
      icon: BarChart3,
      active: pathname === "/admin",
    },
    {
      id: "feedback",
      label: "Feedback",
      href: "/admin/feedback",
      icon: MessageSquareText,
      active: pathname.startsWith("/admin/feedback"),
    },
    {
      id: "usage",
      label: "AI Usage",
      href: "/admin/usage",
      icon: Cpu,
      active: pathname.startsWith("/admin/usage"),
    },
  ];

  return (
    <nav className="mb-8 flex gap-2 border-b border-white/8 pb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-all",
              tab.active
                ? "border-b-2 border-primary text-foreground"
                : "text-muted hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
