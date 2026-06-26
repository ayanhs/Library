import { Sparkles } from "lucide-react";

export function BlueprintLoading() {
  return (
    <div className="glass-card animate-fade-in rounded-2xl p-8 sm:p-10">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-purple/20" />
          <span className="absolute inset-2 animate-pulse rounded-full bg-blue/15" />
          <Sparkles className="relative h-7 w-7 animate-pulse text-purple-light" />
        </div>

        <h3 className="text-lg font-semibold">Architecting Your Story</h3>
        <p className="mt-2 max-w-sm text-sm text-muted">
          AI is crafting your summary, character arcs, and chapter outline…
        </p>

        <div className="mt-8 w-full max-w-xs space-y-3">
          {[
            "Analyzing story prompt",
            "Building character arcs",
            "Outlining chapters",
          ].map((step, i) => (
            <div
              key={step}
              className="flex items-center gap-3 text-sm text-muted"
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-purple-light" />
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
