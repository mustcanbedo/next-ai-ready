import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_DATASET = path.join(ROOT, "docs/evals/search-intent.v1.json");
const DEFAULT_GRAPH = path.join(ROOT, "examples/docs-site/.next-ai-ready/graph.json");
const DEFAULT_MCP_BUILD = path.join(ROOT, "packages/mcp/dist/index.js");

export function validateSearchIntentDataset(dataset) {
  if (!dataset || dataset.version !== 1 || !Array.isArray(dataset.cases) || dataset.cases.length === 0) {
    throw new Error("Search intent dataset must be version 1 with at least one case");
  }
  if (!Number.isInteger(dataset.topK) || dataset.topK < 1 || dataset.topK > 20) {
    throw new Error("topK must be an integer between 1 and 20");
  }
  for (const name of ["top1Accuracy", "topKRecall", "meanReciprocalRank"]) {
    const value = dataset.thresholds?.[name];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`${name} threshold must be a finite number from 0 to 1`);
    }
  }

  const ids = new Set();
  for (const item of dataset.cases) {
    if (!item || typeof item.id !== "string" || !item.id || ids.has(item.id)) {
      throw new Error(`Case ids must be unique non-empty strings: ${JSON.stringify(item?.id)}`);
    }
    ids.add(item.id);
    for (const key of ["locale", "intent", "query", "rationale"]) {
      if (typeof item[key] !== "string" || !item[key].trim()) {
        throw new Error(`${item.id}.${key} must be a non-empty string`);
      }
    }
    if (!Array.isArray(item.expectedRoutes) || item.expectedRoutes.length === 0) {
      throw new Error(`${item.id}.expectedRoutes must contain at least one route`);
    }
    for (const route of item.expectedRoutes) {
      if (typeof route !== "string" || !route.startsWith("/")) {
        throw new Error(`${item.id}.expectedRoutes must contain absolute site routes`);
      }
    }
  }
}

export function scoreSearchIntentCases(dataset, rankings) {
  validateSearchIntentDataset(dataset);
  const rows = dataset.cases.map((item) => {
    const routes = rankings.get(item.id) ?? [];
    const expected = new Set(item.expectedRoutes);
    const index = routes.findIndex((route) => expected.has(route));
    const rank = index === -1 ? null : index + 1;
    return {
      id: item.id,
      locale: item.locale,
      intent: item.intent,
      query: item.query,
      expectedRoutes: item.expectedRoutes,
      returnedRoutes: routes,
      rank,
      top1: rank === 1,
      topK: rank !== null && rank <= dataset.topK,
      reciprocalRank: rank === null ? 0 : 1 / rank,
    };
  });

  const summarize = (selected) => ({
    cases: selected.length,
    top1Accuracy: ratio(selected.filter((row) => row.top1).length, selected.length),
    topKRecall: ratio(selected.filter((row) => row.topK).length, selected.length),
    meanReciprocalRank: average(selected.map((row) => row.reciprocalRank)),
  });

  return {
    version: dataset.version,
    topK: dataset.topK,
    overall: summarize(rows),
    byLocale: groupSummaries(rows, (row) => row.locale, summarize),
    byIntent: groupSummaries(rows, (row) => row.intent, summarize),
    failures: rows.filter((row) => !row.topK),
    displaced: rows.filter((row) => row.topK && !row.top1),
    rows,
  };
}

export function thresholdFailures(metrics, thresholds) {
  return ["top1Accuracy", "topKRecall", "meanReciprocalRank"]
    .filter((name) => metrics.overall[name] < thresholds[name])
    .map((name) => ({ name, actual: metrics.overall[name], required: thresholds[name] }));
}

export async function runSearchIntentEvaluation({
  datasetPath = DEFAULT_DATASET,
  graphPath = DEFAULT_GRAPH,
  mcpBuildPath = DEFAULT_MCP_BUILD,
} = {}) {
  const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
  validateSearchIntentDataset(dataset);
  const graph = JSON.parse(await readFile(graphPath, "utf8"));
  const { toMcpPageToolDefinitions } = await import(pathToFileURL(mcpBuildPath).href);
  const tools = toMcpPageToolDefinitions(graph);
  const search = tools.find((tool) => tool.name === "search_pages");
  const getPage = tools.find((tool) => tool.name === "get_page");
  if (!search) throw new Error("Compiled @next-ai-ready/mcp build does not expose search_pages");
  if (!getPage) throw new Error("Compiled @next-ai-ready/mcp build does not expose get_page");

  const rankings = new Map();
  for (const item of dataset.cases) {
    const response = await search.execute({ query: item.query, locale: item.locale, limit: dataset.topK });
    if (response.isError) throw new Error(`${item.id}: search_pages returned ${response.content[0]?.text}`);
    const payload = JSON.parse(response.content[0]?.text ?? "{}");
    const routes = (payload.results ?? []).map((result) => result.route);
    rankings.set(item.id, routes);
    const relevantRoute = routes.find((route) => item.expectedRoutes.includes(route));
    if (relevantRoute) {
      const pageResponse = await getPage.execute({ route: relevantRoute });
      if (pageResponse.isError) throw new Error(`${item.id}: get_page returned ${pageResponse.content[0]?.text}`);
      const page = JSON.parse(pageResponse.content[0]?.text ?? "{}");
      if (page.route !== relevantRoute || typeof page.markdown !== "string" || page.markdown.length === 0) {
        throw new Error(`${item.id}: get_page did not return readable Markdown for ${relevantRoute}`);
      }
    }
  }

  return { dataset, metrics: scoreSearchIntentCases(dataset, rankings) };
}

function groupSummaries(rows, keyFor, summarize) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFor(row);
    const values = groups.get(key) ?? [];
    values.push(row);
    groups.set(key, values);
  }
  return Object.fromEntries([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => [key, summarize(values)]));
}

function ratio(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function average(values) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function printHumanReport(dataset, metrics) {
  console.log(`Search intent evaluation v${dataset.version} (${metrics.overall.cases} cases, Top-${dataset.topK})`);
  console.log(`Overall: Top-1 ${percent(metrics.overall.top1Accuracy)} | Top-${dataset.topK} ${percent(metrics.overall.topKRecall)} | MRR ${metrics.overall.meanReciprocalRank.toFixed(3)}`);
  for (const [locale, values] of Object.entries(metrics.byLocale)) {
    console.log(`Locale ${locale}: Top-1 ${percent(values.top1Accuracy)} | Top-${dataset.topK} ${percent(values.topKRecall)} | MRR ${values.meanReciprocalRank.toFixed(3)}`);
  }
  for (const row of [...metrics.failures, ...metrics.displaced]) {
    const label = row.rank === null ? "MISS" : `RANK ${row.rank}`;
    console.log(`${label} ${row.id}: ${JSON.stringify(row.query)} -> ${row.returnedRoutes.join(", ") || "(no results)"}`);
  }
}

async function main() {
  const json = process.argv.includes("--json");
  const { dataset, metrics } = await runSearchIntentEvaluation();
  if (json) console.log(JSON.stringify(metrics, null, 2));
  else printHumanReport(dataset, metrics);
  const failures = thresholdFailures(metrics, dataset.thresholds);
  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`${failure.name} ${failure.actual.toFixed(3)} is below required ${failure.required.toFixed(3)}`);
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
