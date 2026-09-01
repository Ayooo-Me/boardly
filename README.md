# Boardly

Simple, shareable task boards for getting things done together.

## Requirements

- Node.js 20 or newer
- npm
- SQLite support through `better-sqlite3`

## Run locally

Install dependencies first:

```bash
npm ci
npm run dev
```

If you see `next: not found`, dependencies have not been installed. Run `npm ci` in the project directory and then retry.

Open [http://localhost:3000](http://localhost:3000), or use `http://<your-computer-ip>:3000` for LAN testing. Users join boards from a shared URL after signing in; their account name is used automatically. Only administrators can create boards, from `/admin` or the administrator home screen.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Quick VPS deployment

On a fresh Ubuntu/Debian VPS:

```bash
sudo apt update
sudo apt install -y nodejs npm
cd /home/ubuntu/board/boardly
npm ci
npm run build
mkdir -p /var/lib/boardly
sudo chown -R "$USER":"$USER" /var/lib/boardly
TODO_DB_PATH=/var/lib/boardly/todo.db PORT=3000 NODE_ENV=production npm start
```

Open `http://your-server-ip:3000/setup` and create the first administrator. Put the application behind HTTPS and a reverse proxy before exposing it publicly.

For a background service, edit `deploy/todo-board.service` to match your VPS user and application path, then install it:

```bash
sudo cp deploy/todo-board.service /etc/systemd/system/boardly.service
sudo systemctl daemon-reload
sudo systemctl enable --now boardly
sudo systemctl status boardly
```

Check logs with:

```bash
sudo journalctl -u boardly -f
```

## Deployment wizard

The wizard detects Debian/Ubuntu, RHEL/Fedora, and Arch Linux. When Node.js/npm are missing it uses the available system package manager to install Node.js, npm, native build tools, Python, and SQLite tools; it uses `sudo` when needed. It then installs project dependencies with `npm ci` and prepares a standalone production build:

**Run it as a user with sudo access or as root:**

```bash
chmod +x deploy.sh deploy-tui.sh
./deploy.sh --tui
```

It asks for the domain, port, service user, persistent SQLite path, and branding, writes a private `.env.production`, installs missing prerequisites and dependencies, and runs the production build. On unsupported distributions, install Node.js 20+ and npm manually before rerunning. Copy `.next/standalone/`, `.next/static/`, `public/`, and the generated environment configuration to the server. The server must have Node.js installed, but does not need the full source tree or `node_modules` when using the standalone output.

After deployment, open the site root and complete `/setup`; the first account becomes the administrator and can create boards. Board pages include a **Share link** button that copies the current board URL. Plain HTTP is suitable only for trusted local/LAN testing; HTTPS requires a reverse proxy or TLS terminator.

## Database

SQLite defaults to `todo.db`. Set `TODO_DB_PATH` to place it elsewhere, especially in production:

```bash
TODO_DB_PATH=/var/lib/boardly/todo.db npm start
```

Back up the database before deployments or schema changes:

```bash
sqlite3 "$TODO_DB_PATH" '.backup todo.db.backup'
```

## White-label branding and admin

Configure branding with:

```env
NEXT_PUBLIC_BRAND_NAME=Acme Workspace
NEXT_PUBLIC_BRAND_TAGLINE=Plan and ship together.
NEXT_PUBLIC_BRAND_DESCRIPTION=Acme's shared workspace for teams.
NEXT_PUBLIC_BRAND_LOGO=/icon.png
NEXT_PUBLIC_BRAND_ACCENT=#635bff
```

On a fresh installation, `/setup` creates the first administrator. Only administrators can create boards and manage accounts, boards, branding, permissions, and invite codes.

## Product documentation

Open [`/docs`](http://localhost:3000/docs) in the running app for the full web guide. The offline guide is available at [`docs/BOARDLY.md`](docs/BOARDLY.md).

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Boardly is available under the [MIT License](LICENSE), without warranty.
