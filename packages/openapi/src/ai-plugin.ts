import type { SiteInfo } from "@next-ai-ready/core";

export interface BuildAiPluginOptions {
  /** Where the OpenAPI document is served. Default: "/api/openapi.json". */
  openapiPath?: string;
  /** Where the logo file is served, relative to site.baseUrl or absolute. */
  logoUrl?: string;
  /** Contact email for plugin registration. */
  contactEmail?: string;
  /** URL to legal terms. */
  legalInfoUrl?: string;
}

/**
 * Build an `ai-plugin.json` manifest (ChatGPT Plugins / well-known format).
 *
 * Most plugin marketplaces have wound down, but the format is still the
 * lowest-common-denominator discovery surface for several enterprise AI
 * gateways. Generating it is free, so we do.
 *
 * Spec: https://platform.openai.com/docs/plugins/getting-started
 */
export function buildAiPlugin(site: SiteInfo, opts: BuildAiPluginOptions = {}): Record<string, unknown> {
  const baseUrl = site.baseUrl.replace(/\/+$/, "");
  const openapiPath = opts.openapiPath ?? "/api/openapi.json";

  return {
    schema_version: "v1",
    name_for_human: site.name,
    name_for_model: site.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_").slice(0, 40),
    description_for_human: site.description ?? `${site.name} API for AI agents.`,
    description_for_model:
      site.description ??
      `${site.name} API. See the OpenAPI document for available tools and when to use them.`,
    auth: { type: "none" },
    api: {
      type: "openapi",
      url: `${baseUrl}${openapiPath}`,
    },
    logo_url: opts.logoUrl ?? `${baseUrl}/icon.png`,
    contact_email: opts.contactEmail ?? "",
    legal_info_url: opts.legalInfoUrl ?? baseUrl,
  };
}
