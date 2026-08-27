import test from "node:test";
import assert from "node:assert/strict";
import { isPreparedReleaseCommit } from "./changeset-status.mjs";

test("recognizes a committed prerelease version update", () => {
  assert.equal(
    isPreparedReleaseCommit({
      packageChanges: [],
      headFiles: [
        ".changeset/pre.json",
        "packages/next/package.json",
        "packages/next/CHANGELOG.md",
      ],
      prereleaseConsumed: true,
    }),
    true,
  );
});

test("allows synchronized docs and release tooling beside generated package output", () => {
  assert.equal(
    isPreparedReleaseCommit({
      packageChanges: [],
      headFiles: [
        ".changeset/pre.json",
        ".changeset/release-mcp-with-llms-alpha16.md",
        "README.md",
        "examples/docs-site/content/en/index.mdx",
        "scripts/sync-release-docs.test.mjs",
        "packages/mcp/package.json",
        "packages/mcp/CHANGELOG.md",
      ],
      prereleaseConsumed: true,
    }),
    true,
  );
});

test("does not hide source changes that are missing a changeset", () => {
  assert.equal(
    isPreparedReleaseCommit({
      packageChanges: [],
      headFiles: ["packages/next/src/cli/audit.ts"],
      prereleaseConsumed: true,
    }),
    false,
  );
  assert.equal(
    isPreparedReleaseCommit({
      packageChanges: ["packages/mcp/src/tools.ts"],
      headFiles: ["packages/next/package.json"],
      prereleaseConsumed: true,
    }),
    false,
  );
  assert.equal(
    isPreparedReleaseCommit({
      packageChanges: [],
      headFiles: [
        ".changeset/pre.json",
        "packages/next/package.json",
        "packages/next/CHANGELOG.md",
        "packages/next/src/cli/audit.ts",
      ],
      prereleaseConsumed: true,
    }),
    false,
  );
});
