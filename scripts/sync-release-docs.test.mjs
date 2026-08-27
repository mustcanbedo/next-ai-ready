import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { releaseDocRules, syncReleaseDoc, syncReleaseDocs } from "./sync-release-docs.mjs";

test("updates only the uniquely identified current release line", () => {
  const source = [
    "Current release: 0.1.0-alpha.17.",
    "History: 0.1.0-alpha.16 and alpha.15.",
  ].join("\n");
  const result = syncReleaseDoc(
    source,
    [{ includes: "Current release:", token: "full" }],
    "0.1.0-alpha.18",
  );

  assert.equal(
    result,
    ["Current release: 0.1.0-alpha.18.", "History: 0.1.0-alpha.16 and alpha.15."].join("\n"),
  );
});

test("updates short release labels used by website badges", () => {
  const result = syncReleaseDoc(
    'badge: "npm alpha.17 · docs track main"',
    [{ includes: "badge:", token: "short" }],
    "0.1.0-alpha.18",
  );
  assert.equal(result, 'badge: "npm alpha.18 · docs track main"');
});

test("switches prerelease labels to a stable version", () => {
  const result = syncReleaseDoc(
    'badge: "npm alpha.17 · docs track main"',
    [{ includes: "badge:", token: "short" }],
    "0.1.0",
  );
  assert.equal(result, 'badge: "npm 0.1.0 · docs track main"');
});

test("preserves a separate GA target while replacing the current prerelease", () => {
  const source = "Current: 0.1.0-alpha.17. GA target: 0.1.0.";
  const result = syncReleaseDoc(
    source,
    [{ includes: "Current:", token: "full" }],
    "0.1.0",
  );
  assert.equal(result, "Current: 0.1.0. GA target: 0.1.0.");
});

test("fails closed when a release anchor is ambiguous", () => {
  assert.throws(
    () => syncReleaseDoc("Current alpha.17\nCurrent alpha.17", [{ includes: "Current", token: "short" }], "0.1.0-alpha.18"),
    /Expected one line/,
  );
});

test("syncs every managed release surface for the next version", async () => {
  const root = await mkdtemp(join(tmpdir(), "nair-release-docs-"));
  try {
    await mkdir(join(root, "packages/meta"), { recursive: true });
    await writeFile(
      join(root, "packages/meta/package.json"),
      JSON.stringify({ name: "next-ai-ready", version: "0.1.0-alpha.19" }),
    );

    for (const target of releaseDocRules) {
      const source = await readFile(join(process.cwd(), target.path), "utf8");
      const destination = join(root, target.path);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, source);
    }

    const synced = await syncReleaseDocs({ root });
    assert.equal(synced.changed.length, releaseDocRules.length);
    const checked = await syncReleaseDocs({ check: true, root });
    assert.deepEqual(checked.changed, []);

    const history = await readFile(join(root, "docs/improvement-plan.zh-CN.md"), "utf8");
    assert.match(history, /alpha\.16 发布后/);
    assert.match(history, /PR #20 合并后触发 Release Alpha #5/);

    const readme = await readFile(join(root, "README.md"), "utf8");
    assert.match(readme, /\*\*Release candidate:\*\*/);
    assert.match(readme, /0\.1\.0-alpha\.19/);
    assert.doesNotMatch(readme, /0\.1\.0-alpha\.19[^\n]*(?:published on npm|currently serve)/i);

    const chineseReadme = await readFile(join(root, "README.zh-CN.md"), "utf8");
    assert.match(chineseReadme, /\*\*候选版本：\*\*/);
    assert.match(chineseReadme, /0\.1\.0-alpha\.19/);
    assert.doesNotMatch(chineseReadme, /0\.1\.0-alpha\.19[^\n]*(?:现已发布|已经发布|已发布至)/);

    const readiness = await readFile(join(root, "docs/ga-readiness.md"), "utf8");
    assert.match(readiness, /\*\*Current repository candidate:\*\*/);
    assert.doesNotMatch(readiness, /Current published version/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
