const en = {
  nav: {
    docs: "Docs",
    quickstart: "Quickstart",
    api: "API",
    github: "GitHub",
  },
  hero: {
    badge: "npm alpha.15 · docs track main",
    title: "next-ai-ready",
    subtitle:
      "Add AI-readable discovery and Markdown endpoints to a Next.js App Router site in about 10 minutes. Add authenticated agent actions later, when you need them.",
    cta: "Start the 10-minute setup",
    setup: "pnpm add next-ai-ready@alpha zod@^4\npnpm exec next-ai-ready init\npnpm exec next-ai-ready build\npnpm exec next-ai-ready doctor --score",
    success: "Done when doctor reports 0 errors and llms.txt lists your content.",
  },
  verification: {
    label: "Third-party tool baseline",
    score: "100/100",
    title: "Vercel Agent Readability",
    description:
      "The production documentation passed all 25 checks with the pinned open-source CLI v0.5.0 on August 1, 2026.",
    evidence: "View machine-readable evidence",
    workflow: "View recurring audit",
    disclaimer:
      "Technical readability score only. It does not guarantee ranking, indexing, or citation.",
  },
  proof: {
    label: "Live production proof",
    title: "This documentation site runs on next-ai-ready",
    description:
      "Inspect the exact outputs served by this production deployment. The regular interface, AI-readable content, and agent capabilities are built from the same repository.",
    source: "View the production source",
    items: [
      { href: "/llms.txt", label: "Discovery", value: "/llms.txt" },
      { href: "/en/docs/installation.md", label: "Page Markdown", value: "/:page.md" },
      { href: "/openapi.json", label: "Capabilities", value: "/openapi.json" },
      { href: "/tools.json", label: "Tool manifest", value: "/tools.json" },
    ],
  },
  features: {
    heading: "AI-readable foundations for your Next.js site",
    subheading:
      "Your existing Next.js app gains a complete AI interface — discovery, retrieval, and tool execution.",
    items: [
      {
        title: "AI Search Discovery",
        description:
          "Give AI consumers clean discovery and retrieval paths with llms.txt, per-page Markdown, and structured metadata.",
        icon: "search",
      },
      {
        title: "Agent Tool Calling",
        description:
          "Define explicitly exposed actions with type-safe schemas. Compatible agents can invoke them under your authentication policy.",
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
    subtitle: "Complete the verified setup in about 10 minutes.",
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
      "api-reference": "API Reference",
      decisions: "Decisions",
    },
  },
};

export default en;
