import assert from "node:assert/strict";
import test from "node:test";
import {
  scoreSearchIntentCases,
  thresholdFailures,
  validateSearchIntentDataset,
} from "./search-intent-eval.mjs";

const DATASET = {
  version: 1,
  topK: 3,
  thresholds: { top1Accuracy: 0.5, topKRecall: 1, meanReciprocalRank: 0.7 },
  cases: [
    {
      id: "first",
      locale: "en",
      intent: "setup",
      query: "install",
      expectedRoutes: ["/install"],
      rationale: "Installation owns the query.",
    },
    {
      id: "second",
      locale: "zh",
      intent: "reference",
      query: "配置",
      expectedRoutes: ["/zh/config"],
      rationale: "The configuration page owns the query.",
    },
  ],
};

test("validates human-labeled datasets", () => {
  assert.doesNotThrow(() => validateSearchIntentDataset(DATASET));
  assert.throws(
    () => validateSearchIntentDataset({ ...DATASET, cases: [DATASET.cases[0], DATASET.cases[0]] }),
    /unique/,
  );
  assert.throws(() => validateSearchIntentDataset({ ...DATASET, topK: 21 }), /topK/);
});

test("computes retrieval metrics and grouped summaries", () => {
  const metrics = scoreSearchIntentCases(
    DATASET,
    new Map([
      ["first", ["/install", "/other"]],
      ["second", ["/other", "/zh/config"]],
    ]),
  );

  assert.deepEqual(metrics.overall, {
    cases: 2,
    top1Accuracy: 0.5,
    topKRecall: 1,
    meanReciprocalRank: 0.75,
  });
  assert.equal(metrics.byLocale.en.top1Accuracy, 1);
  assert.equal(metrics.byLocale.zh.top1Accuracy, 0);
  assert.deepEqual(metrics.displaced.map((row) => row.id), ["second"]);
  assert.deepEqual(thresholdFailures(metrics, DATASET.thresholds), []);
});

test("reports every failed acceptance threshold", () => {
  const metrics = scoreSearchIntentCases(DATASET, new Map());
  assert.deepEqual(
    thresholdFailures(metrics, DATASET.thresholds).map((failure) => failure.name),
    ["top1Accuracy", "topKRecall", "meanReciprocalRank"],
  );
});
