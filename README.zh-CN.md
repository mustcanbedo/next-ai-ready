# next-ai-ready

English | [中文文档](./README.zh-CN.md)

**在线文档：** [中文](https://next-ai-ready.vercel.app/zh) · [English](https://next-ai-ready.vercel.app/en)

[![npm alpha](https://img.shields.io/npm/v/next-ai-ready/alpha.svg?label=npm%20alpha)](https://www.npmjs.com/package/next-ai-ready)
[![CI](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/ci.yml/badge.svg)](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/ci.yml)
[![Agent Readability](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/agent-readability.yml/badge.svg)](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/agent-readability.yml)
[![Vercel Agent Readability: 100/100](https://img.shields.io/badge/Vercel%20Agent%20Readability-100%2F100-000000?logo=vercel)](./docs/audit-baselines/vercel-agent-readability-0.5.0-2026-08-01.json)

> **第三方工具基线：** 生产文档站在 2026-08-01 使用 Vercel 开源的 `@vercel/agent-readability@0.5.0` 获得 **100/100**。[查看机器可读原始结果](./docs/audit-baselines/vercel-agent-readability-0.5.0-2026-08-01.json)，或运行 `pnpm audit:vercel:site` 复现。该分数衡量技术层面的 Agent 可读性，不代表搜索排名、收录或引用效果。

> **发布渠道：** 本仓库与文档站跟随 `main`；npm 当前为 `0.1.0-alpha.14`，已包含 TypeScript Action 加载修复、运行时专用入口、Audit v3 和 MCP 页面发现。2026-08-02 已通过公共 registry 的 npm/pnpm × Next.js 14/15/16 完整矩阵；生产 MCP 也已通过带认证 initialize 及 `list_pages`、`search_pages`、`get_page` 调用。

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
import { defineAction } from "next-ai-ready"
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
npx next-ai-ready audit https://example.com/about --version 2 --json  # 五维审计报告
npx next-ai-ready audit https://example.com/about --version 3 --json  # 三平面严格预检
npx next-ai-ready mcp      # 通过 stdio 运行 MCP 服务器（Claude Desktop / Cursor）
```

然后运行 `next build`，暴露生成的发现、读取与能力接口。

在 `next.config.mjs` 中显式启用 Markdown 内容协商：

```js
// next.config.mjs
import { withAiReady } from "next-ai-ready"

const nextConfig = {}

export default withAiReady({ agentReadable: true })(nextConfig)
```

带有 `Accept: text/markdown` 或已知 Agent User-Agent 的页面请求会得到 Markdown，普通浏览器请求仍然获得 HTML。浏览器访问不存在页面时仍返回真实 HTTP `404`；不存在的 Markdown 表示则返回 `200` 恢复文档，其中包含请求路径、发现入口和最多五个相关页面，便于 Agent 继续导航。

`next-ai-ready audit <url>` 会独立验证浏览器与 Agent 的行为。Audit v1 仍是默认版本，保持原有 JSON 结构、评分和 CI 退出行为不变；Audit v2 继续保留原有五维报告。使用 `--version 3` 可分别查看 Agent Readability、Semantic/AEO Quality 与 Agent Capability，采用严格的通过项分层计分。v3 是快速的本地子集预检，仓库固定的 `@vercel/agent-readability` 命令仍是 Readability 的官方外部质量门。

**10 分钟上手：** [`docs/quickstart-10min.zh-CN.md`](./docs/quickstart-10min.zh-CN.md) · [English](./docs/quickstart-10min.md)

或使用脚手架：

```bash
npm create next-ai-ready@alpha my-app
cd my-app
npm install
npx next-ai-ready init
npm run dev
```

脚手架会生成可直接运行的最小 Next.js App Router TypeScript 项目和初始 `content/index.mdx`。AI-ready 配置、路由 handler、actions 与 `withAiReady()` 接线会留给随后执行的 `next-ai-ready init`，不会由模板预置。

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

### 包导入

消费者应用只需安装 `next-ai-ready`。已发布的 `alpha.14` 支持以下导入：

| 导入 | 用途 |
|---|---|
| `next-ai-ready` | `defineConfig()`、`defineAction()`、`withAiReady()` 与 `aiRobots()` |
| `next-ai-ready/hooks` | 运行时观测 hook |
| `next-ai-ready/handlers/*` | 生成的 App Router handler |
| `next-ai-ready/actions`、`/config`、`/json-ld`、`/robots` | tracing 范围更小的运行时专用 API |
| `next-ai-ready/audit` | 不加载 CLI 调度器的程序化 Audit |

## 状态

🚧 **Pre-alpha**（`0.1.0-alpha.14` 已发布到 npm `@alpha`）。公开包和生产 MCP 链路已通过上述发布验证；最终 GA 验收与后续工作见[当前改进台账](./docs/improvement-plan.zh-CN.md)。

- ✅ **知识平面** — MDX → 语义图 → `llms.txt` / `*.md` / `*.ai.json` / JSON-LD
- ✅ **能力平面** — `defineAction` → `/api/actions/<name>` + OpenAPI 3.1 / `tools.json` / `ai-plugin.json`
- ✅ **MCP 服务器** — action 作为工具、页面作为资源，并提供基于 graph 的 `list_pages` / `get_page` / `search_pages` 页面发现（HTTP + stdio）
- ✅ **开发工具** — `build` / `init` / `doctor` / 版本化 `audit` / `mcp` CLI，`robots.txt`，分析钩子
- ✅ **文档站** — 线上 [next-ai-ready.vercel.app](https://next-ai-ready.vercel.app/zh)（[源码](./examples/docs-site)）

详见 [`docs/`](./docs)（[**文档索引**](./docs/README.md)）：

- [`docs/improvement-plan.zh-CN.md`](./docs/improvement-plan.zh-CN.md) — 当前改进台账、验收标准与待商榷事项
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
- **推荐 Next.js 15+** — Next.js 14.2+、15 和 16 均已通过真实项目验证；15+ 可原生使用异步 `params`。
- **i18n 在 graph 层为路由级，非 CMS 级** — 当路由带 locale 前缀（如 `/zh/docs/...`）时，`SemanticGraph` 含 `locale` 与 `routesByLocale`；`llms.txt` 分区与 MCP 资源仍需按语言手动策展。见 [i18n 指南](https://next-ai-ready.vercel.app/zh/docs/guides/i18n-ai-urls) 与 [Phase 6 设计](./docs/phase6-design.md)。

## 许可证

MIT
