const DEFAULT_AUTH_NEXT = "/dashboard";

function normalizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_AUTH_NEXT;
  }

  return next;
}

/** Client-side callback URL for email confirmation and password reset links. */
export function getAuthCallbackUrl(next = DEFAULT_AUTH_NEXT): string {
  const safeNext = normalizeNextPath(next);

  if (typeof window === "undefined") {
    return `/auth/callback?next=${encodeURIComponent(safeNext)}`;
  }

  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", safeNext);
  return url.toString();
}

export function sanitizeAuthRedirectPath(
  next: string | null | undefined
): string {
  return normalizeNextPath(next);
}

/** Server-side site URL fallback for emails and metadata. */
export function getServerSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function getServerAuthCallbackUrl(next = DEFAULT_AUTH_NEXT): string {
  const safeNext = normalizeNextPath(next);
  return `${getServerSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
