import type { MetadataRoute } from "next";
import { aiRobots } from "@next-ai-ready/core";
import { getSiteBaseUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return aiRobots(
    {
      name: SITE_NAME,
      baseUrl: getSiteBaseUrl(),
      description: SITE_DESCRIPTION,
    },
    { aiBots: "allow", sitemap: true },
  );
}
