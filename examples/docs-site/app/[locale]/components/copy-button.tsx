"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function CopyButton({ text, locale, label }: { text: string; locale: Locale; label?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const message = status === "copied"
    ? (locale === "zh" ? "已复制" : "Copied")
    : status === "error"
      ? (locale === "zh" ? "复制失败，请选择文本复制" : "Copy failed; select the text to copy")
      : label ?? (locale === "zh" ? "复制代码" : "Copy code");
  const buttonText = label && (status === "copied" ? message : label);

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
    <button type="button" className={label ? "icon-button copy-text-button" : "icon-button"} onClick={copy} aria-label={buttonText ?? message} title={message}>
      {status === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {buttonText}
    </button>
    <span role="status" className={label && status === "error" ? "copy-error" : "sr-only"}>
      {status !== "idle" ? message : ""}
    </span>
  </>;
}
