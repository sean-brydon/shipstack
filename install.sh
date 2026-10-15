#!/usr/bin/env bash
# Links shipit's skills into ~/.claude/skills and its agents into ~/.claude/agents.
# Symlinks, so edits in this repo apply to the next session. Safe to rerun.
#   ./install.sh            install or refresh
#   ./install.sh --dry-run  show what it would do
#   ./install.sh --uninstall  remove only links that point into this repo
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
claude="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
mode="install"
case "${1:-}" in
  --dry-run) mode="dry" ;;
  --uninstall) mode="uninstall" ;;
  "") ;;
  *) echo "usage: $0 [--dry-run|--uninstall]" >&2; exit 2 ;;
esac

run() { if [ "$mode" = dry ]; then echo "would: $*"; else "$@"; fi; }

link() {
  local src="$1" dst="$2"
  if [ "$mode" = uninstall ]; then
    if [ -L "$dst" ] && [[ "$(readlink "$dst")" == "$repo"/* ]]; then
      rm "$dst" && echo "removed $dst"
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
  [ "$mode" = dry ] || echo "linked $dst"
}

run mkdir -p "$claude/skills" "$claude/agents" "$claude/shipit"

for dir in "$repo"/skills/*/; do
  name="$(basename "$dir")"
  link "${dir%/}" "$claude/skills/$name"
done
for file in "$repo"/agents/*.md; do
  [ -e "$file" ] || continue
  link "$file" "$claude/agents/$(basename "$file")"
done

if [ "$mode" = install ]; then
  echo
  echo "shipit is installed. In a new Claude Code session:"
  echo "  /setup-shipit   pick models per role (optional; defaults work)"
  echo "  /shipit <task>  route a task to a playbook"
fi
