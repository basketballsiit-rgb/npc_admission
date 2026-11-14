/**
 * Utility to get the client-side base path for Next.js subpath deployments.
 * On production: https://service.npc.ac.th/npc_admission
 */
export function getClientBasePath(): string {
  if (typeof window !== "undefined") {
    return window.location.pathname.startsWith("/npc_admission") ? "/npc_admission" : "";
  }
  return process.env.NEXT_PUBLIC_BASE_PATH || (process.env.NODE_ENV === "production" ? "/npc_admission" : "");
}

/**
 * Prefix an API or asset path with the client base path if needed.
 * Example: apiUrl("/api/rounds") => "/npc_admission/api/rounds" (on service.npc.ac.th)
 */
export function apiUrl(path: string): string {
  const base = getClientBasePath();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Prefix a static asset (like logo, images) with the base path to avoid Next.js image proxy issues.
 */
export function assetUrl(path: string): string {
  const base = getClientBasePath();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
