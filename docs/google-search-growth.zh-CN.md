# next-ai-ready Google 自然搜索执行手册

> 建立日期：2026-08-24
> 状态更新：2026-10-07
> 目标：先获得可核验的 Google 收录与曝光，再优化点击和安装转化。

## 1. 当前诊断

截至 2026-09-27，站点已迁移到独立域名 `nextaiready.com`；根域、`www` 和旧
`next-ai-ready.vercel.app` 入口均已配置，后两者通过 `308` 永久跳转到根域。生产 sitemap
包含 50 个真实 HTML 页面；`llms.txt`、`openapi.json` 等机器端点不再混入搜索 sitemap。线上
`robots.txt`、XML sitemap、canonical 和 hreflang 均可访问。2026-10-07 读取新资源
`sc-domain:nextaiready.com` 的索引报告，报告更新到 10-04，不能当作当天实时状态：

| 项目 | 最新可核验状态 |
|---|---|
| 已收录 | 8 页：英文 6 页、中文 2 页 |
| 已发现 - 尚未编入索引 | 42 页：英文 19 页、中文 23 页，历史抓取日期均不适用 |
| 重定向排除 | 2 个根地址入口，按语言跳转到首页；不要求源地址收录 |
| sitemap | 10-07 最近读取成功，发现 50 个 HTML 页面 |
| `/en/docs/guides/nextjs-llms-txt` | 已收录，正常 Googlebot 09-29 抓取，Google canonical 与该 URL 一致 |
| `/zh`、中文安装页与中文主教程 | 历史未抓取；10-07 Google 实时测试成功且可编入索引，不等于已收录 |

此前概览把中文首页、MCP 与 robots 教程写成已收录，最新新域名清单不支持该表述，已纠正。
下面的历史记录保留原检测日期，不与当前状态或旧域名数据混合。

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

### 2026-10-02 文档站对标：学习结构，不推断别人的流量

选择与本站读者任务相近的现行官方教程，而不是仅按品牌或 Star 数选择。搜索结果样本中可见
Next.js MDX 与 Fumadocs 内容文档；这不是 Google 排名报告，也没有这些站点的私有 GSC 数据。
Nuxt SEO 作为相邻生态的结构参考。品牌、外链、历史域名等因素没有被控制，不能把它们的搜索
可见性归因于某个 UI 或内容格式。

| 参考页面 | 可观察的方法 | 本站判断 |
|---|---|---|
| [Next.js MDX](https://nextjs.org/docs/app/guides/mdx) | 任务型标题，依赖、配置、必需文件、渲染路径逐段展开；链接可运行模板；展示维护日期 | 本站已有问题型教程与代码证据，但编号步骤被渲染成段落，正文维护日期尚不可见 |
| [Fumadocs Quick Start](https://www.fumadocs.dev/docs) | 明示前置环境，新项目与既有项目分路；给首个内容文件、启动命令及验收 URL | 保留本站 Knowledge-only 最小安装路径，不把可选 MCP 塞入必经流程；逐页检查步骤后的预期输出 |
| [Nuxt AI Ready 安装](https://nuxtseo.com/docs/ai-ready/getting-started/installation) | 配置之后立即给 Markdown 请求与构建产物检查；解释部署模式边界 | 本站已有 curl、生产 smoke 与缺页恢复检查；不为“学习”再复制一套同义教程 |
| [Nuxt AI 内容专题](https://nuxtseo.com/learn-seo/nuxt/launch-and-listen/ai-optimized-content) | 学习目标、具体文件示例、检查清单与相关任务互相连接 | 维护已有 llms.txt 核心指南及 Nextra/Fumadocs 分支的上下文内链，不新增竞争 URL |

以上均为文档页面观察，未在本轮安装运行其他框架的示例。Google 的
[实用内容指导](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
支持清楚交代来源、作者和制作方法；[SEO 入门指南](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
强调清晰标题、易读组织和有上下文的链接。它们没有承诺“加日期、加目录、加 llms.txt 即涨排名”。

按确定性与读者收益安排，而非声称已测得增长：

| 优先级 | 动作 | 状态与验收 |
|---|---|---|
| 1 | 修复真实阅读障碍 | 本轮候选：编号步骤输出 `ol/li`，保留起始编号、行内格式和续行；页头显示已有 author/updatedAt，无字段则不补造；单元与生产路由回归保护 |
| 2 | 让安装结果可自证 | 已有命令与预期正文；下一轮用新读者视角逐页复走，不通过就修最小步骤，不仅展示 100/100 技术分 |
| 3 | 补真实案例与复现证据 | 自有 Nextra 夹具和截图已在 PR #48 合入；优先获得一次仓库外复用及授权引用，不标成外部客户成功案例 |
| 4 | 按数据修主题缺口 | 当前 MDX 标题与 URL 实验保持至 10-10；复盘查询/页面的曝光、点击与安装，先改善已有相关页面；重复标题、批量 AI 文章、付费关键词工具暂不引入 |

本轮仅改变 HTML 阅读呈现，不改 SDK API、npm 版本、正文标题、URL 或维护日期，不重复请求
索引。日期取源文件的真实维护记录，不使用当前时间或构建时间。与 PR #49 的选型内容独立，
本地通过不等于已部署，也不能把这次展示修复当成无干扰的流量因果实验。

本地验收：八项列表渲染测试、五项 SEO 引用测试、50 个内容页的生产路由及维护信息检查通过；
Next.js 16.2.6 构建生成 58 个静态页面，Markdown、MCP 鉴权/检索、404、截图加载和产物同步
回归通过。修改的 TS/TSX ESLint 无错误或警告，现有 alpha.21 发布文档与生成产物未漂移。
浏览器实际核验 1280px 桌面与 390/320px 中英文手机页面，无整页横向溢出，维护信息可换行；
本轮没有升级为完整 Markdown 渲染器，嵌套列表与复杂多行块仍不在支持范围内。

### 2026-10-07 迁移信号与抓取效率实验

50 个 sitemap 页面只读 HTTP 检查均返回 200 HTML、可索引指令、自指向 canonical 与
服务端正文；三条中文优先 URL 的 Google 实时测试也通过。人工处置和安全问题报告未检测到
问题。这些结果没有发现基础访问阻碍，但不能排除所有质量因素，也不能代替正常索引爬虫抓取。

旧资源的“地址更改”前置验证未通过，尚未完成迁移通知。已授权的旧域名 308 → 301
兼容性测试也没有解决验证失败，现已恢复并核验为 308；没有改 DNS、新域名语言选择或防护。
旧首页和示例文档 GET 均可到达新站 200 HTML，但不等于迁移通知工具已通过。Google 的
[站点迁移指南](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
支持永久重定向，并建议域名迁移使用地址更改工具。状态码测试不是根因确认，也不能
替代正常抓取和收录；停止无新证据的反复切换，通知是否验证通过须单独记录。

GSC 抓取统计更新到 10-05：2,038 次请求、平均响应 128ms，主机状态没有问题。“其他”
文件类型有 1,697 次请求；首屏检查的 10 个样本均是成功的 `_rsc` 变体，不能推断整个类别
都是 RSC，更不能据此确认 42 页未收录的原因。

已合入的改动只关闭文档侧栏列表的自动预取，保留 HTML `a[href]`、语言路径、活动样式和客户端
导航，顶部导航保持原策略。根据 [Next.js 预取说明](https://nextjs.org/docs/app/guides/prefetching)，
代价是点击侧栏时才请求下一页数据；不屏蔽 `_rsc`、JavaScript 或 Markdown，不给正常 HTML
加 `noindex`。

| 同一中文主教程的本地生产浏览器样本 | 修改前 | 修改后 |
|---|---:|---:|
| 自动 RSC 预取请求 | 72 | 28 |
| 预取路径数（去重） | 17 | 6 |

条件为同一 Chrome、1497 × 805 视口、完整加载 `/zh/docs/guides/nextjs-llms-txt`，测量前
不点击或滚动，使用本地请求代理记录。每组仅一次，未使用隔离浏览器上下文控制缓存或固定计时，
不能解释为统计结论、Googlebot 实验或收录提升。剩余预取来自保留策略的顶部导航。

本地验收：新增两项双语侧栏回归；完整文档 smoke 的 10 项 Vitest 与 17 项 Node 测试、
50 个内容页路由检查通过；Next.js 16.2.6 生产构建成功；实际中英文点击与语言切换正常。
PR #55 已合入 main，生产部署为 Ready，并核验中英文导航与缺页契约。没有新增生产请求量
对照，不将本地样本写成线上收益；不改 SDK API、npm 版本、页面标题或 URL。

后续单页历史检查仍显示中文安装页和主教程“已发现 - 尚未编入索引”，抓取时间不适用；
引荐来源分别包含已收录的英文对应页，不是缺少发现入口。npm `0.1.0-alpha.22` 的官网
元数据已指向新域名，但 README 正文没有直达安装页或主教程的入口。

本轮只在主包 README 增加中英文安装与实战教程的绝对链接，说明默认 Knowledge-only 与
可选能力功能的边界。此改动改善包到文档的接入路径，不保证收录或排名，不增加竞争 URL。
源码合入不等于 npm README 已更新：随下一次获准的包发布一并生效，不为这几条链接单独
提升版本或触发发布。当前已收录页面与站内导航保持不变，不重复请求索引。

下一步按优先级：核对现有生态引用是否指向新域名，补真实可复用案例；迁移工具的失败
单独保留证据排查。中文首页、安装页和主教程仍是优先收录对象。部署后 7-14 天对照正常爬虫
抓取日期、待抓取页数、收录与查询变化；如果转为“已抓取 - 尚未编入索引”，再单页诊断
Google canonical、重复内容和独特价值。观察日期不是收录期限，不反复提交 sitemap 或索引请求。

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
