import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-muted">
        404
      </p>
      <h1 className="text-3xl font-semibold text-foreground">Page not found</h1>
      <p className="max-w-md text-muted">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link href="/dashboard" className="btn-primary px-5 py-2.5">
        Back to dashboard
      </Link>
    </main>
  );
}
