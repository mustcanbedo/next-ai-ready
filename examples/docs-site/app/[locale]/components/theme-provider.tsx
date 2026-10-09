"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

export function DocsThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      storageKey="next-ai-ready-theme"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
