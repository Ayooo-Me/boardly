# Boardly

Simple, shareable task boards for getting things done together.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), or use the demo board at `/boards/demo`. For another device on your LAN, use `http://<your-computer-ip>:3000` (plain HTTP).

Users join boards from a shared URL after signing in; their account name is used automatically. Only administrators can create boards, from `/admin` or the administrator home screen. Boardly also supports local email/password accounts at `/auth`, with hashed passwords and expiring httpOnly sessions. Verification and reset links are logged during development until an email provider is configured.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deployment wizard

Run the interactive preparation wizard locally:

```bash
chmod +x deploy.sh deploy-tui.sh
./deploy.sh --tui
```

The wizard asks for the domain, port, service user, persistent SQLite path, and branding, writes a private `.env.production`, and runs the production build. After deployment, open the site root and complete `/setup`; the first account becomes the administrator and can create boards. Board pages include a **Share link** button that copies the current board URL. The app itself supports plain HTTP for local/LAN use; HTTPS requires a reverse proxy or TLS terminator in front of it. It intentionally does not install packages, modify DNS, create users, or deploy remotely. On a fresh deployment, open `/setup` to create the first administrator.

For production, put the app behind HTTPS and a reverse proxy before exposing it publicly. Review `deploy/todo-board.service` and the generated environment file before enabling systemd.

## Database

SQLite defaults to `todo.db`. Set `TODO_DB_PATH` to place it elsewhere, especially in production:

```bash
TODO_DB_PATH=/var/lib/boardly/todo.db npm start
```

Back up the database before deployments or schema changes:

```bash
sqlite3 "$TODO_DB_PATH" '.backup todo.db.backup'
```

The app performs additive startup migrations for task descriptions, priorities, due dates, ordering, timestamps, user presence, shared board documents, and board memberships. Board roles are enforced server-side: owners manage members, editors manage board content, commenters can comment, and viewers are read-only.

## White-label branding and admin

Configure branding without editing source code by adding these values to `.env.production` or `.env.local`:

```env
NEXT_PUBLIC_BRAND_NAME=Acme Workspace
NEXT_PUBLIC_BRAND_TAGLINE=Plan and ship together.
NEXT_PUBLIC_BRAND_DESCRIPTION=Acme's shared workspace for teams.
NEXT_PUBLIC_BRAND_LOGO=/icon.png
NEXT_PUBLIC_BRAND_ACCENT=#635bff
```

There is no admin email/password stored in source. On a fresh installation, open `/setup` and create the first administrator account. The setup is available only while no administrator exists; after that, sign in normally at `/auth` and open `/admin`. The admin dashboard shows installation metrics, accounts, boards, and active white-label settings. It does not replace board-level roles: board owners still manage individual board membership.

The deployment wizard points first-time installations to `/setup`. The old `ADMIN_EMAILS` configuration is no longer used. The one-time `npm run create-admin` command remains available as a local recovery utility, but normal first boot uses `/setup`.

## Product documentation

Open [`/docs`](http://localhost:3000/docs) in the running app for the full web guide. It covers first-time setup, board modes and purposes, task workflows, private one-time invite codes, permissions, administration, white-label configuration, and troubleshooting.

The same guide is available in [`docs/BOARDLY.md`](docs/BOARDLY.md) for repositories, deployments, and offline reference.
