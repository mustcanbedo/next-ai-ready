# next-ai-ready — 完整 Backlog

> **定位：** 本文件是项目的**完整待办与技术债清单**（single source of truth for「还没做 / 待优化」）。
>
> **与 [`completion-audit.md`](./completion-audit.md) 的分工：**
>
> | 文档 | 读者 | 内容 |
> |------|------|------|
> | `completion-audit.md` | 决策者 / 发布负责人 | 完成度评估、P0–P2 行动项、0.1 DoD |
> | [`ga-readiness.md`](./ga-readiness.md) | 发布负责人 | **0.1 GA** 还剩什么、DoD |
> | [`post-ga.md`](./post-ga.md) | 产品 / 维护者 | **GA 之后**优化（PG-xx） |
> | **`backlog.md`（本文）** | 开发者 / 长期维护 | **全部**未完成项、优化项、Phase 6、文档债 |
>
> **维护规则：** 完成一项 → 在本文件标记 `[x]` 并注明日期；`completion-audit.md` 的 P0/P1 仅保留摘要，细节以本文为准。
>
> **最后更新：** 2026-06-02（alpha.9/10 adopter UX；GA 清单见 [`ga-readiness.md`](./ga-readiness.md)；GA 后见 [`post-ga.md`](./post-ga.md)）

---

## 图例

| 标记 | 含义 |
|------|------|
| `[ ]` | 未完成 |
| `[x]` | 已完成 |
| 🔴 | 阻塞 alpha / 0.1 |
| 🟡 | 应在 0.1 前或紧随其后 |
| 🟢 | 优化 / 可延后 |
| ⬜ | Phase 6 / 未排期 |
| 🚫 | 明确 out of scope |

---

## 1. Roadmap 声称完成但实际漏做

> `progress.txt` 或 Roadmap 阶段标 ✅，但代码/文档中未交付的项。

| ID | 优先级 | 来源 | 项 | 现状 | 建议 |
|----|--------|------|-----|------|------|
| R-01 | ~~🟡~~ ✅ | Phase 4 exit | **MCP HTTP 端点 token 鉴权** | [x] 2026-06-01 — `handlers/mcp.ts` 实现 `NEXT_AI_READY_MCP_TOKEN` gate；doctor 检查 |
| R-02 | ~~🟡~~ ✅ | `with-ai-ready.ts` 注释 + architecture §6 | **`withAiReady()` CORS headers** | [x] 2026-06-01 — 删除未实现的 CORS 承诺（JSDoc + architecture.md） |
| R-03 | ~~🟡~~ ✅ | Phase 1 / architecture | **JSON-LD 注入 HTML 页面** | [x] 2026-06-01 — `getPageJsonLd(route)` + `getSiteJsonLd()` 导出 from `@next-ai-ready/next` |
| R-04 | ~~🟡~~ ✅ | Phase 2 exit | **First public alpha tag** | [x] 2026-06-01 — `@alpha` → `0.1.0-alpha.3`（9 包对齐） |
| R-05 | ~~🟡~~ ✅ | Phase 5 | **Doctor 对照 24 tactics 评分** | [x] 2026-06-01 — `cli/tactics.ts` |
| R-06 | ~~🟡~~ ✅ | Phase 5 | **`aiRobots()` for `app/robots.ts`** | [x] 2026-06-01 — `aiRobots(site, config)` 导出 from core + next；返回 MetadataRoute.Robots 形状 |
| R-07 | ~~🟡~~ ✅ | Phase 5 | **`next-ai-ready dev` watch** | [x] 2026-06-01 — `cli/dev.ts` |
| R-08 | ~~🟢~~ ✅ | Phase 5 | **系统化友好错误信息** | [x] 2026-06-01 — `AiReadyError` + `formatCliError()` |
| R-09 | ~~🟢~~ ✅ | Phase 3 | **`examples/ecommerce`** | [x] 2026-06-01 |
| R-10 | ~~🟢~~ ✅ | Phase 5 optional | **`npm create next-ai-ready`** | [x] 2026-06-01 |

---

## 2. URL / 产物路径一致性（🔴 功能 bug 类）

| ID | 优先级 | 项 | 详情 |
|----|--------|-----|------|
| U-01 | ~~🔴~~ ✅ | **OpenAPI canonical URL** | [x] 2026-05-31 — canonical `/openapi.json`；`/api/openapi.json` 保留为 alias rewrite |
| U-02 | ~~🔴~~ ✅ | **tools.json canonical URL** | [x] 2026-05-31 — canonical `/tools.json`；`/api/tools.json` 保留为 alias rewrite |
| U-03 | ~~🟡~~ ✅ | **ai-plugin OpenAPI 指针** | [x] 2026-05-31 — `buildAiPlugin()` 默认 `openapiPath: "/openapi.json"` |
| U-04 | ~~🟡~~ ✅ | **文档内 URL 统一** | [x] 2026-05-31 — init 模板注释已更新；docs-site MDX 待后续 PR |
| U-05 | ~~🟡~~ ✅ | **Doctor URL 可达性检查** | [x] 2026-06-01 — doctor 检查 `public/openapi.json` 存在 + `next.config` 含 `withAiReady` + `package.json` build script |

**修复方向（二选一，全 repo 统一）：**

- **方案 A（推荐）：** canonical = `/openapi.json`、`/tools.json`（与 `public/` 一致）；rewrite 作为 alias；ai-plugin 改默认 path。
- **方案 B：** canonical = `/api/*`；build 改输出路径 + 文档全改。

---

## 3. Onboarding / Next.js 集成

| ID | 优先级 | 项 | 详情 |
|----|--------|-----|------|
| N-01 | ~~🔴~~ ✅ | **`init` 不写 `next.config`** | [x] 2026-05-31 — `patchNextConfig()` 自动 wrap `withAiReady()`；无 config 时创建 |
| N-02 | ~~🔴~~ ✅ | **`init` 不写 `package.json` scripts** | [x] 2026-05-31 — `patchPackageJson()` 自动添加 `next-ai-ready build &&` + `typecheck` |
| N-03 | ~~🟡~~ ✅ | **`init` scaffold `instrumentation.ts`** | [x] 2026-06-01 |
| N-04 | ~~🟡~~ ✅ | **`init` robots 策略说明** | [x] 2026-06-01 — config 注释 + doctor |
| N-05 | ~~🟡~~ ✅ | **`init` 中 `import "@/actions"`** | [x] 2026-06-01 — 相对路径 `../../../../actions/index.*` |
| N-06 | ~~🟡~~ ✅ | **`actions/index.mjs` vs `.ts`** | [x] 2026-06-01 — TS 项目生成 `index.ts` + `ai-ready.config.ts` |
| N-07 | ~~🟡~~ ✅ | **最低 Next.js 版本文档** | [x] 2026-06-01 — installation en/zh；Next 15+ |
| N-08 | ~~🟡~~ ✅ | **Next 14 params 兼容层** | [x] 2026-06-01 — `resolveParams()` + handler 审计 |
| N-09 | ~~🟡~~ ✅ | **`ai-ready.config.ts` 不支持** | [x] 2026-06-01 — jiti 加载 `.ts` config |
| N-10 | ~~🟡~~ ✅ | **dev 模式 stale graph** | [x] 2026-06-01 — `next-ai-ready dev` watch（R-07） |
| N-11 | ~~🟡~~ ✅ | **手动 cache 失效** | [x] 2026-06-01 — `dev` CLI 自动 invalidate + rebuild |
| N-12 | ~~🟡~~ ✅ | **i18n + middleware 与 AI URL** | [x] 2026-06-01 — `guides/i18n-ai-urls.mdx` |
| N-13 | ~~🟡~~ ✅ | **文档声明不支持场景** | [x] 2026-05-31 — README "Known limitations" 涵盖全部 |
| N-14 | ~~🟡~~ ✅ | **optional peer `next` 文档** | [x] 2026-06-01 — installation 导出矩阵 |
| N-15 | 🟢 | **Turbo / monorepo 集成示例** | `turbo.json` 中 `next-ai-ready build` 作为 dependency task |

---

## 4. 文档站（`examples/docs-site`）

### 4.1 框架 dogfood（阻塞验证）

| ID | 优先级 | 项 |
|----|--------|-----|
| D-01 | ~~🔴~~ ✅ | 添加 `ai-ready.config.mjs` | [x] 2026-05-31 — content globs `content/{en,zh}/**/*.mdx` |
| D-02 | ~~🔴~~ ✅ | `next.config` 接入 `withAiReady()` | [x] 2026-05-31 — `.mjs` config（Next.js require() 不支持 ESM-only 包） |
| D-03 | ~~🔴~~ ✅ | `app/%5Fai-ready/**` route stubs | [x] 2026-05-31 — 7 handler stubs + action + MCP routes |
| D-04 | ~~🔴~~ ✅ | `actions/` + demo actions | [x] 2026-05-31 — search_docs, get_page_content, list_api_methods |
| D-05 | ~~🔴~~ ✅ | `next-ai-ready build` 产出 graph + llms.txt | [x] 2026-05-31 — 12 routes, 3 actions, 8 files; prebuild script |
| D-06 | ~~🟡~~ ✅ | `instrumentation.ts` + `instrumentation-node.ts` + hooks subpath | [x] 2026-06-01 — Edge-safe dogfood |
| D-07 | ~~🟡~~ ✅ | 双轨 `lib/docs.ts` | [x] 2026-05-31 — UI 读 MDX 直接，framework 提供 AI 端点 |
| D-08 | ~~🟡~~ ✅ | 验证双语 scanner route 映射 | [x] 2026-05-31 — content 移至 `content/{locale}/`，routes = `/en/introduction` |

### 4.2 内容页面（相对 `pre-docs-site-checklist.md` §6.1）

**英文 + 中文各需补全：**

| ID | 路径 | 状态 |
|----|------|------|
| D-10 | `getting-started/project-structure.mdx` | `[x]` 2026-06-01 |
| D-11 | `concepts/two-planes.mdx` | `[x]` 2026-06-01 |
| D-12 | `concepts/how-it-works.mdx` | `[x]` 2026-06-01 |
| D-13 | `guides/mdx-content.mdx` | `[x]` 2026-06-01 |
| D-14 | `guides/actions.mdx` | `[x]` 2026-06-01 |
| D-15 | `guides/mcp-integration.mdx` | `[x]` 2026-06-01 |
| D-16 | `guides/analytics.mdx` | `[x]` 2026-06-01 |
| D-17 | `guides/robots-txt.mdx` | `[x]` 2026-06-01 |
| D-18 | `api-reference/define-action.mdx` | `[x]` 2026-06-01 |
| D-19 | `api-reference/define-semantic.mdx` | `[x]` 2026-06-01 |
| D-20 | `api-reference/with-ai-ready.mdx` | `[x]` 2026-06-01 |
| D-21 | `api-reference/cli.mdx` | `[x]` 2026-06-01 |
| D-22 | `decisions/adr-index.mdx` | `[x]` 2026-06-01 |

**已有（各 locale）：** introduction, installation, guides/quickstart, concepts/knowledge-plane, concepts/capability-plane, api-reference/config, getting-started/project-structure, concepts/two-planes, concepts/how-it-works, guides/mdx-content, guides/actions, guides/mcp-integration, guides/analytics, guides/robots-txt, api-reference/define-action, api-reference/define-semantic, api-reference/with-ai-ready, api-reference/cli, decisions/adr-index

### 4.3 Demo actions（Capability dogfood）

| ID | 优先级 | Action | 用途 |
|----|--------|--------|------|
| D-30 | ~~🟡~~ ✅ | `search_docs` | [x] 2026-05-31 — docs-site dogfood |
| D-31 | ~~🟡~~ ✅ | `get_page_content` | [x] 2026-05-31 |
| D-32 | ~~🟡~~ ✅ | `list_api_methods` | [x] 2026-05-31 |

### 4.4 文档站元信息

| ID | 优先级 | 项 |
|----|--------|-----|
| D-40 | ~~🟢~~ ✅ | 替换 `examples/docs-site/README.md` | [x] 2026-06-01 |
| D-42 | ~~🟢~~ ✅ | 清理遗留 `content/docs/` | [x] 2026-06-01 |
| D-41 | ~~🟢~~ ✅ | docs-site `package.json` 增加 `prebuild: next-ai-ready build` | [x] 2026-05-31 |

---

## 5. 发布与工程基础设施

| ID | 优先级 | 项 | 状态 |
|----|--------|-----|------|
| E-01 | ~~🔴~~ ✅ | GitHub Actions CI | [x] 2026-05-31 — `.github/workflows/ci.yml`：install → build → test → typecheck + e2e |
| E-02 | ~~🔴~~ ✅ | 外部 e2e 脚本（monorepo 外 create-next-app） | [x] 2026-05-31 — `scripts/e2e-smoke.mjs`：temp dir → init → build → 验证 artifacts |
| E-03 | ~~🟡~~ ✅ | npm publish `@alpha` 并验证可安装 | [x] 2026-06-01 — `@alpha` → `0.1.0-alpha.6`；alpha.7 待发 |
| E-04 | ~~🟡~~ ✅ | Changeset release 流程走通 | [x] 2026-06-01 — `changeset:status` + CONTRIBUTING.md |
| E-05 | ~~🟡~~ ✅ | `pnpm pack --dry-run` 自动化检查 | [x] 2026-06-01 — `scripts/pack-check.mjs` + `pnpm pack:check` |
| E-06 | ~~🟡~~ ✅ | bin 入口 smoke test（meta + next） | [x] 2026-06-01 — `scripts/bin-smoke.mjs` + `pnpm bin:smoke` |
| E-07 | ~~🟡~~ ✅ | handler subpath exports 存在性检查 | [x] 2026-06-01 — `scripts/exports-check.mjs` + `pnpm exports:check` |
| E-08 | ~~🟡~~ ✅ | CONTRIBUTING.md | [x] 2026-06-01 |
| E-09 | ~~🟢~~ ✅ | 更新 `progress.txt` 或标记 deprecated → 指向 backlog | [x] 2026-06-01 |
| E-10 | ~~🟢~~ ✅ | 更新 `roadmap.md` checkbox（Phase 5 交付物） | [x] 2026-06-01 |
| E-11 | ~~🟢~~ ✅ | `REVIEW.md` 顶部加 banner：superseded by completion-audit + backlog | [x] 2026-05-31 |

### pre-docs-site-checklist 逐步状态

| Step | 内容 | 状态 |
|------|------|------|
| 1 | build + test + typecheck | `[x]` |
| 2 | 发布前检查 | `[x]` 2026-06-01 — E-05/E-07 scripts |
| 3 | Changeset 版本 | `[x]` 2026-06-01 — E-04 + alpha6 changeset |
| 4 | npm publish | `[x]` 2026-06-01 — alpha.6 |
| 5 | 外部 e2e | `[x]` 2026-05-31 |
| 6 | 文档站内容架构 | `[x]` 2026-06-01 — D-10～D-22（26 篇 MDX）+ D-06 instrumentation |
| 7 | 文档站 dogfood 开发 | `[x]` 2026-05-31 |

---

## 6. Goals.md — 24 Tactics 深度缺口

> Tactic 功能已实现，但 **doctor / 文档 / 运行时** 未完全兑现的部分。

| Tactic | 缺口 ID | 项 |
|--------|---------|-----|
| K6 | ~~T-01~~ ✅ | [x] 2026-06-01 — doctor 校验 graph 中 `updatedAt` / `author` 覆盖率 |
| K10 | ~~T-02~~ ✅ | [x] 2026-06-01 — doctor 检测 noai meta、robots 冲突、JSON-LD helper |
| K10 | ~~T-03~~ ✅ | [x] 2026-06-01 — doctor 验证 `robots.txt` AI bot 策略 |
| K10 | ~~T-04~~ ✅ | [x] 2026-06-01 — `--json` flag 输出结构化报告 |
| K10 | ~~T-05~~ ✅ | [x] 2026-06-01 — `--score` flag 输出 0–100 AI-readiness 评分 |
| K4 | ~~T-06~~ ✅ | [x] 2026-06-01 — `getPageJsonLd(route)` + `getSiteJsonLd()` 导出（见 R-03） |
| K11 | ~~T-07~~ ✅ | [x] 2026-06-01 — `handlers/ai-plugin.ts` + rewrite + `emitAiRequest` |

---

## 7. 测试缺口

| ID | 优先级 | 项 | 包 |
|----|--------|-----|-----|
| X-01 | ~~🟡~~ ✅ | `init → build → handler` 端到端 | [x] 2026-06-01 — `test/e2e-pipeline.test.ts` |
| X-02 | ~~🟡~~ ✅ | `load-config.ts` 单测 | [x] 2026-06-01 — `test/load-config.test.ts` |
| X-03 | ~~🟡~~ ✅ | `mcp-stdio.ts` | [x] 2026-06-01 |
| X-04 | ~~🟡~~ ✅ | `meta` 包 exports 测试 | [x] 2026-06-01 |
| X-05 | ~~🟡~~ ✅ | llms.txt snapshot 回归 | [x] 2026-06-01 |
| C-02 | ~~🟡~~ ✅ | ESLint + CI lint job | [x] 2026-06-01 |
| K10 | ~~T-02~~ ✅ | doctor noai / JSON-LD / robots | [x] 2026-06-01 |
| X-05 | ~~🟢~~ ✅ | artifact snapshot（openapi, tools.json, ai-plugin） | [x] 2026-06-01 |
| X-06 | ~~🟢~~ ✅ | chunk overlap 边界 | [x] 2026-06-01 — `mdx/test/chunks.test.ts` |
| X-07 | ~~🟢~~ ✅ | MCP HTTP auth 单元测试 | [x] 2026-06-01 — `mcp-auth.test.ts` |

**已修复（勿重复开项）：** core 工具测试、withAiReady 测试、循环依赖、openapi observability。

---

## 8. 代码质量与技术债（REVIEW.md 剩余 + 代码审计）

### 8.1 Monorepo / 包结构

| ID | 优先级 | 项 | 文件/位置 |
|----|--------|-----|-----------|
| C-01 | ~~🟡~~ ✅ | 双 `bin` 入口 | [x] 2026-06-01 — README + installation 说明 |
| C-02 | ~~🟡~~ ✅ | ESLint + CI lint | [x] 2026-06-01 |
| C-03 | ~~🟢~~ ✅ | `meta` 包 test script | [x] — vitest + exports.test.ts |
| C-04 | ~~🟢~~ ✅ | `@next-ai-ready/core/scanner` subpath | [x] 2026-06-01 |
| C-11 | ~~🟢~~ ✅ | `ActionsModulePath` branded type | [x] 2026-06-01 — `actionsModulePath()` |
| C-20 | ~~🟢~~ ✅ | `compile()` sync | [x] — sync fn; async only for I/O in build |
| C-31 | ~~🟢~~ ✅ | `absoluteUrl()` in core | [x] — `@next-ai-ready/core/url` |
| C-72 | ~~🟢~~ ✅ | MCP URI 映射 | [x] 2026-06-01 — `mcpPageUri()` / `routeFromMcpPageUri()` |
| C-81 | ~~🟢~~ ✅ | Handler JSDoc | [x] — module docs on all handlers |

### 8.2 core

| ID | 优先级 | 项 |
|----|--------|-----|
| C-10 | ~~🟢~~ ✅ | `_relative` export 已移除 |
| C-11 | 🟢 | `AiReadyConfig.actions` branded type | 可选 |

### 8.3 mdx

| ID | 优先级 | 项 |
|----|--------|-----|
| C-20 | 🟢 | `compile()` 同步但 build CLI `await` — 去掉误导性 await 或改 async |
| C-21 | 🟢 | chunk overlap 测试（见 X-06） |

### 8.4 semantic

| ID | 优先级 | 项 |
|----|--------|-----|
| C-30 | ~~🟡~~ ✅ | `getPageNodes()` 递归 descendants | [x] 2026-06-01 |
| C-31 | 🟢 | `absoluteUrl()` 提取到 core | 可选 |

### 8.5 llms

| ID | 优先级 | 项 |
|----|--------|-----|
| C-40 | 🟢 | `globToRegex()` 语义未文档化 |
| C-41 | 🟢 | `byMostRecent` tie-breaker 可缓存（极 minor） |

### 8.6 actions

| ID | 优先级 | 项 |
|----|--------|-----|
| C-50 | ~~🟡~~ ✅ | `isZodSchema()` | [x] 2026-06-01 |
| C-51 | ~~🟢~~ ✅ | `extractZodIssues()` | [x] 2026-06-01 |
| C-52 | ~~🟡~~ ✅ | Zod v4 only | [x] 2026-06-01 |

### 8.7 openapi

| ID | 优先级 | 项 |
|----|--------|-----|
| C-60 | ~~🟢~~ ✅ | `buildToolsJson()` | [x] 2026-06-01 |
| C-61 | ~~🟢~~ ✅ | `buildAiPlugin()` contact_email | [x] 2026-06-01 |

### 8.8 mcp

| ID | 优先级 | 项 |
|----|--------|-----|
| C-70 | ~~🟡~~ ✅ | stdio auth-gated actions 文档 | [x] 2026-06-01 |
| C-71 | ~~🟢~~ ✅ | MCP 参数命名注释 | [x] 2026-06-01 |
| C-72 | 🟢 | MCP URI 映射去重 | 可选 refactor |

### 8.9 next

| ID | 优先级 | 项 |
|----|--------|-----|
| C-80 | ~~🟢~~ ✅ | `importSdkStdio` try/catch | [x] 2026-06-01 |
| C-81 | 🟢 | Handler JSDoc | 可选 |
| C-82 | ~~🟡~~ ✅ | load-config `.ts` | [x] 2026-06-01 |

---

## 9. 文档与 README 维护

| ID | 优先级 | 项 |
|----|--------|-----|
| M-01 | ~~🟡~~ ✅ | README / README.zh-CN：测试数 → **124** | [x] 2026-06-01 |
| M-02 | ~~🟡~~ ✅ | README：pre-alpha 限制清单（Zod v4、Next 版本、无 static export） | [x] 2026-05-31 |
| M-03 | ~~🟡~~ ✅ | installation 文档：Zod v4 peer 要求 | [x] 2026-05-31 |
| M-04 | ~~🟡~~ ✅ | MCP Claude Desktop / Cursor 连接 snippet | [x] 2026-06-01 — `guides/mcp-integration.mdx` en/zh |
| M-05 | ~~🟡~~ ✅ | `architecture.md` CORS 描述与代码对齐（实现或删） | [x] 2026-06-01 — 删除未实现的 CORS 承诺 |
| M-06 | ~~🟢~~ ✅ | 包级 README 内容充实 | [x] 2026-06-01 |
| M-07 | ~~🟢~~ ✅ | `docs/research.md` 竞品信息更新 | [x] 2026-06-01 — alpha.6 状态 |

---

## 10. Phase 6 — Post-MVP 候选（设计完成 ⬜ 实现未排期）

> 详细设计：[`phase6-design.md`](./phase6-design.md)。实现仍为 post-MVP。

| ID | 项 | 说明 |
|----|-----|------|
| P6-01 | LLM-backed `SemanticProvider` | ✅ `enrich` + `summarize` at build |
| P6-02 | Content source adapters | ✅ `defineContentSource()` |
| P6-03 | Embedding-ready chunks | ✅ `semantic.embeddings.provider` |
| P6-04 | Edge runtime port | ✅ fetch loader; full Edge handlers TBD |
| P6-05 | Rate-limit / auth recipes | ✅ `examples/recipes/upstash-ratelimit` |
| P6-06 | Multi-language SemanticGraph | ✅ `locale` + `routesByLocale` |
| P6-07 | Tool manifest preview UI | ✅ `examples/tool-preview` |

---

## 11. 明确 Out of Scope（🚫 勿提案）

来源：roadmap + goals.md

- Hosted SaaS / dashboard / analytics service
- Vector DB / built-in retrieval
- Chatbot UI
- Browser automation / scraping
- CMS
- Pages Router

---

## 12. 优先级 ↔ ID 快速索引

### P0（发布 alpha 前）— ✅ 2026-06-01 全部完成

| Audit # | Backlog IDs | 状态 |
|---------|-------------|------|
| 1 URL 统一 | U-01～U-04 | ✅ |
| 2 init 增强 | N-01, N-02 | ✅ |
| 3 docs-site dogfood | D-01～D-05, D-07, D-08, D-30～D-32 | ✅ |
| 4 CI | E-01 | ✅ |
| 5 e2e | E-02 | ✅ |
| — npm alpha | E-03, R-04 | ✅ alpha.3 |

### P1（0.1 前）— ✅ 2026-06-01 全部完成

| Audit # | Backlog IDs |
|---------|-------------|
| 6 文档内容 | D-10 – D-22, D-06 ✅ |
| 7 demo actions | D-30 – D-32 ✅ |
| 8 Doctor 增强 | T-01～T-06, U-05, R-05 ✅ |
| 9 aiRobots | R-06 ✅ |
| 10 npm | E-03, E-04 ✅ |
| 11 README | M-01, M-02 ✅ |
| 12 Zod | C-52, M-03 ✅ |
| 13–17 | R-01～R-03, N-07, D-06 ✅ |

### P2（0.1 后）— ✅ 2026-06-01 全部完成

R-05～R-07, R-09～R-10, N-05～N-06, N-09～N-11, X-01～X-05, C-02, E-08

**当前主战场：** 0.1 GA（见 [`ga-readiness.md`](./ga-readiness.md)）+ [`post-ga.md`](./post-ga.md) 排队

---

## 13. Post-GA 产品与 DX

> 完整说明与优先级 → **[`post-ga.md`](./post-ga.md)**。实现时在本节登记 ID。

| ID | 项 | 优先级 |
|----|-----|--------|
| PG-01 | 单轨 docs 模板（create-next-ai-ready） | P1 |
| PG-02 | Locale-aware llms.txt 分区 | P1 |
| PG-03 | HTTP actions 全局鉴权 recipe / 可选 env gate | P1 |
| PG-04 | `doctor --check-artifacts` 通用化 | P1 |
| PG-05 | npm `0.1.0` GA tag（非 @alpha） | P1 |
| PG-06 | ContentSource / CMS 适配器产品化 | P2 |
| PG-07 | SemanticProvider LLM enrich | P2 |
| PG-08 | 更简 onboarding（doctor --fix） | P2 |
| PG-09 | UI 完整 MDX 或官方 docs 栈指引 | P2 |
| PG-10 | Edge Knowledge handlers 完整移植 | P2 |
| PG-11 | MCP 按 locale 过滤 resources | P2 |
| PG-12～PG-17 | 见 post-ga.md | P3 |

---

## 14. 统计摘要

| 类别 | 未完成项（约） |
|------|----------------|
| Roadmap / 集成 / 测试 / 文档 | **0**（blocking） |
| 代码质量 🟢 细项 | 0 |
| Phase 6 实现 | 0（foundation ✅） |
| **合计 blocking** | **0** |

**P0–P2、alpha.6 发布、backlog 清零批次均已完成**（2026-06-01）。

---

## 15. 变更 log

| 日期 | 变更 |
|------|------|
| 2026-06-02 | GA 文档：`ga-readiness.md`、`post-ga.md`、`docs/README.md`；adopter UX alpha.10；action-auth recipe |
| 2026-06-01 | alpha.7 backlog 清零：AiReadyError, ai-plugin handler, snapshots, i18n/peer docs, Phase 6 design |
| 2026-06-01 | alpha.4 bump；e2e-smoke + doctor；E-06 bin-smoke；CI release checks |
| 2026-06-01 | D-10～D-22 文档内容 ✅；PR-5/PR-6 完成（R-01/R-02/R-03/R-06/D-06/U-05/T-*）；测试 97→109 |
| 2026-06-01 | alpha.3 发布：R-04/E-03 ✅；D-30～D-32、D-41、E-11 ✅；P0 全部完成 |
| 2026-05-31 | 初版：从 completion-audit、REVIEW、roadmap、pre-docs-site-checklist 合并补齐 |
