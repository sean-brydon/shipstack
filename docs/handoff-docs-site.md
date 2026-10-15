# Handoff: finish the shipstack docs site on devl

You are a Claude Code agent in a berth task on the devl box. The owner is offline. Work in this worktree, run `/shipit` discipline (read `~/.claude/skills/shipit/SKILL.md` if installed, else `skills/shipit/SKILL.md` in this repo), and finish without asking. Pause only for the irreversible things the router lists. Budget: about $60 of API spend in total; if you pass it, stop and write up where you are.

## Goal

A Fumadocs docs site for shipstack in `site/`, ready to deploy on Vercel, with real recorded agent runs as proof. Deliver it as a PR to `main` on sean-brydon/shipstack with a Proof section. Do not deploy (no Vercel login on this box); the owner deploys when back.

## 1. Set up

- `pnpm` may be missing: `npm i -g pnpm` (or `npx -y pnpm@9 ...`). Install inside `site/` with `pnpm install`. Never symlink node_modules.
- Link this checkout's skills so `/shipit` works in headless runs: `./install.sh` (it only creates links in `~/.claude`, never overwrites).
- Pick free ports only (check with `ss -ltn`); kill only processes you started.

## 2. Finish the site (partly built in `site/`)

Check what exists first; an earlier agent got as far as the Runs section. The spec:

- Same setup as Fumadocs 16 (`fumadocs-core`, `fumadocs-mdx`, `fumadocs-ui`), Next 16, Tailwind 4. Brand "shipstack".
- A global **With berth / Without berth** switch in the docs layout, persisted in localStorage (try/catch), default Without berth. MDX components `<Berth>` and `<NoBerth>` show content for one mode (both rendered, hidden by CSS keyed on an `<html>` attribute; with JS off both show with labels).
- `<Run id="…" />` renders `site/content/runs/<id>.json` (schema below): header card (title, playbook, model, duration, cost, turns, environment, recorded date), prompt bubble, step timeline (tool steps collapsed to name + summary, expandable to input/output; consecutive subagent steps grouped under the agent label and model), result as markdown, diff in a collapsible block, footer "Recorded from a real `claude -p` session. Costs at list API prices." A missing file renders a "recording not available" box, never a build error.
- Generated pages from the repo markdown (`site/scripts/sync-content.mjs`, run as `prebuild`): every playbook (`skills/shipit/playbooks/*.md`), skill (`skills/*/SKILL.md`, frontmatter stripped, description as page description) and principle (`skills/shipit/principles/*.md`), with index pages. Escape MDX hazards (`<`, `{`, `}` outside code) or emit plain `.md`. Rewrite `~/.claude/skills/<x>/SKILL.md`, `playbooks/<x>.md`, `principles/<x>.md` links to site pages. Generated files stay on disk (a Vercel build may only see `site/`); the script no-ops if `../skills` is missing.
- Hand-written pages: Introduction (3 sentences, 3-command install, headline benefits with real numbers, link to Runs), Benefits (vs plain Claude Code; the eval in `docs/evals/`; honest costs: a feature is roughly 2 to 4 times a plain session, the trivial lane avoids that), Getting started (`install.sh`, `/setup-shipit` incl. the auto-mode repos step, first task), How /shipit works (flow, trivial lane, "a playbook is the checklist /shipit follows for one kind of task; you never name it", model roles, proof, cost receipt), Runs (index + one page per run), Proof (sizing table from `skills/shipit/references/proof-pack.md`, the opt-in hook and its settings snippet), Models and cost (roles, budget, eval as simple CSS bars, `cost.py`), Auto mode (`skills/shipit/references/auto-mode.md`), berth (what it adds, with/without table), Playbooks, Skills, Principles, Credits (pstack by Lauren Tan, MIT, https://github.com/cursor/plugins/tree/main/pstack).
- Rules: plain short sentences, no long-dash character, nothing company-specific, nothing from `docs/how-sean-works*` (it is not in this repo and must not be). Bare `<word>` in MDX prose breaks the build; use backticks.

## 3. Record the runs (real, never invented)

Use `site-runs/normalize.py` to turn each `claude -p --output-format stream-json --verbose` log into `site/content/runs/<id>.json`. It takes the log and a meta JSON (`id, title, command, playbook, environment, repo, prompt, recorded, notes`, optional `diff_file`). Put raw logs in a scratch folder, not the repo.

Demo app: `examples/acme-invoices` (planted bug: 15% off $59.97 shows $8.99, should be $9.00; the CLI prints "Totall"). For each run that touches it, copy it to a fresh scratch dir and `git init` + commit, so the diff is real (`git diff` after the run is the `diff_file`).

Code for the read-only runs: clone berth with `gh repo clone cosscom/shipyard ~/src/shipyard` (read-only use).

| id | where | permission mode | prompt |
|---|---|---|---|
| `trivial` | acme copy | auto | `/shipit the CLI summary prints "Totall" instead of "Total". fix the typo.` |
| `bugfix` | acme copy | auto | `/shipit invoice totals are a cent off when a percentage discount applies: 3 widgets at $19.99 with 15% off shows a discount of $8.99, should be $9.00. repro first, then fix and verify.` |
| `ideation` | acme copy | plan | `/shipit I want invoices to support multiple currencies. what if we did that? no code yet, help me plan it.` |
| `how` | ~/src/shipyard | plan | `/how does berthd shots compare decide which baseline to diff against when main's dev server isn't running?` |
| `why` | ~/src/shipyard | plan | `/why does the laptop proxy rewrite the Host header to localhost:PORT before forwarding to the dev server?` |
| `interrogate` | this repo at `main` | plan | `/interrogate the last three commits on main. skeptically. real bugs only, no nitpicks. don't change anything.` |
| `trivial-plain`, `bugfix-plain` | acme copies | auto | same prompts as trivial and bugfix, run with berth hidden: `env -u BERTH_SESSION -u BERTH_LOCATION -u BERTH_WORKTREE_NAME -u BERTH_PORT -u BERTH_URL PATH=<PATH without berth/berthd dirs> claude -p …` (unset every `BERTH_*` you find) |

Runs from this task carry berth's environment, so label them `"Claude Code headless (claude -p) on a berth box, auto permission mode"`; the `-plain` ones `"Claude Code headless (claude -p), no berth, auto permission mode"`. On the trivial and bugfix pages, show `<Berth><Run id="bugfix" /></Berth><NoBerth><Run id="bugfix-plain" /></NoBerth>` (same for trivial). At most 5 runs at once.

Before committing any run JSON, scan it for secrets, tokens, emails and private paths outside `/home/sean/src` and the scratch dirs; redact if found and note it in the run's `notes`.

For each run page, replace `TODO-commentary` with 3 to 5 bullets of what to notice, drawn from the actual run (what it checked, what it proved, what it cost, anything it got wrong). If a run failed or did something silly, say so plainly; that's useful too.

## 4. Prove and deliver

- `cd site && pnpm build` passes. Start it, then screenshot the home page, a run page and a skill page in light and dark at phone and desktop widths with the **berth-browser** skill (`berthd browser`), and look at each shot. Fix what's broken.
- Branch from this worktree, conventional lowercase commits (`feat(site): …`), end commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Push. Embed the screenshots in the PR by committing them to a `pr-assets` branch (one folder per PR, never merged) and linking `https://github.com/sean-brydon/shipstack/blob/pr-assets/<pr>/<name>.png?raw=true`.
- Open one PR to `main` with `## Why`, `## What changed`, `## Proof` (build output, the screenshot table, the run list with cost and duration per run, total spend from `python3 -I skills/shipit/scripts/cost.py`), and end it with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Add a `vercel.json` only if needed. Vercel will build `site/` as the root directory.
- Finish with a short status in your last message: PR link, total cost, anything left for the owner (deploy is one: `cd site && vercel --prod`).
