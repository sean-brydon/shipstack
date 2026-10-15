---
title: "Runtime forensics"
description: "Diagnose a live symptom (leak, idle-CPU spin, glitch) from instrumentation. The deliverable is a diagnosis."
---

**You own the diagnosis. Instrument the live process, don't theorize from source.** The deliverable is a cited diagnosis, not a fix.

1. Capture the live signal on the matching surface via the control skill (Non-negotiables): a CPU profile for a spinning process, a heap snapshot for a leak, a CDP trace for a visual glitch. A real artifact, not a guess. For a page inside a berth worktree, the **berth-browser** skill reaches it (`berthd browser console`, `berthd browser network`, `berthd browser eval`), else the **claude-in-chrome** skill. For a CLI or server, drive it with Bash or tmux and attach the runtime's own profiler.
2. Reduce the artifact to the smoking gun: the function on the hot path, the retainer chain from the leaked object to a GC root, the loop firing without input. Parse large artifacts in a subagent (the **Guard the Context Window** principle, [`~/.claude/skills/shipit/principles/guard-the-context-window.md`](/principles/guard-the-context-window)), keep the reduced finding in the main thread. Pick each subagent's `effort` for the job, per the Subagents section of [`~/.claude/skills/shipit/SKILL.md`](/skills/shipit).
3. Prove the mechanism before believing it. Inject instrumentation via CDP eval on the running process (`berthd browser eval` for a berth page), or hotfix the live code without reloading, to confirm the hypothesis cheaply.
4. Map the finding back to source: file, symbol, the line that allocates or schedules.
5. Show the reduced finding, not the raw dump. A table of the top frames (self time, total time, source location), a retainer chain or a firing loop as a Mermaid flowchart, or a `berth.chart` line of heap size or CPU over time when the signal is a trend. Inside berth, register it with the **berth-artifacts** skill. Outside berth, a markdown table or Mermaid block in the reply. Name the capture it came from.
6. Throughput checkpoint stays one line: `throughput checkpoint: n/a, read-only forensics`.

**Reply:** the signal captured, the reduced finding with its table or diagram, how you proved the mechanism, the source location, artifact paths. No fix unless asked. Hand back to Bug fix or Perf once the cause is known.
