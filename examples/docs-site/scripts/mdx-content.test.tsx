import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MdxContent } from "../app/[locale]/components/mdx-content";

// Vitest returns asset URLs; Next's static image loader also supplies dimensions.
vi.mock("../public/guides/nextra/html.jpg", () => ({
  default: { src: "/guides/nextra/html.jpg", width: 1280, height: 720 },
}));

async function render(content: string) {
  return renderToStaticMarkup(await MdxContent({ content }));
}

describe("documentation tutorial steps", () => {
  it("ships both syntax themes without moving code rendering to the client", async () => {
    const html = await render('```typescript\nconst ready = true;\n```');
    expect(html).toContain("github-light");
    expect(html).toContain("github-dark");
    expect(html).toContain("--shiki-dark:");
    expect(html).toContain("const");
  });

  it("renders numbered steps as a semantic ordered list with inline formatting", async () => {
    const html = await render("1. Install `next-ai-ready`.\n2. **Configure** the [content](./mdx-content).\n3. Build.\n4. Verify.");
    expect(html).toContain("<ol");
    expect(html.match(/<li\b/g)).toHaveLength(4);
    expect(html).toContain("<code");
    expect(html).toContain("<strong");
    expect(html).toContain('href="./mdx-content"');
    expect(html).not.toContain("1. Install");
  });

  it("preserves a non-one starting number", async () => {
    expect(await render("3. Build.\n4. Verify.")).toContain('start="3"');
  });

  it("keeps soft continuations inside a step and the following paragraph outside", async () => {
    const html = await render("1. Install.\n   Keep the existing UI.\n2. Verify.\n\nDone.");
    expect(html).toContain("Install. Keep the existing UI.</li>");
    expect(html).toMatch(/<\/ol><p[^>]*>Done\.<\/p>/);
  });

  it("keeps blank-separated steps in the same ordered list", async () => {
    const html = await render("1. Install.\n\n2. Verify.");
    expect(html.match(/<ol\b/g)).toHaveLength(1);
    expect(html.match(/<li\b/g)).toHaveLength(2);
  });

  it("does not absorb a preceding paragraph or an unordered list", async () => {
    const html = await render("Follow these steps:\n1. Install.\n2. Verify.\n- Optional action.");
    expect(html).toMatch(/Follow these steps:<\/p><ol/);
    expect(html).toMatch(/<\/ol><ul/);
    expect(html).toContain("Optional action.");
  });

  it("stops at headings, quotes and code blocks without interpreting code as steps", async () => {
    const html = await render("1. Install.\n## Verify\n2. Build.\n> Check the response.\n```text\n1. Not a step.\n```");
    expect(html).toMatch(/<\/ol><h2/);
    expect(html).toMatch(/<\/ol><blockquote/);
    expect(html.match(/<ol\b/g)).toHaveLength(2);
    expect(html).toContain("1. Not a step.");
  });

  it("does not absorb a table after the steps", async () => {
    const html = await render("1. Verify.\n| Field | Value |\n| --- | --- |\n| Status | Ready |");
    expect(html).toMatch(/<\/ol><div[^>]*><table/);
    expect(html).toContain("Ready");
  });

  it("keeps a supported tutorial screenshot outside the ordered list", async () => {
    const html = await render("1. Verify.\n![Nextra HTML](/guides/nextra/html.jpg)");
    expect(html).toMatch(/<\/ol><figure/);
    expect(html).toContain('alt="Nextra HTML"');
  });
});
