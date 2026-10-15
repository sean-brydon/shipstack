# Prove It Works

**Applies when:** you finish a task, before you declare it done.

Verify every task output by checking the real thing directly. Do not infer from proxies, self-reports, or "it compiles."

**Why:** Unverified work has unknown correctness. Indirect verification (file mtimes, output freshness, agent self-reports, cached screenshots) feels cheaper than direct observation. Acting on a wrong inference costs far more than checking the source.

Check the real thing, not a proxy:
- Check process liveness directly, not indirectly through derived state
- Read the actual value, not a cached or derived representation
- When verification fails, suspect the observation method before suspecting the system

## Script the check when you can

The strongest proof is a deterministic script that re-runs the same comparison, not a one-time eyeball. Write the script, run it, and keep its output as an artifact a reviewer can re-run instead of trusting your word.

Keep the artifact visible for the human. Commit it only for large or complex work where the trail has to be auditable later, like a big port or migration (the **show-me-your-work** skill).

## Show the proof

Proof is something the user can see. "It works" in a reply is a self-report, the proxy this principle rules out. Hand over the observation itself.

- **A page or a UI change needs a screenshot of the running build.** Drive the real surface on the worktree's own dev server and take screenshots, in light and dark. For a before/after, take a visual diff against main across phone, tablet, and desktop widths. If your environment can open the page next to the user, do that (see your adapter). The project's own Playwright setup works too. Look at each screenshot before you hand it over.
- **A number, a comparison, or a pass/fail matrix needs a table or a chart.** Make it an artifact when the result is worth a page (a chart, a CSV, or Markdown the user can open; load the **dataviz** skill for any chart), else a markdown table in the reply.
- **A CLI or a script needs the command and its real output.** Paste the command and the lines that show the result, not a paraphrase of them.
- **Every table or chart names its source.** Give the command, the file, or the run that produced it, so the reader can rerun it.

Skip the artifact for a one-line answer. The test is whether the user would rather look at it than read it.
