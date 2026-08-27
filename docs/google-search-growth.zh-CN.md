# next-ai-ready Google 自然搜索执行手册

> 建立日期：2026-08-24
> 状态更新：2026-08-26
> 目标：先获得可核验的 Google 收录与曝光，再优化点击和安装转化。

## 1. 当前诊断

截至 2026-08-26，Search Console 的 URL-prefix property 已验证，sitemap 提交成功并发现
52 个页面。线上 `robots.txt`、XML sitemap、canonical 和 hreflang 均可访问。核心 URL
抽查结果为：

| URL | 当前状态 |
|---|---|
| `/en` | 已收录 |
| `/zh` | 已收录 |
| `/en/docs/guides/mcp-integration` | 已收录 |
| `/en/docs/guides/robots-txt` | 已收录 |
| `/en/docs/guides/nextjs-llms-txt` | 已发现，尚未收录 |

PR #25 已从中英文首页、文档入口和 `llms.txt` 增加到目标指南的内部链接，并将机器可读
产物的 freshness 改为内容 `updatedAt`。下一步不是反复提交 sitemap，而是请求一次重新索引，
随后观察 7 至 14 天的抓取、收录和查询变化。

`Agent Readability 100/100` 只代表机器可读取，不代表 Google 已收录、获得排名或产生点击。

## 2. Search Console 首次接入（已完成）

当前站点使用 Vercel 子域，已添加 **URL-prefix property**：

```text
https://next-ai-ready.vercel.app/
```

选择 HTML tag 验证后，只复制 `content` 中的 token，不要复制整个 `<meta>` 标签。在 Vercel
项目的 Production 环境增加：

```text
GOOGLE_SITE_VERIFICATION=<Google 提供的 token>
```

重新部署后，页面会通过 Next.js Metadata API 输出：

```html
<meta name="google-site-verification" content="..." />
```

生产页面已通过该标签完成 Verify。该 token 不是 API 密钥，但仍应
由项目设置统一维护，不要硬编码进仓库。

## 3. 提交与请求收录

Sitemaps 已提交并成功发现 52 个页面：

```text
https://next-ai-ready.vercel.app/sitemap.xml
```

使用 URL Inspection 依次检查以下核心页面；只有状态发生变化或内容有实质更新时才重新请求：

1. `https://next-ai-ready.vercel.app/en`
2. `https://next-ai-ready.vercel.app/zh`
3. `https://next-ai-ready.vercel.app/en/docs/guides/nextjs-llms-txt`
4. `https://next-ai-ready.vercel.app/en/docs/guides/mcp-integration`
5. `https://next-ai-ready.vercel.app/en/docs/guides/robots-txt`

不要批量反复请求。只有页面有真实内容更新或修复抓取问题时才重新提交。

## 4. 每周指标

每周一记录过去 7 天和过去 28 天：

| 指标 | 来源 | 第一阶段成功标准 |
|---|---|---|
| 已收录页面 | Search Console Pages | 核心 5 页全部收录 |
| 非品牌曝光 | Search Console Performance | 连续两周增长 |
| 自然点击 | Search Console Performance | 从 0 产生首批真实点击 |
| 有曝光的查询数 | Search Console Queries | 至少 10 个非品牌查询 |
| 教程页 CTR | Search Console Pages | 有足够曝光后再优化标题与摘要 |
| 自然访问 | Vercel Analytics | 与 Search Console 点击趋势一致 |
| npm 下载与 GitHub Star | npm/GitHub | 记录但不归因到单次曝光 |

判断顺序必须是：`已抓取 -> 已收录 -> 有曝光 -> 有点击 -> 有安装`。在没有曝光前优化 CTA
没有意义，在没有收录前继续讨论排名也没有意义。

## 5. 内容队列

优先维护明确问题，而不是泛产品介绍：

1. Next.js App Router 如何添加 `llms.txt` 与逐页 Markdown。
2. 如何为 Next.js 添加 MCP Server，并保护生产 HTTP 端点。
3. Next.js `robots.txt` 如何区分 Googlebot 与 AI crawlers。
4. Fumadocs 如何复用 MDX 内容生成 `llms.txt`。
5. Nextra 如何提供 Markdown 与 AI 发现端点。

每篇内容必须包含直接答案、可运行命令、生产验证方法、常见错误和相关内链。英文原文作为主
分发版本；中文版本服务中文搜索和小红书内容承接。

## 6. 外部分发

内容合入并部署后再分发，所有渠道链接必须指向生产 canonical：

- Reddit：技术问题、实现取舍和真实验证结果。
- X：一个结果型主帖加一个实现线程。
- 小红书：中文问题、30-45 秒录屏和完整教程链接。
- DEV/Hashnode：可被 Google 抓取的英文实战摘要；支持 canonical 时指回本站原文。
- GitHub README、npm README 和相关 Awesome 列表：链接到最匹配的教程，而不是只链接首页。

禁止把完全相同的全文同时发布到多个没有 canonical 的站点。外部内容应提供足够独立价值，
并把完整代码、更新记录和验证结果留在原始教程。

## 7. 后续域名决策

Vercel 子域可以被 Google 收录，不是当前阻塞项。获得首批曝光后再评估独立域名。迁移时必须
一次完成 canonical、重定向、Search Console 新 property、sitemap、README、npm metadata 和
机器可读产物更新，避免把尚未形成的搜索信号再次拆散。
