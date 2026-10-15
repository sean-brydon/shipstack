### Trace forensics

**You own the diagnosis from the artifact.**

Distinct from **Runtime forensics**, which instruments the live process. Here the capture already exists. The artifact is a fixed dataset, read it, don't re-run it. Keep tooling generic: a DevTools or trace parser for cpuprofile and `.json.gz`, a text editor for a spindump, your heap tooling for a heapsnapshot.

1. Identify the format and load it with the right tool. Parse large artifacts in a subagent (the **Guard the Context Window** principle, `~/.claude/skills/shipit/principles/guard-the-context-window.md`) and keep the reduced finding in the main thread. Pick each subagent's `effort` for the job, per the Subagents section of `~/.claude/skills/shipit/SKILL.md`.
2. Transform the raw artifact into a form you can query. Dump the trace or heap snapshot into sqlite, one row per sample, frame, or node. Reach the queryable shape before you read.
3. Narrow to the cause. Query for the frames that hold the most time and walk the call tree to the hot path. For a leak, follow the retainer chain from the leaked object to a GC root. For a spindump, find the thread stuck on-CPU or blocked and its wait reason.
4. Attribute to source. Map the hot frame to file, symbol, and line via the artifact's own symbols. A frame with no source mapping is not yet a diagnosis. Resolve the symbols, or say plainly the artifact does not carry them.
5. If you have a paired capture, diff the before and after artifacts to confirm. Otherwise, mark the finding as the strongest hypothesis the artifact supports, not a confirmed cause.
6. Show the query result, not prose about it. Export the top-frames query (frame, self time, total time, share, source location) as a CSV, the retainer chain as a Mermaid flowchart, and for a paired capture a `berth.chart` bar of the top frames before and after. Inside berth, register them with the **berth-artifacts** skill. Outside berth, a markdown table or Mermaid block in the reply. Each one names the artifact and the sqlite query it came from.
7. Hand back a cited diagnosis, no fix unless asked. Route to Bug fix or Perf issue once the cause is known. Throughput checkpoint stays one line: `throughput checkpoint: n/a, read-only forensics`.

**Reply:** the artifact and format, the reduced finding with its table, chart, or diagram, the source location, the artifact paths, and whether a paired capture confirmed it.
