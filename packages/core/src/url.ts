/**
 * Join a site base URL and a route into an absolute URL.
 *
 * Handles trailing-slash normalization so callers don't have to worry about it.
 *
 *   absoluteUrl("https://acme.com/", "/docs/install") → "https://acme.com/docs/install"
 *   absoluteUrl("https://acme.com", "/")              → "https://acme.com"
 */
export function absoluteUrl(base: string, route: string): string {
  const baseNorm = base.replace(/\/+$/, "");
  return route === "/" ? baseNorm : `${baseNorm}${route}`;
}
