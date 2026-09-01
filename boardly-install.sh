#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -n "${BOARDLY_USER:-}" ]]; then
  APP_USER="$BOARDLY_USER"
elif [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  APP_USER="$SUDO_USER"
elif id ubuntu >/dev/null 2>&1; then
  APP_USER="ubuntu"
elif id www-data >/dev/null 2>&1; then
  APP_USER="www-data"
else
  APP_USER="$(id -un)"
fi
APP_PORT="${BOARDLY_PORT:-3000}"
DB_PATH="${TODO_DB_PATH:-/var/lib/boardly/todo.db}"
SERVICE_NAME="boardly"

log() { printf '\033[1;36m[Boardly]\033[0m %s\n' "$1"; }
fail() { printf '\033[1;31m[Boardly] ERROR:\033[0m %s\n' "$1" >&2; exit 1; }
run_root() { if [[ "$(id -u)" -eq 0 ]]; then "$@"; else command -v sudo >/dev/null 2>&1 || fail "Root privileges are required. Run as root or install sudo."; sudo "$@"; fi; }

[[ "$(uname -s)" == "Linux" ]] || fail "This installer supports Linux VPS systems only."
[[ "$APP_PORT" =~ ^[0-9]+$ ]] && (( APP_PORT >= 1 && APP_PORT <= 65535 )) || fail "BOARDLY_PORT must be between 1 and 65535."

install_system_packages() {
  local package_manager=""
  if command -v apt-get >/dev/null 2>&1; then
    package_manager="apt"
    log "Detected Debian/Ubuntu package manager (apt)."
    run_root apt-get update
    run_root env DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs npm build-essential python3 make g++ sqlite3 curl iproute2
  elif command -v dnf >/dev/null 2>&1; then
    package_manager="dnf"
    log "Detected RHEL/Fedora package manager (dnf)."
    run_root dnf install -y nodejs npm gcc-c++ make python3 sqlite curl iproute
  elif command -v yum >/dev/null 2>&1; then
    package_manager="yum"
    log "Detected legacy RHEL package manager (yum)."
    run_root yum install -y nodejs npm gcc-c++ make python3 sqlite curl iproute
  elif command -v pacman >/dev/null 2>&1; then
    package_manager="pacman"
    log "Detected Arch package manager (pacman)."
    run_root pacman -Sy --noconfirm nodejs npm base-devel sqlite curl iproute2
  else
    fail "No supported package manager found. Install Node.js 20+, npm, Python, a C++ compiler, make, and SQLite manually."
  fi
  [[ -n "$package_manager" ]]
}

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  install_system_packages
fi
command -v node >/dev/null 2>&1 || fail "Node.js installation failed."
command -v npm >/dev/null 2>&1 || fail "npm installation failed."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] && (( NODE_MAJOR >= 20 )) || fail "Node.js 20+ is required; found $(node --version)."

if [[ ! -x "$APP_DIR/node_modules/.bin/next" ]]; then
  log "Installing Boardly dependencies with npm ci."
  cd "$APP_DIR"
  npm ci
fi

log "Building Boardly."
cd "$APP_DIR"
npm run build

log "Preparing persistent database directory."
run_root mkdir -p "$(dirname "$DB_PATH")"
run_root chown -R "$APP_USER":"$APP_USER" "$(dirname "$DB_PATH")"

get_ipv4() {
  local ip=""
  if command -v hostname >/dev/null 2>&1; then ip="$(hostname -I 2>/dev/null | awk '{print $1}')"; fi
  if [[ -z "$ip" ]] && command -v ip >/dev/null 2>&1; then ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") {print $(i+1); exit}}')"; fi
  if [[ -z "$ip" ]]; then ip="127.0.0.1"; fi
  printf '%s' "$ip"
}

IPV4="$(get_ipv4)"
ENV_FILE="$APP_DIR/.env.production"
if [[ ! -f "$ENV_FILE" ]]; then
  umask 077
  printf 'NODE_ENV=production\nPORT=%q\nTODO_DB_PATH=%q\nBOARDLY_PROTOCOL=http\nBOARDLY_DOMAIN=%q\n' "$APP_PORT" "$DB_PATH" "$IPV4" > "$ENV_FILE"
  log "Created $ENV_FILE."
fi
run_root chown "$APP_USER":"$APP_USER" "$ENV_FILE"
run_root chmod 600 "$ENV_FILE"

SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
run_root tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=Boardly task boards
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
Environment=HOSTNAME=0.0.0.0
ExecStart=$(command -v npm) start
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

if command -v systemctl >/dev/null 2>&1; then
  log "Starting Boardly as a system service."
  run_root systemctl daemon-reload
  run_root systemctl enable --now "$SERVICE_NAME"
  sleep 2
  run_root systemctl --no-pager --full status "$SERVICE_NAME" || true
else
  log "systemd is unavailable; starting Boardly in the background."
  nohup env NODE_ENV=production PORT="$APP_PORT" TODO_DB_PATH="$DB_PATH" npm start >"$APP_DIR/boardly.log" 2>&1 &
fi

printf '\n\033[1;32mBoardly is ready.\033[0m\n'
printf 'IPv4 URL:  http://%s:%s\n' "$IPV4" "$APP_PORT"
printf 'Setup:     http://%s:%s/setup\n' "$IPV4" "$APP_PORT"
printf 'Logs:      sudo journalctl -u %s -f\n' "$SERVICE_NAME"
printf 'Database:  %s\n' "$DB_PATH"
printf '\nCreate the first administrator at /setup. Use HTTPS/reverse proxy before public exposure.\n'
