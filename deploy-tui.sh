#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
line() { printf '%s\n' "────────────────────────────────────────────────────────────"; }
ask() { local prompt="$1" default="${2:-}" value; if [[ -n "$default" ]]; then read -r -p "$prompt [$default]: " value; value="${value:-$default}"; else read -r -p "$prompt: " value; fi; printf '%s' "$value"; }
fail() { printf '\033[31mERROR:\033[0m %s\n' "$1" >&2; exit 1; }

install_prerequisites() {
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    local runner=""
    if [[ "$(id -u)" -ne 0 ]]; then
      command -v sudo >/dev/null 2>&1 || fail "Node.js/npm are missing. Install sudo or run this wizard as root."
      runner="sudo"
    fi
    if [[ -f /etc/debian_version ]] && command -v apt-get >/dev/null 2>&1; then
      $runner apt-get update
      $runner apt-get install -y nodejs npm build-essential python3 make g++ sqlite3
    elif [[ -f /etc/redhat-release ]] && command -v dnf >/dev/null 2>&1; then
      $runner dnf install -y nodejs npm gcc-c++ make python3 sqlite
    elif [[ -f /etc/arch-release ]] && command -v pacman >/dev/null 2>&1; then
      $runner pacman -Sy --noconfirm nodejs npm base-devel sqlite
    else
      fail "Unsupported Linux package manager. Install Node.js 20+ and npm, then rerun."
    fi
  fi
  command -v node >/dev/null 2>&1 || fail "Node.js installation failed."
  command -v npm >/dev/null 2>&1 || fail "npm installation failed."
  local major="$(node -p 'process.versions.node.split(".")[0]')"
  [[ "$major" =~ ^[0-9]+$ ]] && (( major >= 20 )) || fail "Node.js 20 or newer is required; found $(node --version)."
  if [[ ! -x node_modules/.bin/next ]]; then
    bold "Installing Boardly dependencies"
    npm ci
  fi
}

clear || true
bold "Boardly deployment setup"
line
printf 'This wizard installs missing prerequisites when supported, prepares a build and configuration, and does not modify DNS or deploy remotely.\n\n'

ENV_FILE=".env.production"
DB_PATH="$(ask 'SQLite database path' '/var/lib/boardly/todo.db')"
PORT="$(ask 'Application port' '3000')"
DOMAIN="$(ask 'Domain or LAN host name (optional)' '')"
PROTOCOL="$(ask 'Protocol for local/LAN use (http or https)' 'http')"
if [[ "$PROTOCOL" != "http" && "$PROTOCOL" != "https" ]]; then fail "Protocol must be http or https."; fi
SERVICE_USER="$(ask 'Service user' 'www-data')"
BRAND_NAME="$(ask 'Brand name' 'Boardly')"
BRAND_TAGLINE="$(ask 'Brand tagline' 'Simple, shareable task boards for getting things done together.')"
BRAND_LOGO="$(ask 'Logo path or URL' '/icon.png')"

if [[ ! "$PORT" =~ ^[0-9]+$ ]] || (( PORT < 1 || PORT > 65535 )); then fail "Invalid port."; fi

printf '\n'
bold "Configuration summary"
printf 'Database: %s\nPort:     %s\nDomain:   %s\nUser:     %s\nBrand:    %s\n\n' "$DB_PATH" "$PORT" "${DOMAIN:-not set}" "$SERVICE_USER" "$BRAND_NAME"
confirm="$(ask 'Install prerequisites, write configuration, and build now? (y/N)' 'N')"
[[ "$confirm" =~ ^[Yy]$ ]] || { printf 'Cancelled.\n'; exit 0; }

install_prerequisites
umask 077
printf 'TODO_DB_PATH=%q\nPORT=%q\nNODE_ENV=production\nBOARDLY_PROTOCOL=%q\n' "$DB_PATH" "$PORT" "$PROTOCOL" > "$ENV_FILE"
printf 'NEXT_PUBLIC_BRAND_NAME=%q\nNEXT_PUBLIC_BRAND_TAGLINE=%q\nNEXT_PUBLIC_BRAND_LOGO=%q\n' "$BRAND_NAME" "$BRAND_TAGLINE" "$BRAND_LOGO" >> "$ENV_FILE"
if [[ -n "$DOMAIN" ]]; then printf 'BOARDLY_DOMAIN=%q\n' "$DOMAIN" >> "$ENV_FILE"; fi

mkdir -p "$(dirname "$DB_PATH")" 2>/dev/null || printf 'Note: create %s with appropriate permissions on the server.\n' "$(dirname "$DB_PATH")"
npm run build

printf '\n'
bold "Prepared successfully"
printf 'Generated: %s\nBuild:     .next/standalone\nDatabase:  %s\n\n' "$ENV_FILE" "$DB_PATH"
printf 'First boot: start the app, then open /setup to create the administrator account.\nFor a VPS, copy the standalone output, public/, %s, and deploy/todo-board.service.\nLocal/LAN URL: %s://%s:%s\nUse plain HTTP for trusted LAN testing. Do not expose the app publicly until HTTPS and a reverse proxy are configured.\n' "$ENV_FILE" "$PROTOCOL" "${DOMAIN:-localhost}" "$PORT"
