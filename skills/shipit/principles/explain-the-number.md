# Explain the Number

**Applies when:** you are about to trust, report, or act on a number you measured: a speedup, a regression, a throughput, a latency, or an eval result.

Find what limits the number, and rule out that it measured something other than the work you think.

- **Ask "why not double?"** Name the resource or code path that bounds the result, such as a core, a lock, the disk, the network, or the load generator itself. Get it from a profile or from system counters taken during a run, then map it to source. A guess from reading the code is not a limiter. If you cannot say why the number is not twice as good, you do not know what you measured.
- **List what else the number could be measuring, and rule out each one with evidence.** The usual suspects are errors, skipped or cached work, code that never ran, an untuned side (one left on default settings), noise, and a piece too small to matter end to end.
- **Keep the evidence with the number.** Put the run count, the spread, and the limiter in the notes or a linked artifact.

For a performance number, run the full procedure with the **benchmark-checklist** skill (`<skills>/benchmark-checklist/SKILL.md`). For an eval result, ask the same of the trials: did every run do the task, does the gap hold across trials and models, and does the scenario matter.

You skipped this when the evidence behind a number has no run count, no spread, or no named limiter, or when the time saved is larger than the time the changed piece took.

## Show the number

A number the user cannot see behind is a claim. Report it as something they can look at.

- **A before/after, a comparison, or a series is a chart or a table.** Each row or point is one run, so the run count and the spread are visible. Put the limiter in the caption.
- **Make it an artifact** when the result is worth a page: a chart or a CSV the user can open. Load the **dataviz** skill for any chart. Rewrite the file to update it live as runs come in, if your environment supports that (see your adapter). Otherwise put a markdown table in the reply.
- **Every chart or table names its source.** Give the command, the file, or the run that produced it, so a reader can rerun it.
- A single number with its run count, spread, and limiter in one sentence needs no artifact.

Distinct from the [Prove It Works](prove-it-works.md) principle, which checks that an output is real.
