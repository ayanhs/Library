import { cn } from "@/lib/utils";

interface BlueprintSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function BlueprintSection({
  title,
  icon,
  children,
  className,
}: BlueprintSectionProps) {
  return (
    <section
      className={cn(
        "glass-card rounded-2xl border border-white/5 p-5 sm:p-6",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple/15 text-purple-light">
            {icon}
          </span>
        )}
        <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function BlueprintText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
      {children}
    </p>
  );
}
