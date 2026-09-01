#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--tui" ]]; then
  exec "$(dirname "$0")/deploy-tui.sh"
fi

echo "Tip: run ./deploy.sh --tui for interactive domain, database, port, and first-account setup."
echo "Building production bundle (standalone)..."
npm run build

echo ""
echo "Standalone output ready in .next/standalone/"
echo "Copy the following to your VPS:"
echo "  - .next/standalone/            (Node server + .next/)"
echo "  - .next/static/                (JS/CSS/assets)"
echo "  - public/                       (favicon etc.)"
echo "  - todo.db                       (SQLite DB — back it up before deploys)"
echo ""
echo "For backups, set TODO_DB_PATH and copy the database while the service is stopped:"
echo "  sqlite3 \"\$TODO_DB_PATH\" .backup todo.db.backup"
echo ""
echo "On the VPS, run:"
echo "  TODO_DB_PATH=/var/lib/boardly/todo.db PORT=3000 node .next/standalone/server.js"
echo "  LAN testing: http://<your-computer-ip>:3000"
echo ""
echo "Or use the systemd service template at deploy/todo-board.service"
