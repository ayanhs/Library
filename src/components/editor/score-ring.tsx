"use client";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  label: string;
  size?: "lg" | "sm";
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function ringColor(score: number): string {
  if (score >= 80) return "stroke-emerald-400";
  if (score >= 60) return "stroke-amber-400";
  return "stroke-red-400";
}

export function ScoreRing({ score, label, size = "sm" }: ScoreRingProps) {
  const isLarge = size === "lg";
  const dim = isLarge ? 120 : 72;
  const radius = isLarge ? 52 : 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="-rotate-90" width={dim} height={dim}>
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={isLarge ? 8 : 5}
            className="text-white/5"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={isLarge ? 8 : 5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-700", ringColor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-bold tabular-nums",
              isLarge ? "text-3xl" : "text-lg",
              scoreColor(score)
            )}
          >
            {score}
          </span>
        </div>
      </div>
      <span className="text-center text-xs font-medium text-muted">{label}</span>
    </div>
  );
}
