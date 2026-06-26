import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        "glass-card gradient-border rounded-2xl p-8 sm:p-10",
        className
      )}
    >
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-muted sm:text-base">{subtitle}</p>
      </div>

      {children}

      {footer && (
        <div className="mt-6 border-t border-white/5 pt-6 text-center text-sm text-muted">
          {footer}
        </div>
      )}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground/90"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="animate-fade-in text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground",
        "placeholder:text-muted/60",
        "transition-all duration-200",
        "hover:border-white/15 hover:bg-white/[0.07]",
        "focus:border-purple/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-purple/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function SubmitButton({
  children,
  isLoading,
  className,
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={cn(
        "relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-white",
        "bg-gradient-to-r from-purple to-blue",
        "transition-all duration-200",
        "hover:from-purple-light hover:to-blue-light hover:shadow-lg hover:shadow-purple/25",
        "focus:outline-none focus:ring-2 focus:ring-purple/50 focus:ring-offset-2 focus:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-purple-light transition-colors hover:text-blue-light"
    >
      {children}
    </Link>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      className="animate-fade-in rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      role="alert"
    >
      {message}
    </div>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div
      className="animate-fade-in rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
      role="status"
    >
      {message}
    </div>
  );
}
