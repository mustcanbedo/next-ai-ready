# next-ai-ready 产品改进台账

> 最后更新：2026-08-24
> 维护者视角：`next-ai-ready` 原始作者与技术负责人  
> 当前发布：npm `0.1.0-alpha.17`（`latest` 与 `alpha`）
> 当前主分支基线：`36fa7e1`（PR #22 已合并）

本文是后续优化的**执行状态与决策记录**。`roadmap.md` 保留工程阶段历史，
`post-ga.md` 保留候选方向；当它们与本文的当前优先级冲突时，以本文为准。

## 1. 北极星与产品边界

核心命题：

> 让 Next.js 网站既能被 AI 读取和引用，也能被 Agent 安全调用。

当前阶段的北极星不再是功能数、内部测试数或 Audit 分数，而是：

> 有多少个仓库外的真实 Next.js 项目成功安装、部署并持续使用。

未来 30 天的最低采用目标：

- 5 个仓库外项目完成 `install -> init -> build -> doctor`。
- 3 个可公开访问的生产案例或模板。
- 10 次与 Next.js、Fumadocs 或 CMS 项目维护者的有效接入交流。
- 1 个赞助意向、付费审计线索或商业实施线索。
- 对首次成功时间、失败步骤和七日留存建立可核验记录。

在完成上述外部验证前，除真实采用阻塞外，不新增大型 SDK 功能。

长期保留：

- Knowledge Plane：可发现、可读取、可引用、可检索。
- Capability Plane：可调用、可授权、可审计。
- Next.js App Router 原生集成。
- 默认无数据库、确定性构建。
- 开源核心不依赖付费 SaaS。

不放进 SDK 核心：

- 页面设计器、页面美化和营销自动化。
- 完整传统 SEO 套件。
- 默认运行时数据库或内置向量数据库。
- 托管分析后台和销售 CRM。
- 多框架支持。

页面美化、AEO 改造和获客优化可以作为独立商业服务，但不得反向增加 SDK 的
默认复杂度。

## 2. 状态口径

每一项只能使用以下状态，避免把“代码写完”当成“产品完成”：

| 状态 | 含义 |
|---|---|
| `待开始` | 尚未进入实现 |
| `进行中` | 已有代码，但验收条件未全部满足 |
| `待验证` | 实现完成，等待外部或真实项目验证 |
| `已完成` | 已合入 `main`、测试通过并满足验收条件 |
| `待商榷` | 产品或架构决策尚未确定，不进入开发 |
| `暂不做` | 已明确排除在当前路线之外 |

评分口径：

- 自有 Audit 分数只表示通过当前版本的自有规则。
- Vercel 或其他外部工具的分数必须明确标注工具、版本、URL 和检测日期。
- `100/100` 不等于路线图全部完成，也不等于获得外部标准认证。
- 功能分支、npm 包、`main` 和线上站点必须分别记录，不能混称“已发布”。

## 3. 当前真实快照

| 能力 | 状态 | 说明 |
|---|---|---|
| Agent Markdown 缺页恢复 | `已完成` | Agent Markdown 请求返回 `200`、`noindex`、发现入口和相似页面；浏览器仍返回真实 `404` |
| Audit 三层报告 | `已完成` | v1/v2 保持兼容；v3 已随 npm alpha.14 发布，并拆分 Readability、Semantic/AEO 与 Capability；发布前 CLI 回归和外部安装均通过 |
| MCP 页面发现 | `已完成` | `list_pages`、`get_page`、`search_pages` 已随 alpha.14 发布，并于 2026-08-02 在带认证的生产 MCP 端点完成真实调用；locale 过滤已随 alpha.17 发布 |
| Next.js 兼容验证 | `已完成` | alpha.15 已从公共 registry 通过 npm/pnpm × Next.js 14/15/16 六组合；alpha.16 `latest` 已复验 pnpm/Next.js 16 与 npm/Next.js 15；alpha.17 已从公共 `latest` 通过 pnpm + Next.js 16 的真实 `next.config.ts` 与正式生产构建 |
| Vercel 官方 Readability 基线 | `已完成` | `main` 部署后已使用固定的 `@vercel/agent-readability@0.5.0` 复测生产站，25 项全部通过并保持 `100/100`；每周/手动工作流仍单独跟踪 |
| npm GA | `进行中` | 当前已发布 `0.1.0-alpha.17`，`latest` 与 `alpha` 已对齐并通过完整发布门禁及 npm manifest 核验；尚未退出 prerelease 或发布 `0.1.0` |
| i18n 与 Content Adapter | `进行中` | alpha.17 已发布 locale 搜索过滤及 Nextra/Fumadocs 默认内容发现；完整 alternate URL 与更多 ContentSource Adapter 仍待真实采用验证 |
| 动态索引 | `待商榷` | 只保留 Provider 方向，等待真实需求证据 |
| 商业观测 | `待商榷` | SDK 只定义开放事件和 Adapter；托管产品单独决策 |
| 外部采用与分发 | `进行中` | 技术可信度已建立，但尚无可核验的仓库外采用基线、公开案例漏斗或渠道归因 |
| Google 自然搜索 | `进行中` | 公开搜索尚未稳定返回本站页面；robots、sitemap 与 canonical 可用，开始接入 Search Console、修复本地化 metadata、真实更新时间和搜索意图内容 |
| 赞助与商业入口 | `待开始` | 尚未配置 GitHub Sponsors/FUNDING；先建立真实使用价值，再验证赞助转化 |

## 4. 已决定执行

### P0：可信度修复

这是 GA 之前的最高优先级。

| ID | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| A0-01 | 将 Audit 输出重构为 `Agent Readability`、`Semantic/AEO Quality`、`Agent Capability` 三层 | `已完成` | JSON schema、CLI 和文档使用同一模型；旧版兼容路径有迁移说明 |
| A0-02 | 为每条检查标记 `standard` 或 `enhancement` | `已完成` | 用户能区分外部标准要求与 next-ai-ready 增强建议 |
| A0-03 | 建立 Vercel Agent Readability Spec 对照表 | `已完成` | 已按官方 `0.5.0` 的 25 项检查标注直接覆盖、部分覆盖或仅官方门禁；详见[版本化对照表](./vercel-agent-readability-mapping.zh-CN.md) |
| A0-04 | 增加外部站点回归夹具 | `已完成` | 已用离线响应夹具覆盖 Nuxt SEO、普通 Next.js 文档站和缺少 AI 输出的网站；来源 URL、采样日期和官方分数均已记录，本地分数与固定官方基线偏差不得超过 3 分 |
| A0-05 | 固化双 404 行为测试 | `已完成` | 浏览器 `404`；Agent Markdown `200` + `noindex` + 请求路径 + 发现入口 + 相似页面 |
| A0-06 | 进行独立线上复测 | `已完成` | 官方 `0.5.0` 对生产 URL 得分 `100/100`；工具、日期、URL 与 25 项结果已保存为[机器可读基线](./audit-baselines/vercel-agent-readability-0.5.0-2026-08-01.json) |
| A0-07 | 引入 Vercel 官方 Agent Readability 质量门 | `已完成` | 固定官方依赖版本；提供本地与 CI 命令；线上站低于 `100/100` 时质量门失败 |
| A0-08 | 在 README 与网站公开第三方评分证据 | `已完成` | README 与生产网站已展示工具、版本、URL、日期、原始结果与复现入口，并明确不代表排名或引用 |

P0 完成条件：

1. 外部 Agent Readability 检测达到 `100/100`。
2. 自有 Audit 不再对符合外部标准的网站给出相反结论。
3. Capability 增强项不会伪装成网页可读性的标准缺陷。

当前官方基线（2026-08-01）：

```bash
pnpm audit:vercel:site
```

- 工具：`@vercel/agent-readability@0.5.0`
- URL：`https://next-ai-ready.vercel.app/en`
- 总分：`100/100`（Excellent）
- Can agents reach you：`3/3`
- Can agents find you：`8/8`
- Can agents read you：`9/9`
- Is your HTML agent-friendly：`5/5`
- 质量门：`--min-score 100`
- CI：`.github/workflows/agent-readability.yml`，每周运行并支持手动触发

同日使用发布前的 Audit v3 对该 URL 预检：Agent Readability `100/100`、
Semantic/AEO Quality `100/100`、Agent Capability `67/100`。Capability 的
当时唯一警告是生产 MCP Token 尚未配置，因此无法进行带凭证的协议验证。2026-08-02
已轮换并将 Sensitive Token 写入 Vercel Production，随后使用最新项目设置重新部署。
生产端点通过 Bearer Token 完成 MCP `initialize`（HTTP 200，协议 `2025-03-26`），
并真实调用 `list_pages`、`search_pages`、`get_page`；无凭证请求继续返回 401。
此前发现的默认 `basePath` 与生成路由不一致问题已随 alpha.14 修复。v3 结果用于验证三层报告实现，不能替代上方
官方 CLI 的 25 项外部结果。

### P1：外部采用与分发

这是当前最高优先级。Nuxt 生态证明的关键不是继续堆 runtime 功能，而是通过短安装路径、
真实示例、生态目录、持续发布内容、免费工具和 Sponsor/Pro 入口形成分发系统。
Next.js 没有完全对应的官方模块目录，因此必须用可部署模板、集成生态、搜索内容和定向接入
共同替代。

调研依据：Nuxt 的[官方模块目录](https://nuxt.com/modules?category=SEO)提供集中发现入口；
[`@nuxtjs/seo` 的 npm 页面](https://www.npmjs.com/package/%40nuxtjs/seo)持续展示下载、依赖和
Funding；[Nuxt SEO Releases](https://github.com/harlan-zw/nuxt-seo/releases)把升级命令、示例和
用户收益作为发布内容；[Nuxt Robots 模块页](https://nuxt.com/modules/robots)同时连接文档、
社区、免费工具、Sponsor Program 和付费 Pro。我们学习的是这套分发和承接结构，不是复制
Nuxt 的全部功能。

任务按预计成效和反馈速度排序：

| 排名 | ID | 任务 | 状态 | 成效假设 | 验收标准 |
|---:|---|---|---|---|---|
| 1 | A1-01 | 将现有文档站包装为官方公开生产案例 | `进行中` | 复用已经线上运行、100/100 且带真实 MCP 的最强证据，比先造新仓库更快建立信任 | 官网首屏可进入 Live Proof；集中展示真实 Vercel URL、源码位置、`/llms.txt`、Markdown、MCP、第三方评分和 90 秒以内演示 |
| 2 | A1-02 | 定向协助首批 10 位维护者接入 | `进行中` | 直接协助比广泛发帖更快发现真实阻力并产生首批案例 | 10 次有效交流、5 次实际安装、每次记录来源、耗时、失败步骤、结果和后续状态 |
| 3 | A1-03 | 上线免费 URL Audit 与可分享结果 | `待开始` | 免费诊断是搜索流量、分享和商业线索进入产品的最低摩擦入口 | 无需安装即可审计公开 URL；结果标明外部标准与增强项；可分享；有速率限制、SSRF 防护和来源归因 |
| 4 | A1-04 | 发布五篇高意图内容并投放生态渠道 | `进行中` | 抢占明确的 Next.js AI-readiness 搜索问题，比泛品牌宣传更容易带来合格用户 | 五篇内容各有可执行示例与可追踪链接；完成 Awesome/目录/社区提交；按渠道记录访问和安装 |
| 5 | A1-05 | 建立赞助和商业承接入口 | `待开始` | 赞助按钮只有在持续价值和真实用户存在时才会转化；服务线可更早形成现金流 | `.github/FUNDING.yml`、npm `funding`、Sponsor 页面、免费 Audit 到付费实施的清晰路径；身份和收款由维护者本人验证 |
| 6 | A1-06 | 按真实需求发布可复制模板和三个黄金示例 | `待开始` | 文档站负责证明生产能力；独立 starter 只在用户需要一键复制时提供，避免重复建设 | 先验证官方案例能带来安装；再决定是否发布独立 starter，并按需求扩展文档、SaaS、电商场景 |
| 7 | A1-07 | 建立 Google 收录与自然搜索增长闭环 | `进行中` | 技术可读性只有在页面被抓取、收录并匹配搜索需求后才会带来用户 | 按[自然搜索执行手册](./google-search-growth.zh-CN.md)完成 Search Console 验证、sitemap 提交、5 个核心 URL 检查；每周记录收录、曝光、点击、查询和安装趋势 |

公开叙事统一为：

> Make any Next.js site readable by AI in 10 minutes. Add callable agent actions when you are ready.

Capability Plane 继续作为差异化能力，但不要求首次访问者在安装前理解完整架构。

### P1B：发布 0.1 GA

| ID | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| G1-01 | 合入并发布当前 Audit/MCP 功能 | `已完成` | PR #2-#7 已合入 `main`；Audit v3、MCP 页面发现和依赖链修复已随 npm alpha.14 发布 |
| G1-02 | 配置生产 MCP Token | `已完成` | 2026-08-02 完成 Production Sensitive Token 轮换、重新部署、无凭证 401 和带凭证 initialize 200 验证；文档站 smoke 固化同一认证与工具回归 |
| G1-03 | 固化真实安装矩阵 | `已完成` | 外部 smoke 在 Next.js 15/16 使用真实 `next.config.ts`；alpha.15 已完成公共 registry 六组合，alpha.16 `latest` 已复验 pnpm/Next.js 16 与 npm/Next.js 15，alpha.17 `latest` 已复验 pnpm/Next.js 16 |
| G1-04 | 冻结 0.1 公共 API | `已完成` | 十个发布包的 entrypoint、命名导出、类型声明哈希与 bin 基线均已通过；程序化 Audit 已收口到独立入口，不再暴露 CLI 调度 API |
| G1-05 | 建立最小回滚流程 | `已完成` | 2026-08-02 完成只读演练；计划器兼容 pnpm 透传的 `--`，并生成精确 deprecate/dist-tag 命令，不执行写操作 |
| G1-06 | 更新 GA 文案并发布 `0.1.0` | `待验证` | README、官网与机器可读首页已统一为“承诺、可复制流程、成功标准”；至少 3 个仓库外真实项目接入并修复共同阻塞后，再决定稳定版发布 |
| G1-07 | 消除 `main`、npm 与网站文档的发布漂移 | `已完成` | npm、README、双语文档站与机器可读产物已对齐 alpha.17；文档 artifact smoke、`doctor` 100/100、路由 smoke 及公共 registry Next.js 16 构建通过；发布门禁已有 manifest 漂移检查 |
| G1-08 | 恢复 GitHub Actions npm 发布身份 | `已完成` | 仓库 Secret `NPM_TOKEN` 已配置；2026-08-02 幂等重跑 Release Alpha，身份验证、发布门禁和已发布版本检查全部通过 |

GA 之前不加入数据库、IndexNow、大型 DevTools 或托管后台。

2026-08-01 至 2026-08-02 alpha 发布记录：

- `verify:release` 全部门禁通过：构建、测试、类型检查、端到端生成、pack、exports、公共 API、CLI、文档站和外部 Next.js tarball 安装。
- ESLint 无错误、无警告；`git diff --check` 通过。
- 首次发布了 `next-ai-ready@0.1.0-alpha.13`、`@next-ai-ready/next@0.1.0-alpha.13`、`@next-ai-ready/mcp@0.1.0-alpha.12` 与 `create-next-ai-ready@0.1.0-alpha.11`。
- 公共 registry 回归发现 alpha.13 的传递依赖 `@next-ai-ready/semantic@0.1.0-alpha.11` 未发布 `./jsonld` export；`@next-ai-ready/core@0.1.0-alpha.11` 也缺少新运行时专用 exports。根因是公开 manifest 改动未伴随底层包版本提升。
- PR #7 增加 `registry:manifest-check`，在发布门禁中比较本地与 npm 同版本的公开 manifest，防止在相同版本下漂移；Changesets 随后生成完整的精确依赖替换链。
- 修正版已发布：Core、Semantic、Actions、MDX、OpenAPI 为 alpha.12，LLMS、MCP 为 alpha.13，Next 与 meta 包为 alpha.15；`@alpha` 没有移动正式版 `latest`。
- `next-ai-ready@0.1.0-alpha.14` 已从公共 npm registry 完成 npm/pnpm × Next.js 14/15/16 六组合干净安装、`init`、`build`、`doctor --score` 与生产构建，全部通过。
- 生产 MCP Token 已轮换并重新部署；认证 initialize、`list_pages`、`search_pages`、`get_page` 均通过。搜索 `installation` 时英文安装页排名第一，读取结果包含 alpha.14 文档。
- 文档站 smoke 使用隔离的测试 token 自动验证无凭证 401、认证 initialize 和三个页面工具；本地 `doctor` 达到 0 error、0 warning、`100/100`。
- 回滚计划完成只读演练，并修复 pnpm 9 将参数分隔符透传给脚本时的解析失败。
- 2026-08-02 重新执行仓库外 `create-next-app` 接入时，`doctor` 达到 100/100，但正式 `next build` 暴露两个此前矩阵未覆盖的缺口：`next-ai-ready/config` 缺少 CommonJS 入口，以及 `withAiReady()` 的类型约束不兼容官方 `NextConfig`。alpha.15 已增加专用 CJS 配置产物、放宽包装器泛型，并让外部 smoke 在 Next.js 15/16 使用 `next.config.ts`；npm/pnpm × Next.js 14/15/16 六组 tarball 与公共 registry 回归全部通过。
- Release Alpha workflow 的完整发布门禁通过，但因仓库 `NPM_TOKEN` 为空在 publish 步骤停止；随后使用已验证的本机 npm 身份 `jairhu` 发布 alpha.15。发布前没有产生半发布状态，发布后两个入口包的 `alpha` 标签均指向 alpha.15，`latest` 未改变。
- PR #17 合并后触发 Release Alpha #4；GitHub Actions 使用仓库 `NPM_TOKEN` 完成身份验证、完整门禁、十个包的缺失版本发布和标签验证。`next-ai-ready@0.1.0-alpha.16`、`@next-ai-ready/next@0.1.0-alpha.16` 与 `create-next-ai-ready@0.1.0-alpha.12` 的 `latest`/`alpha` 均已对齐。
- alpha.16 发布后从公共 npm `latest` 进行两次仓库外临时项目回归：pnpm + Next.js 16.2.12、npm + Next.js 15.5.22 均完成安装、`init`、产物构建、`doctor` 与正式 `next build`。
- PR #20 合并后触发 Release Alpha #5；完整发布门禁通过并发布 Nextra/Fumadocs 内容发现、locale 搜索过滤及精确依赖链。`next-ai-ready@0.1.0-alpha.17` 与 `@next-ai-ready/next@0.1.0-alpha.17` 的 `latest`/`alpha` 均已对齐，十个公开 manifest 与 npm 完全一致。
- alpha.17 发布后，公共 registry smoke 曾因依赖声明使用裸 `latest` 命中 pnpm 旧标签缓存；验证器已改为先解析 registry 精确版本并显式允许 `sharp` 构建。修正后准确安装 alpha.17，并在 pnpm + Next.js 16.2.12 中完成 `init`、产物构建、`doctor` 与正式 `next build`。

2026-08-01 分支审查修复：Audit v3 的 required 检查现在统一产生 failure 并使 CLI
非零退出；`create-next-ai-ready` 已移出 Changesets ignore 列表；公开 Audit 只确认 MCP
端点与认证门，不会自动读取或向任意审计目标外发生产 Token。带凭据的 MCP initialize
仍属于明确域名的部署验收步骤。

### P2：知识检索闭环

| ID | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| S2-01 | `list_pages`、`get_page`、`search_pages` | `已完成` | 已随 alpha.14 发布并通过生产带认证调用；可枚举 42 页、搜索命中目标安装页并读取完整 Markdown |
| S2-02 | locale 过滤和确定性分页 | `待开始` | 中英文结果不混淆；cursor 行为有回归测试 |
| S2-03 | 统一 Search Provider | `待开始` | MCP 与 HTTP 搜索调用同一实现，不复制排序逻辑 |
| S2-04 | 补齐页面元数据 | `进行中` | title、summary、canonical URL、locale、updatedAt 均有类型和测试 |
| S2-05 | 工具调用效果评估 | `待开始` | 测试问题能在一到两次工具调用内找到并读取目标页 |

### P3：零配置与 i18n

P0、P1 外部采用验证完成后再开始。

| ID | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| I3-01 | 自动识别 locale 路由与语言清单 | `待开始` | 常见 `[lang]`/`[locale]` 路由无需重复配置 |
| I3-02 | alternate URL、frontmatter locale、hreflang Link | `待开始` | Markdown、HTTP header 和 graph 信息一致 |
| I3-03 | 首批 ContentSource Adapter | `待开始` | 先选择一个真实用户最多的生态并做端到端示例 |
| I3-04 | `doctor --fix` | `待开始` | 可预览改动、可重复执行、不覆盖用户自定义代码 |
| I3-05 | 减少 init 生成文件 | `待开始` | 普通 MDX 项目三分钟接入，生成文件数量有明确下降 |

### P4-P6：后续阶段

| 阶段 | 方向 | 当前处理 |
|---|---|---|
| P4 动态内容 | RuntimeIndexProvider、增量更新、TTL、CMS 新鲜度 | 先设计接口和收集需求，不实现默认数据库 |
| P5 观测 | AI 访问、资源读取、搜索和 Action 调用事件 | 先稳定事件规范，再做 OTel/PostHog/Webhook Adapter |
| P6 Capability | Auth、scope、限流、幂等、高风险确认、审计和工具评估 | 在真实 Action 用户出现后按风险排序实现 |

## 5. 待商榷事项

以下事项没有完成决策前不得直接进入核心实现。

| ID | 问题 | 需要证据或决定 | 默认立场 |
|---|---|---|---|
| D-01 | 三层 Audit 是否合成一个总分 | 总分是否会再次混淆标准与增强项 | 优先展示三个独立分数，总分仅作辅助 |
| D-02 | Capability 是否影响网页可读性分数 | 外部规范与产品差异化之间的边界 | 不影响 Readability 标准分 |
| D-03 | Agent 缺页返回 `200` 的适用范围 | 不同 Agent、缓存和 SEO 工具的真实行为 | 仅 Markdown 协商路径使用，并带 `noindex`/`no-store` |
| D-04 | HTTP 搜索接口的公开协议 | REST 路由、认证、缓存和响应 schema | 先复用只读 Search Provider，不创建第二套排名 |
| D-05 | 首个 ContentSource Adapter | Fumadocs、Velite、Contentlayer 或 CMS 的用户需求 | 优先 Fumadocs，但先收集真实接入样本 |
| D-06 | Runtime Index 何时进入路线 | 大站规模、更新频率和重新构建成本 | 没有生产证据前保持可选设计 |
| D-07 | IndexNow 与 Content Signals | 对 AI 发现和业务效果是否有可测收益 | 只做独立可选插件，不作为 GA 阻塞项 |
| D-08 | 商业分析后台边界 | 开源事件、托管存储和隐私责任 | 开源只提供事件与 Adapter，托管产品独立仓库 |
| D-09 | Edge Runtime 优先级 | 用户占比、依赖体积和功能限制 | Node.js 仍为默认，等待明确需求 |
| D-10 | Next.js 14 长期支持期限 | 维护成本与用户安装数据 | 0.1 验证兼容，GA 后再确定支持窗口 |

## 6. 明确暂不做

- 多框架 SDK。
- 内置向量数据库或默认 RAG 服务。
- 默认运行时数据库。
- Chatbot UI。
- 页面设计器和完整 SEO 管理后台。
- Pages Router 和静态导出支持。
- 把商业线索、邮件外呼或 CRM 放进开源 SDK。

## 7. 下一轮执行顺序

P0 已完成并部署，接下来不再按内部功能完成度排期，而按外部采用成效推进：

1. `A1-01`：先把现有生产文档站包装成公开 Live Proof，不再等待新仓库。
2. `A1-02`：用标准案例定向协助 10 位维护者，验证 5 次真实安装并记录流失点。
3. `A1-03`：根据真实安装问题确定免费 URL Audit MVP，不先建设完整 SaaS 后台。
4. `A1-04`：围绕案例和 Audit 发布五篇高意图内容，并提交 Next.js 相关生态入口。
5. `A1-05`：在已有真实价值证明的页面配置 Sponsor 和商业实施入口。
6. `G1-06`：至少 3 个仓库外项目成功后，依据兼容反馈决定 `0.1.0` GA，而不是按日期发布。
7. `A1-06`：文档站案例证明能带来安装后，再决定是否发布独立 starter，并复制成 SaaS 和电商示例。

`S2-02`、`S2-03`、`I3-*`、动态索引与 DevTools 均暂停；只有当外部采用记录证明它们是
安装、部署或持续使用的共同阻塞时，才重新进入执行队列。

### 7.1 每周成效看板

| 指标 | 当前基线 | 30 天目标 | 证据来源 |
|---|---:|---:|---|
| 仓库外成功安装 | 待建立 | 5 | 接入记录 + 公开仓库或经授权的构建结果 |
| 公开生产案例 | 1 | 3 | 真实 URL + 项目链接；官方文档站为案例 #1，不计入外部采用 |
| 有效维护者交流 | 0 | 10 | 接入记录，不以群发数量计数 |
| 首次成功中位时间 | 待建立 | <= 10 分钟 | 从安装开始到 `doctor` 通过的计时 |
| 七日仍在使用 | 待建立 | >= 3 | 七日回访或构建证据 |
| 赞助/付费线索 | 0 | >= 1 | Sponsor 意向、Audit 回复或实施咨询 |

Stars、页面访问和 npm 下载量只作为上游信号，不替代成功安装与持续使用。

官方文档站可以计入“公开生产案例”，但不能计入“仓库外成功安装”。维护者自行创建的测试
仓库、CI fixture 和本地临时项目也不得计入外部采用；它们只能
作为激活摩擦基线。2026-08-02 使用公共 npm `alpha.15` 进行首次独立演练：脚手架、安装、
`init`、框架生成和 Next.js 15 生产构建全部通过；`init` 写入 13 个文件，默认 `doctor`
得到 `88/100`、0 error、4 warning。主要摩擦为生产 MCP Token、`updatedAt`、`author` 和
JSON-LD 尚未配置。该演练已形成一个本地 starter 草案，但在文档站案例证明用户确实需要
独立模板前不公开新仓库；避免把分发工作再次变成内部资产堆积。

2026-08-02，PR #13 合入并部署后，官方文档站已成为公开生产案例 #1：首页 Live Proof
可直接访问 `/llms.txt`、页面 Markdown、`/openapi.json` 和 `/tools.json`，并链接到生产源码；
四个端点均在线返回 HTTP 200。A1-01 剩余交付为 90 秒以内演示素材。A1-04 已开始第一篇
高意图内容“如何为 Next.js 添加 llms.txt 和 Markdown 端点”。

同日，首篇中英文指南随 PR #14 合入并部署，HTML 与 Markdown 生产 URL 均返回 HTTP 200。
A1-02 开始建立转化入口：首页 Live Proof 提供首批 5 个免费接入名额，进入结构化 GitHub
Issue 表单；表单收集 Next.js 版本、包管理器、内容来源、目标和阻塞，不接收任何密钥。

2026-08-05，首批两条“先询问是否需要兼容 PR”的公开 Discussion 均超过 72 小时且保持
0 条外部回复、0 位外部参与者；该批次停止，不继续追问，也不把帖子数量视作有效交流。
分发假设调整为“可运行成果优先”：强化现有中英文 Next.js App Router 教程，使用
`create-next-ai-ready` 作为经过发布门禁的最小演示，并为小红书、Reddit、X 建立差异化发布包、
UTM 与 24 小时/7 天成效记录。A1-04 仍为`进行中`；只有产生可追踪访问、真实安装问题或
仓库外部署后，才能把本轮分发判定为有效。

## 8. 维护规则

每次迭代必须同时更新本文：

1. 开始开发时把任务改为 `进行中`。
2. 代码完成但未发布时改为 `待验证`，不得写 `已完成`。
3. 合入、发布并满足验收标准后才能改为 `已完成`。
4. 新产品方向先进入“待商榷事项”，记录证据后再排期。
5. 每次发布记录 Git commit、npm 版本、线上 URL 和验证日期。
6. README、文档站和 CLI 帮助必须与已发布版本保持一致。
