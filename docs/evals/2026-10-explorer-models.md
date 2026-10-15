# Eval: which model should run the reading roles

Date: 2026-10-14. Question: should `/how` explorers (and other read-only roles) run on Haiku 5.5 instead of Sonnet 5.5, and at what effort?

## Setup

- Three real `/how` questions about a Go codebase (a notification pipeline, a screenshot diff pipeline, an HTTP proxy), each with a fixed exploration angle.
- Three arms per question: Haiku 5.5 at `high`, Haiku 5.5 at `xhigh`, Sonnet 5.5 at `xhigh` (the old default). 9 runs, all `Explore` subagents, all given the exact `skills/how/references/explorer-prompt.md` prompt.
- One blind judge (Opus 5.5) saw reports by label only. It verified at least 8 concrete claims per report against the code (130+ in total), and scored accuracy, coverage, references, insight and honesty from 1 to 5 each.

## Results

| arm | mean score /25 | claims wrong / checked | mean cost per run | mean time |
|---|---|---|---|---|
| Haiku `high` | 19.3 | 3 / 39 | $0.017 | 99 s |
| Haiku `xhigh` | **23.3** | 5 / 50 | $0.040 | 275 s |
| Sonnet `xhigh` | 21.0 | 2 / 46 | $0.665 | 166 s |

Per question, the judge preferred: Sonnet for the notification pipeline (24 vs Haiku xhigh 23), Haiku xhigh for the diff pipeline (22, tied with Haiku high; Sonnet 18), Haiku xhigh for the proxy (25 vs Sonnet 21). Raw scores are in `explorer-scores.csv`, costs in `explorer-cost.csv`.

Cost is computed from each run's recorded token usage at list prices (Haiku $0.10/$0.50, Sonnet $2/$10 per million tokens, cache reads at 10% of input, cache writes at 125%). Two caveats. The transcripts under-record output tokens, so add roughly $0.05 to $0.15 per Sonnet run and under a cent per Haiku run. The Haiku `xhigh` runs went past 100K-token prompts, where Haiku is billed 5x; the worst case for that arm is about $0.20 per run, still several times cheaper than Sonnet.

## Decision

Reading roles (`how explorer`, `why investigators`, `recall readers`, `source readers`) default to Haiku and keep the budget's starting effort (`xhigh` at the default `large` budget) instead of being lowered like routine roles. Code delegates, verification and review panels stay on Sonnet or the panel mix.

## Limits

Three questions, one codebase, one judge. The quality gap between Haiku `xhigh` and Sonnet is within what a different question set could flip. The cost gap (about 15x) and the effort finding (Haiku `high` clearly weaker) are the robust parts. `why` investigators were switched on the same reasoning but were not measured, since they read MCP sources rather than code.
