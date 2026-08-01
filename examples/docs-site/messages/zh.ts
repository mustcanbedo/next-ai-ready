const zh = {
  nav: {
    docs: "文档",
    quickstart: "快速开始",
    api: "API",
    github: "GitHub",
  },
  hero: {
    badge: "npm alpha.14 · 文档跟随 main",
    title: "Next.js 的\nAI 基础设施层",
    subtitle:
      "让 AI 更容易发现和读取你的内容，并通过明确授权的接口调用功能。一个配置文件，UI 零改动。",
    cta: "开始使用",
    install: "pnpm add next-ai-ready@alpha",
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
  features: {
    heading: "AI 从你的站点获取一切所需",
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
          "使用类型安全的 Schema 定义 Action，自动生成 OpenAPI 端点和 MCP 工具，任何 Agent 均可调用。",
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
    subtitle: "60 秒内即可开始。",
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
