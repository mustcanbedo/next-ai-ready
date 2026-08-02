# 10 分钟上手

本指南帮助你在 Next.js App Router 项目中用 `next-ai-ready` 快速接入 AI 可读 + Agent 可调用能力。

## 前置条件

- Node.js 20+
- Next.js 15+（App Router）
- 若定义 actions，需 Zod v4（`zod@^4`）

## 1. 脚手架（推荐）

```bash
npm create next-ai-ready my-app
cd my-app
npm install
npx next-ai-ready init
```

脚手架会生成可直接运行的最小 Next.js App Router TypeScript 应用，包括 `app/layout.tsx`、`app/page.tsx` 和初始 `content/index.mdx`。模板不会预生成 AI-ready 配置或 handler；依赖安装完成后，由 `next-ai-ready init` 添加这些文件与接线。

## 2. 配置站点

编辑 `ai-ready.config.mjs`：

```js
import { defineConfig } from "next-ai-ready";

export default defineConfig({
  site: {
    name: "My Site",
    baseUrl: "https://example.com", // 生产 URL，不要尾部斜杠
    description: "供 AI 搜索与 llms.txt 使用的一句话描述。",
  },
  content: ["content/**/*.mdx"], // build 时扫描的 glob
  actions: "./actions/index.mjs",   // 可选：能力平面
});
```

确认 `next.config` 已用 `withAiReady()` 包裹（`init` 会在缺失时注入）。

## 3. 接入构建

在 `package.json` 中：

```json
{
  "scripts": {
    "prebuild": "next-ai-ready build",
    "build": "next build",
    "dev": "next dev"
  }
}
```

`prebuild` 保证在 `next build` 前生成 `public/llms.txt`、`.next-ai-ready/graph.json`、OpenAPI 等产物。

## 4. 添加内容（知识平面）

创建 `content/docs/intro.mdx`：

```mdx
export const semantic = {
  summary: "一句话说明产品做什么。",
  questions: [
    { q: "这是什么产品？", a: "供 AI 引用的简短回答。" },
  ],
}

# 简介

正文内容。
```

执行：

```bash
npx next-ai-ready build
npm run dev
```

## 5. 验证 AI 端点

浏览器或 curl 访问：

| URL | 用途 |
|-----|------|
| `/llms.txt` | 站点 LLM 索引 |
| `/llms-full.txt` | 全文 dump（含 FAQ） |
| `/docs/intro.md` | 单页 Markdown（路由与 graph 一致） |
| `/openapi.json` | Agent API |
| `/tools.json` | 工具定义 |

## 6. 运行 doctor

```bash
npx next-ai-ready doctor --score
```

建议 **90+**。常见 **100 分**修复项：

| 告警 | 修复 |
|------|------|
| 缺少 prebuild / build 脚本 | 添加 `"prebuild": "next-ai-ready build"` |
| 无 `public/robots.txt` | 执行 `build`，或使用 `app/robots.ts` + `emit.robots: false` |
| 未设置 `NEXT_AI_READY_MCP_TOKEN` | 生产环境暴露 `/api/mcp` 时配置 |
| 缺少 `updatedAt` / `author` | 写入 MDX frontmatter |
| 应用内无 JSON-LD | 在 layout 使用 `getPageJsonLd()` / `getSiteJsonLd()` |
| 公开 action 无 `whenToUse` | 为每个 public action 补充 `whenToUse` |

使用 `--score` 时，doctor 会输出 **Top fixes** 建议。

## 7. 可选：生产环境 MCP

```bash
# .env.production
NEXT_AI_READY_MCP_TOKEN=your-secret-token
```

客户端以 `Authorization: Bearer <token>` 访问 `/api/mcp`。

## 已有 Next.js 项目（TSX 页面）？

**A. 迁到 MDX（推荐）**  
文档放入 `content/**/*.mdx`，营销页继续用 TSX。每个 AI 路由对应一份源文件。

**B. 双轨（文档站模式）**  
UI 仍用 TSX；在 `content/` 维护供 AI 平面使用的 MDX。见 [`examples/docs-site/README.md`](../examples/docs-site/README.md)。

**C. 自定义内容源（实验性）**  
`defineContentSource()` 与 Phase 6 适配器 — 见 [`phase6-design.md`](./phase6-design.md)。

## 限制（上线前必读）

- actions 仅支持 Zod v4
- handler 为 `runtime = "nodejs"`（非 Edge）
- 不支持 `output: 'export'` 静态导出
- 仅 App Router（无 Pages Router）

## 下一步

- [线上文档](https://next-ai-ready.vercel.app/zh)
- [`architecture.md`](./architecture.md)
- [`goals.md`](./goals.md) — 24 条 AEO 战术
