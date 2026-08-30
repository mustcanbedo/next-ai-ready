import type {CSSProperties, ReactNode} from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
} from "remotion";

type Locale = "en" | "zh";
type Format = "landscape" | "vertical";
type Variant = "en-reddit" | "en-x" | "zh-vertical";

type DemoProps = {
  variant: Variant;
};

type Copy = {
  hookTitle: string;
  hookBody: string;
  beforeTitle: string;
  beforeBody: string;
  installTitle: string;
  installBody: string;
  buildTitle: string;
  buildBody: string;
  endpointsTitle: string;
  endpointsBody: string;
  searchTitle: string;
  searchBody: string;
  proofTitle: string;
  proofBody: string;
  proofItems: [string, string, string];
  ctaTitle: string;
  ctaBody: string;
  tutorial: string;
};

const FPS = 30;

const copy: Record<Locale, Copy> = {
  en: {
    hookTitle: "Can AI tools read your Next.js site?",
    hookBody: "A polished page is not always a clean retrieval surface.",
    beforeTitle: "Before: one page, one dense HTML response",
    beforeBody: "No discovery file. No stable page Markdown. Retrieval starts by guessing.",
    installTitle: "Add an AI-readable layer",
    installBody: "One public package. Your App Router UI stays untouched.",
    buildTitle: "Build deterministic artifacts",
    buildBody: "Generated from the same content you already maintain.",
    endpointsTitle: "Keep your Next.js UI. Add clean AI endpoints.",
    endpointsBody: "Discovery, page Markdown, sitemap and optional capabilities stay separate from the UI.",
    searchTitle: "Agents can find the right page",
    searchBody: "Locale-aware MCP search and page retrieval share the same semantic graph.",
    proofTitle: "Verify the result, not the promise",
    proofBody: "100/100 readability is a technical check. It does not guarantee indexing, ranking or citation.",
    proofItems: ["≠ indexing", "≠ ranking", "≠ citation"],
    ctaTitle: "Try it on a real Next.js project",
    ctaBody: "MIT licensed. Alpha. Looking for concrete integration blockers.",
    tutorial: "next-ai-ready.vercel.app/en/docs/guides/nextjs-llms-txt",
  },
  zh: {
    hookTitle: "AI 工具能稳定读懂你的 Next.js 网站吗？",
    hookBody: "页面对人很好看，不代表机器能拿到干净、稳定的正文。",
    beforeTitle: "接入前：只有复杂 HTML",
    beforeBody: "没有发现入口，没有逐页 Markdown，检索只能先猜页面。",
    installTitle: "增加 AI 可读层",
    installBody: "安装一个公开包，不改变现有 App Router 页面。",
    buildTitle: "生成确定性的机器可读产物",
    buildBody: "与现有内容保持同步，不再手工维护多份副本。",
    endpointsTitle: "不改 Next.js 页面，给 AI 一套干净入口",
    endpointsBody: "发现、逐页 Markdown、站点目录与可选能力描述互不混淆。",
    searchTitle: "Agent 能找到正确页面",
    searchBody: "支持语言过滤的 MCP 搜索和页面读取，共用同一份语义图。",
    proofTitle: "验证结果，而不是相信承诺",
    proofBody: "100/100 只代表技术可读性，不保证收录、排名或引用。",
    proofItems: ["不代表收录", "不代表排名", "不代表引用"],
    ctaTitle: "拿一个真实 Next.js 项目来测试",
    ctaBody: "MIT 开源，仍是 Alpha，正在寻找真实接入阻塞。",
    tutorial: "next-ai-ready.vercel.app/zh/docs/guides/nextjs-llms-txt",
  },
};

const palette = {
  ink: "#111318",
  muted: "#59616d",
  paper: "#f7f8f5",
  white: "#ffffff",
  line: "#d9dde3",
  cyan: "#16b8d4",
  lime: "#b8ee36",
  coral: "#ff6f59",
  yellow: "#ffd65a",
  terminal: "#171a1f",
  terminalText: "#e7ecf2",
};

const getLayout = (format: Format) => {
  const vertical = format === "vertical";
  return {
    vertical,
    safeX: vertical ? 72 : 112,
    safeY: vertical ? 118 : 76,
    title: vertical ? 74 : 72,
    body: vertical ? 36 : 34,
    caption: vertical ? 32 : 27,
  };
};

const Brand = ({format}: {format: Format}) => {
  const {vertical, safeX, safeY} = getLayout(format);
  return (
    <div
      style={{
        position: "absolute",
        top: safeY,
        left: safeX,
        right: safeX,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: palette.ink,
        fontFamily: "Inter, SF Pro Display, PingFang SC, sans-serif",
        zIndex: 20,
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: vertical ? 18 : 14}}>
        <div
          style={{
            width: vertical ? 54 : 44,
            height: vertical ? 54 : 44,
            backgroundColor: palette.ink,
            color: palette.lime,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: vertical ? 26 : 21,
            fontWeight: 800,
            borderRadius: 10,
          }}
        >
          AI
        </div>
        <div style={{fontSize: vertical ? 34 : 30, fontWeight: 760}}>next-ai-ready</div>
      </div>
      <div
        style={{
          border: `2px solid ${palette.ink}`,
          padding: vertical ? "10px 18px" : "8px 14px",
          fontSize: vertical ? 24 : 20,
          fontWeight: 700,
          borderRadius: 999,
          backgroundColor: palette.white,
        }}
      >
        0.1.0-alpha.19
      </div>
    </div>
  );
};

const Caption = ({children, format}: {children: ReactNode; format: Format}) => {
  const {vertical, safeX, caption} = getLayout(format);
  return (
    <div
      style={{
        position: "absolute",
        left: safeX,
        right: safeX,
        bottom: vertical ? 112 : 58,
        minHeight: vertical ? 92 : 70,
        padding: vertical ? "20px 30px" : "16px 26px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        backgroundColor: palette.ink,
        color: palette.white,
        fontFamily: "Inter, SF Pro Display, PingFang SC, sans-serif",
        fontSize: caption,
        fontWeight: 650,
        lineHeight: 1.35,
        borderRadius: 18,
        zIndex: 30,
      }}
    >
      {children}
    </div>
  );
};

const Scene = ({children, duration, format}: {children: ReactNode; duration: number; format: Format}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, duration - 8, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill style={{backgroundColor: palette.paper, opacity, overflow: "hidden"}}>
      <Brand format={format} />
      {children}
    </AbsoluteFill>
  );
};

const TitleBlock = ({
  title,
  body,
  format,
  accent = palette.cyan,
}: {
  title: string;
  body: string;
  format: Format;
  accent?: string;
}) => {
  const frame = useCurrentFrame();
  const {vertical, safeX, title: titleSize, body: bodySize} = getLayout(format);
  const intro = spring({frame, fps: FPS, config: {damping: 180, mass: 0.8}});
  return (
    <div
      style={{
        position: "absolute",
        left: safeX,
        right: safeX,
        top: vertical ? 300 : 196,
        fontFamily: "Inter, SF Pro Display, PingFang SC, sans-serif",
        color: palette.ink,
        opacity: interpolate(intro, [0, 1], [0, 1]),
        translate: interpolate(intro, [0, 1], ["0px 34px", "0px 0px"]),
      }}
    >
      <div
        style={{
          display: "inline-block",
          width: vertical ? 88 : 76,
          height: vertical ? 14 : 12,
          backgroundColor: accent,
          marginBottom: vertical ? 34 : 24,
        }}
      />
      <div
        style={{
          fontSize: titleSize,
          lineHeight: 1.08,
          fontWeight: 820,
          maxWidth: vertical ? 900 : 1200,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: bodySize,
          lineHeight: 1.42,
          color: palette.muted,
          marginTop: vertical ? 28 : 20,
          maxWidth: vertical ? 900 : 1080,
        }}
      >
        {body}
      </div>
    </div>
  );
};

const BrowserFrame = ({path, children, style}: {path: string; children: ReactNode; style?: CSSProperties}) => (
  <div
    style={{
      backgroundColor: palette.white,
      border: `3px solid ${palette.ink}`,
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: "14px 14px 0 rgba(17, 19, 24, 0.11)",
      ...style,
    }}
  >
    <div
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 20px",
        borderBottom: `2px solid ${palette.line}`,
      }}
    >
      {[palette.coral, palette.yellow, palette.lime].map((color) => (
        <div key={color} style={{width: 16, height: 16, borderRadius: 999, backgroundColor: color}} />
      ))}
      <div
        style={{
          marginLeft: 12,
          flex: 1,
          backgroundColor: palette.paper,
          border: `1px solid ${palette.line}`,
          borderRadius: 10,
          padding: "9px 16px",
          fontFamily: "SFMono-Regular, Menlo, monospace",
          fontSize: 22,
          color: palette.muted,
        }}
      >
        localhost:3000{path}
      </div>
    </div>
    {children}
  </div>
);

const Terminal = ({
  lines,
  format,
  style,
}: {
  lines: Array<{text: string; tone?: "command" | "success" | "muted" | "accent"}>;
  format: Format;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const {vertical} = getLayout(format);
  return (
    <div
      style={{
        backgroundColor: palette.terminal,
        border: `3px solid ${palette.ink}`,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "14px 14px 0 rgba(17, 19, 24, 0.12)",
        ...style,
      }}
    >
      <div
        style={{
          height: 62,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 22px",
          borderBottom: "1px solid #303641",
          color: "#aab2be",
          fontFamily: "SFMono-Regular, Menlo, monospace",
          fontSize: vertical ? 21 : 18,
        }}
      >
        <div style={{width: 14, height: 14, borderRadius: 999, backgroundColor: palette.coral}} />
        <div style={{width: 14, height: 14, borderRadius: 999, backgroundColor: palette.yellow}} />
        <div style={{width: 14, height: 14, borderRadius: 999, backgroundColor: palette.lime}} />
        <span style={{marginLeft: 10}}>next-ai-ready-demo</span>
      </div>
      <div
        style={{
          padding: vertical ? "34px 30px" : "30px 34px",
          fontFamily: "SFMono-Regular, Menlo, monospace",
          fontSize: vertical ? 25 : 23,
          lineHeight: 1.62,
          color: palette.terminalText,
        }}
      >
        {lines.map((line, index) => {
          const opacity = interpolate(frame, [index * 18, index * 18 + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const color =
            line.tone === "success"
              ? palette.lime
              : line.tone === "muted"
                ? "#8f9aa8"
                : line.tone === "accent"
                  ? palette.cyan
                  : palette.terminalText;
          return (
            <div key={`${line.text}-${index}`} style={{opacity, color, whiteSpace: "pre-wrap"}}>
              {line.tone === "command" ? <span style={{color: palette.cyan}}>$ </span> : null}
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HookScene = ({text, format, duration}: {text: Copy; format: Format; duration: number}) => {
  const frame = useCurrentFrame();
  const {vertical, safeX, title, body} = getLayout(format);
  return (
    <Scene duration={duration} format={format}>
      <div
        style={{
          position: "absolute",
          left: safeX,
          right: safeX,
          top: vertical ? 420 : 260,
          fontFamily: "Inter, SF Pro Display, PingFang SC, sans-serif",
          color: palette.ink,
        }}
      >
        <div
          style={{
            width: vertical ? 160 : 138,
            height: vertical ? 28 : 24,
            backgroundColor: palette.lime,
            marginBottom: vertical ? 48 : 34,
            scale: interpolate(frame, [0, 18], [0.2, 1], {
              extrapolateRight: "clamp",
              easing: Easing.spring({damping: 180}),
              output: "perceptual-scale",
            }),
            transformOrigin: "left center",
          }}
        />
        <div
          style={{
            fontSize: vertical ? title + 12 : title + 20,
            lineHeight: 1.05,
            fontWeight: 850,
            maxWidth: vertical ? 900 : 1500,
            opacity: interpolate(frame, [8, 24], [0, 1], {extrapolateRight: "clamp"}),
            translate: interpolate(frame, [8, 24], ["0px 36px", "0px 0px"], {
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {text.hookTitle}
        </div>
        <div
          style={{
            marginTop: vertical ? 36 : 28,
            fontSize: body,
            lineHeight: 1.45,
            color: palette.muted,
            opacity: interpolate(frame, [20, 38], [0, 1], {extrapolateRight: "clamp"}),
          }}
        >
          {text.hookBody}
        </div>
      </div>
      <Caption format={format}>{text.hookBody}</Caption>
    </Scene>
  );
};

const BeforeScene = ({text, format, duration}: {text: Copy; format: Format; duration: number}) => {
  const {vertical, safeX} = getLayout(format);
  return (
    <Scene duration={duration} format={format}>
      <TitleBlock title={text.beforeTitle} body={text.beforeBody} format={format} accent={palette.coral} />
      <BrowserFrame
        path="/llms.txt"
        style={{
          position: "absolute",
          left: safeX,
          right: safeX,
          top: vertical ? 690 : 480,
          height: vertical ? 760 : 370,
        }}
      >
        <div
          style={{
            height: "calc(100% - 64px)",
            display: "flex",
            flexDirection: vertical ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: vertical ? 46 : 70,
            padding: vertical ? 50 : 42,
            fontFamily: "Inter, SF Pro Display, PingFang SC, sans-serif",
          }}
        >
          <div style={{fontSize: vertical ? 156 : 128, fontWeight: 860, color: palette.coral}}>404</div>
          <div style={{width: vertical ? 720 : 680}}>
            <div style={{fontSize: vertical ? 40 : 34, fontWeight: 760, color: palette.ink}}>llms.txt not found</div>
            <div
              style={{
                height: 20,
                width: "100%",
                backgroundColor: palette.line,
                marginTop: 28,
                boxShadow: `0 38px 0 ${palette.line}, 0 76px 0 ${palette.line}`,
              }}
            />
          </div>
        </div>
      </BrowserFrame>
      <Caption format={format}>{text.beforeBody}</Caption>
    </Scene>
  );
};

const InstallScene = ({text, format, duration}: {text: Copy; format: Format; duration: number}) => {
  const {vertical, safeX} = getLayout(format);
  return (
    <Scene duration={duration} format={format}>
      <TitleBlock title={text.installTitle} body={text.installBody} format={format} accent={palette.cyan} />
      <Terminal
        format={format}
        style={{
          position: "absolute",
          left: safeX,
          right: safeX,
          top: vertical ? 690 : 452,
          minHeight: vertical ? 760 : 410,
        }}
        lines={[
          {text: "npm create next-ai-ready@alpha next-ai-ready-demo", tone: "command"},
          {text: "cd next-ai-ready-demo && npm install", tone: "command"},
          {text: "npx next-ai-ready init", tone: "command"},
          {text: "✓ App Router handlers created", tone: "success"},
          {text: "✓ next-ai-ready 0.1.0-alpha.19", tone: "success"},
        ]}
      />
      <Caption format={format}>{text.installBody}</Caption>
    </Scene>
  );
};

const BuildScene = ({text, format, duration}: {text: Copy; format: Format; duration: number}) => {
  const {vertical, safeX} = getLayout(format);
  return (
    <Scene duration={duration} format={format}>
      <TitleBlock title={text.buildTitle} body={text.buildBody} format={format} accent={palette.lime} />
      <Terminal
        format={format}
        style={{
          position: "absolute",
          left: safeX,
          right: safeX,
          top: vertical ? 690 : 452,
          minHeight: vertical ? 760 : 410,
        }}
        lines={[
          {text: "npx next-ai-ready build", tone: "command"},
          {text: "✓ public/llms.txt", tone: "success"},
          {text: "✓ public/llms-full.txt", tone: "success"},
          {text: "✓ public/sitemap.md", tone: "success"},
          {text: "✓ /<route>.md + /<route>.ai.json", tone: "success"},
          {text: "Content freshness: updatedAt", tone: "muted"},
        ]}
      />
      <Caption format={format}>{text.buildBody}</Caption>
    </Scene>
  );
};

const EndpointsScene = ({text, format, duration}: {text: Copy; format: Format; duration: number}) => {
  const frame = useCurrentFrame();
  const {vertical, safeX} = getLayout(format);
  const cards = [
    {path: "/", label: "Human UI", color: palette.cyan},
    {path: "/llms.txt", label: "Discovery", color: palette.lime},
    {path: "/docs/install.md", label: "Page Markdown", color: palette.yellow},
    {path: "/api/mcp", label: "Optional MCP", color: palette.coral},
  ];
  return (
    <Scene duration={duration} format={format}>
      <TitleBlock title={text.endpointsTitle} body={text.endpointsBody} format={format} accent={palette.yellow} />
      <div
        style={{
          position: "absolute",
          left: safeX,
          right: safeX,
          top: vertical ? 760 : 522,
          display: "grid",
          gridTemplateColumns: vertical ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: vertical ? 24 : 22,
        }}
      >
        {cards.map((card, index) => (
          <div
            key={card.path}
            style={{
              minHeight: vertical ? 255 : 230,
              border: `3px solid ${palette.ink}`,
              backgroundColor: palette.white,
              borderRadius: 18,
              padding: vertical ? 30 : 26,
              fontFamily: "Inter, SF Pro Display, PingFang SC, sans-serif",
              opacity: interpolate(frame, [index * 10, index * 10 + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(frame, [index * 10, index * 10 + 10], ["0px 26px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            <div style={{height: 14, width: 70, backgroundColor: card.color, marginBottom: 28}} />
            <div
              style={{
                fontFamily: "SFMono-Regular, Menlo, monospace",
                fontSize: vertical ? 23 : 20,
                color: palette.muted,
                overflowWrap: "anywhere",
              }}
            >
              {card.path}
            </div>
            <div style={{fontSize: vertical ? 30 : 27, fontWeight: 760, color: palette.ink, marginTop: 16}}>
              {card.label}
            </div>
          </div>
        ))}
      </div>
      <Caption format={format}>{text.endpointsBody}</Caption>
    </Scene>
  );
};

const SearchScene = ({text, format, duration}: {text: Copy; format: Format; duration: number}) => {
  const {vertical, safeX} = getLayout(format);
  return (
    <Scene duration={duration} format={format}>
      <TitleBlock title={text.searchTitle} body={text.searchBody} format={format} accent={palette.cyan} />
      <Terminal
        format={format}
        style={{
          position: "absolute",
          left: safeX,
          right: safeX,
          top: vertical ? 720 : 478,
          minHeight: vertical ? 690 : 380,
        }}
        lines={[
          {text: "search_pages({ query: 'installation', locale: 'en' })", tone: "command"},
          {text: "1. Installation · /en/docs/installation", tone: "success"},
          {text: "get_page({ route: '/en/docs/installation' })", tone: "command"},
          {text: "✓ Clean Markdown + canonical + updatedAt", tone: "success"},
        ]}
      />
      <Caption format={format}>{text.searchBody}</Caption>
    </Scene>
  );
};

const ProofScene = ({text, format, duration}: {text: Copy; format: Format; duration: number}) => {
  const frame = useCurrentFrame();
  const {vertical, safeX} = getLayout(format);
  return (
    <Scene duration={duration} format={format}>
      <TitleBlock title={text.proofTitle} body={text.proofBody} format={format} accent={palette.lime} />
      <div
        style={{
          position: "absolute",
          left: safeX,
          right: safeX,
          top: vertical ? 740 : 500,
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          alignItems: "stretch",
          gap: vertical ? 26 : 30,
          fontFamily: "Inter, SF Pro Display, PingFang SC, sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: vertical ? 310 : 250,
            border: `3px solid ${palette.ink}`,
            backgroundColor: palette.ink,
            color: palette.white,
            borderRadius: 22,
            padding: vertical ? 40 : 34,
          }}
        >
          <div style={{fontSize: vertical ? 34 : 28, color: palette.lime, fontWeight: 720}}>Agent Readability</div>
          <div
            style={{
              fontSize: vertical ? 124 : 108,
              lineHeight: 1,
              fontWeight: 860,
              marginTop: 24,
              scale: interpolate(frame, [0, 25], [0.4, 1], {
                extrapolateRight: "clamp",
                easing: Easing.spring({damping: 170}),
                output: "perceptual-scale",
              }),
              transformOrigin: "left center",
            }}
          >
            100/100
          </div>
        </div>
        <div
          style={{
            flex: 1.25,
            minHeight: vertical ? 310 : 250,
            border: `3px solid ${palette.ink}`,
            backgroundColor: palette.white,
            color: palette.ink,
            borderRadius: 22,
            padding: vertical ? 40 : 34,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
            fontSize: vertical ? 30 : 27,
            fontWeight: 720,
          }}
        >
          {text.proofItems.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      </div>
      <Caption format={format}>{text.proofBody}</Caption>
    </Scene>
  );
};

const CtaScene = ({text, format, duration}: {text: Copy; format: Format; duration: number}) => {
  const frame = useCurrentFrame();
  const {vertical, safeX, title, body} = getLayout(format);
  return (
    <Scene duration={duration} format={format}>
      <div
        style={{
          position: "absolute",
          left: safeX,
          right: safeX,
          top: vertical ? 360 : 238,
          textAlign: "center",
          fontFamily: "Inter, SF Pro Display, PingFang SC, sans-serif",
          color: palette.ink,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: vertical ? 122 : 100,
            height: vertical ? 122 : 100,
            borderRadius: 24,
            backgroundColor: palette.ink,
            color: palette.lime,
            fontSize: vertical ? 52 : 42,
            fontWeight: 850,
            scale: interpolate(frame, [0, 24], [0.3, 1], {
              extrapolateRight: "clamp",
              easing: Easing.spring({damping: 160}),
              output: "perceptual-scale",
            }),
          }}
        >
          AI
        </div>
        <div style={{fontSize: vertical ? title + 4 : title + 14, lineHeight: 1.08, fontWeight: 850, marginTop: 38}}>
          {text.ctaTitle}
        </div>
        <div style={{fontSize: body, color: palette.muted, lineHeight: 1.4, marginTop: 26}}>{text.ctaBody}</div>
        <div
          style={{
            display: "inline-block",
            marginTop: vertical ? 58 : 42,
            padding: vertical ? "26px 34px" : "20px 30px",
            backgroundColor: palette.lime,
            border: `3px solid ${palette.ink}`,
            borderRadius: 16,
            fontFamily: "SFMono-Regular, Menlo, monospace",
            fontSize: vertical ? 27 : 25,
            fontWeight: 720,
          }}
        >
          npm create next-ai-ready@alpha
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: "SFMono-Regular, Menlo, monospace",
            fontSize: vertical ? 22 : 21,
            color: palette.muted,
            overflowWrap: "anywhere",
          }}
        >
          {text.tutorial}
        </div>
        <div style={{marginTop: 22, fontSize: vertical ? 24 : 22, fontWeight: 700}}>
          github.com/mustcanbedo/next-ai-ready
        </div>
      </div>
      <Caption format={format}>{text.ctaBody}</Caption>
    </Scene>
  );
};

const SCENES = {
  hook: HookScene,
  before: BeforeScene,
  install: InstallScene,
  build: BuildScene,
  endpoints: EndpointsScene,
  search: SearchScene,
  proof: ProofScene,
  cta: CtaScene,
};

type SceneId = keyof typeof SCENES;
type TimelineItem = {scene: SceneId; seconds: number};

const TIMELINES: Record<Variant, TimelineItem[]> = {
  "zh-vertical": [
    {scene: "endpoints", seconds: 5},
    {scene: "before", seconds: 4},
    {scene: "install", seconds: 9},
    {scene: "build", seconds: 7},
    {scene: "search", seconds: 6},
    {scene: "proof", seconds: 6},
    {scene: "cta", seconds: 8},
  ],
  "en-reddit": [
    {scene: "endpoints", seconds: 6},
    {scene: "before", seconds: 8},
    {scene: "install", seconds: 10},
    {scene: "build", seconds: 8},
    {scene: "search", seconds: 8},
    {scene: "proof", seconds: 8},
    {scene: "cta", seconds: 12},
  ],
  "en-x": [
    {scene: "endpoints", seconds: 5},
    {scene: "install", seconds: 7},
    {scene: "build", seconds: 5},
    {scene: "proof", seconds: 5},
    {scene: "cta", seconds: 8},
  ],
};

const durationFor = (variant: Variant) =>
  TIMELINES[variant].reduce((total, item) => total + item.seconds * FPS, 0);

export const ProductDemo = ({variant}: DemoProps) => {
  const locale: Locale = variant === "zh-vertical" ? "zh" : "en";
  const format: Format = variant === "zh-vertical" ? "vertical" : "landscape";
  const text = copy[locale];
  const timeline = TIMELINES[variant];
  let start = 0;
  return (
    <AbsoluteFill style={{backgroundColor: palette.paper}}>
      {timeline.map((item, index) => {
        const SceneComponent = SCENES[item.scene];
        const from = start;
        const duration = item.seconds * FPS;
        start += duration;
        return (
          <Sequence key={`${item.scene}-${index}`} from={from} durationInFrames={duration}>
            <SceneComponent text={text} format={format} duration={duration} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="NextAiReady-ZH-Vertical"
        component={ProductDemo}
        durationInFrames={durationFor("zh-vertical")}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{variant: "zh-vertical"}}
      />
      <Composition
        id="NextAiReady-EN-Reddit"
        component={ProductDemo}
        durationInFrames={durationFor("en-reddit")}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{variant: "en-reddit"}}
      />
      <Composition
        id="NextAiReady-EN-X"
        component={ProductDemo}
        durationInFrames={durationFor("en-x")}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{variant: "en-x"}}
      />
    </>
  );
};
