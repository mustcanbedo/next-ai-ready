# @next-ai-ready/semantic

Builds `SemanticGraph` from compiled pages, emits JSON-LD (`WebPage`, `Article`, `FAQPage`, `BreadcrumbList`), and provides deterministic page retrieval.

Breadcrumbs include the site homepage and only ancestors present as pages in the graph. They use page titles and `citeUrl` values, skip missing directory pages and duplicate canonical URLs, and omit trails with fewer than two distinct items. Keep graph routes aligned with your application's real public pages.

```ts
import { createGraphSearchProvider, searchGraphPages } from "@next-ai-ready/semantic/search";

const result = searchGraphPages(graph, { query: "how to install", locale: "en" });
const provider = createGraphSearchProvider(graph);
```

`PageSearchProvider` is the shared boundary used by HTTP actions and MCP tools. The default provider is database-free and searches the pre-built graph; applications can inject a runtime provider without changing either protocol adapter.

Part of [next-ai-ready](../../README.md). Pre-alpha.
