import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import matter from "gray-matter";
import { CURATED_FAQ } from "./faq-curated.mjs";

for (const [locale, title] of [["en", "Quickstart Check"], ["zh", "快速接入检查"]]) {
  const path = new URL(`../content/${locale}/docs/guides/quickstart.mdx`, import.meta.url);

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
}
