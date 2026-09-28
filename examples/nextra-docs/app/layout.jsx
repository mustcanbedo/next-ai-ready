import { Head } from "nextra/components";
import "nextra-theme-docs/style.css";

export const metadata = {
  title: {
    default: "Nextra AI-ready fixture",
    template: "%s | Nextra AI-ready fixture",
  },
  description: "A tested Nextra 4 and next-ai-ready knowledge-plane integration.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>{children}</body>
    </html>
  );
}
