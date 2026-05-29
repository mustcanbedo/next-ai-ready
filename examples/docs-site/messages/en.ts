const en = {
  nav: {
    docs: "Docs",
    quickstart: "Quickstart",
    api: "API",
    github: "GitHub",
  },
  hero: {
    badge: "v0.1.0-alpha — now on npm",
    title: "The AI Layer\nfor Next.js",
    subtitle:
      "Make your site readable by AI search engines and callable by AI agents. One config file, zero changes to your UI.",
    cta: "Get Started",
    install: "pnpm add next-ai-ready",
  },
  features: {
    heading: "Everything AI needs from your site",
    subheading:
      "Your existing Next.js app gains a complete AI interface — discovery, retrieval, and tool execution.",
    items: [
      {
        title: "AI Search Discovery",
        description:
          "Your content appears in ChatGPT, Perplexity, Google AI Overviews. Structured llms.txt and per-page Markdown make you citable.",
        icon: "search",
      },
      {
        title: "Agent Tool Calling",
        description:
          "Define actions with type-safe schemas. They become OpenAPI endpoints and MCP tools that any agent can invoke.",
        icon: "zap",
      },
      {
        title: "Semantic Graph",
        description:
          "Your MDX pages compile into a rich knowledge graph. AI systems get summaries, topics, Q&A pairs, and relationships.",
        icon: "network",
      },
      {
        title: "MCP Protocol",
        description:
          "First-class MCP server support. Claude Desktop, Cursor, and any MCP client can connect to your site directly.",
        icon: "plug",
      },
      {
        title: "Zero Lock-in",
        description:
          "Open standards only — OpenAPI, JSON-LD, llms.txt, MCP. Works with any AI provider. MIT licensed.",
        icon: "unlock",
      },
      {
        title: "Developer Experience",
        description:
          "init, build, doctor CLI. Type-safe config. CI-friendly checks. Hot reload in development. Works with any Next.js app.",
        icon: "terminal",
      },
    ],
  },
  planes: {
    knowledge: {
      label: "Knowledge Plane",
      title: "AI can read your content",
      description:
        "MDX pages are compiled into a semantic graph. AI search engines get structured, citable content via llms.txt, Markdown, and JSON-LD.",
    },
    capability: {
      label: "Capability Plane",
      title: "AI can call your features",
      description:
        "Define actions with Zod schemas. They become OpenAPI endpoints, MCP tools, and tools.json manifests — all from one definition.",
    },
  },
  artifacts: {
    heading: "What gets generated",
    items: [
      { path: "/llms.txt", label: "LLM site index" },
      { path: "/openapi.json", label: "OpenAPI 3.1 spec" },
      { path: "/api/mcp", label: "MCP server" },
      { path: "/<page>.md", label: "Per-page Markdown" },
      { path: "/tools.json", label: "Tools manifest" },
      { path: "JSON-LD", label: "Structured data" },
    ],
  },
  cta: {
    title: "Ready to make your site AI-ready?",
    subtitle: "Get started in under 60 seconds.",
    button: "Read the documentation",
  },
  footer: {
    license: "MIT License",
    builtWith: "Built with Next.js",
  },
  docs: {
    sidebar: {
      "getting-started": "Getting Started",
      concepts: "Concepts",
      guides: "Guides",
      api: "API Reference",
    },
  },
};

export default en;
