"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeSelect({ locale }: { locale: Locale }) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { theme, setTheme } = useTheme();
  const selectedTheme = mounted && (theme === "light" || theme === "dark") ? theme : "system";
  const Icon = selectedTheme === "light" ? Sun : selectedTheme === "dark" ? Moon : Monitor;
  const chinese = locale === "zh";
  const label = chinese ? "外观" : "Appearance";

  return (
    <label className="theme-control" title={label}>
      <Icon size={16} aria-hidden="true" focusable="false" />
      <select
        aria-label={label}
        value={selectedTheme}
        disabled={!mounted}
        onChange={(event) => setTheme(event.target.value)}
      >
        <option value="light">{chinese ? "浅色" : "Light"}</option>
        <option value="dark">{chinese ? "深色" : "Dark"}</option>
        <option value="system">{chinese ? "跟随系统" : "System"}</option>
      </select>
    </label>
  );
}
