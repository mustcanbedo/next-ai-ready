# @next-ai-ready/mcp

MCP adapter: actions → tools, graph pages → `airead://page/*` resources and read-only discovery tools.

Transport (HTTP/stdio) lives in `@next-ai-ready/next`. Peer deps: `mcp-handler`, `@modelcontextprotocol/sdk`.

## Graph-backed page tools

Passing a `SemanticGraph` to `registerAiReady(server, { graph })` automatically registers:

| Tool | Input | Limits |
|---|---|---|
| `list_pages` | `{ cursor?, limit? }` | `limit` defaults to 20 and is capped at 50; `cursor` is an absolute site route up to 512 characters. |
| `get_page` | `{ route }` | `route` is a safe absolute site route from 1 to 512 characters; returns metadata and full AI-ready Markdown. |
| `search_pages` | `{ query, limit? }` | `query` is 1–200 characters; `limit` defaults to 5 and is capped at 20. |

`search_pages` uses deterministic local lexical ranking over the pre-built graph. It does not call an external API or require a vector database. Omit `graph` to register action tools without page tools or resources.

```ts
const result = registerAiReady(server, { graph })
// result.tools includes action tools plus list_pages, get_page, and search_pages.
```

Part of [next-ai-ready](../../README.md). Pre-alpha.
