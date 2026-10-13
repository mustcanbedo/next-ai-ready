import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { URL } from "node:url";
import matter from "gray-matter";
import { CURATED_FAQ } from "./faq-curated.mjs";

for (const [locale, title] of [["en", "Quickstart Check"], ["zh", "快速接入检查"]]) {
  const path = new URL(`../content/${locale}/docs/guides/quickstart.mdx`, import.meta.url);

  test(`${locale} llms and MDX guides connect the endpoint and content tasks`, async () => {
    for (const [slug, target] of [["nextjs-llms-txt", "mdx-content"], ["mdx-content", "nextjs-llms-txt"]]) {
      const source = new URL(`../content/${locale}/docs/guides/${slug}.mdx`, import.meta.url);
      const { content } = matter(await readFile(source, "utf8"));
      assert.ok(content.includes(`](./${target})`), `${slug}: missing contextual guide link`);
      await readFile(new URL(`./${target}.mdx`, source), "utf8");
    }
  });

  test(`${locale} llms troubleshooting distinguishes HTML fallback from missing-page recovery`, async () => {
    const source = new URL(`../content/${locale}/docs/guides/nextjs-llms-txt.mdx`, import.meta.url);
    const { content } = matter(await readFile(source, "utf8"));
    const heading = locale === "en" ? "## Common mistakes" : "## 常见问题";
    const diagnostics = content.split(heading)[1]?.split(/\n## /)[0];
    assert.ok(diagnostics, "troubleshooting must be part of the guide");
    for (const text of [
      "withAiReady()",
      "text/html",
      "Content-Type: text/markdown",
      'document_status: "not_found"',
      "X-Robots-Tag: noindex",
      ".next-ai-ready/graph.json",
      "public/llms.txt",
      "curl -i -H 'Accept: text/markdown' http://localhost:3000/about.md",
      "curl -i http://localhost:3000/about.md",
    ]) assert.ok(diagnostics.includes(text), `missing retrieval diagnostic: ${text}`);
    for (const label of locale === "en" ? ["**Symptom:**", "**Fix:**", "**Verify:**"] : ["**症状：**", "**修复：**", "**复验：**"]) {
      assert.equal(diagnostics.split(label).length - 1, 2, `both retrieval failures need ${label}`);
    }
    assert.doesNotMatch(diagnostics, /curl -I /, "inspect the body, not only HEAD");
  });

  test(`${locale} MDX troubleshooting rebuilds content and verifies production canonical URLs`, async () => {
    const source = new URL(`../content/${locale}/docs/guides/mdx-content.mdx`, import.meta.url);
    const { content } = matter(await readFile(source, "utf8"));
    const heading = locale === "en" ? "## Common content collection problems" : "## 常见内容集合问题";
    const diagnostics = content.split(heading)[1];
    assert.ok(diagnostics, "collection diagnostics must be part of the guide");
    for (const text of [
      "content/docs/**/*.{md,mdx}",
      "content/docs/installation.mdx",
      ".next-ai-ready/graph.json",
      "pnpm build\npnpm start",
      "curl -i http://localhost:3000/docs/installation.md",
      "curl -i https://docs.example.com/llms.txt",
      "curl -i https://docs.example.com/docs/installation.md",
      'document_status: "not_found"',
      "site.baseUrl",
      "canonical",
      "`Link`",
    ]) assert.ok(diagnostics.includes(text), `missing collection diagnostic: ${text}`);
    for (const label of locale === "en" ? ["**Symptom:**", "**Fix:**", "**Verify:**"] : ["**症状：**", "**修复：**", "**复验：**"]) {
      assert.equal(diagnostics.split(label).length - 1, 2, `both collection failures need ${label}`);
    }
    assert.doesNotMatch(diagnostics, /curl -I /, "verify the deployed page body");
  });

  for (const slug of ["guides/quickstart", "installation", "getting-started/project-structure"]) {
    test(`${locale} ${slug} FAQ agrees with its curated source`, async () => {
      const source = new URL(`../content/${locale}/docs/${slug}.mdx`, import.meta.url);
      const { data } = matter(await readFile(source, "utf8"));
      assert.deepEqual(data.questions, CURATED_FAQ[locale][slug]);
    });
  }

  test(`${locale} quickstart has concrete source and HTTP acceptance checks`, async () => {
    const { content } = matter(await readFile(path, "utf8"));
    const sample = content.match(/```markdown\n([\s\S]*?)\n```/);
    assert.ok(sample, "a complete content example is required");
    const page = matter(sample[1]);
    assert.equal(page.data.title, title);
    assert.match(page.content, /pnpm install/);
    assert.ok(content.includes("content/docs/quickstart.mdx"));
    for (const command of [
      "npm create next-ai-ready@latest my-site",
      "pnpm add next-ai-ready",
      "pnpm exec next-ai-ready init",
      "npm run build",
      "npm run start",
      "curl -i http://localhost:3000/llms.txt",
      "curl -i http://localhost:3000/docs/quickstart.md",
      "curl -i -H 'Accept: text/html' http://localhost:3000/",
    ]) assert.ok(content.includes(command), `missing command: ${command}`);
    assert.ok(content.includes("not_found"), "HTTP 200 recovery is not a successful retrieval");
    assert.ok(content.includes("text/markdown"));
    assert.ok(content.includes("site.baseUrl"));
    assert.doesNotMatch(content, /create-next-app/, "existing apps must not be recreated");
  });

  test(`${locale} quickstarts describe the released OpenAPI diagnostic fix consistently`, async () => {
    const repositoryGuide = new URL(
      `../../../docs/quickstart-10min${locale === "zh" ? ".zh-CN" : ""}.md`,
      import.meta.url,
    );
    const releasedFix = locale === "en" ? /released in alpha\.22/ : /已随 alpha\.22 发布/;
    for (const source of [repositoryGuide, path]) {
      const content = await readFile(source, "utf8");
      assert.match(content, releasedFix, `${source.pathname}: record the published fix`);
      assert.match(content, /alpha\.21/, "keep upgrade guidance for the affected release");
      assert.doesNotMatch(content, /diagnostic fix is pending release|诊断修复尚待发布/);
    }
  });

  test(`${locale} Fumadocs guide distinguishes native retrieval from SDK integration`, async () => {
    const source = new URL(`../content/${locale}/docs/guides/fumadocs-ai-ready.mdx`, import.meta.url);
    const { data, content } = matter(await readFile(source, "utf8"));
    assert.ok(data.questions.some(({ a }) => a.includes("Fumadocs") && a.includes("MCP")));
    for (const text of [
      "https://www.fumadocs.dev/docs/integrations/llms",
      "npx @fumadocs/cli feature llms",
      "npx @fumadocs/cli feature mcp",
      'import { createMDX } from "fumadocs-mdx/next"',
      "withAiReady({ agentReadable: true })(withMDX(nextConfig))",
      "content/docs/getting-started.mdx",
      "curl -i -H 'Accept: text/markdown'",
      "curl -i -H 'Accept: text/html'",
      'document_status: "not_found"',
      "./actions",
    ]) assert.ok(content.includes(text), `missing native-first integration detail: ${text}`);
    assert.doesNotMatch(content, /curl -I /, "HEAD-only checks do not verify page content");
    const boundary = locale === "en" ? "not a Fumadocs Source API adapter" : "不是 Fumadocs Source API Adapter";
    assert.ok(content.includes(boundary), "file scanning must not be presented as a native adapter");
  });
}
