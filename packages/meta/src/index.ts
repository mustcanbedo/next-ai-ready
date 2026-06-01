// next-ai-ready meta package — re-exports the common public API.
export * from '@next-ai-ready/core'
export { defineAction, defineActions } from '@next-ai-ready/actions'
export {
  withAiReady,
  registerAiHooks,
  clearAiHooks,
  aiRobots,
  getPageJsonLd,
  getSiteJsonLd,
  pageJsonLdFromGraph,
  siteJsonLdFromGraph,
  loadGraphFromFetch,
  createEdgeGraphLoader,
  invalidateEdgeGraphCache,
} from '@next-ai-ready/next'
export type { AiRobotsResult, AiRobotsRule } from '@next-ai-ready/core'
