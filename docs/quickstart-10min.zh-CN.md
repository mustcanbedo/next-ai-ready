# 10 分钟上手

本指南验证 Next.js App Router 项目的知识平面基础接入。预留约十分钟，依赖下载与生产构建
可能需要更长时间；Actions 与 MCP 留待有实际需求时接入。

## 前置条件

- Node.js 20+
- Next.js 14.2+（App Router）；脚手架使用 Next.js 15
- 若定义 actions，需 Zod v4（`zod@^4`）

## 1. 脚手架（推荐）

```bash
npm create next-ai-ready@latest my-app
cd my-app
npm install
npx next-ai-ready init
```

脚手架会生成可直接运行的最小 Next.js App Router TypeScript 应用，包括 `app/layout.tsx`、`app/page.tsx` 和初始 `content/index.mdx`。模板不会预生成 AI-ready 配置或 handler；依赖安装完成后，由 `next-ai-ready init` 添加这些文件与接线。

## 2. 配置站点

编辑已有 `ai-ready.config.ts` 或 `ai-ready.config.mjs`，不要另建第二个配置。下面的站点
信息和域名仅为示例，必须替换为实际生产值，不要部署占位域名：

```js
import { defineConfig } from "next-ai-ready";

export default defineConfig({
  site: {
    name: "My Site",
    baseUrl: "https://example.com", // 生产 URL，不要尾部斜杠
    description: "供 AI 搜索与 llms.txt 使用的一句话描述。",
  },
  content: ["content/**/*.mdx"], // build 时扫描的 glob
});
```

确认 `next.config` 已用 `withAiReady({ agentReadable: true })` 包裹（`init` 会在缺失时注入）。
待明确的可调用工作流准备好后，安装 Zod 和 MCP peer packages，再运行
`next-ai-ready init --with-capabilities`；该命令会生成能力路由，并把 actions 模块加入配置。

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

`init` 会在缺失时添加构建接线；保留已有脚本，不要直接用示例覆盖。AI 构建生成
`public/llms.txt` 与 `.next-ai-ready/graph.json`，OpenAPI 是可选产物。

## 4. 添加内容（知识平面）

创建 `content/docs/intro.mdx`：

```markdown
---
title: 简介
summary: 安装示例项目依赖。
---

# 简介

在项目根目录运行 `pnpm install` 安装依赖。
```

执行：

```bash
npx next-ai-ready build
npm run build
npm run start
```

## 5. 验证 AI 端点

在另一个终端检查响应头和正文：

```bash
curl -i http://localhost:3000/llms.txt
curl -i http://localhost:3000/docs/intro.md
curl -i -H 'Accept: text/html' http://localhost:3000/
```

发现索引应包含配置域名下的 `/docs/intro` 链接；逐页端点应返回 `200`、`text/markdown`、
“简介”标题和安装依赖说明。包含 `document_status: "not_found"` 的 `200` 是恢复文档，不能
当作成功。普通 `/` 请求应继续返回 HTML；在 `content/` 下添加 MDX 不会创建网页路由。

| URL | 用途 |
|-----|------|
| `/llms.txt` | 站点 LLM 索引 |
| `/llms-full.txt` | 全文 dump（含 FAQ） |
| `/docs/intro.md` | 单页 Markdown（路由与 graph 一致） |

OpenAPI、`/tools.json` 与 MCP 需要显式配置能力平面，不属于默认 `init` 或本次基础验收。

## 6. 运行 doctor

```bash
npx next-ai-ready doctor --score
```

要求 **0 个错误**，再逐条修复或记录告警。高分不能代替上述 HTTP 检查。公开 alpha.21
会误报纯知识平面缺少 OpenAPI，诊断修复尚待发布；不要为消除它而开启能力平面。

其他告警可按以下方向处理：

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

- [线上文档](https://nextaiready.com/zh)
- [`architecture.md`](./architecture.md)
- [`goals.md`](./goals.md) — 24 条 AEO 战术
