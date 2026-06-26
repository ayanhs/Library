import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function BookFormField({
  label,
  htmlFor,
  error,
  required,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground/90"
      >
        {label}
        {required && <span className="ml-1 text-purple-light">*</span>}
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

export function BookFormInput({
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

export function BookFormSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground",
        "transition-all duration-200",
        "hover:border-white/15 hover:bg-white/[0.07]",
        "focus:border-purple/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-purple/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&>option]:bg-surface",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function BookFormTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground",
        "min-h-[140px] placeholder:text-muted/60",
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

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
