# Vercel Agent Readability 对照表

> 基线版本：`@vercel/agent-readability@0.5.0`  
> 核对日期：2026-08-01  
> 官方评分命令：`pnpm audit:vercel:site`

本文记录 Vercel 官方 25 项检查与 `next-ai-ready audit --version 3` 的关系。
它不是对官方实现的复刻，也不把本地预检结果表述为官方分数。

## 口径

- **官方门禁**：`@vercel/agent-readability` 是 Agent Readability 最终评分来源。
- **对应**：本地 v3 检查覆盖同一行为，可能额外施加更严格条件。
- **部分覆盖**：本地 v3 只做快速信号检测，不能替代官方检查。
- **仅官方门禁**：本地 v3 不重复实现，由固定版本的官方 CLI 验收。
- **增强项**：Semantic/AEO Quality 和 Agent Capability 是 `next-ai-ready` 的产品能力，
  不计入 Vercel 官方 Agent Readability 分数。

官方 `0.5.0` 使用严格通过计分：required 每项 3 分，recommended 每项 2 分，
optional 每项 1 分，warning 不得分。当前 10 项 required、15 项 recommended、
0 项 optional，原始满分 60，再换算为 `0-100`。被官方工具判定为 skipped
的项目不进入分母。

官方 JSON 输出目前没有稳定检查 ID，所以下表以官方类别与检查名称作为版本基线，
不得把项目内部派生 ID 宣称为 Vercel API。

## 25 项映射

| 官方类别 | 官方检查 | 等级 | 本地 v3 对应 | 覆盖 | 处理方式 |
|---|---|---:|---|---|---|
| Can agents reach you | Soft 404 detection | required | `real-404` | 对应 | 浏览器缺页必须返回真实 `404`，本地条件更严格 |
| Can agents reach you | Auth gate detection | required | `html-response` | 部分覆盖 | 本地只确认可读取 HTML；登录墙识别以官方门禁为准 |
| Can agents reach you | Redirect behavior | recommended | - | 仅官方门禁 | 检查跨主机重定向及 Agent 获取中断风险 |
| Can agents find you | llms.txt | required | `llms-txt` | 部分覆盖 | 本地要求非空纯文本；官方还要求正文超过最低长度 |
| Can agents find you | llms.txt links resolve | required | - | 仅官方门禁 | 官方 CLI 验证入口链接没有死链 |
| Can agents find you | llms.txt size | recommended | - | 仅官方门禁 | 官方 CLI 验证内容未超过上下文友好阈值 |
| Can agents find you | llms.txt valid | recommended | - | 仅官方门禁 | 官方 CLI 验证 H1 与 Markdown 链接格式 |
| Can agents find you | sitemap.xml | required | `sitemap-xml` | 部分覆盖 | 本地检查非空 XML；`lastmod` 等细节由官方 CLI 验证 |
| Can agents find you | sitemap.md | recommended | `sitemap-md` | 部分覆盖 | 本地检查非空 Markdown；官方还验证标题结构 |
| Can agents find you | robots.txt | required | `robots-txt` | 部分覆盖 | 本地检查文件与 sitemap 信号；具体 AI Bot 策略由官方 CLI 验证 |
| Can agents find you | Structured data | recommended | `json-ld` | 部分覆盖 | 本地确认 JSON-LD 信号；合法性和类型质量需后续增强 |
| Can agents read you | Agent UA -> markdown | required | `agent-user-agent` | 部分覆盖 | 本地使用 GPTBot 探测当前页；官方使用自身抽样与 User-Agent 口径 |
| Can agents read you | Accept header -> markdown | recommended | `accept-markdown` | 部分覆盖 | 请求行为相同，但 Markdown 判定和页面抽样范围不同 |
| Can agents read you | Vary: Accept | recommended | `markdown-headers` | 部分覆盖 | 本地将 Vary 与其他响应元数据合并为一项检查 |
| Can agents read you | .md URL -> markdown | required | `explicit-markdown` | 部分覆盖 | 本地只验证当前目标页，官方会从站点发现结果抽样 |
| Can agents read you | Markdown link alternate | recommended | `markdown-headers` | 部分覆盖 | 本地接受 alternate、canonical Link 或 Content-Location 中任一发现信号 |
| Can agents read you | Frontmatter | recommended | `markdown-frontmatter` | 部分覆盖 | 本地确认 YAML frontmatter；字段完整性由官方门禁验证 |
| Can agents read you | Missing page -> markdown | recommended | `agent-markdown-404` | 对应 | Agent 缺页返回 `200` Markdown；`noindex` 和恢复入口由独立增强项评估 |
| Can agents read you | Page size (markdown) | recommended | - | 仅官方门禁 | 官方 CLI 验证 Markdown 不会挤占 Agent 上下文 |
| Can agents read you | Code fence validity | recommended | - | 仅官方门禁 | 官方 CLI 验证代码围栏闭合 |
| Is your HTML agent-friendly | Server-rendered content | required | `html-response` | 部分覆盖 | 本地检查 SSR HTML 响应；官方 CLI 抽样正文可见性 |
| Is your HTML agent-friendly | Page size (HTML text) | required | - | 仅官方门禁 | 官方 CLI 验证 HTML 正文大小 |
| Is your HTML agent-friendly | Heading structure | recommended | `page-h1` | 部分覆盖 | 本地确认主 H1；完整 H1-H3 层级由官方 CLI 验证 |
| Is your HTML agent-friendly | Meta description | recommended | `meta-description` | 部分覆盖 | 本地确认非空；长度及多页抽样由官方 CLI 验证 |
| Is your HTML agent-friendly | Canonical URL | recommended | `html-canonical` | 部分覆盖 | 本地检查当前页；官方会对多个发现页面抽样 |

汇总：2 项对应、16 项部分覆盖、7 项仅由官方门禁覆盖。因此 Audit v3 的
Readability `100/100` 只能表示本地单页预检全通过，不能与官方 25 项
`100/100` 互换。

## next-ai-ready 增强层

以下检查不属于上述官方 25 项，必须在输出中标记为
`source: next-ai-ready-enhancement`：

| 平面 | 本地检查 | 意义 |
|---|---|---|
| Semantic/AEO Quality | `markdown-frontmatter`、`html-canonical`、`meta-description`、`json-ld`、`page-h1` | 改善内容归因、语义理解和引用质量 |
| Semantic/AEO Quality | `agent-markdown-recovery-quality` | 缺页 Markdown 提供 `noindex` 和可继续导航的恢复入口 |
| Agent Capability | `tools-manifest` | Agent 能发现可调用工具 |
| Agent Capability | `openapi-spec` | Agent 能理解 HTTP Action 契约 |
| Agent Capability | `mcp-endpoint` | Agent 能通过受保护的 MCP 协议调用能力 |

Capability 缺失只能降低 Capability 平面结果，不得让官方 Readability 门禁失败。

## 版本升级规则

升级 `@vercel/agent-readability` 时必须同时完成：

1. 在独立分支运行官方 JSON 审计并保存类别、名称和等级差异。
2. 更新本对照表和 Audit v3 的 `methodology.version`。
3. 判断新增检查应由本地预检覆盖，还是继续交给官方门禁。
4. 运行 `pnpm audit:vercel:site`，保持线上基线 `100/100`。
5. 更新产品改进台账中的工具版本、URL、日期和原始结果。
6. 更新外部兼容夹具；本地 Readability 预检与固定官方基线的绝对偏差不得超过 3 分。

未完成上述步骤前，不允许仅更新依赖版本。
