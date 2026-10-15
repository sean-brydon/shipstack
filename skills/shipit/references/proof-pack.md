# The proof pack

The evidence that a change works, built before you say done and before you open a PR. It is for a reader who won't run anything: they look at it and believe the claim, or they see exactly where it falls short.

## Size it to the change

| change | proof |
|---|---|
| a nit: typo, copy, config value, comment, dependency bump | the one check that covers it, with its command and result |
| backend: logic, API, data, CLI | the repo's checks plus one real run of the changed path (a test that hits it, a request and its response, a CLI run, a log line) |
| anything that shows on a screen | screenshots in light and dark, and the visual diff |
| a number | a chart of before and after with its command |
| docs only | the docs build, or the rendered page |

A one-line Proof section is fine when one line is the honest proof. "Nothing to prove: README wording only" is fine too, when true. The point is that proof is stated on purpose.

## What goes in it

Pick every row that applies to the change. A row that applies but can't be produced stays in the pack as a gap, with the reason.

| change touches | proof | how |
|---|---|---|
| any page or UI | screenshots in light and dark, of the real app, in the states that changed (empty, loading, error, full) | drive the real surface with the browser driver your adapter names, else the project's Playwright |
| UI, or a refactor that must not change UI | before/after across phone, tablet and desktop, with the visual diff | a visual diff against main where your adapter has one, else paired screenshots side by side |
| a desktop or mobile app | the built app driven for real, with screenshots or a short recording | the project's verify skill (**create-verification-skill** makes one) |
| a CLI or TUI | the command and its real output, or a tmux capture for a TUI | a shell, `tmux capture-pane -p` |
| a number (perf, size, latency, eval score) | a chart or table of before and after, with the command that measured it and how many runs | **benchmark-checklist** first, then a chart artifact (your adapter says how to publish one) |
| a bug fix | the repro failing before and passing after, on the same surface | the test from **tdd**, or the screenshot pair |
| any code | the checks the repo names (AGENTS.md, CLAUDE.md, CI config), each with pass/fail and the command | a shell, or your adapter's way to run a command in the worktree's own environment |

## Rules

- **Real artifact, not a proxy.** Screenshot the running app, not a story or a mock. Measure the real path, not a microbenchmark of a helper. "Tests pass" is one row, never the whole pack.
- **Look at every shot before you use it.** Read each image. A screenshot of a spinner, an error page, the wrong theme, or a cropped-off change is not proof. Retake it.
- **Every item names its source.** The command, the URL and port, the commit. A reader can rerun it.
- **One place.** Collect the pack in one artifact (a Markdown or HTML page linking the shots and charts, published the way your adapter says), else a markdown section in the reply. The PR body embeds it (see `playbooks/opening-a-pr.md`).
- **Score UI against the bar.** For UI, the pack includes the Design audit's last score (8/10 or better, or the honest number and why).
- **Gaps are listed, not hidden.** "Not verified on Windows: no box available" is fine. Silence is not.

## In the PR

The PR body gets a **Proof** section: the screenshots embedded (light and dark), the visual-diff summary, charts as images or links, and a checks table (command, result). `gh` cannot upload images, so images go on the `pr-assets` branch (one folder per PR, never merged), embedded by their GitHub URL, as `playbooks/opening-a-pr.md` says. Never commit screenshots into the feature branch unless the repo does that.
