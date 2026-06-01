# next-ai-ready 完成度审视

> **审查视角：** 以 Next.js 生态作者的标准审视——不仅看「功能有没有写」，更看「Next 开发者能否在 10 分钟内跑通、部署后不踩坑、与 App Router / Turbopack / Serverless 部署模型是否一致」。
>
> **审查日期：** 2026-06-01（alpha.7 + docs-site dogfood 同步）  
> **当前版本：** 仓库 `0.1.0-alpha.7`；npm `@alpha` 最新为 `0.1.0-alpha.6`（alpha.7/8 待发）  
> **测试状态：** 146 tests / 9 packages

### 相关文档（分工）

| 文档 | 用途 |
|------|------|
| **本文 `completion-audit.md`** | 完成度评估、P0–P2 **行动摘要**、0.1 DoD |
| **[`backlog.md`](./backlog.md)** | **完整**待办 + 技术债 + Phase 6（~110+ 跟踪项，single source of truth） |
| [`roadmap.md`](./roadmap.md) | 分阶段交付计划（Phase 0 checkbox 已同步） |
| [`pre-docs-site-checklist.md`](./pre-docs-site-checklist.md) | 发布与文档站前置步骤 |
| [`REVIEW.md`](../REVIEW.md) | 2025-07 代码审查（**已过时**，见附录 A） |

> 问「还有没有漏的？」→ 查 **`backlog.md`**。问「下一步先做什么？」→ 查 **本文 §8–11**。

---

## 1. 执行摘要

`next-ai-ready` 的**核心架构已经成立**：Knowledge + Capability 双平面、build-time 产物 + runtime handler 分离、与 bundler 解耦——这是正确的 Next.js 集成方向，和 Turbopack / Webpack 都能共存。

**框架代码本身约 95% 完成**；**作为可推荐给早期用户的产品约 93% 完成**。P0 + P1 + P2 均已完成。

**剩余差距**主要在：

1. **0.1 GA** — 可选 10 分钟 UX 手验（见 CONTRIBUTING.md）
2. **Phase 6 实现** — 设计见 `docs/phase6-design.md`
3. **可选 refactor** — C-04/C-11/C-31/C-72 等 🟢 细项

**结论：** **可对外推荐 `next-ai-ready@alpha` 给早期 adopter**；下一里程碑：**0.1 GA** 或 Phase 6 首项（P6-06 i18n graph）。

---

## 2. Roadmap 阶段对照

| 阶段 | 目标 | 状态 | 完成度 | 备注 |
|------|------|------|--------|------|
| **Phase 0** | Monorepo 骨架 | ✅ 完成 | ~95% | CI + e2e 已有（E-01/E-02） |
| **Phase 1** | Knowledge 核心 | ✅ 完成 | 100% | MDX → Graph → JSON-LD |
| **Phase 2** | llms.txt + Next 集成 | ✅ 完成 | ~98% | docs-site 已 dogfood；`@alpha` → alpha.3 |
| **Phase 3** | Capability 平面 | ✅ 完成 | ~95% | `examples/ecommerce` ✅ |
| **Phase 4** | MCP Server | 🟡 基本完成 | ~90% | HTTP + stdio + token auth ✅ |
| **Phase 5** | DX + Doctor + 文档站 | ✅ 完成 | ~98% | R-08 友好错误 ✅ |
| **Phase 6** | Post-MVP foundation | ✅ 已交付 | 100% | P6-01～P6-07 foundation；Edge handler 完整移植仍 future |

### Phase 5 细项（Roadmap 原文 vs 现状）

| 交付物 | 状态 | 说明 |
|--------|------|------|
| `next-ai-ready doctor` | ✅ | 基础检查：config、actions、graph、route stubs |
| `aiRobots()` for `app/robots.ts` | ✅ | 2026-06-01 — `aiRobots(site, config)` 导出 from core + next |
| `next-ai-ready dev`（watch） | ✅ | 2026-06-01 — `cli/dev.ts`（chokidar + cache invalidate） |
| 友好错误信息 | ✅ | 2026-06-01 — `AiReadyError` + action items |
| 文档站 dogfood | ✅ | 2026-05-31 — config + withAiReady + handlers + 3 demo actions + prebuild |
| `npm create next-ai-ready` | ✅ | 2026-06-01 — `packages/create-next-ai-ready` |
| Doctor 对照 24 tactics 评分 | ✅ | 2026-06-01 — `cli/tactics.ts`；`--score` + `--json` |
| MCP `/api/mcp` production token gate | ✅ | 2026-06-01 — `NEXT_AI_READY_MCP_TOKEN` env gate + doctor 检查 |
| `withAiReady()` CORS headers | ✅ | 2026-06-01 — 删除未实现承诺（JSDoc + architecture.md） |
| JSON-LD 注入 HTML 页面 helper | ✅ | 2026-06-01 — `getPageJsonLd(route)` + `getSiteJsonLd()` 导出 |
| Phase 2「First public alpha tag」 | ✅ | `@alpha` → `0.1.0-alpha.6`（2026-06-01，npm smoke 通过） |

> 上表 Phase 5 以外漏项的完整 ID 与细节 → [`backlog.md` §1](./backlog.md#1-roadmap-声称完成但实际漏做)

---

## 3. Goals.md — 24 Tactics 完成对照

> 来源：[`docs/goals.md`](./goals.md)。这是框架「该不该 ship」的功能验收清单。

### Knowledge 平面（K1–K12）

| # | Tactic | 状态 | 实现位置 / 缺口 |
|---|--------|------|-----------------|
| K1 |  hand-curated `llms.txt` | ✅ | `@next-ai-ready/llms` |
| K2 | `/<route>.md` | ✅ | handler + rewrite（需 `withAiReady()`） |
| K3 | `/<route>.ai.json` | ✅ | handler + rewrite |
| K4 | JSON-LD | ✅ | `@next-ai-ready/semantic` |
| K5 | 稳定 URL anchor | ✅ | `github-slugger` sectionize |
| K6 | `updatedAt` / `author` / `reviewedBy` | ✅ | 2026-06-01 — doctor 校验 graph 中覆盖率 |
| K7 | Token-aware chunking | ✅ | `chunkSections()` |
| K8 | FAQ 提取 | ✅ | frontmatter + heuristic |
| K9 | `robots.txt` 允许 AI bot | ✅ | `buildRobotsTxt()` → `public/` |
| K10 | doctor 检测 noai / GPTBot / JSON-LD | ✅ | 2026-06-01 — robots.txt、noai meta、JSON-LD helper、score + JSON report |
| K11 | `onAiRequest` 分析钩子 | ✅ | knowledge handlers + observability |
| K12 | MDX → clean Markdown | ✅ | `renderMarkdown()` |

### Capability 平面（C1–C12）

| # | Tactic | 状态 | 实现位置 / 缺口 |
|---|--------|------|-----------------|
| C1 | `defineAction` + Zod | ✅ | `@next-ai-ready/actions` |
| C2 | `whenToUse` / `whenNotToUse` | ✅ | doctor 对 public action 有 warn |
| C3 | OpenAPI 3.1 | ✅ | `@next-ai-ready/openapi` |
| C4 | `/tools.json` | ✅ | 静态 + handler |
| C5 | `/.well-known/ai-plugin.json` | ✅ | 静态产物 |
| C6 | MCP HTTP + stdio | ✅ | `@next-ai-ready/mcp` + handlers |
| C7 | 默认 deny（`public: false`） | ✅ | ADR-010 已实现 |
| C8 | 调用钩子 | ✅ | `onInvoke` in action handler |
| C9 | `x-ai-examples` | ✅ | OpenAPI extensions |
| C10 | 严格 input 校验 | ✅ | `safeParse` + 结构化错误 |
| C11 | `server-only` | ✅ | handler 入口 |
| C12 | MCP resources（页面 markdown） | ✅ | `airead://page/...` |

**Tactics 汇总：** 24/24 ✅

---

## 4. Next.js 作者视角 — 集成专项审查

这是本审视的核心：从「Next 开发者真实使用路径」出发，逐项检查框架是否与 App Router 生态一致。

### 4.1 ✅ 做对了的事

| 决策 | 为什么对 |
|------|----------|
| **Build-time JSON 产物 + runtime 只读** | 不耦合 bundler；Turbopack / Webpack 无差别 |
| **`withAiReady()` 只做 rewrites + file tracing** | 符合 ADR-006「最小侵入」 |
| **Handler 一律 `export const runtime = "nodejs"`** | 读 `.next-ai-ready/*.json` 需要 Node fs |
| **`outputFileTracingIncludes`** | Serverless 部署时 graph/manifest 不会丢 |
| **Route Handler 薄 re-export 模式** | 用户可覆盖、可审计，符合 App Router 惯例 |
| **Action handler 兼容 `params: Promise<>`** | Next 15+ async params 已处理 |
| **`withAiReady()` 已支持 `{ beforeFiles, afterFiles, fallback }`** | REVIEW.md 中的旧问题已修复 |
| **`init` 自动 patch next.config + package.json** | 2026-05-31 — `patchNextConfig()` + `patchPackageJson()` |
| **OpenAPI / tools canonical URL 统一** | `/openapi.json`、`/tools.json`；`/api/*` 为 alias |
| **docs-site dogfood + 3 demo actions** | 12 routes、MCP/actions 可调用 |
| **CI + 外部 e2e + npm `@alpha`** | `.github/workflows/ci.yml`、`e2e-smoke.mjs`、alpha.3 已发布 |

### 4.2 🔴 集成缺口（仍会导致用户踩坑）

> **已修复（2026-05-31）：** init 不写 next.config / package.json（N-01/N-02 ✅）；OpenAPI/tools URL 不一致（U-01～U-03 ✅）。以下仍为缺口。

#### A. `init` 仍不完整 — 次要 onboarding 项

`init` 已自动 patch `next.config`、`package.json`，并 scaffold `instrumentation.ts`、相对路径 actions、TS 项目 `ai-ready.config.ts`。**仍待：**

- N-12：i18n + middleware 与 AI URL 策略文档
- N-14：optional peer `next` 导出矩阵说明

#### B. ~~OpenAPI / tools URL 不一致~~ ✅ 已修复

canonical = `/openapi.json`、`/tools.json`；`buildAiPlugin()` 默认已改。Doctor 仍不校验 URL 可达性（U-05，P1）。

#### C. 构建与 dev 体验

- `next-ai-ready build` 是**独立 CLI**；`init` 已写入 prebuild 链
- ✅ `next-ai-ready dev` watch — content 改动自动 rebuild + cache invalidate（R-07）
- dev 模式下 handler 读 `.next-ai-ready/graph.json`；**不 rebuild 则 stale**（用 `dev` 或手动 rebuild）

#### D. i18n / Middleware 未纳入设计

`examples/docs-site` 的 middleware 将无 locale 前缀的路径重定向到 `/en/...`，matcher 排除 `.*\\..*`（带点路径）。

**影响：**

- SemanticGraph **无 locale 维度**（Phase 6 才规划）
- 多语言站点的 `/<route>.md` URL 策略未定义
- middleware 可能干扰 AI 友好 URL（需文档说明如何 exclude `/_ai-ready/*` 和 `*.md`）

#### E. ~~架构文档承诺但未实现的项~~ ✅ 已全部解决（2026-06-01）

| 项 | 说明 |
|----|------|
| **MCP production auth** | ✅ 2026-06-01 — `handlers/mcp.ts` 实现 `NEXT_AI_READY_MCP_TOKEN` gate |
| **CORS headers** | ✅ 2026-06-01 — 删除未实现承诺（JSDoc + architecture.md） |
| **JSON-LD in HTML** | ✅ 2026-06-01 — `getPageJsonLd(route)` + `getSiteJsonLd()` 导出 |

#### F. 明确不支持的场景（需文档声明，非 bug）

| 场景 | 现状 |
|------|------|
| Pages Router | 明确 out of scope |
| `output: 'export'` 静态导出 | 未测试；action/MCP handler 不可用 |
| Edge Runtime | 所有 handler 强制 nodejs |
| MCP stdio + auth-gated actions | synthetic Request 无法过 auth |
| Zod v3 用户 | 框架依赖 Zod v4 `z.toJSONSchema()` |

### 4.3 🟡 集成改进项（不阻塞 alpha）

| 项 | 说明 |
|----|------|
| ~~`ai-ready.config.ts` 不支持~~ | ✅ N-09 — jiti 加载 `.ts` config |
| ~~`init` 中 `import "@/actions"`~~ | ✅ N-05 — 相对路径 `../../../../actions/index.*` |
| ~~`actions/index.mjs` vs `.ts`~~ | ✅ N-06 — TS 项目生成 `.ts` |
| 双 `bin` 入口 | `next-ai-ready`（meta）和 `@next-ai-ready/next` 都声明 bin — 需文档（C-01） |
| ~~无 lint CI~~ | ✅ C-02 — `eslint.config.js` + CI lint |
| N-12 i18n / middleware | 多语言 SemanticGraph 仍 Phase 6 |
| N-14 optional peer 文档 | handler 需 Next + `server-only`；CLI 不需要 |

→ 完整代码质量项（REVIEW 剩余 ~22 条）→ [`backlog.md` §8](./backlog.md#8-代码质量与技术债reviewmd-剩余--代码审计)

---

## 5. 文档站（`examples/docs-site`）审视

文档站框架集成（2026-05-31）与规划内容（2026-06-01）均已完成。剩余为示例与清理项。

### 5.1 已有

- Next.js 16 App Router + Tailwind 4 + 中英 i18n UI
- **框架 dogfood：** `ai-ready.config.mjs`、`withAiReady()`、`app/_ai-ready/**`、3 demo actions、`prebuild: next-ai-ready build`
- **19 篇/语言 MDX**（en/zh 各 19）：含 D-10～D-22 guides + api-reference + 原有 6 篇
- **双轨架构（D-07）：** UI 读 MDX；AI 端点走 framework build（routes + actions in graph）
- content 在 `content/{locale}/**`，scanner route 映射已验证（D-08）

### 5.2 缺失

**框架集成：**

- [x] `instrumentation.ts` + `instrumentation-node.ts` + `next-ai-ready/hooks`（D-06）— docs-site dogfood + init scaffold

**清理 / 元信息（🟢）：**

- [x] 删除遗留 `content/docs/`（D-42）
- [x] 替换 docs-site README（D-40）

**示例项目（P2）：**

- [x] `examples/ecommerce`（Phase 3 roadmap）— 2026-06-01

### 5.3 架构说明

文档站采用 **双轨**：站点 UI 仍用 `lib/docs.ts` 读 MDX（快速迭代文档排版）；Knowledge/Capability 端点由 `next-ai-ready build` 驱动，与生产用户路径一致。双语 content 在 `content/{locale}/` 下，SemanticGraph **尚无 locale 维度**（Phase 6 P6-06）。

---

## 6. 发布与工程基础设施

| 项 | 状态 | 说明 |
|----|------|------|
| 版本号 | ✅ | 全包 `0.1.0-alpha.7`（monorepo）；npm `@alpha` 待 publish |
| Changesets | ✅ | `.changeset/alpha8-phase6-foundation.md` + `pnpm changeset:status` |
| npm publish | 🟡 | registry `@alpha` → `0.1.0-alpha.6`；alpha.7 代码已就绪，待 `verify:release` + publish |
| GitHub Actions CI | ✅ | `.github/workflows/ci.yml` |
| 外部 e2e 验证 | ✅ | `scripts/e2e-smoke.mjs` |
| CONTRIBUTING.md | ✅ | 2026-06-01 |
| LICENSE | ✅ | MIT |
| 包 README | ✅ | 9 包均有 README.md |

### pre-docs-site-checklist 进度

| Step | 内容 | 状态 |
|------|------|------|
| 1 | 全量 build + test | ✅ 124 tests green |
| 2 | 发布前检查 | ✅ E-05/E-07 scripts（2026-06-01） |
| 3 | Changeset 版本 | ✅ E-04 — `changeset:status` + alpha6 changeset |
| 4 | npm publish | ✅ 2026-06-01 — alpha.6 |
| 5 | 外部 Next app e2e | ✅ 2026-05-31 |
| 6 | 文档站内容架构 | ✅ 2026-06-01 — D-10～D-22 |
| 7 | 文档站 dogfood 开发 | ✅ 2026-05-31 |

---

## 7. 测试与质量

### 7.1 当前覆盖（138 tests）

| 包 | Tests | 覆盖重点 |
|----|-------|----------|
| `@next-ai-ready/next` | 50 | build、init、doctor、tactics、errors、mcp-auth、load-config、e2e |
| `@next-ai-ready/openapi` | 11 | openapi + tools + ai-plugin + snapshots |
| `@next-ai-ready/mdx` | 10 | compile + chunk overlap |
| `@next-ai-ready/core` | 34 | stableId、scanner、config、bots、robots、aiRobots |
| `@next-ai-ready/actions` | 11 | security + manifest + invoke |
| `@next-ai-ready/semantic` | 6 | graph + JSON-LD + recursive getPageNodes |
| `@next-ai-ready/llms` | 7 | renderers + llms snapshot |
| `@next-ai-ready/mcp` | 6 | tools + resources + register |
| `next-ai-ready` (meta) | 3 | re-export surface |

### 7.2 仍缺的测试

| 优先级 | 缺口 |
|--------|------|
| — | 无 P0–P2 测试缺口 |
| P3 | 可选 refactor 测试（C-* 细项） |

> 注：X-01/X-02/X-03/X-04 已于 2026-06-01 完成（e2e-pipeline、load-config、mcp-stdio、meta exports）。REVIEW.md 以本文为准。

---

## 8. 剩余工作清单（按优先级）

### P0 — 发布 alpha 前必须完成 ✅（2026-06-01 全部完成）

| # | 任务 | 状态 | 完成日期 |
|---|------|------|----------|
| 1 | 统一 OpenAPI / tools URL | ✅ | 2026-05-31 |
| 2 | 增强 `init` codemod | ✅ | 2026-05-31 |
| 3 | 文档站 dogfood 接入 | ✅ | 2026-05-31 |
| 4 | GitHub Actions CI | ✅ | 2026-05-31 |
| 5 | 外部 e2e 脚本 | ✅ | 2026-05-31 |
| — | npm publish `@alpha` alpha.3 | ✅ | 2026-06-01 |

### P1 — 0.1 发布前应完成

| # | 任务 | 预估 | 验收标准 | 状态 |
|---|------|------|----------|------|
| 6 | 补全文档站内容（至 checklist 规划） | 2–3d | 核心 guides + api-reference 齐全 | ✅ 2026-06-01 — 26 篇 MDX（en/zh 各 13），build 通过 |
| 7 | 文档站 demo actions | — | search_docs / get_page_content / list_api_methods 可 MCP 调用 | ✅ 2026-05-31 |
| 8 | Doctor 增强 | 1d | withAiReady、build script、openapi URL 可达 | ✅ 2026-06-01 — next.config、package.json、openapi.json、robots.txt、updatedAt/author、score、JSON report |
| 9 | `aiRobots()` helper | 0.5d | 供 `app/robots.ts` 动态生成 | ✅ 2026-06-01 — R-06 |
| 10 | npm publish `@alpha` + 验证 | — | 外部 `pnpm add next-ai-ready@alpha` | ✅ 2026-06-01 |
| 11 | 更新 README 测试数 / 状态 | — | 114 tests；pre-alpha 限制 | ✅ 2026-06-01 |
| 12 | Zod v4 要求文档化 | — | README + installation | ✅ 2026-05-31 |
| 13 | MCP production token auth | 1d | backlog R-01 | ✅ 2026-06-01 |
| 14 | CORS 实现或删文档承诺 | 0.5d | backlog R-02 | ✅ 2026-06-01 |
| 15 | JSON-LD 页面 helper | 1d | backlog R-03 | ✅ 2026-06-01 |
| 16 | 最低 Next.js 版本文档 | 0.5h | backlog N-07 | ✅ 2026-06-01 — installation en/zh |
| 17 | `instrumentation.ts` 示例 | 0.5d | backlog D-06 | ✅ 2026-06-01 — docs-site + init scaffold (N-03) |

### P2 — 0.1 后可跟进

| # | 任务 | 预估 | backlog ID |
|---|------|------|------------|
| 18 | `next-ai-ready dev` watch CLI | 1d | R-07 | ✅ 2026-06-01 |
| 19 | `ai-ready.config.ts` 支持（jiti） | 0.5d | N-09 | ✅ 2026-06-01 |
| 20 | `npm create next-ai-ready` 脚手架 | 1d | R-10 | ✅ 2026-06-01 |
| 21 | `examples/ecommerce` | 1d | R-09 | ✅ 2026-06-01 |
| 22 | Doctor 24-tactic 评分 + JSON 报告 | 2d | R-05 | ✅ 2026-06-01 |
| 23 | ESLint + lint CI | 0.5d | C-02 | ✅ 2026-06-01 |
| 24 | artifact snapshot 测试 | 0.5d | X-05 | ✅ 2026-06-01 |
| 25 | CONTRIBUTING.md | 0.5d | E-08 | ✅ 2026-06-01 |
| 26 | Changeset release 流程 | 0.5d | E-04 | ✅ 2026-06-01 — `changeset:status` + config fix |
| 27 | init→build→handler 测试 | — | X-01 | ✅ 2026-06-01 |
| 28 | load-config 单测 | — | X-02 | ✅ 2026-06-01 |

> P2 完整列表（含 REVIEW 每条 🟢 优化）→ [`backlog.md` §8–10](./backlog.md)

---

## 9. 0.1 发布 Definition of Done

当以下全部满足时，可以对外发布 **0.1.0**：

- [x] 新用户单包安装：`pnpm add next-ai-ready@alpha` → `init` → `build` → `doctor` exit 0 — 2026-06-01
- [x] 可选：`create-next-app` + dev + curl — 手验步骤见 CONTRIBUTING.md
- [x] `examples/docs-site` 完全 dogfood 框架（2026-05-31）
- [x] 文档站内容至 checklist 规划（2026-06-01 — D-10～D-22）
- [x] OpenAPI / ai-plugin / tools URL **一致且可访问**（2026-05-31）
- [ ] CI green on every PR（流程项）
- [x] npm `@alpha` → **0.1.0-alpha.6**（2026-06-01，`USE_NPM=1 external:smoke` 通过）
- [x] 已知限制 documented（2026-05-31）

---

## 10. 总体完成度估算

```
┌─────────────────────────────────────────────────────────┐
│  框架核心（Phase 0–4）          ████████████████████░  96% │
│  DX / CLI（Phase 5 框架部分）   ███████████████████░░  93% │
│  文档站 dogfood + 内容          ████████████████████░  92% │
│  发布就绪（CI / npm / e2e）     ███████████████████░░  95% │
│  ─────────────────────────────────────────────────────  │
│  整体 MVP（→ 0.1 出口）         ███████████████████░░  94% │
└─────────────────────────────────────────────────────────┘
```

---

## 11. 建议的下一步（最短路径 → 0.1）

P0、P1、P2 与 alpha.6 发布均已完成（2026-06-01）。**alpha.7**（hooks subpath、Edge-safe instrumentation、docs-site 同步）代码已合并，待发 npm。

**下一步（→ 0.1 GA）：**

1. 可选 10 分钟 UX 手验：`create-next-app` → init → dev → curl `/llms.txt`
2. R-08 友好错误信息（可选）
3. 文档同步 backlog 剩余 🟢 技术债按优先级排期

---

## 附录 A — 与 REVIEW.md 的差异

| REVIEW.md 项 | 2026-05-31 状态 |
|--------------|-----------------|
| mdx ↔ semantic 循环依赖 | ✅ 已修复 |
| core 工具无测试 | ✅ 已有 24 tests |
| withAiReady object form | ✅ 已支持 + 6 tests |
| openapi handler 无 observability | ✅ 已加 emitAiRequest |
| meta 包 hollow | ✅ 已 re-export defineAction/withAiReady |
| 测试总数 61 | 现为 **124** |

---

## 附录 B — 关键文件索引

| 文件 | 作用 |
|------|------|
| **`docs/backlog.md`** | **完整待办 + 技术债（本文的补充）** |
| `packages/next/src/cli/init.ts` | init codemod（已增强 patchNextConfig + patchPackageJson） |
| `packages/next/src/cli/doctor.ts` | 预检 CLI（待增强 T-*、U-05） |
| `packages/openapi/src/ai-plugin.ts` | ai-plugin URL 默认值（已改为 `/openapi.json`） |
| `examples/docs-site/` | 文档站（已 dogfood；内容 ~30%） |
| `docs/pre-docs-site-checklist.md` | 发布 + 文档站前置清单 |
| `docs/roadmap.md` | 分阶段交付计划 |
| `progress.txt` | 开发进度日志（部分过时，见 backlog E-09） |

---

## 附录 C — REVIEW.md 全量对照

> `REVIEW.md`（2025-07-15）共 ~40 条发现。下表为**当前状态**；未列出的 🟢 细项见 [`backlog.md` §8](./backlog.md#8-代码质量与技术债reviewmd-剩余--代码审计)。

| REVIEW # | 原严重度 | 项 | 现状 |
|----------|----------|-----|------|
| 1.1 | 🔴 | mdx ↔ semantic 循环依赖 | ✅ 已修复 |
| 1.2 | 🟡 | meta 包 hollow | ✅ 已 re-export |
| 1.3 | 🟡 | 双 bin 入口 | 🟡 backlog C-01 — 需文档 |
| 1.4 | 🟡 | 无 lint scripts | ✅ C-02 — ESLint + CI |
| 2.1–2.3 | 🟡/🟢 | core 拆分 / _relative / any | ❌ backlog C-04, C-10, C-11 |
| 3.1–3.2 | 🟡/🟢 | compile await / chunk overlap | ❌ backlog C-20, X-06 |
| 4.1–4.2 | 🟡/🟢 | getPageNodes / absoluteUrl | ❌ backlog C-30, C-31 |
| 5.1–5.2 | 🟡/🟢 | globToRegex / byMostRecent | ❌ backlog C-40, C-41 |
| 6.1–6.3 | 🟡/🟢 | Zod v4 / isZodSchema | 🟡 部分 — backlog C-50–52, M-03 |
| 7.1–7.2 | 🟢 | buildToolsJson / buildAiPlugin | ❌ backlog C-60, C-61 |
| 8.1–8.3 | 🟡/🟢 | MCP naming / stdio auth / dup | ❌ backlog C-70–72 |
| 9.1–9.2 | 🟡 | openapi/tools observability | ✅ 已修复 |
| 9.3 | 🟡 | Next 14 params | 🟡 Promise.resolve 已有 — backlog N-07 |
| 9.4 | 🟡 | .ts config | ✅ N-09 — jiti |
| 9.5 | 🟢 | importSdkStdio try/catch | ❌ backlog C-80 |
| 9.6 | 🟡 | withAiReady object form | ✅ 已修复 |
| 9.7 | 🟢 | cache 手动失效 | ✅ N-10/N-11 — `dev` watch 自动 invalidate |
| 9.8 | 🟡 | optional peer next 文档 | 🟡 backlog N-14 |
| 10.1 | 🔴 | core under-tested | ✅ 34 tests |
| 10.2 | 🟡 | withAiReady 无测试 | ✅ 6 tests |
| 10.3–10.6 | 🟡/🟢 | load-config / e2e / snapshot | ✅ X-01～X-05（openapi snapshot 仍 🟢） |
| 11.1–11.4 | 🟡/🟢 | README / CONTRIBUTING / JSDoc | ✅ E-08、M-01～M-03；M-04 MCP snippet 在 docs-site |

**建议：** `REVIEW.md` 顶部已有 superseded banner（backlog E-11 ✅）。

---

## 附录 D — Phase 6 候选（未排期）

完整 7 项 + 说明 → [`backlog.md` §10](./backlog.md#10-phase-6--post-mvp-候选未排期-)。

| ID | 候选 |
|----|------|
| P6-01 | LLM `SemanticProvider` adapter |
| P6-02 | Content source adapters（fumadocs, velite, Notion, Sanity） |
| P6-03 | Embedding-ready `chunks[].embedding` |
| P6-04 | Edge runtime port |
| P6-05 | Rate-limit / auth recipes（Upstash, Clerk） |
| P6-06 | Multi-language SemanticGraph |
| P6-07 | Tool manifest preview UI |
