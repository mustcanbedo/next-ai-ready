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
      headFiles: ["packages/next/package.json", "packages/next/CHANGELOG.md"],
      prereleaseConsumed: true,
    }),
    false,
  );
});
