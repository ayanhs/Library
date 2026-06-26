import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDisplayName(
  metadata: Record<string, unknown> | undefined,
  email: string | undefined
): string {
  const fullName = metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }
  if (email) {
    return email.split("@")[0];
  }
  return "Author";
}
