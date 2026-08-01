# next-ai-ready

English | [中文文档](./README.zh-CN.md)

**在线文档：** [中文](https://next-ai-ready.vercel.app/zh) · [English](https://next-ai-ready.vercel.app/en)

> 传统网站为浏览器而建。
> **next-ai-ready** 让你的 Next.js 站点被 AI **可读**、被 Agent **可调用**。
>
> **网站 = UI + 知识 + 能力**

---

## 这是什么

`next-ai-ready` 是 Next.js 的 **AEO / Agent-API 层**。

SEO 为浏览器和搜索引擎优化你的网站。
`next-ai-ready` 为 **AI 消费者** 增加标准化接口，让：

1. **AI 系统可以发现并读取干净的内容表示。**
2. **获得授权的 AI Agent 可以调用你的功能**，将其作为代表用户执行的工具。

这些接口改善技术可访问性，但不保证被索引、获得排名、被引用或出现在 AI 生成的回答中。

这不是 SaaS，不是仪表盘，不是聊天机器人。它是一个 **开发者基础设施工具**，与 `next.config.js` 并列使用。

## 产出物

基于同一个 Next.js 应用，无需修改 UI，你将获得：

| 产出物                          | 消费者                    |
| ------------------------------- | ------------------------- |
| HTML                            | 浏览器（不受影响）        |
| `/llms.txt`、`/llms-full.txt`   | LLM、AI 搜索爬虫          |
| `/sitemap.md`                   | Agent 可读的页面发现目录  |
| `/<route>.md`、`/<route>.ai.json` | 检索、RAG、AI 数据摄取   |
| JSON-LD（`Article`、`FAQPage`、`WebPage`） | 搜索引擎、AI 搜索 |
| `/openapi.json`、`/tools.json`、`/.well-known/ai-plugin.json` | Agent、OpenAPI 消费者 |
| `/api/mcp`（MCP 服务器）        | MCP 客户端（Claude Desktop、Cursor、Agent） |
| `/robots.txt`（显式 AI 爬虫策略）| AI 爬虫 |

## 两个平面

```
                  ┌────────────────────────┐
                  │   Next.js App Router   │
                  └───────────┬────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
       ┌────────────┐                  ┌──────────────┐
       │  知识平面   │  ← MDX +         │  能力平面    │  ← defineAction()
       │ Knowledge  │   semantic{}     │  Capability  │
       └─────┬──────┘                  └──────┬───────┘
             │                                │
        llms.txt                         openapi.json
        page.md / .ai.json               tools.json
        JSON-LD                          MCP server
```

## 快速体验

```ts
// app/docs/getting-started/page.mdx
export const semantic = {
  summary: "60 秒内安装并运行 Acme。",
  topics: ["安装", "快速开始"],
  questions: [{ q: "如何安装 Acme？", a: "运行 `pnpm i acme`。" }],
}

# 快速开始
...
```

```ts
// actions/search-product.ts
import { defineAction } from "@next-ai-ready/actions"
import { z } from "zod"

export default defineAction({
  name: "search_product",
  description: "按关键词搜索产品。",
  whenToUse: "当用户想要在我们的目录中查找产品时。",
  input: z.object({ keyword: z.string(), limit: z.number().default(10) }),
  output: z.object({ items: z.array(z.object({ id: z.string(), title: z.string() })) }),
  public: true,
  async handler({ keyword, limit }, ctx) {
    return { items: await db.products.search(keyword, limit) }
  },
})
```

```bash
pnpm add next-ai-ready@alpha
npx next-ai-ready init     # 生成配置 + 路由桩文件 + 示例 action
npx next-ai-ready build    # 产出 llms.txt、sitemap.md、语义图、OpenAPI、tools、robots
npx next-ai-ready doctor   # 验证配置、action 暴露规则、路由接线（CI 友好）
npx next-ai-ready audit https://example.com/about  # 验证 Agent 实际收到的线上页面
npx next-ai-ready mcp      # 通过 stdio 运行 MCP 服务器（Claude Desktop / Cursor）
```

然后运行 `next build`，暴露生成的发现、读取与能力接口。

在 `next.config.mjs` 中显式启用 Markdown 内容协商：

```js
export default withAiReady({ agentReadable: true })(nextConfig)
```

带有 `Accept: text/markdown` 或已知 Agent User-Agent 的页面请求会得到 Markdown，普通浏览器请求仍然获得 HTML。浏览器访问不存在页面时仍返回真实 HTTP `404`；不存在的 Markdown 表示则返回 `200` 恢复文档，其中包含请求路径、发现入口和最多五个相关页面，便于 Agent 继续导航。

`next-ai-ready audit <url>` 会独立验证浏览器与 Agent 的行为。它保持 JSON 契约向后兼容，同时接受其他实现中符合标准的等价响应元数据。

**10 分钟上手：** [`docs/quickstart-10min.zh-CN.md`](./docs/quickstart-10min.zh-CN.md) · [English](./docs/quickstart-10min.md)

或使用脚手架：

```bash
npm create next-ai-ready@alpha my-app
```

### 分析钩子

了解哪些 AI 爬虫读取了你的内容、哪些 Agent 调用了你的 action：

```ts
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}

// instrumentation-node.ts
import "server-only";
import { registerAiHooks } from "next-ai-ready/hooks";

registerAiHooks({
  onAiRequest: (info) => analytics.track("ai_request", info),
  onInvoke:    (info) => analytics.track("ai_invoke", info),
})
```

请使用 `next-ai-ready/hooks` 子路径，避免在 Edge instrumentation 中加载 Node 专用模块。

## 状态

🚧 **Pre-alpha**（`0.1.0-alpha.11` 已发布到 npm `@alpha`），但核心功能已实现并测试（9 个包共 145+ 个测试）：

- ✅ **知识平面** — MDX → 语义图 → `llms.txt` / `*.md` / `*.ai.json` / JSON-LD
- ✅ **能力平面** — `defineAction` → `/api/actions/<name>` + OpenAPI 3.1 / `tools.json` / `ai-plugin.json`
- ✅ **MCP 服务器** — action 作为 MCP 工具 + 页面作为资源（HTTP + stdio）
- ✅ **开发工具** — `build` / `init` / `doctor` / `audit` / `mcp` CLI，`robots.txt`，分析钩子
- ✅ **文档站** — 线上 [next-ai-ready.vercel.app](https://next-ai-ready.vercel.app/zh)（[源码](./examples/docs-site)）

详见 [`docs/`](./docs)（[**文档索引**](./docs/README.md)）：

- [`docs/goals.md`](./docs/goals.md) — 北极星：AEO + Agent 能力
- [`docs/ga-readiness.md`](./docs/ga-readiness.md) — 0.1 GA 清单
- [`docs/post-ga.md`](./docs/post-ga.md) — GA 之后规划
- [`docs/research.md`](./docs/research.md) — 竞品分析
- [`docs/architecture.md`](./docs/architecture.md) — 完整架构
- [`docs/decisions.md`](./docs/decisions.md) — 架构决策记录
- [`docs/roadmap.md`](./docs/roadmap.md) — 分阶段交付计划
- [`docs/quickstart-10min.zh-CN.md`](./docs/quickstart-10min.zh-CN.md) — 10 分钟上手

### 已知限制

- **需要 Zod v4** — action 使用 `z.toJSONSchema()`，仅 Zod v4 支持。请安装 `zod@^4`。
- **仅 Node.js 运行时** — 所有 handler 导出 `runtime = "nodejs"`。不支持 Edge Runtime。
- **不支持静态导出** — Next.js 的 `output: 'export'` 不兼容（handler 需要服务端运行时）。
- **不支持 Pages Router** — 仅支持 App Router。`withAiReady()` 和路由 handler 基于 App Router 约定。
- **推荐 Next.js 15+** — handler 使用 `params: Promise<>`（异步 params）。Next.js 14 可通过 `Promise.resolve()` 兼容但未官方测试。
- **i18n 在 graph 层为路由级，非 CMS 级** — 当路由带 locale 前缀（如 `/zh/docs/...`）时，`SemanticGraph` 含 `locale` 与 `routesByLocale`；`llms.txt` 分区与 MCP 资源仍需按语言手动策展。见 [i18n 指南](https://next-ai-ready.vercel.app/zh/docs/guides/i18n-ai-urls) 与 [Phase 6 设计](./docs/phase6-design.md)。

## 许可证

MIT
