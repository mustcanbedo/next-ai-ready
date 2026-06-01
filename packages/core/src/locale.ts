/**
 * Locale helpers for multi-language SemanticGraph (P6-06).
 */

const LOCALE_ROUTE_RE = /^\/([a-z]{2})(?:[-_][a-z]{2})?(?=\/|$)/i;

/** Common ISO 639-1 locales to prevent false matches (e.g. `/api`, `/app`). */
const KNOWN_LOCALES = new Set([
  "en", "zh", "ja", "ko", "fr", "de", "es", "pt", "ru", "ar",
  "it", "nl", "pl", "tr", "vi", "th", "id", "sv", "da", "no",
  "fi", "el", "he", "hi", "bn", "uk", "cs", "ro", "hu", "sk",
]);

/** Parse locale prefix from a route, e.g. `/en/docs` → `"en"`. */
export function parseLocaleFromRoute(route: string): string | undefined {
  const m = route.match(LOCALE_ROUTE_RE);
  if (!m?.[1]) return undefined;
  const locale = m[1].toLowerCase();
  return KNOWN_LOCALES.has(locale) ? locale : undefined;
}

/** Strip locale prefix for canonical route within a locale, e.g. `/en/docs` → `/docs`. */
export function stripLocaleFromRoute(route: string, locale: string): string {
  const prefix = `/${locale}`;
  if (route === prefix) return "/";
  if (route.startsWith(`${prefix}/`)) {
    const stripped = route.slice(prefix.length);
    return stripped.length ? stripped : "/";
  }
  return route;
}

/** Build locale → routes index from flat routes map. */
export function buildRoutesByLocale(
  routes: Record<string, string>,
): Record<string, Record<string, string>> | undefined {
  const byLocale: Record<string, Record<string, string>> = {};
  for (const [route, nodeId] of Object.entries(routes)) {
    const locale = parseLocaleFromRoute(route);
    if (!locale) continue;
    const localRoute = stripLocaleFromRoute(route, locale);
    byLocale[locale] ??= {};
    byLocale[locale][localRoute] = nodeId;
  }
  return Object.keys(byLocale).length ? byLocale : undefined;
}
