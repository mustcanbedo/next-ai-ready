# Nextra 生态采用与合作执行单

> 更新日期：2026-09-29  
> 当前状态：首批三条邀请已发布，等待外部回复；没有回复不自动追发。

## 1. 本轮目标

本轮不直接索要赞助。先用已经合入 `main` 的 Nextra 4 可执行夹具换取三类更有价值的结果：

1. Nextra 维护者确认集成方向是否有价值，并决定是否接受指南或示例 PR。
2. 两个仓库外 Nextra 4 项目完成真实安装或给出明确拒绝理由。
3. 获得一个可以公开引用的生产案例，再讨论赞助、联合内容或长期维护合作。

Nextra 当前的赞助页同时展示 Inkeep 与 xyflow；官方 Ask AI 指南又直接提供 Inkeep 集成。
这说明有效的赞助关系建立在“持续维护 + 对用户有用的集成 + 公开展示”上，而不是先发一封
索要赞助的邮件。next-ai-ready 应先成为 Nextra 用户可以复现的互补集成。

参考入口：

- Nextra Sponsors：https://nextra.site/sponsors
- Nextra Ask AI：https://nextra.site/docs/guide/search/ai
- Nextra Showcase：https://nextra.site/showcase
- 可执行夹具：https://github.com/mustcanbedo/next-ai-ready/tree/main/examples/nextra-docs

## 2. 合格与排除规则

首批采用对象必须同时满足：

- 公开仓库和公开部署；
- Next.js App Router；
- Nextra 4；
- 非 `output: 'export'`；
- 当前缺少至少一个明确、可验证的 AI 读取入口；
- 有公开且合适的维护者沟通渠道。

以下对象不进入首批安装邀请：

| 对象 | 原因 | 后续处理 |
|---|---|---|
| React Cosmos | Nextra 2 + Next.js 14，并使用静态导出，超出当前 SDK 边界 | 保留为未来静态导出需求证据，不联系 |
| Typia | Nextra 4，但使用静态导出，超出当前 SDK 边界 | 不以现有能力承诺兼容 |
| ASI:One Docs | 已提供 `llms.txt`，且页面请求可返回 Markdown | 作为独立实现参考，不推销重复能力 |
| EmbedPDF | 已自行实现路由级 Markdown 投影与搜索共用内容树 | 作为同行与潜在互补合作，不计安装线索 |
| BuildShip Docs | 仍是 Pages Router/Nextra 旧结构 | 当前 App Router 产品边界内不联系 |

## 3. 首批候选

以下 HTTP 检查均在 2026-09-29 执行。自有 Audit 分数只用于内部定位，不作为对外批评或
外部标准分数；邀请只陈述可直接复现的端点事实。

| 优先级 | 项目 | 适配证据 | 当前可验证缺口 | 渠道 | 阶段与下一步 |
|---:|---|---|---|---|---|
| 1 | Nextra 官方文档 | Next.js 16、Nextra workspace、`next start` | `/llms.txt` 404；页面请求仍返回 HTML | [Discussion #5054](https://github.com/shuding/nextra/discussions/5054) | `invited`；等待维护者判断是否适合官方指南或示例 |
| 2 | Superseed Docs | Next.js 16.1、Nextra 4.6、`next start` | `/llms.txt` 404；`/index.md` 404 | [Issue #142](https://github.com/superseed-xyz/docs/issues/142) | `invited`；对方明确同意后提供小范围兼容 PR |
| 3 | Morgen Dev Docs | Next.js 15.1、Nextra 4、`next start` | `/llms.txt` 404；`/index.md` 404 | [Issue #20](https://github.com/morgen-so/morgen-dev-docs/issues/20) | `invited`；对方明确同意后提供小范围兼容 PR |
| 4 | WebNN Docs | Next.js 16.2、Nextra 4.6、`next start` | 已有 `/llms.txt`；页面级 `.md` 404 | GitHub Issues | `identified`；先确认现有生成方式，再提增量价值 |

候选源码：

- https://github.com/shuding/nextra/tree/main/docs
- https://github.com/superseed-xyz/docs
- https://github.com/morgen-so/morgen-dev-docs
- https://github.com/webmachinelearning/webnn-docs

## 4. 首批已发布文案与候选草案

### 4.1 Nextra Discussion

标题：

```text
Would an optional AI-readable endpoints recipe be useful for Nextra 4?
```

正文：

```text
I maintain next-ai-ready, an MIT-licensed Next.js package for generating AI-readable knowledge
endpoints without replacing the existing docs UI.

I built an executable Nextra 4.6.1 + Next.js 16 fixture where the same MDX collection drives the
Nextra site and /llms.txt, /llms-full.txt, page-level Markdown, Accept: text/markdown, and optional
MCP page discovery. The fixture has a production smoke test and is now merged:

https://github.com/mustcanbedo/next-ai-ready/tree/main/examples/nextra-docs

Would this be useful as an optional Nextra integration guide or example? I am happy to adapt the
material to Nextra's documentation conventions and maintain the compatibility fixture. No change
to Nextra's UI or default runtime would be required.
```

### 4.2 Superseed Docs Issue

标题：

```text
Would an AI-readable docs integration PR be useful?
```

正文：

```text
I noticed this documentation site uses Nextra 4.6 on Next.js 16. I maintain next-ai-ready and have
a tested Nextra 4 fixture that reuses the existing MDX content to add /llms.txt, page-level
Markdown, and content negotiation without changing the human-facing docs UI:

https://github.com/mustcanbedo/next-ai-ready/tree/main/examples/nextra-docs

As of 2026-09-29, https://docs.superseed.xyz/llms.txt and /index.md return 404. If these endpoints
would be useful, I can prepare a small PR against this repo and keep it limited to the existing
content and deployment model. Would you be open to reviewing that?
```

### 4.3 Morgen Dev Docs Issue

标题：

```text
Offer: small Nextra 4 PR for llms.txt and page Markdown
```

正文：

```text
Your public docs repo is a close match for a compatibility fixture I maintain: Nextra 4 on a
server-rendered Next.js application. The integration reuses the existing MDX source and adds
/llms.txt, page-level Markdown, and Accept: text/markdown while leaving the current Nextra UI alone:

https://github.com/mustcanbedo/next-ai-ready/tree/main/examples/nextra-docs

I verified on 2026-09-29 that https://docs.morgen.so/llms.txt and /index.md currently return 404.
If this is useful to your documentation workflow, I can open a narrowly scoped PR for review. Is
that something you would consider?
```

### 4.4 WebNN Docs Issue

标题：

```text
Question about page-level Markdown for the WebNN docs
```

正文：

```text
I saw that webnn.io already publishes /llms.txt, which is a useful discovery entry point. The docs
also run Nextra 4.6 on Next.js 16. I maintain next-ai-ready, and its Nextra fixture can additionally
serve route-specific Markdown from the same MDX source and support Accept: text/markdown:

https://github.com/mustcanbedo/next-ai-ready/tree/main/examples/nextra-docs

Before proposing code, I wanted to ask whether page-level Markdown is part of your current plan.
If it is useful, I can prepare a small compatibility PR; if the existing llms.txt workflow already
covers your needs, no action is needed.
```

WebNN 文案尚未发布，仍保留为候选草案。

## 5. 发送顺序与停止条件

1. 先发布 Nextra Discussion，等待维护者确认这个集成是否适合其文档范围。
2. 不等待背书也可以分别联系 Superseed 和 Morgen，但每个项目只发送一次初始邀请。
3. WebNN 已有 `llms.txt`，只做增量需求确认，不把已有实现描述为缺陷。
4. 对方回复后才创建外部 PR；没有回复不自动追发。
5. 两个项目明确不需要页面级 Markdown时，停止同类邀请并重新评估产品价值。
6. 第一个仓库外部署完成后，再联系 Inkeep、xyflow 或其他厂商讨论联合案例或赞助。

## 6. 成效记录

发布后在 [`../early-adopter-operations.zh-CN.md`](../early-adopter-operations.zh-CN.md) 更新阶段：

```text
identified -> invited -> engaged -> installing -> verified -> deployed -> retained-7d
```

帖子数量、Stars 和曝光不算采用。只有真实项目完成安装、构建、诊断与部署，才能进入
`verified` 或 `deployed`。

### 6.1 首批发布记录

| 日期 | 对象 | 公开记录 | 当前阶段 | 后续动作 |
|---|---|---|---|---|
| 2026-09-29 | Nextra | [Discussion #5054](https://github.com/shuding/nextra/discussions/5054) | `invited` | 等待回复，不自动追发 |
| 2026-09-29 | Superseed Docs | [Issue #142](https://github.com/superseed-xyz/docs/issues/142) | `invited` | 获得明确同意后才创建 PR |
| 2026-09-29 | Morgen Dev Docs | [Issue #20](https://github.com/morgen-so/morgen-dev-docs/issues/20) | `invited` | 获得明确同意后才创建 PR |

截至 2026-09-29，三条邀请均刚刚发布，外部回复为 0，因此“有效维护者交流”仍为 0。
