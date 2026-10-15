#!/usr/bin/env bash
# Links shipstack's skills into each agent it finds, and its Claude Code subagents into ~/.claude/agents.
#   Claude Code (claude on PATH, or ~/.claude exists): skills -> ~/.claude/skills, agents -> ~/.claude/agents
#   Codex (codex on PATH, or ${CODEX_HOME:-~/.codex} exists): skills -> ~/.agents/skills
# Symlinks, so edits in this repo apply to the next session. Never overwrites. Safe to rerun.
#   ./install.sh                            install or refresh for every agent found
#   ./install.sh --agent claude|codex|all   pick the agents instead of detecting them
#   ./install.sh --dry-run                  show what it would do (combines with --uninstall)
#   ./install.sh --uninstall                remove only links that point into this repo, from both places
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
claude="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
agents_home="$HOME/.agents"
uninstall=0
dry=0
agent=""

usage() { echo "usage: $0 [--agent claude|codex|all] [--dry-run] [--uninstall]" >&2; exit 2; }

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) dry=1 ;;
    --uninstall) uninstall=1 ;;
    --agent)
      [ $# -ge 2 ] || usage
      agent="$2"; shift ;;
    --agent=*) agent="${1#--agent=}" ;;
    *) usage ;;
  esac
  shift
done

want_claude=0
want_codex=0
case "$agent" in
  claude) want_claude=1 ;;
  codex) want_codex=1 ;;
  all) want_claude=1; want_codex=1 ;;
  "")
    if [ "$uninstall" = 1 ]; then
      want_claude=1; want_codex=1
    else
      if command -v claude >/dev/null 2>&1 || [ -d "$claude" ]; then want_claude=1; fi
      if command -v codex >/dev/null 2>&1 || [ -d "${CODEX_HOME:-$HOME/.codex}" ]; then want_codex=1; fi
    fi ;;
  *) usage ;;
esac

if [ "$want_claude" = 0 ] && [ "$want_codex" = 0 ]; then
  echo "found neither Claude Code nor Codex. Pass --agent claude, codex or all." >&2
  exit 1
fi

run() { if [ "$dry" = 1 ]; then echo "would: $*"; else "$@"; fi; }

link() {
  local src="$1" dst="$2"
  if [ "$uninstall" = 1 ]; then
    if [ -L "$dst" ] && [[ "$(readlink "$dst")" == "$repo"/* ]]; then
      run rm "$dst"
      [ "$dry" = 1 ] || echo "removed $dst"
    fi
    return
  fi
  if [ -L "$dst" ]; then
    [ "$(readlink "$dst")" = "$src" ] && return
    [[ "$(readlink "$dst")" == "$repo"/* ]] || { echo "skip $dst: links somewhere else ($(readlink "$dst"))" >&2; return; }
    run rm "$dst"
  elif [ -e "$dst" ]; then
    echo "skip $dst: a real file or folder is there, not touching it" >&2
    return
  fi
  run ln -s "$src" "$dst"
  [ "$dry" = 1 ] || echo "linked $dst"
}

link_skills() {
  local dest="$1" dir
  for dir in "$repo"/skills/*/; do
    link "${dir%/}" "$dest/$(basename "$dir")"
  done
}

if [ "$want_claude" = 1 ]; then
  [ "$uninstall" = 1 ] || run mkdir -p "$claude/skills" "$claude/agents" "$claude/shipit"
  link_skills "$claude/skills"
  for file in "$repo"/agents/*.md; do
    [ -e "$file" ] || continue
    link "$file" "$claude/agents/$(basename "$file")"
  done
fi

if [ "$want_codex" = 1 ]; then
  [ "$uninstall" = 1 ] || run mkdir -p "$agents_home/skills" "$agents_home/shipit"
  link_skills "$agents_home/skills"
fi

if [ "$uninstall" = 0 ] && [ "$dry" = 0 ]; then
  echo
  if [ "$want_claude" = 1 ]; then
    echo "Claude Code: in a new session,"
    echo "  /setup-shipit   pick models per role (optional; defaults work)"
    echo "  /shipit <task>  route a task to a playbook"
  fi
  if [ "$want_codex" = 1 ]; then
    echo "Codex: in a new session, ask it to use the setup-shipit skill (optional), then the shipit skill with your task."
  fi
fi
