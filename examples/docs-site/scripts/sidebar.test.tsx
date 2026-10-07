import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Sidebar } from "../app/[locale]/components/sidebar";
import type { DocMeta } from "../lib/docs";

const { link, pathname } = vi.hoisted(() => ({ link: vi.fn(), pathname: vi.fn() }));
vi.mock("next/link", () => ({ default: link }));
vi.mock("next/navigation", () => ({ usePathname: pathname }));

const docs: DocMeta[] = [
  { title: "Installation", summary: "Install", slug: "installation", section: "getting-started", order: 1 },
  { title: "Guide", summary: "Read", slug: "guides/nextjs-llms-txt", section: "guides", order: 2 },
];

beforeEach(() => {
  link.mockReset();
  pathname.mockReset();
  link.mockImplementation((props: { href: string; children: ReactNode; className?: string }) =>
    createElement("a", { href: props.href, className: props.className }, props.children));
});

describe("documentation sidebar crawling", () => {
  it.each(["en", "zh"] as const)("keeps %s anchors and active styling without automatic prefetch", (locale) => {
    pathname.mockReturnValue(`/${locale}/docs/installation`);
    const html = renderToStaticMarkup(createElement(Sidebar, {
      locale,
      groups: { "getting-started": [docs[0]], guides: [docs[1]] },
      sectionLabels: { "getting-started": "Getting started", guides: "Guides" },
    }));

    expect(link).toHaveBeenCalledTimes(2);
    expect(link.mock.calls.map(([props]) => props.prefetch)).toEqual([false, false]);
    expect(link.mock.calls[0][0].className).toContain("font-medium");
    expect(link.mock.calls[1][0].className).not.toContain("font-medium");
    expect(html.match(/<a\b/g)).toHaveLength(2);
    expect(html).toContain(`href="/${locale}/docs/installation"`);
    expect(html).toContain(`href="/${locale}/docs/guides/nextjs-llms-txt"`);
    expect(html).not.toContain("_rsc");
  });
});
