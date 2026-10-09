"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function CopyButton({ text, locale }: { text: string; locale: Locale }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const label = status === "copied"
    ? (locale === "zh" ? "已复制" : "Copied")
    : status === "error"
      ? (locale === "zh" ? "复制失败，请选择文本复制" : "Copy failed; select the text to copy")
      : (locale === "zh" ? "复制代码" : "Copy code");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2400);
  }

  return <>
    <button type="button" className="icon-button" onClick={copy} aria-label={label} title={label}>
      {status === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </button>
    <span role="status" className="sr-only">{status !== "idle" ? label : ""}</span>
  </>;
}
