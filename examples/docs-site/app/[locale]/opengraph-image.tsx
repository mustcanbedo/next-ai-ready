import { ImageResponse } from "next/og";
import { locales, type Locale } from "@/lib/i18n";

export const alt = "next-ai-ready for Next.js";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: value } = await params;
  const locale: Locale = locales.includes(value as Locale) ? (value as Locale) : "en";
  const copy =
    locale === "zh"
      ? {
          eyebrow: "NEXT.JS AEO + AGENT API",
          headline: "让网站被 AI 读取，\n也能被 Agent 安全调用",
          detail: "llms.txt  ·  Markdown  ·  JSON-LD  ·  MCP",
        }
      : {
          eyebrow: "NEXT.JS AEO + AGENT API",
          headline: "Readable by AI.\nCallable by agents.",
          detail: "llms.txt  ·  Markdown  ·  JSON-LD  ·  MCP",
        };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#090a0d",
          color: "#f4f4f5",
          padding: "72px 78px 64px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700 }}>
            <div style={{ width: 16, height: 44, background: "#3b82f6" }} />
            <span>next-ai-ready</span>
          </div>
          <div style={{ fontSize: 19, color: "#60a5fa", letterSpacing: 2 }}>{copy.eyebrow}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              whiteSpace: "pre-wrap",
              fontSize: locale === "zh" ? 66 : 76,
              lineHeight: 1.12,
              fontWeight: 750,
              letterSpacing: 0,
              maxWidth: 980,
            }}
          >
            {copy.headline}
          </div>
          <div style={{ fontSize: 24, color: "#a1a1aa" }}>{copy.detail}</div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["Knowledge Plane", "Capability Plane", "Open Source"].map((item, index) => (
            <div
              key={item}
              style={{
                display: "flex",
                padding: "10px 16px",
                border: `1px solid ${["#3b82f6", "#22c55e", "#f59e0b"][index]}`,
                color: "#d4d4d8",
                fontSize: 17,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
