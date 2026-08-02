const zh = {
  nav: {
    docs: "文档",
    quickstart: "快速开始",
    api: "API",
    github: "GitHub",
  },
  hero: {
    badge: "npm alpha.17 · 文档跟随 main",
    title: "next-ai-ready",
    subtitle:
      "约 10 分钟，为 Next.js App Router 站点增加供 AI 工具发现和读取的内容入口。需要时，再添加经过鉴权的 Agent Action。",
    cta: "开始 10 分钟接入",
    setup: "pnpm add next-ai-ready zod@^4\npnpm exec next-ai-ready init\npnpm exec next-ai-ready build\npnpm exec next-ai-ready doctor --score",
    success: "当 doctor 显示 0 个错误，且 llms.txt 已列出你的内容时，即完成接入。",
  },
  verification: {
    label: "第三方工具基线",
    score: "100/100",
    title: "Vercel Agent Readability",
    description:
      "生产文档站于 2026 年 8 月 1 日使用固定版本的开源 CLI v0.5.0，通过全部 25 项检查。",
    evidence: "查看机器可读原始结果",
    workflow: "查看定期审计",
    disclaimer: "该分数仅衡量技术可读性，不保证排名、收录或引用。",
  },
  proof: {
    label: "线上生产证据",
    title: "这个文档站正在使用 next-ai-ready",
    description:
      "直接检查当前生产部署提供的真实产物。普通网页、AI 可读内容和 Agent 能力均来自同一个仓库。",
    source: "查看生产站源码",
    help: "申请免费接入协助",
    capacity: "首批开放 5 个接入名额",
    items: [
      { href: "/llms.txt", label: "内容发现", value: "/llms.txt" },
      { href: "/zh/docs/installation.md", label: "页面 Markdown", value: "/:page.md" },
      { href: "/openapi.json", label: "能力描述", value: "/openapi.json" },
      { href: "/tools.json", label: "工具清单", value: "/tools.json" },
    ],
  },
  features: {
    heading: "为 Next.js 站点建立 AI 可读基础",
    subheading: "现有 Next.js 应用自动获得完整的 AI 接口 —— 发现、检索、工具调用。",
    items: [
      {
        title: "AI 内容发现",
        description:
          "通过 llms.txt、逐页 Markdown 和结构化元数据，为 AI 消费者提供清晰的发现与读取路径。",
        icon: "search",
      },
      {
        title: "Agent 工具调用",
        description:
          "使用类型安全的 Schema 定义并显式暴露 Action；兼容的 Agent 可在你的鉴权策略下调用。",
        icon: "zap",
      },
      {
        title: "语义图谱",
        description:
          "MDX 页面编译为丰富的知识图谱，AI 系统获取摘要、主题、问答对和语义关系。",
        icon: "network",
      },
      {
        title: "MCP 协议",
        description:
          "一等公民的 MCP 服务器支持。Claude Desktop、Cursor 及任何 MCP 客户端可直连你的站点。",
        icon: "plug",
      },
      {
        title: "零锁定",
        description:
          "仅使用开放标准 —— OpenAPI、JSON-LD、llms.txt、MCP。兼容任何 AI 提供商。MIT 许可。",
        icon: "unlock",
      },
      {
        title: "开发者体验",
        description:
          "init、build、doctor CLI。类型安全配置。CI 友好检查。开发时热更新。适用于任何 Next.js 应用。",
        icon: "terminal",
      },
    ],
  },
  planes: {
    knowledge: {
      label: "知识平面",
      title: "AI 可以阅读你的内容",
      description:
        "MDX 页面编译为语义图谱，AI 搜索引擎通过 llms.txt、Markdown 和 JSON-LD 获取结构化、可引用的内容。",
    },
    capability: {
      label: "能力平面",
      title: "AI 可以调用你的功能",
      description:
        "使用 Zod Schema 定义 Action，自动生成 OpenAPI 端点、MCP 工具和 tools.json —— 一次定义，多处暴露。",
    },
  },
  artifacts: {
    heading: "自动生成的产出物",
    items: [
      { path: "/llms.txt", label: "LLM 站点索引" },
      { path: "/openapi.json", label: "OpenAPI 3.1 规范" },
      { path: "/api/mcp", label: "MCP 服务器" },
      { path: "/<page>.md", label: "逐页 Markdown" },
      { path: "/tools.json", label: "工具清单" },
      { path: "JSON-LD", label: "结构化数据" },
    ],
  },
  cta: {
    title: "准备让你的站点 AI-Ready？",
    subtitle: "约 10 分钟完成可验证的基础接入。",
    button: "阅读文档",
  },
  footer: {
    license: "MIT 许可证",
    builtWith: "基于 Next.js 构建",
  },
  docs: {
    sidebar: {
      "getting-started": "快速上手",
      concepts: "核心概念",
      guides: "指南",
      "api-reference": "API 参考",
      decisions: "架构决策",
    },
  },
};

export default zh;
