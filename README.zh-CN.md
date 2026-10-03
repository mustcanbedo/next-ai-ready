# next-ai-ready

English | [中文文档](./README.zh-CN.md)

**在线文档：** [中文](https://nextaiready.com/zh) · [English](https://nextaiready.com/en)

**支持与服务：** [支持开源项目，或申请固定范围诊断](https://nextaiready.com/zh/docs/support)

[![npm alpha](https://img.shields.io/npm/v/next-ai-ready/alpha.svg?label=npm%20alpha)](https://www.npmjs.com/package/next-ai-ready)
[![CI](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/ci.yml/badge.svg)](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/ci.yml)
[![Agent Readability](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/agent-readability.yml/badge.svg)](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/agent-readability.yml)
[![Vercel Agent Readability: 100/100](https://img.shields.io/badge/Vercel%20Agent%20Readability-100%2F100-000000?logo=vercel)](./docs/audit-baselines/vercel-agent-readability-0.5.0-2026-08-01.json)

**约 10 分钟，为 Next.js App Router 站点增加供 AI 工具发现和读取的内容入口。** 需要时，再添加经过鉴权的 Agent Action。

## 10 分钟开始

```bash
pnpm add next-ai-ready
pnpm exec next-ai-ready init
# 添加或更新 content/**/*.mdx，然后执行：
pnpm exec next-ai-ready build
pnpm exec next-ai-ready doctor --score
```

当 `doctor` 显示 **0 个错误**，且 `public/llms.txt` 已列出你的内容时，基础接入即完成。生成的发现与 Markdown 入口会与现有 UI 并行工作。

**下一步：** [完成 10 分钟指南](./docs/quickstart-10min.zh-CN.md)、阅读
[App Router llms.txt 实战教程](https://nextaiready.com/zh/docs/guides/nextjs-llms-txt)，
或[添加经过鉴权的 Agent Action](https://nextaiready.com/zh/docs/guides/actions)。

**已经使用 Fumadocs？** 原生 LLM 与文档 MCP 路由可能已经够用。
增加第二套内容流水线前，先看[原生优先的接入选择](https://nextaiready.com/zh/docs/guides/fumadocs-ai-ready)。
需要跨内容集合共享语义图、结构化输出，或可选的应用 Action 时，再考虑 next-ai-ready。

希望先运行一个随时可删除的演示，再改动现有项目？

```bash
npm create next-ai-ready@alpha next-ai-ready-demo
```

生成结果是普通的 Next.js TypeScript 项目，可以直接提交和部署。

> **第三方工具基线：** 生产文档站在 2026-08-01 使用 Vercel 开源的 `@vercel/agent-readability@0.5.0` 获得 **100/100**。[查看机器可读原始结果](./docs/audit-baselines/vercel-agent-readability-0.5.0-2026-08-01.json)，或运行 `pnpm audit:vercel:site` 复现。该分数衡量技术层面的 Agent 可读性，不代表搜索排名、收录或引用效果。

> **候选版本：** 本仓库与文档站跟随 `main`，当前目标为 `0.1.0-alpha.21`。公开可用性仍以 `npm view next-ai-ready dist-tags --json` 为准。alpha.21 将默认 `init` 改为 Knowledge-first：只生成 5 个 AI 可读内容文件，不强制要求 Capability 依赖，并通过 `--with-capabilities` 显式升级。

公开 alpha.21 仍会在纯知识平面项目提示缺少 OpenAPI 产物。OpenAPI 是可选能力，不要为了
消除此告警开启能力平面；诊断修复尚待发布。按[快速开始的 HTTP 检查](./docs/quickstart-10min.zh-CN.md)
验证实际内容，而不是仅看分数。

> **发布基线（2026-10-01）：** 已核验 npm `latest` 为 `0.1.0-alpha.21`。本轮基于真实页面生成面包屑的修复已列入下一个 patch，不属于该已发布版本。

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
| JSON-LD（`Article`、`FAQPage`、`WebPage`、`BreadcrumbList`） | 搜索引擎、AI 搜索 |
| `/openapi.json`、`/tools.json`、`/.well-known/ai-plugin.json` | Agent、OpenAPI 消费者 |
| `/api/mcp`（MCP 服务器）        | MCP 客户端（Claude Desktop、Cursor、Agent） |
| `/robots.txt`（显式 AI 爬虫策略）| AI 爬虫 |

### 允许 AI 搜索，但不开放模型训练

AI 搜索、模型训练与用户主动触发的页面读取是三种不同的访问决策。不要再用一个
含糊的总开关控制全部 AI 爬虫，可以按用途分别配置：

```ts
// ai-ready.config.ts
import { defineConfig } from "next-ai-ready"

export default defineConfig({
  site: { name: "Acme", baseUrl: "https://acme.com" },
  robots: {
    aiBots: {
      search: "allow",
      training: "disallow",
      user: "allow",
      other: "disallow",
    },
  },
})
```

原有 `aiBots: "allow" | "disallow"` 写法继续兼容。各服务商的限制和验证方法见
[AI 爬虫策略指南](https://nextaiready.com/zh/docs/guides/robots-txt)。

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
pnpm add next-ai-ready
npx next-ai-ready init     # 生成知识平面配置与路由
npx next-ai-ready build    # 产出 llms.txt、sitemap.md、语义图、OpenAPI、tools、robots
npx next-ai-ready doctor   # 验证配置、action 暴露规则、路由接线（CI 友好）
npx next-ai-ready audit https://example.com/about  # 验证 Agent 实际收到的线上页面
npx next-ai-ready audit https://example.com/about --version 2 --json  # 五维审计报告
npx next-ai-ready audit https://example.com/about --version 3 --json  # 三平面严格预检
npx next-ai-ready mcp      # 通过 stdio 运行 MCP 服务器（Claude Desktop / Cursor）
```

需要 Actions 与 MCP 时，再安装运行时 peer dependencies 并显式启用：

```bash
pnpm add zod@^4 @modelcontextprotocol/sdk mcp-handler
npx next-ai-ready init --with-capabilities
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

v3 的每条检查还会返回有边界的 `judgment`：`pass`、`fail` 或 `unknown`，并附带有限置信度、可追溯证据和明确的复核决策。分数继续作为摘要使用，但证据缺失或受凭据限制的检查会进入复核，而不会被包装成确定事实。

**10 分钟上手：** [`docs/quickstart-10min.zh-CN.md`](./docs/quickstart-10min.zh-CN.md) · [English](./docs/quickstart-10min.md)

或使用脚手架：

```bash
npm create next-ai-ready my-app
cd my-app
npm install
npx next-ai-ready init
npm run dev
```

脚手架会生成可直接运行的最小 Next.js App Router TypeScript 项目和初始 `content/index.mdx`。AI-ready 配置、路由 handler 与 `withAiReady()` 接线会留给随后执行的 `next-ai-ready init`；Actions 与 MCP 通过 `--with-capabilities` 按需启用。

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

消费者应用只需安装 `next-ai-ready`。仓库中的 `alpha.21` 候选版本支持以下导入：

| 导入 | 用途 |
|---|---|
| `next-ai-ready` | `defineConfig()`、`defineAction()`、`withAiReady()`、`aiRobots()` 与统一页面检索 |
| `next-ai-ready/hooks` | 运行时观测 hook |
| `next-ai-ready/handlers/*` | 生成的 App Router handler |
| `next-ai-ready/actions`、`/config`、`/json-ld`、`/robots` | tracing 范围更小的运行时专用 API |
| `next-ai-ready/search` | 不加载构建期 SDK 模块的统一页面检索 |
| `next-ai-ready/audit` | 不加载 CLI 调度器的程序化 Audit |

## 状态

🚧 **Pre-alpha**（仓库候选版本 `0.1.0-alpha.21`；公开可用性以 npm dist-tags 为准）。受保护发布工作流负责验证包与标签；正式 `0.1.0` GA 前的外部采用门槛见[当前改进台账](./docs/improvement-plan.zh-CN.md)。

- ✅ **知识平面** — MDX → 语义图 → `llms.txt` / `*.md` / `*.ai.json` / JSON-LD
- ✅ **能力平面** — `defineAction` → `/api/actions/<name>` + OpenAPI 3.1 / `tools.json` / `ai-plugin.json`
- ✅ **MCP 服务器** — action 作为工具、页面作为资源，并提供支持 locale 过滤和中文检索的 `list_pages` / `get_page` / `search_pages` 页面发现（HTTP + stdio）
- ✅ **统一检索层** — MCP 与 HTTP Action 共用可替换的 `PageSearchProvider`，避免不同协议的排序结果漂移
- ✅ **开发工具** — `build` / `init` / `doctor` / 版本化 `audit` / `mcp` CLI，`robots.txt`，分析钩子
- ✅ **文档站** — 线上 [nextaiready.com](https://nextaiready.com/zh)（[源码](./examples/docs-site)）
- ✅ **Nextra 4 兼容夹具** — 同一份 MDX 同时驱动 Nextra 界面和 AI 可读端点，并带生产级 smoke 契约（[运行示例](./examples/nextra-docs)、[带截图的第一方教程](https://nextaiready.com/zh/docs/guides/nextra-ai-ready)）

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
- **Nextra 4.6.1 需要局部 Zod 兼容配置** — Nextra 的依赖范围可能把内部 Zod 解析到 4.4.x，导致主题 layout 校验失败。[可执行夹具](./examples/nextra-docs)只把 Nextra 内部 Zod 固定为 4.3.6，应用仍使用 Zod 4.4.x；上游修复发布后即可移除 override（[#4989](https://github.com/shuding/nextra/issues/4989)、[#5036](https://github.com/shuding/nextra/issues/5036)）。
- **仅 Node.js 运行时** — 所有 handler 导出 `runtime = "nodejs"`。不支持 Edge Runtime。
- **不支持静态导出** — Next.js 的 `output: 'export'` 不兼容（handler 需要服务端运行时）。
- **不支持 Pages Router** — 仅支持 App Router。`withAiReady()` 和路由 handler 基于 App Router 约定。
- **推荐 Next.js 15+** — Next.js 14.2+、15 和 16 均已通过真实项目验证；15+ 可原生使用异步 `params`。
- **i18n 在 graph 层为路由级，非 CMS 级** — 当路由带 locale 前缀（如 `/zh/docs/...`）时，`SemanticGraph` 含 `locale` 与 `routesByLocale`；`llms.txt` 分区与 MCP 资源仍需按语言手动策展。见 [i18n 指南](https://nextaiready.com/zh/docs/guides/i18n-ai-urls) 与 [Phase 6 设计](./docs/phase6-design.md)。

## 许可证

MIT
