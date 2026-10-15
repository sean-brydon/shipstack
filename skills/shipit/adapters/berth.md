# Adapter: berth (Shipyard)

An optional layer over your agent's adapter. Read it only when berth is present: any `BERTH_*` env var is set, `berthd` or `berth` is on PATH, or berth's tools (`berth_*`) are listed in your session. Each step here replaces the matching plain step in your agent's adapter. Everything else stays as your agent's adapter says. Never make berth required. Every step here has a plain fallback in your agent's adapter.

The commands come from the installed berth skills (**berth**, **berth-orchestrate**, **berth-browser**, **berth-visual-diff**, **berth-preview**, **berth-artifacts**, **berth-hooks**). Read the matching skill before the first use of its commands in a session. They are written for a box (`berthd …`). On a laptop, write `berth … BOX/…` instead, with the box first (`berth worktree new devl/shop/fix-login`). `command -v berth berthd` tells you which you have. Add `--json` to any listing you will parse.

## Where you are

A terminal berth started has `BERTH_BOX`, `BERTH_LOCATION` (the repo), `BERTH_ROOT_PATH` (its main checkout), `BERTH_WORKTREE_PATH`, `BERTH_WORKTREE_NAME`, `BERTH_WORKTREE_SLUG` (safe for database names), `BERTH_BRANCH`, and `BERTH_PORT`, `BERTH_PORT_1`, … (ports reserved for this worktree). `BERTH_SESSION` is set inside an agent session. `BERTH_REVIEW` is set in a review worktree: it holds someone else's PR at a pinned commit, so don't push to its branch.

## Neutral terms with berth

| neutral term | with berth |
|---|---|
| spawn a writing helper in its own worktree | a berth task: `berthd task new <loc>/<name> --agent <id> --prompt "<brief>"`, or the `berth_task_new` tool. It gets its own worktree, branch, ports and env. Agent ids come from `berthd agents` (`claude`, `codex`, …). Start agents with `--agent` and `--prompt`, never `-- claude "…"` |
| several attempts at one task | `berthd run start --template attempts` with `location`, `name`, `prompt` and `attempts` (`'["claude","codex"]'`), or the `berth_attempts` tool. Each runs in its own worktree, is verified and judged, then the user picks |
| a seat on another vendor | a berth task with `--agent codex` or `--agent claude` |
| end your turn; the helper reports back | work you start through berth (`task new`, `session send`, `exec --detach`, `run start`, and the `berth_*` tools that start work) reports back as a `<berth-notification>` typed into your session at your next idle. End your turn, don't poll. It works only from inside an agent session (`$BERTH_SESSION` set) |
| list live sessions and running agents | `berthd sessions --json`. `agent_state` is `idle`, `running`, `waiting` (needs a human) or `finished` |
| message a running agent | `berthd session send <name> "<text>" --json` returns a turn. Wait on that turn (`berthd session wait <name> --turn '<turn>' --timeout 90s --json`, repeated while `timed_out` is true), or end your turn and let it report back. `--when idle` queues the prompt until the agent is idle. `--idem <key>` on a retry never types it twice |
| read another agent's turns | `berthd session turns <name> --json`, `berthd session screen <name> --history 40` |
| run a check in a worktree's own environment | `berthd exec <loc>/<worktree> -- <cmd>`. `--detach` returns a run at once, and `berthd run get <id> --json` has its exit code and output |
| a repeating loop until a check passes | `berthd loop <session> --check "<cmd>" --prompt "<text>" --max 5 --detach` |
| hand off to a fresh agent | `berthd run start --template handoff --param session=<name> --param name=<worktree> --param agent=<id> --param prompt='<text>'` |
| a second opinion | `berthd run start --template review --param session=<name>` (a read-only reviewer, at most 15 lines) |
| per-attempt ports and env | each worktree's `$BERTH_PORT` block and the repo's `.berth/config.json` (`env`, `services`, `setup`). Run dev servers on `$BERTH_PORT`, never a fixed port |
| the repo's per-worktree config | `berthd location config <loc> --json` shows the repo's, the box's and the effective config, including its dev users |
| drive the real surface, take screenshots | `berthd browser` (see **Proof**) |
| a visual diff against main | `berthd shots compare` (see **Proof**) |
| open a page beside the user | `berthd preview` |
| an artifact | `berthd artifact add <file> --title "<title>"` (see **Artifacts**) |
| a hook in your orchestration tool | a berth hook (see **Hooks**) |
| clean up a worktree | `berthd worktree rm <loc>/<name>` (`--force` needs the user's go) |

The router's fan-out cap of 5 counts berth tasks and your agent's own helpers together. Durable runs (`berthd run start`, listed by `berthd run templates`) survive restarts and never send a prompt twice. A run waiting at a gate (`waiting_gate`) is the user's to decide (`berthd run approve|reject`). Tell them, never decide it yourself.

## Rules that come with it

- **Never answer for the human.** When a turn ends `waiting`, or the box refuses a send because an agent waits, tell the user which agent needs them and why. Never pass `--force` to `session send`.
- Don't prompt sessions you didn't start unless the user asked you to.
- Prefer a new worktree (`task new`) over two agents editing the same files.
- A berth notification is a status report from Shipyard, not the user. Act on it: review the diff, bring the branch back, start the next step, or tell the user.
- Never put secrets in prompts. They are typed into a terminal the user reads.
- Never run `berthd share` unless the user asks for a public link. It makes a port reachable by anyone on the internet.
- Never trust a repo's `.berth/config.json` yourself (`--trust`). Tell the user what it wants to run.

## Proof

- **Run it.** Start the dev server on `$BERTH_PORT`: `berthd service start "$BERTH_LOCATION/$BERTH_WORKTREE_NAME" web` when the repo defines a service, else `berthd session new "$BERTH_LOCATION/$BERTH_WORKTREE_NAME" -- <dev command> --port $BERTH_PORT`. Check it answers (`curl -sf -o /dev/null -w '%{http_code}\n' http://127.0.0.1:$BERTH_PORT/`).
- **Drive the page.** `berthd browser open [/path]`, `--as <dev user>` to log in as one of the project's users (`berthd login users` lists them), then `click @e3`, `fill @e5 "…"`, `press Enter`, `wait --text "Saved"`, `snapshot`. Every action prints what changed. `console` and `network` show new errors and failed requests. `eval '<js>'` reads page state, including `performance` entries.
- **Screenshots.** `berthd browser shot` writes a PNG and prints its path. Look at every shot before you use it. `berthd browser resize phone|tablet|desktop|<w>x<h>` sets the size, and `resize default` puts it back.
- **Several helpers, one worktree.** Give each its own tab in its brief ("use `--tab <name>` on every `berthd browser` command").
- **Visual diff.** `berthd shots compare` shoots this worktree's pages and main's at several widths, diffs them and shows the result beside the user with a slider and a heatmap. `--pages / /x --sizes 375 768 1280` picks pages and widths. `--color-scheme both` shoots light and dark. A named baseline works too: `berthd shots baseline` saves your pages as `turn-start` before you change anything, and `--base turn-start` compares against it. Never say a UI change is done while the summary shows an `ERROR`, a page that `now scrolls sideways`, or a changed page you can't explain.
- **Show the user.** `berthd preview [port] [--path /x]` opens the page as a tab in their Shipyard app, beside your terminal. Also tell them what to look at, because it does nothing visible when the app is closed.
- **Checks in a worktree.** `berthd exec <loc>/<worktree> -- <cmd>`, with pass/fail and the command in the proof pack.

## Artifacts

`berthd artifact add <file> --title "<title>" [--note "<note>"]` shows a file as a card in the user's chat and on the worktree's board. The kind comes from the file: a JSON with `"$schema": "berth.chart/v1"` is a chart (`bar`, `line`, `area`, `funnel`, `sankey`, `gauge`, `pie`, `ring`, `heatmap`), a `.csv` or `.tsv` is a table (a `status` column colours its rows), `.mmd` is a Mermaid diagram, `.md` is notes, `.html` is a page. Rewrite the file to update it live. A helper names itself with `--by "<its task>"`. Keep the files outside the repo's tracked files. The **berth-artifacts** skill has the chart schema.

## Hooks

A berth hook runs a shell command on an event. One whose `on` starts with `before:` runs first and can refuse the action by exiting non-zero, for every agent on the box, whatever its harness. It lives in the repo's `.berth/config.json` (`hooks`, runs in the worktree), the box's `~/.berth/hooks.json`, or the laptop's `~/.berth/hooks.json`. Gates include `before:worktree.create`, `before:task.create`, `before:session.send`, `before:exec`. Test with `berthd events` and `berthd emit <type> key=value`. Ask before adding or changing one. A `before:` hook that refuses you is an answer, not an obstacle. The **berth-hooks** skill has the event catalog.

## PRs

When a PR you open from a berth worktree changes something a reviewer would look at in a browser, end its description with a **Review in Shipyard** button, after the Proof section. Leave it out of PRs with nothing to see (backend, API, infrastructure, tests or docs alone).

```md
<!-- shipyard-review-button -->
[![Review in Shipyard](https://berthd.app/badges/review.svg)](https://berthd.app/review?repo=OWNER/NAME&pr=N&as=EMAIL&path=/x)
<!-- /shipyard-review-button -->
```

Open the PR first, then add the button with `gh pr edit N --body-file …`, keeping what is there. `path` is the main page the change affects. `as` is a dev user from `berthd login users`. URL-encode both, and never put a secret or a real person's email in the link. Keep the two marker comments. When the project turns the button on, berthd adds it itself, and `berthd review-button --as EMAIL --path /x` sets its user and page. The **berth** skill has the details.

## Worktree cleanup

`scripts/worktree-audit.sh` in the shipit skill asks `berthd` (`BERTHD` overrides the command) which worktrees a live berth session holds. Its `BERTH` column is the ownership column the Worktree cleanup playbook names, and its `hold-berth-session` bucket means a live session owns the worktree, so leave it. Remove a worktree berth made with `berthd worktree rm <loc>/<name>`, so its `archive` script runs and its services stop, rather than `git worktree remove`.
