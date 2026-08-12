import Link from "next/link";
import {
  BookOpen,
  Download,
  ImageIcon,
  Layers,
  PenLine,
  ScrollText,
  Sparkles,
  Wand2,
} from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Start your book",
    description:
      "Add your title, genre, and story idea. Tell us about your characters and world — we handle the rest.",
    icon: BookOpen,
  },
  {
    number: "02",
    title: "Approve your blueprint",
    description:
      "AI builds a full story blueprint — chapter outline, plot beats, and pacing. You review and approve before writing begins.",
    icon: Layers,
  },
  {
    number: "03",
    title: "Write with AI",
    description:
      "Generate chapters one at a time with AI assistance, then edit every word until it sounds like you.",
    icon: PenLine,
  },
  {
    number: "04",
    title: "Stay consistent",
    description:
      "The Story Bible tracks characters, locations, and rules. The AI Editor helps you rewrite, expand, and polish.",
    icon: ScrollText,
  },
  {
    number: "05",
    title: "Cover & export",
    description:
      "Generate cover art options, pick your favorite, and export a publish-ready PDF, Word doc, or EPUB.",
    icon: Download,
  },
] as const;

const FEATURES = [
  {
    title: "AI Story Architect",
    description: "Turn a rough idea into a structured blueprint with chapter-by-chapter plans.",
    icon: Wand2,
  },
  {
    title: "Guided chapter writing",
    description: "AI drafts each chapter from your blueprint — you stay in control of every edit.",
    icon: PenLine,
  },
  {
    title: "Story Bible",
    description: "Auto-generated reference for characters, places, and world rules so nothing contradicts.",
    icon: ScrollText,
  },
  {
    title: "AI Editor",
    description: "Rewrite passages, adjust tone, expand scenes, or tighten prose in one click.",
    icon: Sparkles,
  },
  {
    title: "Cover art",
    description: "Generate three unique cover options per batch and choose the one that fits your book.",
    icon: ImageIcon,
  },
  {
    title: "Export anywhere",
    description: "Download PDF, DOCX, or EPUB with your metadata and cover baked in.",
    icon: Download,
  },
] as const;

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-[28rem] w-[28rem] rounded-full bg-purple/15 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-blue/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-purple/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple to-blue shadow-lg shadow-purple/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              AI Publishing Studio
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-purple to-blue px-4 py-2 text-sm font-semibold text-white transition-all hover:from-purple-light hover:to-blue-light hover:shadow-lg hover:shadow-purple/25"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-muted backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-purple-light" />
              <span>From idea to publish-ready manuscript</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Write your book with{" "}
              <span className="gradient-text">AI at every step</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              AI Publishing Studio guides you from a story idea to a finished
              manuscript — blueprint, chapters, story bible, editing, cover art,
              and export. Built for authors who want help without losing their
              voice.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple to-blue px-8 py-3.5 text-sm font-semibold text-white transition-all hover:from-purple-light hover:to-blue-light hover:shadow-lg hover:shadow-purple/25 sm:w-auto"
              >
                <Sparkles className="h-4 w-4" />
                Start writing for free
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10 sm:w-auto"
              >
                I already have an account
              </Link>
            </div>
          </div>

          {/* Workflow preview card */}
          <div className="mx-auto mt-16 max-w-4xl animate-slide-up">
            <div className="glass-card gradient-border rounded-2xl p-6 sm:p-8">
              <p className="mb-5 text-center text-xs font-medium uppercase tracking-widest text-purple-light">
                Your writing journey
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:gap-3 sm:text-sm">
                {[
                  "Idea",
                  "Blueprint",
                  "Chapters",
                  "Story Bible",
                  "Editor",
                  "Cover",
                  "Export",
                ].map((step, i, arr) => (
                  <span key={step} className="flex items-center gap-2 sm:gap-3">
                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium">
                      {step}
                    </span>
                    {i < arr.length - 1 && (
                      <span className="hidden text-muted sm:inline">→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/5 bg-white/[0.02] py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-muted">
                A clear path from blank page to finished book — you approve each
                stage before moving on.
              </p>
            </div>

            <div className="mt-14 space-y-6">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className="glass-card gradient-border flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-start sm:p-8"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex shrink-0 items-center gap-4 sm:w-48 sm:flex-col sm:items-start sm:gap-3">
                      <span className="text-2xl font-bold text-purple-light/80">
                        {step.number}
                      </span>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple/15">
                        <Icon className="h-5 w-5 text-purple-light" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 leading-relaxed text-muted">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to finish
              </h2>
              <p className="mt-4 text-muted">
                One workspace for the whole publishing workflow — no juggling
                five different tools.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="glass-card rounded-2xl p-6 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple/20 to-blue/20">
                      <Icon className="h-5 w-5 text-purple-light" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/5 pb-20 pt-16 sm:pb-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="glass-card gradient-border mx-auto max-w-3xl rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to write your book?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted">
                Create a free account, set up your first book in minutes, and
                let AI help you go from idea to export.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple to-blue px-8 py-3.5 text-sm font-semibold text-white transition-all hover:from-purple-light hover:to-blue-light hover:shadow-lg hover:shadow-purple/25 sm:w-auto"
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-8 py-3.5 text-sm font-medium text-muted transition-colors hover:text-foreground sm:w-auto"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-light" />
            <span>AI Publishing Studio</span>
          </div>
          <p>Write. Publish. Inspire.</p>
        </div>
      </footer>
    </div>
  );
}
