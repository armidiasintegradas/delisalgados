const PRODUCTION_APP_URL = "https://delisalgados.vercel.app";

function sanitizeBaseUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return null;
  }
}

export function getCanonicalAppUrl() {
  const configured = sanitizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (process.env.NODE_ENV === "production") {
    if (
      configured &&
      !configured.includes("localhost") &&
      !configured.includes("127.0.0.1")
    ) {
      return configured;
    }

    return PRODUCTION_APP_URL;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return configured || "http://localhost:3000";
}

export function assertSafeProductionRedirect(url: string) {
  if (
    process.env.NODE_ENV === "production" &&
    (url.includes("localhost") || url.includes("127.0.0.1"))
  ) {
    throw new Error("Unsafe production auth redirect blocked.");
  }

  return url;
}

export function buildAuthCallbackUrl(nextPath: string) {
  const base = getCanonicalAppUrl();
  const url = new URL("/auth/callback", base);
  url.searchParams.set("next", nextPath);
  return assertSafeProductionRedirect(url.toString());
}
