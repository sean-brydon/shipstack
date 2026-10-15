### Opening a PR

Invoked at the end of every other playbook.

**Worktree.** Work from a git worktree off main. Helpers inherit it. Several writing helpers on the same branch each get their own worktree, or a fresh worktree from `origin/<branch>` between them (see your adapter for the best way to make one). Dirty branch with unrelated work: patch out, fresh worktree, apply. Snarled worktree: a fresh worktree from main, redo minimally. Never `reset --hard` or `checkout -- .` (the permission mode may refuse both).

**Commits.** Commit liberally. Rebase into small, ordered commits before opening PRs. Each commit is a future PR: landable, ordered to tell the story. Amend when the fix belongs in a just-made commit. New commit when separable. Commit bodies don't restate the subject. End every commit message with the attribution trailer your agent gives the session, if it gives one, unless the user's own instructions say otherwise.

**PRs.** Run your agent's simplify pass over the diff before commit if it has one, else simplify it by hand. Before review, read and follow the **no-comments** skill (`<skills>/no-comments/SKILL.md`). Write every PR title, description, and commit body under the **technical-writing** skill (read and follow `<skills>/technical-writing/SKILL.md`, every layer except Diátaxis, and apply the STE vocabulary rules: one word per action, keep articles, a plain verb over `-ing` where one works), then the **unslop** skill (`<skills>/unslop/SKILL.md`).

**Titles.** Conventional Commits `type(scope): subject`, no trailing period. Type such as `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, or `perf`. Scope is the area, such as `shipit` or `babysit`. Subject is short, imperative, and names a real symbol when one carries the change, for example `fix(shipit): retarget opening-a-pr babysit trigger`. Follow the repo's own convention where it has one (lowercase subjects, say).

**Descriptions.** The PR body is a one-minute briefing, not a lab notebook, for a reviewer who has the diff. It says why the change exists, what it leaves out, what it could break, and how you proved it works. Write short, simple sentences with few identifiers, no walls of text. The prose becomes the squash commit body, so keep it under about 40 lines. The Proof section's table and images do not count toward that. Use `##` headings, not bold lead-ins, in this order, and drop a section with nothing to say, except Proof:

- `## Why`: the problem and approach, 1 to 3 short sentences. No SHAs, rebase genealogy, or "based on main" preamble.
- `## What changed`: 1 to 3 short bullets. Name a real symbol or path only when it carries the change. Name both sides of a rename or retarget.
- `## Scope`: always. 1 to 3 short items on what it covers and what it deliberately leaves out (a follow-up, a known gap). No symbols, paths, or file-by-file essay.
- `## Tradeoffs`: only rejected alternatives a reviewer would otherwise ask about. Skip when there was no real choice.
- `## Blast Radius`: 1 to 2 sentences on who or what it touches and why that is safe or risky. If main is red, state the cost of leaving it red.
- `## Proof`: always, and only real evidence from this change at this head. A PR without it is not ready. Build the proof pack first (`references/proof-pack.md`). This section embeds it.
  - A table of the checks you ran, one row each: the check, the exact command or path, and the result (`pass`, `fail`, or the number). Lint, types, tests, the build, and every live run.
  - Screenshots or a short video when the change shows on a screen. UI gets each changed screen in light and dark. Take them from the running change (drive the real surface; see your adapter for the browser and screenshot tools, or use the project's own browser tests), open each one and check it shows what the row claims before you embed it, and embed them in the body, not as links to a local file. `gh` cannot upload images, so commit them to an assets branch that never merges (such as `pr-assets`, one folder per PR) and embed each by its GitHub URL (`https://github.com/<owner>/<repo>/blob/pr-assets/<pr>/<name>.png?raw=true`).
  - Perf: one primary number with its unit, `before → after`, and a link to the chart or the arena or swarm directory for the rest.
  - Links to any artifact that holds the long evidence (a published artifact, a CI run).

Full SHAs, swarm or arena lane recitals, lever-correction essays, file-by-file checklists, and "CLEAN" verdicts go in a linked artifact, not the body. End the description with the attribution line your agent gives the session, if it gives one, unless the user's own instructions say otherwise.

**Review link.** Some environments add a review link or button to the PR description for changes a reviewer would look at in a browser (see your adapter). Leave it out of backend, API, infrastructure, test, or docs-only PRs.

**Forge.** The forge is GitHub through `gh` for create, edit, view, watch, and merge. Do not require Graphite (`gt`).

**Size, and no stacks by default.** For unrelated changes, prefer five narrow PRs to one large PR, each branched from trunk and targeting trunk. One feature built by parallel delegates lands as one PR. **Merged branches are not deleted in these repos**, so a PR stacked on another branch can merge into a dead branch. So the default is independent PRs off trunk. When work depends on an unmerged PR, put it in that PR if it belongs there, or wait for the parent to merge and branch the next one from trunk. A base-branch stack only when the user asks for one. Then the root PR targets trunk, each child rebases onto its parent's exact tip and targets the parent branch (`gh pr create --base <parent-branch>`). As a parent merges, retarget its child to trunk (`gh pr edit <pr> --base <trunk>`) and move its patch onto trunk before that child merges, per `playbooks/shipping.md` step 4. Never merge a PR whose base is not trunk.

**Readiness.** Open every PR ready, never as a draft. With `gh`, omit `--draft`. If a PR still opens as a draft, run `gh pr ready <number>`. Run `gh pr view <number>` before you refer to PR status.

**Babysit.** Opening a PR does not start a babysit. Post the URL and keep building. Finish the phase or stack first. Run a separate babysit pass only when the user asks for one after the whole stack exists. A babysit for each new PR stalls the build and spends checks on commits later waves restart. Push back when feedback drifts from intent.

A helper that opens a PR builds the proof pack first (`references/proof-pack.md`), reads and follows the **interrogate** and **no-comments** skills (`<skills>/interrogate/SKILL.md`, `<skills>/no-comments/SKILL.md`), runs your agent's simplify pass if it has one, and posts the URL. It returns to the parent without babysitting, unless its brief assigns the babysit loop. That brief is the ask `playbooks/babysit.md` waits for.
