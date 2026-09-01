#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ "${1:-}" == "--tui" ]]; then
  exec "$ROOT_DIR/deploy-tui.sh"
fi

log() { printf '\033[1m[Boardly]\033[0m %s\n' "$1"; }
fail() { printf '\033[31m[Boardly] ERROR:\033[0m %s\n' "$1" >&2; exit 1; }

install_prerequisites() {
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    if [[ -f /etc/debian_version ]] && command -v apt-get >/dev/null 2>&1; then
      local runner=""
      if [[ "$(id -u)" -ne 0 ]]; then
        command -v sudo >/dev/null 2>&1 || fail "Node.js/npm are missing. Install sudo or run this script as root."
        runner="sudo"
      fi
      log "Installing Node.js, npm, compiler tools, and SQLite tools for Debian/Ubuntu..."
      $runner apt-get update
      $runner apt-get install -y nodejs npm build-essential python3 make g++ sqlite3
    elif [[ -f /etc/redhat-release ]] && command -v dnf >/dev/null 2>&1; then
      local runner=""
      if [[ "$(id -u)" -ne 0 ]]; then
        command -v sudo >/dev/null 2>&1 || fail "Node.js/npm are missing. Install sudo or run this script as root."
        runner="sudo"
      fi
      log "Installing Node.js, npm, compiler tools, and SQLite tools for RHEL/Fedora..."
      $runner dnf install -y nodejs npm gcc-c++ make python3 sqlite
    elif [[ -f /etc/arch-release ]] && command -v pacman >/dev/null 2>&1; then
      local runner=""
      if [[ "$(id -u)" -ne 0 ]]; then
        command -v sudo >/dev/null 2>&1 || fail "Node.js/npm are missing. Install sudo or run this script as root."
        runner="sudo"
      fi
      log "Installing Node.js, npm, compiler tools, and SQLite tools for Arch..."
      $runner pacman -Sy --noconfirm nodejs npm base-devel sqlite
    else
      fail "Node.js/npm are missing and this Linux distribution is unsupported. Install Node.js 20+ and npm, then rerun."
    fi
  fi

  command -v node >/dev/null 2>&1 || fail "Node.js is still unavailable after installation."
  command -v npm >/dev/null 2>&1 || fail "npm is still unavailable after installation."
  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  [[ "$major" =~ ^[0-9]+$ ]] && (( major >= 20 )) || fail "Node.js 20 or newer is required; found $(node --version)."

  if [[ ! -x node_modules/.bin/next ]]; then
    log "Installing Boardly dependencies..."
    npm ci
  else
    log "Boardly dependencies already installed."
  fi
}

install_prerequisites
log "Building the standalone production bundle..."
npm run build

printf '\n'
log "Build complete."
printf 'Standalone output: .next/standalone/\n\n'
printf 'For a source checkout:\n  NODE_ENV=production TODO_DB_PATH=/var/lib/boardly/todo.db PORT=3000 npm start\n\n'
printf 'For a fresh installation, open /setup to create the administrator.\n'
printf 'Run ./deploy.sh --tui for the interactive deployment wizard.\n'
