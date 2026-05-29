# next-ai-ready

English | [中文文档](./README.zh-CN.md)

> 传统网站为浏览器而建。
> **next-ai-ready** 让你的 Next.js 站点被 AI **可读**、被 Agent **可调用**。
>
> **网站 = UI + 知识 + 能力**

---

## 这是什么

`next-ai-ready` 是 Next.js 的 **AEO / Agent-API 层**。

SEO 为浏览器和搜索引擎优化你的网站。
`next-ai-ready` 为 **AI 消费者** 优化你的网站——让：

1. **AI 搜索引擎引用你**（ChatGPT、Perplexity、Claude、Gemini、Google AI Overviews）。
2. **AI Agent 调用你**（你的功能变成 Agent 可以代替用户调用的工具）。

这不是 SaaS，不是仪表盘，不是聊天机器人。它是一个 **开发者基础设施工具**，与 `next.config.js` 并列使用。

## 产出物

基于同一个 Next.js 应用，无需修改 UI，你将获得：

| 产出物                          | 消费者                    |
| ------------------------------- | ------------------------- |
| HTML                            | 浏览器（不受影响）        |
| `/llms.txt`、`/llms-full.txt`   | LLM、AI 搜索爬虫          |
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
pnpm add next-ai-ready
npx next-ai-ready init     # 生成配置 + 路由桩文件 + 示例 action
npx next-ai-ready build    # 产出 llms.txt、语义图、openapi.json、tools.json、robots.txt
npx next-ai-ready doctor   # 验证配置、action 暴露规则、路由接线（CI 友好）
npx next-ai-ready mcp      # 通过 stdio 运行 MCP 服务器（Claude Desktop / Cursor）
```

然后运行 `next build`，你的站点就能被 AI 发现和调用了。

### 分析钩子

了解哪些 AI 爬虫读取了你的内容、哪些 Agent 调用了你的 action：

```ts
// instrumentation.ts
import { registerAiHooks } from "@next-ai-ready/next"

registerAiHooks({
  onAiRequest: (info) => analytics.track("ai_request", info),  // bot, ua, path, artifact
  onInvoke:    (info) => analytics.track("ai_invoke", info),   // action, latency, ok, caller
})
```

## 状态

🚧 **Pre-alpha**，但核心功能已实现并测试（8 个包共 85 个测试）：

- ✅ **知识平面** — MDX → 语义图 → `llms.txt` / `*.md` / `*.ai.json` / JSON-LD
- ✅ **能力平面** — `defineAction` → `/api/actions/<name>` + OpenAPI 3.1 / `tools.json` / `ai-plugin.json`
- ✅ **MCP 服务器** — action 作为 MCP 工具 + 页面作为资源（HTTP + stdio）
- ✅ **开发工具** — `build` / `init` / `doctor` / `mcp` CLI，`robots.txt`，分析钩子
- ⏳ **文档站** — 进行中

详见 [`docs/`](./docs)：

- [`docs/goals.md`](./docs/goals.md) — 北极星：AEO + Agent 能力
- [`docs/research.md`](./docs/research.md) — 竞品分析
- [`docs/architecture.md`](./docs/architecture.md) — 完整架构
- [`docs/decisions.md`](./docs/decisions.md) — 架构决策记录
- [`docs/roadmap.md`](./docs/roadmap.md) — 分阶段交付计划

## 许可证

MIT
