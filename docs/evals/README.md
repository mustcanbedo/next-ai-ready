# Search intent evaluation

`search-intent.v1.json` is a small, human-labeled retrieval set for the public
documentation corpus. It measures whether the existing deterministic
`search_pages` tool sends a user to the page that answers the query most
directly.

Run it after building the repository:

```bash
pnpm build
pnpm search:intent-eval
```

The evaluator calls the same compiled MCP tools shipped to users. It reports
Top-1 accuracy, Top-K recall, and mean reciprocal rank (MRR), confirms every
relevant search result can be read with `get_page`, then fails when a checked-in
threshold regresses. Queries are split across English and Chinese and grouped
by intent so a high overall score cannot hide one weak language or task
category.

Ground truth stays human-owned. A model may propose future queries, but it must
not silently change expected routes or acceptance thresholds. Add a short
rationale to every case so reviewers can challenge ambiguous labels.
