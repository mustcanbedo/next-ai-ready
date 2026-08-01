import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runAuditMock } = vi.hoisted(() => ({ runAuditMock: vi.fn() }));

vi.mock("../src/cli/audit.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/cli/audit.js")>();
  return { ...actual, runAudit: runAuditMock };
});

import { runCli } from "../src/cli/index.js";

const V1_RESULT = {
  version: "1" as const,
  timestamp: "2026-08-01T00:00:00.000Z",
  target: "https://example.test/",
  pageUrl: "https://example.test/",
  score: 100,
  checks: [],
  errors: 0,
  warnings: 0,
  passed: 0,
};

const V2_RESULT = {
  schema: "next-ai-ready.audit.v2" as const,
  version: "2" as const,
  timestamp: "2026-08-01T00:00:00.000Z",
  target: "https://example.test/",
  pageUrl: "https://example.test/",
  score: 72,
  dimensions: [
    {
      id: "discovery" as const,
      name: "Discovery",
      score: 60,
      weight: 20,
      status: "fail" as const,
      errors: 1,
      warnings: 0,
      passed: 3,
      checks: ["llms-txt"],
    },
    {
      id: "agent-access" as const,
      name: "Agent access",
      score: 90,
      weight: 30,
      status: "warn" as const,
      errors: 0,
      warnings: 1,
      passed: 3,
      checks: ["markdown-headers"],
    },
  ],
  checks: [
    {
      id: "llms-txt",
      name: "llms.txt",
      status: "fail" as const,
      message: "llms.txt is missing.",
      url: "https://example.test/llms.txt",
      dimension: "discovery" as const,
      weight: 4,
      recommendation: "Publish /llms.txt.",
    },
    {
      id: "markdown-headers",
      name: "Markdown response metadata",
      status: "warn" as const,
      message: "Vary: User-Agent is missing.",
      url: "https://example.test/",
      dimension: "agent-access" as const,
      weight: 2,
      recommendation: "Add Vary: User-Agent.",
    },
    {
      id: "accept-markdown",
      name: "Accept negotiation",
      status: "pass" as const,
      message: "Markdown is available.",
      url: "https://example.test/",
      dimension: "agent-access" as const,
      weight: 4,
      recommendation: null,
    },
  ],
  errors: 1,
  warnings: 1,
  passed: 1,
};

const V3_RESULT = {
  schema: "next-ai-ready.audit.v3" as const,
  version: "3" as const,
  timestamp: "2026-08-01T00:00:00.000Z",
  target: "https://example.test/",
  pageUrl: "https://example.test/",
  score: 100,
  methodology: {
    name: "next-ai-ready three-plane preflight" as const,
    referencePackage: "@vercel/agent-readability" as const,
    version: "0.5.0" as const,
    scoring: "required=3,recommended=2,strict-pass-only" as const,
    coverage: "local-subset-official-cli-is-source-of-truth" as const,
    officialCommand: "pnpm audit:vercel:site",
    referenceUrl: "https://vercel.com/kb/guide/agent-readability-spec",
  },
  planes: [
    {
      id: "agent-readability" as const,
      name: "Agent Readability",
      score: 100,
      status: "pass" as const,
      errors: 0,
      warnings: 0,
      passed: 1,
      checks: ["llms-txt"],
    },
    {
      id: "semantic-aeo-quality" as const,
      name: "Semantic/AEO Quality",
      score: 80,
      status: "warn" as const,
      errors: 0,
      warnings: 1,
      passed: 1,
      checks: ["meta-description"],
    },
    {
      id: "agent-capability" as const,
      name: "Agent Capability",
      score: 100,
      status: "pass" as const,
      errors: 0,
      warnings: 0,
      passed: 1,
      checks: ["mcp-endpoint"],
    },
  ],
  checks: [],
  errors: 0,
  warnings: 1,
  passed: 3,
};

let stdout = "";
let stderr = "";

beforeEach(() => {
  stdout = "";
  stderr = "";
  runAuditMock.mockReset();
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    stdout += String(chunk);
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    stderr += String(chunk);
    return true;
  });
  vi.spyOn(console, "log").mockImplementation((...args) => {
    stdout += `${args.join(" ")}\n`;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("audit CLI", () => {
  it("keeps Audit v1 as the default", async () => {
    runAuditMock.mockResolvedValue(V1_RESULT);

    await expect(runCli(["audit", "https://example.test/"])).resolves.toBe(0);

    expect(runAuditMock).toHaveBeenCalledWith("https://example.test/");
    expect(stdout).toContain("[next-ai-ready] audit: score 100/100");
  });

  it("enables Audit v2 without treating the version value as the target", async () => {
    runAuditMock.mockResolvedValue(V2_RESULT);

    await expect(runCli(["audit", "--version", "2", "https://example.test/"])).resolves.toBe(1);

    expect(runAuditMock).toHaveBeenCalledWith("https://example.test/", { version: "2" });
    expect(stdout).toContain("Discovery: 60/100 (weight 20%)");
    expect(stdout).toContain("Agent access: 90/100 (weight 30%)");
    expect(stdout).toContain("Fix: Add Vary: User-Agent.");
    expect(stdout).not.toContain("Fix: null");
    expect(stderr).toContain("Fix: Publish /llms.txt.");
    expect(stdout).toContain("[next-ai-ready] audit v2: score 72/100");
  });

  it("emits the complete Audit v2 report as JSON", async () => {
    runAuditMock.mockResolvedValue(V2_RESULT);

    await expect(runCli(["audit", "https://example.test/", "--version=2", "--json"])).resolves.toBe(1);

    expect(JSON.parse(stdout)).toEqual(V2_RESULT);
  });

  it("prints the three Audit v3 planes without combining their scores", async () => {
    runAuditMock.mockResolvedValue(V3_RESULT);

    await expect(runCli(["audit", "https://example.test/", "--version=3"])).resolves.toBe(0);

    expect(runAuditMock).toHaveBeenCalledWith("https://example.test/", { version: "3" });
    expect(stdout).toContain("Agent Readability: 100/100");
    expect(stdout).toContain("Semantic/AEO Quality: 80/100");
    expect(stdout).toContain("Agent Capability: 100/100");
    expect(stdout).toContain("[next-ai-ready] audit v3: score 100/100");
  });

  it.each([
    { argv: ["audit", "https://example.test/", "--version"], code: "missing_audit_version" },
    { argv: ["audit", "https://example.test/", "--version", "4"], code: "invalid_audit_version" },
    {
      argv: ["audit", "https://example.test/", "--version", "2", "--version=2"],
      code: "duplicate_audit_version",
    },
  ])("reports $code clearly", async ({ argv, code }) => {
    await expect(runCli(argv)).resolves.toBe(1);

    expect(runAuditMock).not.toHaveBeenCalled();
    expect(stderr).toContain(code);
  });

  it("keeps a missing target empty when only the Audit v2 option is present", async () => {
    runAuditMock.mockResolvedValue(V2_RESULT);

    await runCli(["audit", "--version", "2"]);

    expect(runAuditMock).toHaveBeenCalledWith("", { version: "2" });
  });

  it("documents the Audit v2 option in help", async () => {
    await expect(runCli(["help"])).resolves.toBe(0);

    expect(stdout).toContain("--version 2");
    expect(stdout).toContain("dimension-scored Audit v2");
    expect(stdout).toContain("--version 3");
    expect(stdout).toContain("three-plane Audit v3");
  });
});
