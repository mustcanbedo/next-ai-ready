# next-ai-ready Google 自然搜索执行手册

> 建立日期：2026-08-24
> 状态更新：2026-10-01
> 目标：先获得可核验的 Google 收录与曝光，再优化点击和安装转化。

## 1. 当前诊断

截至 2026-09-27，站点已迁移到独立域名 `nextaiready.com`；根域、`www` 和旧
`next-ai-ready.vercel.app` 入口均已配置，后两者通过 `308` 永久跳转到根域。生产 sitemap
包含 50 个真实 HTML 页面；`llms.txt`、`openapi.json` 等机器端点不再混入搜索 sitemap。线上
`robots.txt`、XML sitemap、canonical 和 hreflang 均可访问。核心 URL
抽查结果为：

| URL | 当前状态 |
|---|---|
| `/en` | 已收录 |
| `/zh` | 已收录 |
| `/en/docs/guides/mcp-integration` | 已收录 |
| `/en/docs/guides/robots-txt` | 已收录 |
| `/en/docs/guides/nextjs-llms-txt` | 已收录（2026-10-01 URL Inspection 核验，09-29 抓取） |

PR #25 已从中英文首页、文档入口和 `llms.txt` 增加到目标指南的内部链接，并将机器可读
产物的 freshness 改为内容 `updatedAt`。下一步不是反复提交 sitemap，而是请求一次重新索引，
随后观察 7 至 14 天的抓取、收录和查询变化。

`Agent Readability 100/100` 只代表机器可读取，不代表 Google 已收录、获得排名或产生点击。

### 2026-09-29 核心教程收录推进

Search Console 对 `/en/docs/guides/nextjs-llms-txt` 的索引检查仍显示“已发现 - 尚未编入索引”；
实时网址测试已通过，并显示“网址可编入 Google 索引”。发现来源包括生产 sitemap 与
`/en/docs/api-reference/cli`，说明不存在 robots、响应状态或 `noindex` 阻塞。

本轮不增加竞争 URL，而是强化既有主题集群：

1. 安装页与 CLI 参考页增加到核心教程的上下文链接。
2. Nextra 与 Fumadocs 分支指南增加返回框架无关教程的链接。
3. 核心教程增加生产配置、内容源、路由 smoke 与可执行 Nextra 夹具的可核验证据。
4. 明确官方文档站是第一方 dogfood，不把它表述成外部客户案例。
5. 对新增链接和证据增加 Markdown 路由 smoke 断言。

生产构建已通过：50 条内容路由与 58 个静态页面成功生成；文档路由、Markdown、MCP、缺页
契约和 AI 产物 smoke 全部通过，`doctor` 为 100/100。发布后只请求一次核心教程索引，再按
7 天和 14 天窗口观察；在数据到达前不改 URL，也不创建同义文章。

### 2026-10-01 检查与修复队列

核心 llms.txt 教程已收录，用户 canonical 与 Google canonical 一致。生产 50/50 个 sitemap
HTML 页面均返回 200，title、description、H1、canonical 与语言 alternate 正常。固定工具
`@vercel/agent-readability@0.5.0` 仍为 100/100，但不是自然搜索排名或流量成绩。

新域名效果报告当前只覆盖 2026-09-26 至 09-28：1 次曝光、0 点击、平均排名 83；显示的查询
为 `next-mdx-remote`，页面为 MDX 教程。旧 Vercel 资源实际覆盖 08-23 至 09-28：221 次曝光、
2 次点击、CTR 0.9%、平均排名 45.3。两套资源不直接相加，也不把一次曝光解释为增长趋势。
本次 Google `Next.js llms.txt` 第一页 10 条自然结果未出现本站。新资源的覆盖率与外链报告
仍在处理数据，不能推断已收录总量或外链数；PageSpeed API 返回 429，本次没有性能评分。

本轮只修确定的问题，保留既有标题和 URL：

1. SDK 根据图谱中的真实页面生成面包屑，移除 90 个失效目录引用（12 个唯一目录）。
2. 默认 Knowledge-only 教程只验证真实内容端点；OpenAPI 放到显式 Capability 流程。
3. 对齐 MDX 示例文件和验证 URL，修复 ADR-006 链接，正文内链保留当前语言。
4. 在文档站生产路由 smoke 中检查所有内容页的面包屑、内链目标和锚点。

上述修复属于当前分支，尚未证明在生产生效；SDK 修复随后续 patch 发布。本轮不再次请求索引。
MDX 内容实验的 14 天复盘点是 2026-10-10；域名迁移的 7/14 天观察点为 10-04 与 10-11。
部署后核对失效引用是否清零，再看新资源的查询、曝光、点击与真实安装，不承诺短期排名提升。

面包屑设计参考 [Google Breadcrumb 规范](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)，
不把 URL 中每一层目录假定为真实可导航页面。

#### 本轮本地验收

- 新的路由检查在旧生产构建上先复现了失效面包屑；修复后 50 个内容页的面包屑、内链和锚点全部通过。
- 文档站 Next.js 16.2.6 生产构建成功，生成 58 个静态页面；Markdown、MCP 认证/检索、HTML 404 和 Agent 缺页恢复回归通过。
- semantic 新增 9 项面包屑测试，并对错误终点、重复 URL、非祖先条目及 HTML `noindex` 增加 SEO 检查回归；Next 集成的 99 项测试通过。
- 十个包的公共 API、导出与打包检查通过；30 条双语检索评测未回退；README 与文档站版本同步检查通过。
- 在仓库外临时目录，用本轮本地 tarball 完成 npm 干净安装与 Next.js 16.3.8 生产构建。这是兼容性夹具，不计为真实外部采用。
- 将四个中英文教程中的示例原文提取到该应用：`/docs/example.md` 与 `/docs/installation.md` 均返回 200、Markdown 类型和预期正文，没有误返回缺页恢复内容。
- 默认 Knowledge-only 模式下 `/openapi.json` 为 404；按教程安装能力依赖并运行 `init --with-capabilities` 后，生产构建通过，`/openapi.json`、`/tools.json` 均返回包含公开 `ping` 的 JSON。

以上是本地候选代码的验证，不能代替合入后的生产复测，也不能推断 Google 排名提升。

## 1.1 当前自然搜索基线（2026-09-26）

Search Console 过去三个月的实际数据（该资源从 2026-08-23 起有数据）：

| 指标 | 当前值 |
|---|---:|
| 点击 | 2 |
| 曝光 | 210 |
| CTR | 1.0% |
| 平均排名 | 47.4 |

当前页面机会按影响排序：

| 页面 | 点击 | 曝光 | 平均排名 | 决策 |
|---|---:|---:|---:|---|
| `/en/docs/guides/mdx-content` | 0 | 94 | 73.3 | 保留 URL，围绕 `content collections mdx` 重写搜索意图与正文 |
| `/en` | 2 | 49 | 9.2 | 保留已有排名，明确首页类别标题并强化安装入口 |
| `/en/docs/guides/robots-txt` | 0 | 21 | - | 暂不重写，等待更多查询数据 |
| `/en/docs/guides/fumadocs-ai-ready` | 0 | 16 | - | 暂不重写，等待更多查询数据 |

Search Console 当前公开显示的查询包括 `vercel ai ready`（7 次曝光）与
`content collections mdx`（3 次曝光）；其余低频查询受隐私阈值影响未逐条显示。不能把
“未显示”误判为“没有查询”。

本轮实验只修改已获得信号的页面，不创建竞争 URL：

1. 将 `/en/docs/guides/mdx-content` 改为完整的 Next.js MDX content collection 实战页。
2. 从中英文首页增加到该页的直接内链。
3. 将首页搜索标题从抽象的 “AI Layer” 改为明确的 `llms.txt and MCP for Next.js`。
4. 将底部 CTA 从泛“阅读文档”改为“安装并验证”，直接进入安装页。

首次复盘时间为部署后 14 天，第二次为 28 天。主要观察 MDX 页的平均排名、非品牌曝光和
自然点击；在 14 天观察窗口结束前，不再次改标题、不改 URL、不创建同义页面。第一阶段目标是
让该页平均排名从 73.3 提升到 50 以内，并产生首个非品牌点击。

## 2. Search Console 接入与域名迁移

旧 Vercel 子域已添加并验证 **URL-prefix property**，用于保留迁移前的历史数据：

```text
https://next-ai-ready.vercel.app/
```

新 canonical 为：

```text
https://nextaiready.com/
```

新域名已新增为 **Domain property**：

```text
sc-domain:nextaiready.com
```

该 property 已于 2026-09-28 通过域名提供商的 DNS TXT 记录完成所有权验证。验证记录必须继续
保留在 Spaceship DNS；删除后可能失去 Search Console 所有权。Domain property 覆盖根域、
`www` 及其他协议或子域变体，因此不复用旧 URL-prefix property 的 HTML 验证文件。

仓库中的 `public/googleca0270c5e18afbba.html` 继续用于旧 Vercel URL-prefix property，不能将其
视为新域名的验证凭据。旧 property 不删除，用于核对迁移前后的曝光和点击。

如果未来改用 HTML tag 验证，只复制 `content` 中的 token，不要复制整个 `<meta>` 标签，并在
Vercel 项目的 Production 环境增加：

```text
GOOGLE_SITE_VERIFICATION=<Google 提供的 token>
```

重新部署后，页面会通过 Next.js Metadata API 输出：

```html
<meta name="google-site-verification" content="..." />
```

生产页面会通过 Next.js Metadata API 输出该标签。该 token 不是 API 密钥，但仍应由项目设置
统一维护，不要硬编码进仓库。当前 Domain property 已通过 DNS 验证，不需要再增加 HTML tag。

## 3. 提交与请求收录

旧 property 的 sitemap 保留历史记录；新 Domain property 已于 2026-09-28 提交并成功读取包含
50 个可索引 HTML 页面的 sitemap：

```text
https://nextaiready.com/sitemap.xml
```

使用 URL Inspection 依次检查以下核心页面；只有状态发生变化或内容有实质更新时才重新请求：

1. `https://nextaiready.com/en`
2. `https://nextaiready.com/zh`
3. `https://nextaiready.com/en/docs/guides/nextjs-llms-txt`
4. `https://nextaiready.com/en/docs/guides/mcp-integration`
5. `https://nextaiready.com/en/docs/guides/robots-txt`

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

## 7. 独立域名迁移（基础设施已完成）

已于 2026-09-27 完成基础设施迁移：

- `nextaiready.com` 已绑定 Vercel Production 并通过 HTTPS 验证。
- `www.nextaiready.com` 已通过 `308` 永久跳转到根域。
- `next-ai-ready.vercel.app` 已通过 `308` 永久跳转到根域。
- Vercel Production 已设置 `SITE_URL=https://nextaiready.com`。
- README、npm metadata、站点 canonical 与机器可读产物已切换到新域名。
- Search Console Domain property `nextaiready.com` 已通过 DNS TXT 验证。
- `https://nextaiready.com/sitemap.xml` 已提交成功，Google 已发现 50 个页面。

迁移后的持续工作：

1. 对核心 5 页各请求一次索引，并确认 Google 识别的新 canonical。
2. 迁移后第 7、14、28 天对比新旧 property 的曝光、点击和索引覆盖率。

旧 property 和旧域名不能删除；它们分别承担历史数据保留与永久重定向职责。
