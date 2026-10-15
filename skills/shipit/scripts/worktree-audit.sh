#!/usr/bin/env bash
# Read-only worktree prune audit. Classifies every git worktree by size, merge
# state, uncommitted work, remote/PR state, berth ownership, and the most
# recent Claude Code chat that operated in it. Emits a table sorted by size
# with a suggested bucket. Never deletes anything; deletion stays a
# human-gated step in the playbook.
#
# Usage: worktree-audit.sh [-b|--base <ref>] [repo-path]
#   repo-path defaults to the current repo.
#   -b sets the ref the MERGED column checks against (e.g. origin/integration).
#   Without it the base is origin/HEAD, then origin/main, then origin/master.
#   origin/HEAD is the remote's default branch, not necessarily the branch PRs
#   merge into; pass -b when they differ.
#   CLAUDE_PROJECTS overrides the transcript root (default ~/.claude/projects).
#   BERTHD overrides the berthd command (default berthd on PATH).
set -u

base=""
while [ $# -gt 0 ]; do
	case "$1" in
	-b|--base) [ $# -ge 2 ] || { echo "error: $1 needs a ref" >&2; exit 2; }; base="$2"; shift 2 ;;
	-h|--help) sed -n '2,/^set -u/p' "$0" | sed '$d; s/^# \{0,1\}//'; exit 0 ;;
	-*) echo "error: unknown option: $1" >&2; exit 2 ;;
	*) break ;;
	esac
done

repo="${1:-$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -z "$repo" ] && { echo "not in a git repo; pass a repo path" >&2; exit 1; }
cd "$repo" || exit 1
git rev-parse --git-dir >/dev/null 2>&1 || { echo "error: not a git repo: $repo" >&2; exit 1; }

# Main worktree is the first entry; everything else is a candidate.
main_wt=$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')

if [ -z "$base" ]; then
	for cand in "$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null)" origin/main origin/master; do
		[ -n "$cand" ] && git rev-parse --verify --quiet "$cand^{commit}" >/dev/null && { base="$cand"; break; }
	done
	[ -z "$base" ] && { echo "error: no base ref (origin/HEAD, origin/main, origin/master all missing); pass -b <ref>" >&2; exit 1; }
	echo "warn: no -b given; MERGED checks against $base" >&2
fi

# The base drives the merge check. The fetch is best-effort (stale is fine for
# a first pass) and runs before the check, since -b may name a branch not
# fetched yet. The explicit refspec creates it even in a single-branch clone.
case "$base" in
origin/*) git fetch origin "+refs/heads/${base#origin/}:refs/remotes/$base" --quiet 2>/dev/null \
	|| echo "warn: could not fetch $base; merged column may be stale" >&2 ;;
esac
git rev-parse --verify --quiet "$base^{commit}" >/dev/null 2>&1 || { echo "error: base ref not found: $base" >&2; exit 1; }

# PR state by branch, fetched once as [{number, state, head}] with a lowercase
# state. Empty when gh cannot read this repo's PRs.
prs=$(mktemp)
if raw=$(gh pr list --author "@me" --state all --limit 1000 \
	--json number,state,headRefName 2>/dev/null); then
	printf '%s' "$raw" | jq '[.[] | {number, state: (.state | ascii_downcase), head: .headRefName}]' > "$prs" 2>/dev/null
fi
[ -s "$prs" ] || echo "[]" > "$prs"

# berth-managed worktrees: path -> location/name, and the directories of live
# berth sessions. Only berthd (the box daemon, where berth's worktrees live)
# can say; without it both stay empty. Read-only: never touches berth state.
berth_wts=$(mktemp); berth_live=$(mktemp)
echo "{}" > "$berth_wts"
berthd="${BERTHD:-berthd}"
if command -v "$berthd" >/dev/null 2>&1; then
	"$berthd" locations --json 2>/dev/null | jq '[.[] | .name as $loc | (.worktrees // [])[]
		| select(.main != true) | {key: .path, value: "\($loc)/\(.name)"}] | from_entries' \
		> "$berth_wts" 2>/dev/null || echo "{}" > "$berth_wts"
	"$berthd" sessions --json 2>/dev/null | jq -r '.[] | select(.exited != true) | .dir // empty' \
		> "$berth_live" 2>/dev/null || : > "$berth_live"
fi
[ -s "$berth_wts" ] || echo "{}" > "$berth_wts"

# Claude Code transcripts: ~/.claude/projects/<slug>/<session>.jsonl, where
# <slug> is the session's cwd with every character outside [A-Za-z0-9-]
# replaced by "-". Subagent transcripts nest under <session>/. Worktrees
# (nested like .claude/worktrees/x, or siblings like repo-x as berth makes
# them) share the main checkout's slug as a prefix, so scan those dirs.
projects="${CLAUDE_PROJECTS:-$HOME/.claude/projects}"
slugify() { printf '%s' "$1" | sed 's#[^A-Za-z0-9-]#-#g'; }
main_slug=$(slugify "$main_wt")
transcript_dirs=$(find "$projects" -maxdepth 1 -type d -name "${main_slug}*" 2>/dev/null)
# GNU stat (a Linux box) and BSD stat (macOS) take different flags.
if stat -c '%Y' / >/dev/null 2>&1; then mtime() { stat -c '%Y %n' "$1"; }
else mtime() { stat -f '%m %N' "$1"; }; fi
if command -v rg >/dev/null 2>&1; then mentions() { rg -l -g '*.jsonl' -F -e "$1/" -e "$1\"" "$2"; }
else mentions() { grep -rlF --include='*.jsonl' -e "$1/" -e "$1\"" "$2"; }; fi
now=$(date +%s)

echo "# base: $base"
printf "SIZE\tAGE\tMERGED\tDIRTY\tREMOTE\tPR\tBERTH\tLAST_CHAT\tBUCKET\tWORKTREE\n"

git worktree list --porcelain | awk '/^worktree /{print $2}' | while read -r wt; do
	[ "$wt" = "$main_wt" ] && continue

	size=$(du -sh "$wt" 2>/dev/null | awk '{print $1}')
	head=$(git -C "$wt" rev-parse HEAD 2>/dev/null)
	head_ts=$(git -C "$wt" log -1 --format='%ct' HEAD 2>/dev/null || echo 0)
	age=$([ "$head_ts" -gt 0 ] 2>/dev/null && echo "$(( (now - head_ts) / 86400 ))d" || echo "?")

	# Squash-merged branches are not ancestors of the base, so PR state is the
	# real signal; merge-base only catches fast-forward/rebase merges.
	git merge-base --is-ancestor "$head" "$base" 2>/dev/null && merged=YES || merged=no

	# Distinguish real WIP (tracked edits) from disposable untracked scratch.
	porcelain=$(git -C "$wt" status --porcelain 2>/dev/null)
	if [ -z "$porcelain" ]; then dirty=clean
	elif printf '%s\n' "$porcelain" | grep -qv '^??'; then
		dirty="wip:$(printf '%s\n' "$porcelain" | grep -cv '^??')"
	else dirty="scratch:$(printf '%s\n' "$porcelain" | grep -c '^??')"; fi

	branch=$(git -C "$wt" symbolic-ref --quiet --short HEAD 2>/dev/null || echo "")
	if [ -z "$branch" ]; then remote=detached
	elif git -C "$wt" show-ref --verify --quiet "refs/remotes/origin/$branch"; then
		[ "$(git -C "$wt" rev-parse "origin/$branch" 2>/dev/null)" = "$head" ] \
			&& remote=pushed \
			|| remote="ahead$(git -C "$wt" rev-list --count "origin/$branch..HEAD" 2>/dev/null)"
	else remote=no-remote; fi

	pr=$([ -n "$branch" ] && jq -r --arg b "$branch" \
		'.[] | select(.head==$b) | "#\(.number)/\(.state)"' "$prs" 2>/dev/null | head -1)
	[ -z "$pr" ] && pr="-"

	berth=$(jq -r --arg p "$wt" '.[$p] // "-"' "$berth_wts" 2>/dev/null)
	[ -z "$berth" ] && berth="-"
	live=no
	grep -qxF "$wt" "$berth_live" 2>/dev/null && live=yes

	# Most recent chat whose transcript ran in or operated on this worktree:
	# a session started in it (its own slug dir), or one elsewhere whose
	# transcript names the path followed by "/" or a quote, so glint-482 does
	# not match glint-482-r37. LAST_CHAT is <date>/<session id prefix>.
	last="-"; last_ts=0
	own="$projects/$(slugify "$wt")"
	f=$( { [ -d "$own" ] && find "$own" -name '*.jsonl' 2>/dev/null
		[ -n "$transcript_dirs" ] && printf '%s\n' "$transcript_dirs" | while read -r d; do
			mentions "$wt" "$d" 2>/dev/null; done
		} | while read -r t; do mtime "$t" 2>/dev/null; done \
		| sort -rn | head -1)
	if [ -n "$f" ]; then
		last_ts=$(echo "$f" | awk '{print $1}')
		sid=$(echo "$f" | cut -d' ' -f2- | sed "s#^$projects/[^/]*/##; s#[/.].*##" | cut -c1-8)
		last="$(date -r "$last_ts" '+%Y-%m-%d' 2>/dev/null || date -d "@$last_ts" '+%Y-%m-%d')/$sid"
	fi
	recent=$([ "$last_ts" -gt 0 ] 2>/dev/null && [ $(( (now - last_ts) / 86400 )) -le 4 ] && echo yes || echo no)

	case "$dirty" in wip:*) bucket=hold-wip ;; *)
		case "$pr" in */open|*/draft) bucket=hold-open-pr ;; *)
			if [ "$live" = yes ]; then bucket=hold-berth-session
			elif [ "$recent" = yes ]; then bucket=verify-recent-chat
			elif [ "$merged" = YES ] || [ "$pr" != "-" ]; then bucket=safe
			else bucket=review; fi ;;
		esac ;;
	esac

	printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n" \
		"$size" "$age" "$merged" "$dirty" "$remote" "$pr" "$berth" "$last" "$bucket" "$wt"
done | sort -t$'\t' -k1,1 -rh

rm -f "$prs" "$berth_wts" "$berth_live"
