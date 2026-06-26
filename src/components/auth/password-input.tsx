"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FormInput } from "./auth-card";

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: string;
}

export function PasswordInput({
  id,
  className,
  error,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <FormInput
        id={id}
        type={showPassword ? "text" : "password"}
        className={cn("pr-12", className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-purple/30"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
