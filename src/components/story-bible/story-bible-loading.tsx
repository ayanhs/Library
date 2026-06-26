export function StoryBibleLoading() {
  return (
    <div className="space-y-4 py-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-white/5 bg-white/[0.02] p-5"
        >
          <div className="mb-3 h-4 w-1/3 rounded bg-white/10" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-white/5" />
            <div className="h-3 w-5/6 rounded bg-white/5" />
            <div className="h-3 w-2/3 rounded bg-white/5" />
          </div>
        </div>
      ))}
      <p className="text-center text-sm text-muted">
        Building your Story Bible with AI…
      </p>
    </div>
  );
}
