// @next-ai-ready/next — public entry point.
export * from "./with-ai-ready.js";
export * from "./paths.js";
export { registerAiHooks, clearAiHooks } from "./runtime/observability.js";
export { aiRobots } from "@next-ai-ready/core/robots";
export type { AiRobotsResult, AiRobotsRule } from "@next-ai-ready/core/robots";
export {
  getPageJsonLd,
  getSiteJsonLd,
  pageJsonLdFromGraph,
  siteJsonLdFromGraph,
} from "./jsonld.js";
export {
  loadGraphFromFetch,
  createEdgeGraphLoader,
  invalidateEdgeGraphCache,
} from "./runtime/edge-graph-loader.js";
