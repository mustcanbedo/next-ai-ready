# Pre–Docs-Site Checklist

> 在开始开发文档站（Phase 5 最后一项）之前，需要完成以下步骤。
> 文档站本身是一个独立的 Next.js app，要 **dogfood** 整套框架——
> 即通过 `pnpm add next-ai-ready@alpha` 安装，而非 monorepo 内部 `workspace:*` 引用。
> 这样才能验证真实的安装→初始化→构建链路。

---

## Step 1 — 全量构建 + 测试（~5 min）

确保当前代码在发布前是 green 的。

```bash
# 在 repo 根目录
pnpm install
pnpm build          # turbo build 所有 8 个包
pnpm test           # 85 tests across 8 packages
pnpm typecheck      # 确保无类型错误
```

**通过标准：** 三条命令全部 exit 0，无红色输出。

如果有失败，优先修复再继续。

---

## Step 2 — 发布前检查（~15 min）

### 2.1 npm org 准备

```bash
# 检查 @next-ai-ready org 是否已在 npm 上创建
npm org ls next-ai-ready 2>/dev/null || echo "需要先创建 org"

# 如果还没有，去 https://www.npmjs.com/org/create 创建
# org 名称: next-ai-ready
# 确保你的 npm 账户有 publish 权限

# 确认已登录
npm whoami
```

### 2.2 检查各包的 `files` 字段

所有 8 个包已配置 `"files": ["dist", "README.md"]`。确认每个包目录下有 `README.md`：

```bash
for pkg in core semantic mdx actions llms openapi mcp next meta; do
  if [ ! -f "packages/$pkg/README.md" ]; then
    echo "⚠️  packages/$pkg/README.md 缺失 — 需要创建"
  fi
done
```

如果缺失，至少创建一个占位 README（npm 页面展示用）：

```bash
for pkg in core semantic mdx actions llms openapi mcp next meta; do
  if [ ! -f "packages/$pkg/README.md" ]; then
    echo "# @next-ai-ready/$pkg\n\nPart of [next-ai-ready](https://github.com/YOUR_ORG/next-ai-ready)." \
      > "packages/$pkg/README.md"
  fi
done
```

### 2.3 检查 bin 入口

```bash
# 构建后检查 CLI 入口文件是否存在
ls -la packages/next/dist/cli-bin.js    # @next-ai-ready/next 的 bin
ls -la packages/meta/dist/cli.js        # next-ai-ready (meta) 的 bin

# 确认 shebang 或至少可执行
node packages/meta/dist/cli.js --help
```

### 2.4 检查 subpath exports

关键检查：`@next-ai-ready/next` 的 8 个 handler subpath exports 在 dist 里都有对应文件。

```bash
for handler in llms-txt llms-full page-md page-ai-json openapi tools action mcp; do
  file="packages/next/dist/handlers/${handler}.js"
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file"
  else
    echo "✅ $file"
  fi
done
```

### 2.5 `pnpm pack` 干跑

不实际发布，只是检查包的产物内容：

```bash
for pkg in core semantic mdx actions llms openapi mcp next meta; do
  echo "=== packages/$pkg ==="
  (cd packages/$pkg && pnpm pack --dry-run 2>&1 | head -20)
  echo ""
done
```

确认每个包的 tarball 包含 `dist/` 和 `README.md`，没有意外的大文件。

---

## Step 3 — 版本号 + Changeset（~10 min）

### 方案 A：使用 Changesets（推荐）

```bash
# 创建一个 changeset，覆盖所有包
pnpm changeset

# 选择所有 9 个包
# 选择 minor bump (0.0.0 → 0.1.0)
# 写 summary: "Initial alpha release — Knowledge + Capability planes, MCP, CLI"

# 应用版本号
pnpm changeset version

# 检查版本号已更新
grep '"version"' packages/*/package.json
# 期望输出: 所有包显示 "0.1.0"

# 检查 workspace:* 是否被替换为真实版本
grep 'workspace:' packages/*/package.json
# 如果还有 workspace:* 残留，changeset version 应该已经替换它们
```

### 方案 B：手动设版本（如果 changeset 有问题）

```bash
# 手动批量改版本号
for pkg in core semantic mdx actions llms openapi mcp next meta; do
  cd packages/$pkg
  npm version 0.1.0-alpha.0 --no-git-tag-version
  cd ../..
done
```

> **注意：** 如果用 alpha tag，建议版本号为 `0.1.0-alpha.0`，
> 正式版为 `0.1.0`。alpha 给你留出修复空间。

---

## Step 4 — 发布到 npm（~5 min）

```bash
# Alpha 发布（推荐先用 alpha tag）
pnpm -r publish --tag alpha --access public --no-git-checks

# 验证发布成功
npm view next-ai-ready versions
npm view @next-ai-ready/core versions
npm view @next-ai-ready/next versions
```

发布顺序由 pnpm 自动根据依赖关系处理：
`core → semantic → mdx → actions → llms → openapi → mcp → next → meta`

### 发布后回滚 workspace 引用（可选）

如果你想在 monorepo 内继续用 `workspace:*` 开发：

```bash
git checkout -- packages/*/package.json
```

---

## Step 5 — 端到端验证（~30 min）

在 monorepo **外部**创建一个全新的 Next.js app，模拟用户的完整体验。

```bash
# 在 monorepo 外面的临时目录
cd /tmp
pnpm create next-app@latest test-ai-ready --typescript --app --tailwind --no-src-dir
cd test-ai-ready

# 安装 next-ai-ready
pnpm add next-ai-ready@alpha

# 初始化
npx next-ai-ready init

# 检查生成的文件
ls -la app/llms.txt/
ls -la app/api/actions/
ls -la app/api/mcp/
ls -la ai-ready.config.*

# 写一个测试 MDX 页面
mkdir -p content/docs
cat > content/docs/getting-started.mdx << 'EOF'
---
title: Getting Started
summary: Install and run in under 60 seconds.
---

export const semantic = {
  topics: ["install", "quickstart"],
  questions: [{ q: "How do I install?", a: "Run pnpm add next-ai-ready." }],
}

# Getting Started

Install the package and run init.
EOF

# 构建 AI 产物
npx next-ai-ready build

# 检查产出
cat public/llms.txt
ls .next-ai-ready/

# 启动 dev server
pnpm dev
# 访问以下端点确认可用:
#   http://localhost:3000/llms.txt
#   http://localhost:3000/openapi.json
#   http://localhost:3000/tools.json

# 跑 doctor
npx next-ai-ready doctor
```

### 验证清单

- [ ] `pnpm add next-ai-ready@alpha` 安装成功，无 peer dep 警告（或仅预期的 optional peer dep）
- [ ] `npx next-ai-ready init` 生成 10 个路由文件 + config
- [ ] `npx next-ai-ready build` 产出 `public/llms.txt` + `.next-ai-ready/graph.json`
- [ ] `pnpm dev` 后 `/llms.txt` 返回 200 + text/plain
- [ ] `/openapi.json` 返回合法 OpenAPI 3.1
- [ ] `/tools.json` 返回工具列表
- [ ] `npx next-ai-ready doctor` 输出报告，exit 0
- [ ] 如果有 action，`POST /api/actions/<name>` 返回正确结果

**任何失败项都应该在做文档站之前修复。**

---

## Step 6 — 文档站内容架构设计（~20 min）

在开始写代码之前，确定文档站的页面结构和 actions：

### 6.1 页面结构（Knowledge plane dogfood）

```
content/
├── index.mdx                   # 首页 — 什么是 next-ai-ready
├── getting-started/
│   ├── installation.mdx        # pnpm add + init + build
│   ├── quick-start.mdx         # 5 分钟上手
│   └── project-structure.mdx   # 生成的文件说明
├── concepts/
│   ├── two-planes.mdx          # Knowledge + Capability 核心概念
│   ├── knowledge-plane.mdx     # MDX → SemanticGraph → llms.txt
│   ├── capability-plane.mdx    # defineAction → OpenAPI → MCP
│   └── how-it-works.mdx        # 构建流程 + 运行时数据流
├── guides/
│   ├── mdx-content.mdx         # 编写 MDX + semantic metadata
│   ├── actions.mdx             # 定义和暴露 actions
│   ├── mcp-integration.mdx     # Claude Desktop / Cursor 连接
│   ├── analytics.mdx           # onAiRequest / onInvoke hooks
│   └── robots-txt.mdx          # robots.txt 配置
├── api-reference/
│   ├── config.mdx              # AiReadyConfig 完整参考
│   ├── define-action.mdx       # defineAction() API
│   ├── define-semantic.mdx     # defineSemantic() API
│   ├── with-ai-ready.mdx       # withAiReady() 插件 API
│   └── cli.mdx                 # init / build / doctor / mcp CLI
└── decisions/
    └── adr-index.mdx           # 架构决策记录索引
```

### 6.2 Actions（Capability plane dogfood）

```ts
// actions/search-docs.ts      — 搜索文档内容（基于 SemanticGraph）
// actions/get-page-content.ts  — 获取指定页面的 markdown 内容
// actions/list-api-methods.ts  — 列出所有 API 方法签名
```

### 6.3 技术选型

| 关注点         | 选择                     | 理由                           |
| -------------- | ------------------------ | ------------------------------ |
| 框架           | Next.js 15 (App Router)  | 我们的目标平台                 |
| 样式           | Tailwind CSS 4           | 现代、快速                     |
| MDX            | @next/mdx 或 fumadocs    | 但不依赖 fumadocs 的 AI 功能   |
| 代码高亮       | Shiki                    | 主流                           |
| 部署           | Vercel                   | 免费、一键                     |
| AI-Ready 层    | next-ai-ready@alpha      | dogfood                        |

---

## Step 7 — 文档站项目搭建（开始开发）

```bash
# 在 monorepo 内
mkdir -p examples/docs-site
cd examples/docs-site

# 初始化 Next.js app
pnpm create next-app@latest . --typescript --app --tailwind --no-src-dir

# 安装 next-ai-ready (从 npm，非 workspace)
pnpm add next-ai-ready@alpha

# 初始化 AI-Ready 层
npx next-ai-ready init

# 开始开发
pnpm dev
```

### 开发时切换到本地包（monorepo override）

在 **monorepo 根目录**的 `package.json` 添加：

```json
{
  "pnpm": {
    "overrides": {
      "next-ai-ready": "workspace:*",
      "@next-ai-ready/core": "workspace:*",
      "@next-ai-ready/semantic": "workspace:*",
      "@next-ai-ready/mdx": "workspace:*",
      "@next-ai-ready/actions": "workspace:*",
      "@next-ai-ready/llms": "workspace:*",
      "@next-ai-ready/openapi": "workspace:*",
      "@next-ai-ready/mcp": "workspace:*",
      "@next-ai-ready/next": "workspace:*"
    }
  }
}
```

这样 `examples/docs-site` 的 `package.json` 写的是真实版本号（模拟用户），
但 `pnpm install` 时会被 override 为本地 workspace 包（方便开发迭代）。

发布前删除 overrides，再用真实版本号测一次。

---

## 总结时间线

| 步骤    | 内容                         | 预计时间   |
| ------- | ---------------------------- | ---------- |
| Step 1  | 全量构建 + 测试              | 5 min      |
| Step 2  | 发布前检查                   | 15 min     |
| Step 3  | 版本号 + Changeset           | 10 min     |
| Step 4  | 发布到 npm                   | 5 min      |
| Step 5  | 端到端验证                   | 30 min     |
| Step 6  | 文档站内容架构设计           | 20 min     |
| Step 7  | 开始文档站开发               | → 正式开始 |
| **总计** | **Steps 1-6**               | **~1.5 h** |

Steps 1-5 是**阻塞性前置**，任何一步失败都应停下修复。
Step 6 可以并行思考。Step 7 才是文档站的正式开发。
