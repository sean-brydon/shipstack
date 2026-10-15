# Product Analytics Warehouse

## What this source contains

The warehouse is the product-analytics, data-pipeline, and warehouse-telemetry layer. It complements infrastructure observability. Observability is the *infra/runtime* view, the warehouse is the *product/data* view (what users did, which experiments ran, how feature usage evolved, where a threshold constant came from).

- **Product analytics events.** Raw event tables and, often, typed and deduplicated per-event models built on top of them (dbt or similar). User behavior: feature invocations, clicks, accepts/rejects, submissions, client-reported errors.
- **Usage & billing events.** For cost- or volume-driven decisions.
- **Experiment / feature-flag data.** Exposure and outcome tables. **Schema is company-specific.** Probe before assuming names.
- **System tables.** Query history, compute, billing, and audit tables where the warehouse exposes them (for example `system.query.history` on Databricks, `INFORMATION_SCHEMA.JOBS` on BigQuery, `ACCOUNT_USAGE.QUERY_HISTORY` on Snowflake). They answer "was this query expensive?", "how often did anyone run this?", "when did warehouse load spike?"
- **Model lineage.** dbt models (or the equivalent) reveal what pipelines depend on a table or field. Upstream changes frequently motivate consumer-code changes.
- **Notebooks.** Exploratory analyses engineers wrote before code changes. **Usually not queryable through a SQL MCP.** If you suspect the rationale lives in a notebook, name it as a gap.

## How to search it

Use the warehouse MCP's read-only SQL tool. If a query returns a statement or job ID instead of rows, poll that ID with the server's result tool rather than re-running the query.

**Orient before querying.** Schemas are company-specific. Probe before trusting a table name:

```sql
SHOW TABLES IN <catalog>.<schema> LIKE '*<keyword>*';   -- or the warehouse's INFORMATION_SCHEMA.TABLES
DESCRIBE TABLE <catalog>.<schema>.<table>;
```

**Time-bound every query.** These tables are huge and unconstrained scans time out. Filter on the event timestamp (or the query-history start time) with a window bracketing the ship date, typically ~30 days before and after, wider only for strong reason.

**Prefer typed, deduplicated models over raw event tables.** Raw tables often hold duplicates and untyped JSON properties. Drop to the raw table only when there's no model yet, or you need events from inside the model's refresh lag. Learn the model naming convention from `SHOW TABLES` rather than guessing it.

### Investigation patterns that tend to pay off

Pick the table + column combination that matches the target:

1. **Event usage trajectory.** Daily counts on the relevant event model across a ±30d window around the PR merge. A step function from zero to steady volume within a day or two of the merge is strong circumstantial evidence the PR launched the feature. A decay to zero suggests a deprecation or deletion.
2. **Guard-rail / defensive-check origin.** Distribution (median / p99 / max) of the relevant property in the 14 days *before* the PR. A p99 that matches the target's threshold constant suggests the number was chosen from data.
3. **Experiment / feature-flag lookup.** Find the exposure table (`SHOW TABLES ... LIKE '*experiment*'` or similar), then pull exposure counts by variant for the relevant flag key near the PR date.
4. **Query-history evidence for migrations, backfills, or perf rewrites.** The query-history system table filtered on statement text matching the table or symbol, with a tight time window, surfaces the expensive queries that likely motivated the change (sort by duration or aggregate bytes read and query count).
5. **Model lineage.** If the target reads from or writes into a warehouse model, the model's own git history (in this repo or the analytics repo) often carries the rationale. Hand that lead back to the source control investigator rather than chasing it yourself.

## What good evidence looks like here

Beyond the pattern shapes above:

- An error-classifying event's count drops to near zero in the days after a defensive-code PR. Suggests the PR resolved that error class
- An exposure table row names the target's feature-flag key with a "shipped" / "concluded" decision around the PR ship date

## Common pitfalls

- **Instrumented ≠ caused.** An event's existence means someone cared enough to log it, not that the target code exists *because* of it. Pair with a PR/commit citation from the source control investigator before claiming causation.
- **Silent instrumentation changes.** A step function in event volume may mean a new event started being logged, not that user behavior changed. Check for instrumentation PRs in the same window before reading the ramp as a feature-launch signal.
- **Schema drift.** Event properties evolve. A column on the typed model today may not have existed when the target was written. Older data may carry the property only inside raw JSON.
- **Refresh lag.** Models are rebuilt on a schedule (often hourly/daily). For events from the last few hours, fall back to the raw table and deduplicate by event ID.
- **Company-specific tables.** Experiment, feature-flag, billing, and usage tables vary. Reporting a result from a table whose existence you never confirmed is a classic failure mode. Probe with `SHOW TABLES` / `DESCRIBE TABLE` first.
- **Retention cliff.** If the relevant window predates the table's retention or the model's creation date, that's a *gap*, not a null result. Name it explicitly so the synthesizer doesn't read "no results" as "no activity."
- **Notebooks aren't queryable.** A SQL MCP usually can't see notebooks. If you suspect the rationale lives in one, return a gap.

## What to return

For each relevant finding:
- Type (product event / experiment exposure / usage or billing event / system-table row / model lineage)
- Fully-qualified table name and the exact query you ran
- Time window queried
- Compact numeric summary (counts, percentiles, first/last-seen timestamps). **Don't dump raw rows.**
- Temporal correlation with the target's ship date (e.g., "first row 2024-08-15, PR #49074 merged 2024-08-14")
- Relevance + strength: direct / circumstantial / weak
