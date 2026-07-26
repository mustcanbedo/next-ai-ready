/**
 * Curated FAQ frontmatter per docs page (locale → slug → questions[]).
 * Slugs are paths under content/{locale}/docs/ without .mdx extension.
 */
export const CURATED_FAQ = {
  en: {
    introduction: [
      {
        q: "What is next-ai-ready?",
        a: "An AEO and Agent-API layer for Next.js that adds llms.txt, OpenAPI, MCP, and structured content without changing your UI.",
      },
      {
        q: "How is next-ai-ready different from SEO?",
        a: "SEO targets browsers and search rankings; next-ai-ready targets AI crawlers and agents with artifacts like llms.txt, JSON-LD, and callable actions.",
      },
      {
        q: "Do I need to change my existing pages?",
        a: "No. The framework adds AI routes and build artifacts alongside your current App Router UI.",
      },
    ],
    installation: [
      {
        q: "What are the prerequisites for next-ai-ready?",
        a: "Node.js 20+, Next.js 15+ with App Router, and Zod v4 for actions.",
      },
      {
        q: "Do I need to install @next-ai-ready/* packages separately?",
        a: "No. Install only the next-ai-ready meta package; it re-exports handlers and the CLI.",
      },
      {
        q: "What does next-ai-ready init create?",
        a: "ai-ready.config, route stubs under app/%5Fai-ready/, action and MCP endpoints, and optional instrumentation files.",
      },
    ],
    "guides/quickstart": [
      {
        q: "How long does the quickstart take?",
        a: "About five minutes from install through init, content, build, and doctor.",
      },
      {
        q: "Which endpoints should work after build?",
        a: "/llms.txt, /openapi.json, /tools.json, and per-page Markdown routes when the dev server is running.",
      },
      {
        q: "When should I run next-ai-ready build?",
        a: "After changing MDX content or actions, and before deploy so public/ and .next-ai-ready/ artifacts stay fresh.",
      },
    ],
    "getting-started/project-structure": [
      {
        q: "What files does next-ai-ready add to my project?",
        a: "ai-ready.config, app/%5Fai-ready/ route stubs, actions/, instrumentation files, and build outputs under public/ and .next-ai-ready/.",
      },
      {
        q: "Where does the semantic graph live?",
        a: ".next-ai-ready/graph.json is written by next-ai-ready build and read at runtime by handlers and JSON-LD helpers.",
      },
    ],
    "concepts/two-planes": [
      {
        q: "What are the Knowledge and Capability planes?",
        a: "Knowledge makes content AI-readable (llms.txt, Markdown, JSON-LD). Capability makes features AI-callable (OpenAPI, MCP, actions).",
      },
      {
        q: "Why are the planes separate?",
        a: "Content ingestion and tool execution have different consumers, security models, and build steps.",
      },
    ],
    "concepts/knowledge-plane": [
      {
        q: "What does the Knowledge plane produce?",
        a: "llms.txt, llms-full.txt (with FAQ sections when questions exist), per-page .md and .ai.json routes, JSON-LD, and a semantic graph from MDX.",
      },
      {
        q: "What content formats are scanned?",
        a: "MDX and Markdown files matched by the content globs in ai-ready.config.mjs.",
      },
    ],
    "concepts/capability-plane": [
      {
        q: "What does the Capability plane produce?",
        a: "OpenAPI 3.1, tools.json, ai-plugin.json, MCP tools, and POST /api/actions/<name> endpoints.",
      },
      {
        q: "How do I define a callable feature?",
        a: "Use defineAction with Zod input/output schemas, then run next-ai-ready build to expose it to agents.",
      },
    ],
    "concepts/how-it-works": [
      {
        q: "What happens during next-ai-ready build?",
        a: "Load config, scan MDX, compile semantic nodes, load actions, assemble the graph, and write public/ plus .next-ai-ready/ artifacts.",
      },
      {
        q: "Is the build deterministic?",
        a: "Yes. Same source tree and config produce byte-identical graph and llms output, suitable for CI diffing.",
      },
    ],
    "guides/actions": [
      {
        q: "How do I expose an action to AI agents?",
        a: "Define it with defineAction, mark public or add auth, register in actions/index, and run build.",
      },
      {
        q: "What is whenToUse for?",
        a: "It tells agents when to invoke the action versus alternatives, improving tool selection quality.",
      },
    ],
    "guides/analytics": [
      {
        q: "How do I track AI bot traffic?",
        a: "Use registerAiHooks from next-ai-ready/hooks with onAiRequest for artifact fetches and onInvoke for action calls.",
      },
      {
        q: "Why split instrumentation.ts and instrumentation-node.ts?",
        a: "Next.js loads instrumentation on Edge; Node-only hooks must stay in a separate file dynamically imported on nodejs runtime.",
      },
    ],
    "guides/robots-txt": [
      {
        q: "How do I allow AI crawlers explicitly?",
        a: "next-ai-ready build can emit robots.txt with GPTBot, ClaudeBot, and other AI bots allowed, or use app/robots.ts with aiRobots().",
      },
      {
        q: "Should I advertise llms.txt in robots.txt?",
        a: "Yes. The build adds comments pointing crawlers to /llms.txt and /llms-full.txt when configured.",
      },
    ],
    "guides/mcp-integration": [
      {
        q: "How do MCP clients connect to my site?",
        a: "HTTP transport at /api/mcp when running Next.js, or stdio via npx next-ai-ready mcp for Claude Desktop and Cursor.",
      },
      {
        q: "How do I secure MCP in production?",
        a: "Set NEXT_AI_READY_MCP_TOKEN and send Authorization: Bearer <token> on HTTP requests.",
      },
    ],
    "guides/i18n-ai-urls": [
      {
        q: "How do locale prefixes affect AI routes?",
        a: "Each locale path (e.g. /en/docs/page) becomes a separate route in the semantic graph.",
      },
      {
        q: "Should middleware redirect AI artifact URLs?",
        a: "No. Exclude paths with dots, /api, and _ai-ready from locale middleware so crawlers fetch artifacts without redirects.",
      },
    ],
    "guides/mdx-content": [
      {
        q: "Which frontmatter fields help AI extraction?",
        a: "summary, questions, tags, updatedAt, and author improve llms.txt, FAQ nodes, and JSON-LD quality.",
      },
      {
        q: "Does the docs-site UI execute MDX exports?",
        a: "No. This site uses a simplified Markdown renderer for UI; the build pipeline runs the full semantic compiler.",
      },
    ],
    "api-reference/config": [
      {
        q: "What is ai-ready.config.mjs?",
        a: "The central config for site metadata, content globs, actions path, llms curation, robots policy, and emit toggles.",
      },
      {
        q: "Can I use TypeScript for config?",
        a: "Yes. ai-ready.config.ts is supported via jiti loading.",
      },
    ],
    "api-reference/cli": [
      {
        q: "What CLI commands does next-ai-ready provide?",
        a: "init scaffolds a project; build compiles artifacts; doctor validates wiring; dev watches content; mcp runs stdio MCP.",
      },
      {
        q: "Which package provides the CLI binary?",
        a: "The next-ai-ready meta package. Use npx next-ai-ready or pnpm exec next-ai-ready.",
      },
    ],
    "api-reference/define-action": [
      {
        q: "What is defineAction?",
        a: "A helper to declare type-safe, Zod-validated actions that become OpenAPI operations and MCP tools.",
      },
      {
        q: "When should an action be public?",
        a: "Only when it is safe for unauthenticated agents. Otherwise use auth or keep it private.",
      },
    ],
    "api-reference/define-semantic": [
      {
        q: "What is the semantic export in MDX?",
        a: "An optional export or frontmatter block with summary, topics, questions, and entities for richer graph nodes.",
      },
      {
        q: "Do I need semantic metadata on every page?",
        a: "No, but pages with questions and topics produce better FAQ JSON-LD and llms.txt entries.",
      },
    ],
    "api-reference/with-ai-ready": [
      {
        q: "What does withAiReady() do in next.config?",
        a: "Wraps your Next config to add rewrites for AI routes and optional monorepo outputFileTracingRoot defaults.",
      },
      {
        q: "Can I disable automatic rewrites?",
        a: "Yes. Pass { rewrites: false } to mount AI routes manually under app/%5Fai-ready/.",
      },
    ],
    "decisions/adr-index": [
      {
        q: "What are ADRs in this project?",
        a: "Architecture Decision Records documenting why the framework chose specific designs over alternatives.",
      },
      {
        q: "Are ADRs normative for users?",
        a: "They explain intent and trade-offs; the API reference and doctor checks are the operational source of truth.",
      },
    ],
  },
  zh: {
    introduction: [
      {
        q: "什么是 next-ai-ready？",
        a: "面向 Next.js 的 AEO 与 Agent-API 层，在不改 UI 的前提下提供 llms.txt、OpenAPI、MCP 与结构化内容。",
      },
      {
        q: "next-ai-ready 和 SEO 有什么区别？",
        a: "SEO 面向浏览器与搜索排名；next-ai-ready 面向 AI 爬虫与 Agent，产出 llms.txt、JSON-LD 和可调用 action。",
      },
      {
        q: "需要改动现有页面吗？",
        a: "不需要。框架在现有 App Router 之外增加 AI 路由与构建产物。",
      },
    ],
    installation: [
      {
        q: "安装 next-ai-ready 需要什么环境？",
        a: "Node.js 20+、Next.js 15+ App Router，以及用于 action 的 Zod v4。",
      },
      {
        q: "需要单独安装 @next-ai-ready/* 包吗？",
        a: "不需要。只安装 next-ai-ready 聚合包即可，已包含 handler 与 CLI。",
      },
      {
        q: "next-ai-ready init 会生成什么？",
        a: "ai-ready.config、app/%5Fai-ready/ 路由桩、action/MCP 端点，以及可选的 instrumentation 文件。",
      },
    ],
    "guides/quickstart": [
      {
        q: "快速开始需要多久？",
        a: "约五分钟，完成安装、init、内容、build 和 doctor 验证。",
      },
      {
        q: "build 之后应能访问哪些端点？",
        a: "/llms.txt、/openapi.json、/tools.json，以及 dev 服务器运行时的逐页 Markdown 路由。",
      },
      {
        q: "什么时候需要运行 next-ai-ready build？",
        a: "修改 MDX 或 action 后、部署前，确保 public/ 与 .next-ai-ready/ 产物最新。",
      },
    ],
    "getting-started/project-structure": [
      {
        q: "next-ai-ready 会在项目里添加哪些文件？",
        a: "ai-ready.config、app/%5Fai-ready/ 路由桩、actions/、instrumentation，以及 public/ 与 .next-ai-ready/ 下的构建产物。",
      },
      {
        q: "语义图谱保存在哪里？",
        a: "next-ai-ready build 写入 .next-ai-ready/graph.json，运行时由 handler 与 JSON-LD 助手读取。",
      },
    ],
    "concepts/two-planes": [
      {
        q: "知识平面和能力平面分别是什么？",
        a: "知识平面让内容 AI 可读（llms.txt、Markdown、JSON-LD）；能力平面让功能 AI 可调用（OpenAPI、MCP、action）。",
      },
      {
        q: "为什么要分成两个平面？",
        a: "内容摄取与工具调用的消费者、安全模型和构建步骤不同，分离更清晰。",
      },
    ],
    "concepts/knowledge-plane": [
      {
        q: "知识平面产出什么？",
        a: "llms.txt、llms-full.txt（有 questions 时含 FAQ 块）、逐页 .md/.ai.json 路由、JSON-LD，以及由 MDX 编译的语义图谱。",
      },
      {
        q: "扫描哪些内容格式？",
        a: "ai-ready.config.mjs 中 content glob 匹配的 MDX 与 Markdown 文件。",
      },
    ],
    "concepts/capability-plane": [
      {
        q: "能力平面产出什么？",
        a: "OpenAPI 3.1、tools.json、ai-plugin.json、MCP 工具，以及 POST /api/actions/<name> 端点。",
      },
      {
        q: "如何定义可被调用的功能？",
        a: "用 defineAction 声明 Zod schema，再运行 next-ai-ready build 暴露给 Agent。",
      },
    ],
    "concepts/how-it-works": [
      {
        q: "next-ai-ready build 做了什么？",
        a: "加载配置、扫描 MDX、编译语义节点、加载 action、组装 graph，并写入 public/ 与 .next-ai-ready/。",
      },
      {
        q: "构建是确定性的吗？",
        a: "是。相同源码与配置会产生字节级一致的 graph 与 llms 输出，适合 CI diff。",
      },
    ],
    "guides/actions": [
      {
        q: "如何把 action 暴露给 AI Agent？",
        a: "用 defineAction 定义，设置 public 或 auth，在 actions/index 注册，然后 build。",
      },
      {
        q: "whenToUse 有什么用？",
        a: "告诉 Agent 何时应调用该 action，提升工具选择质量。",
      },
    ],
    "guides/analytics": [
      {
        q: "如何追踪 AI 爬虫访问？",
        a: "通过 next-ai-ready/hooks 的 registerAiHooks，用 onAiRequest 记录产物请求，onInvoke 记录 action 调用。",
      },
      {
        q: "为什么要拆分 instrumentation 文件？",
        a: "Next.js 在 Edge 也会加载 instrumentation；Node 专用 hooks 需在 nodejs 运行时动态 import。",
      },
    ],
    "guides/robots-txt": [
      {
        q: "如何显式允许 AI 爬虫？",
        a: "build 可生成含 GPTBot、ClaudeBot 等规则的 robots.txt，或在 app/robots.ts 使用 aiRobots()。",
      },
      {
        q: "是否应在 robots.txt 中声明 llms.txt？",
        a: "建议声明。构建时可通过注释指向 /llms.txt 与 /llms-full.txt。",
      },
    ],
    "guides/mcp-integration": [
      {
        q: "MCP 客户端如何连接我的站点？",
        a: "Next.js 运行时走 /api/mcp HTTP 传输；Claude Desktop/Cursor 可用 npx next-ai-ready mcp stdio。",
      },
      {
        q: "生产环境如何保护 MCP？",
        a: "设置 NEXT_AI_READY_MCP_TOKEN，HTTP 请求需带 Authorization: Bearer <token>。",
      },
    ],
    "guides/i18n-ai-urls": [
      {
        q: "locale 前缀如何影响 AI 路由？",
        a: "每个 locale 路径（如 /zh/docs/page）在语义图谱中是独立路由。",
      },
      {
        q: "middleware 应 redirect AI 产物 URL 吗？",
        a: "不应。matcher 需排除带点路径、/api、_ai-ready，避免爬虫被重定向。",
      },
    ],
    "guides/mdx-content": [
      {
        q: "哪些 frontmatter 有助于 AI 提取？",
        a: "summary、questions、tags、updatedAt、author 可提升 llms.txt、FAQ 节点与 JSON-LD 质量。",
      },
      {
        q: "docs-site 的 UI 会执行 MDX export 吗？",
        a: "不会。UI 使用简化 Markdown 渲染；完整语义编译由 build 管线完成。",
      },
    ],
    "api-reference/config": [
      {
        q: "ai-ready.config.mjs 是什么？",
        a: "全站配置：site 元数据、content glob、actions 路径、llms 分区、robots 策略与 emit 开关。",
      },
      {
        q: "可以用 TypeScript 写配置吗？",
        a: "可以。支持 ai-ready.config.ts，通过 jiti 加载。",
      },
    ],
    "api-reference/cli": [
      {
        q: "next-ai-ready 有哪些 CLI 命令？",
        a: "init 脚手架、build 编译产物、doctor 校验、dev 监听内容、mcp 启动 stdio 服务。",
      },
      {
        q: "CLI 来自哪个包？",
        a: "next-ai-ready 聚合包。使用 npx next-ai-ready 或 pnpm exec next-ai-ready。",
      },
    ],
    "api-reference/define-action": [
      {
        q: "defineAction 是什么？",
        a: "声明带 Zod 校验的类型安全 action，并生成 OpenAPI 操作与 MCP 工具。",
      },
      {
        q: "何时应设为 public action？",
        a: "仅当对未认证 Agent 也安全时。否则使用 auth 或保持私有。",
      },
    ],
    "api-reference/define-semantic": [
      {
        q: "MDX 中的 semantic 是什么？",
        a: "可选 export 或 frontmatter，包含 summary、topics、questions、entities，用于丰富图谱节点。",
      },
      {
        q: "每页都必须写 semantic 吗？",
        a: "不必须，但有 questions 与 topics 的页面会产生更好的 FAQ JSON-LD 与 llms 条目。",
      },
    ],
    "api-reference/with-ai-ready": [
      {
        q: "withAiReady() 在 next.config 里做什么？",
        a: "包装 Next 配置，添加 AI 路由 rewrite，以及可选的 monorepo outputFileTracingRoot 默认值。",
      },
      {
        q: "可以关闭自动 rewrite 吗？",
        a: "可以。传入 { rewrites: false }，手动在 app/%5Fai-ready/ 挂载路由。",
      },
    ],
    "decisions/adr-index": [
      {
        q: "本项目中的 ADR 是什么？",
        a: "架构决策记录，说明框架为何选择某种设计而非替代方案。",
      },
      {
        q: "ADR 对用户是强制规范吗？",
        a: "ADR 解释意图与权衡；API 参考与 doctor 检查才是运行时的权威来源。",
      },
    ],
  },
};
