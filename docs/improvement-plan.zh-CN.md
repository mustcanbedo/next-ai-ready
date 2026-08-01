# next-ai-ready 产品改进台账

> 最后更新：2026-08-01  
> 维护者视角：`next-ai-ready` 原始作者与技术负责人  
> 当前发布：npm `0.1.0-alpha.12`  
> 当前主分支基线：`4965734`（PR #3 已合并）

本文是后续优化的**执行状态与决策记录**。`roadmap.md` 保留工程阶段历史，
`post-ga.md` 保留候选方向；当它们与本文的当前优先级冲突时，以本文为准。

## 1. 北极星与产品边界

核心命题：

> 让 Next.js 网站既能被 AI 读取和引用，也能被 Agent 安全调用。

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
| Audit 三层报告 | `待验证` | v1/v2 保持兼容；v3 已拆分 Readability、Semantic/AEO 与 Capability，并使用严格分层计分 |
| MCP 页面发现 | `进行中` | 功能分支已有 `list_pages`、`get_page`、`search_pages` 和分页；尚缺 locale 过滤及 HTTP 共用接口 |
| Next.js 兼容验证 | `待验证` | npm/pnpm × Next.js 14/15/16 已进入 CI；本地抽样的 14、15、16 均完成真实生产构建，待 `main` 首次矩阵验证 |
| Vercel 官方 Readability 基线 | `已完成` | `main` 部署后已使用固定的 `@vercel/agent-readability@0.5.0` 复测生产站，25 项全部通过并保持 `100/100`；每周/手动工作流仍单独跟踪 |
| npm GA | `待开始` | 当前仅发布 `0.1.0-alpha.12`，尚未发布 `0.1.0` |
| i18n 与 Content Adapter | `待开始` | graph 有基础字段和 ContentSource 接口，但没有完整接入体验 |
| 动态索引 | `待商榷` | 只保留 Provider 方向，等待真实需求证据 |
| 商业观测 | `待商榷` | SDK 只定义开放事件和 Adapter；托管产品单独决策 |

## 4. 已决定执行

### P0：可信度修复

这是 GA 之前的最高优先级。

| ID | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| A0-01 | 将 Audit 输出重构为 `Agent Readability`、`Semantic/AEO Quality`、`Agent Capability` 三层 | `待验证` | JSON schema、CLI 和文档使用同一模型；旧版兼容路径有迁移说明 |
| A0-02 | 为每条检查标记 `standard` 或 `enhancement` | `待验证` | 用户能区分外部标准要求与 next-ai-ready 增强建议 |
| A0-03 | 建立 Vercel Agent Readability Spec 对照表 | `待验证` | 已按官方 `0.5.0` 的 25 项检查标注直接覆盖、部分覆盖或仅官方门禁；详见[版本化对照表](./vercel-agent-readability-mapping.zh-CN.md) |
| A0-04 | 增加外部站点回归夹具 | `待验证` | 已用离线响应夹具覆盖 Nuxt SEO、普通 Next.js 文档站和缺少 AI 输出的网站；来源 URL、采样日期和官方分数均已记录，本地分数与固定官方基线偏差不得超过 3 分 |
| A0-05 | 固化双 404 行为测试 | `已完成` | 浏览器 `404`；Agent Markdown `200` + `noindex` + 请求路径 + 发现入口 + 相似页面 |
| A0-06 | 进行独立线上复测 | `已完成` | 官方 `0.5.0` 对生产 URL 得分 `100/100`；工具、日期、URL 与 25 项结果已保存为[机器可读基线](./audit-baselines/vercel-agent-readability-0.5.0-2026-08-01.json) |
| A0-07 | 引入 Vercel 官方 Agent Readability 质量门 | `待验证` | 固定官方依赖版本；提供本地与 CI 命令；线上站低于 `100/100` 时质量门失败 |
| A0-08 | 在 README 与网站公开第三方评分证据 | `待验证` | 首屏展示工具、版本、URL、日期、原始结果与复现入口，并明确不代表排名或引用 |

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

同日使用未发布的 Audit v3 对该 URL 预检：Agent Readability `100/100`、
Semantic/AEO Quality `100/100`、Agent Capability `67/100`。Capability 的
当时唯一警告是生产 MCP Token 尚未配置，因此无法进行带凭证的协议验证。2026-08-01
已将 Sensitive Token 写入 Vercel Production；线上鉴权由 `401` 变为进入 MCP handler，
同时暴露出默认 `basePath` 与生成路由不一致导致的 transport `404`。修复已进入当前分支，
待合入 `main` 并重新部署后完成协议验收。v3 结果用于验证三层报告实现，不能替代上方
官方 CLI 的 25 项外部结果。

### P1：发布 0.1 GA

| ID | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| G1-01 | 合入并发布当前 Audit/MCP 功能 | `待验证` | 功能分支通过审查后进入 `main`，npm 包与仓库版本一致 |
| G1-02 | 配置生产 MCP Token | `待验证` | Vercel Production Sensitive Token 已保存并部署，错误凭据仍为 401、正确凭据已通过鉴权；线上复测发现生成路由缺少默认 `/api/mcp` basePath，修复待合入 `main` 后完成初始化握手 |
| G1-03 | 固化真实安装矩阵 | `待验证` | 当前分支 tarball 已通过 npm/pnpm × Next.js 14/15/16 六组合；并抽样通过 pnpm 9.12 与 11.9；`init` 已覆盖标识符、对象字面量、括号表达式和 `defineConfig()` 默认导出；待 `main` 首次矩阵通过 |
| G1-04 | 冻结 0.1 公共 API | `待验证` | 已增加十个发布包的 entrypoint、命名导出、类型声明哈希与 bin 基线；程序化 Audit 已收口到独立入口，不再暴露 CLI 调度 API；待 `main` 首次通过 |
| G1-05 | 建立最小回滚流程 | `待验证` | npm 计划器仅生成精确 deprecate/dist-tag 命令；Git revert、Vercel rollback/promote 和三层验证已进入手册，待 GA 前演练 |
| G1-06 | 更新 GA 文案并发布 `0.1.0` | `待开始` | README 不再写 Pre-alpha；十分钟流程无错误 |

GA 之前不加入数据库、IndexNow、大型 DevTools 或托管后台。

2026-08-01 分支审查修复：Audit v3 的 required 检查现在统一产生 failure 并使 CLI
非零退出；`create-next-ai-ready` 已移出 Changesets ignore 列表；公开 Audit 只确认 MCP
端点与认证门，不会自动读取或向任意审计目标外发生产 Token。带凭据的 MCP initialize
仍属于明确域名的部署验收步骤。

### P2：知识检索闭环

| ID | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| S2-01 | `list_pages`、`get_page`、`search_pages` | `待验证` | 从已发布 npm 包连接真实 MCP Client 后通过 |
| S2-02 | locale 过滤和确定性分页 | `待开始` | 中英文结果不混淆；cursor 行为有回归测试 |
| S2-03 | 统一 Search Provider | `待开始` | MCP 与 HTTP 搜索调用同一实现，不复制排序逻辑 |
| S2-04 | 补齐页面元数据 | `进行中` | title、summary、canonical URL、locale、updatedAt 均有类型和测试 |
| S2-05 | 工具调用效果评估 | `待开始` | 测试问题能在一到两次工具调用内找到并读取目标页 |

### P3：零配置与 i18n

P0、P1 完成后再开始。

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

P0 的功能分支实现已完成，当前按以下顺序收敛 GA：

1. `G1-01` / `G1-02`：合入 MCP basePath 修复并在生产完成认证初始化握手。
2. `G1-03` / `G1-04`：在 `main` 验证安装矩阵与公共 API 基线。
3. `G1-06`：完成 GA 文案、发布检查和 `0.1.0` 发布。

## 8. 维护规则

每次迭代必须同时更新本文：

1. 开始开发时把任务改为 `进行中`。
2. 代码完成但未发布时改为 `待验证`，不得写 `已完成`。
3. 合入、发布并满足验收标准后才能改为 `已完成`。
4. 新产品方向先进入“待商榷事项”，记录证据后再排期。
5. 每次发布记录 Git commit、npm 版本、线上 URL 和验证日期。
6. README、文档站和 CLI 帮助必须与已发布版本保持一致。
