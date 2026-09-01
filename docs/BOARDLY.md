# Boardly user guide

Boardly is a flexible shared workspace for tasks, notes, and structured team work. Fresh installations open the first-time administrator setup before normal workspace use.

## First-time setup

1. Open the deployed domain or IP address.
2. A fresh installation redirects to `/setup`.
3. Create the first name, email, and password.
4. That account becomes the global administrator.
5. After setup, `/` opens the normal app and `/setup` confirms setup is already complete.

Sign in at `/auth` and open `/admin` for installation management.

## Create and configure a board

From `/admin`, an administrator can create a board and choose:

- **Mode** — how the board is intended to organize work.
- **Purpose** — the type of work the board represents.
- **Visibility** — public link access or private code-required access.

Existing boards remain compatible and default to **Kanban / General**.

## Board modes

Board mode and purpose are independent. Choose the combination that fits the workflow:

- **Kanban** — workflow columns and draggable task cards.
- **List** — compact list-oriented task tracking.
- **Calendar** — date-centered planning for deadlines, content, or events.
- **Timeline** — schedule and milestone planning.
- **Table** — structured rows for CRM, inventory, or database-style work.
- **Whiteboard** — freeform visual planning and brainstorming.
- **Forms / Inbox** — collect incoming requests and turn them into work.
- **Goals / OKR** — objectives, key results, owners, and progress.
- **Approval** — draft, review, changes requested, and approved workflows.
- **Support** — tickets, requesters, urgency, and resolution status.
- **CRM pipeline** — leads, opportunities, stages, and next actions.

Available purposes include General, Project, Bug tracker, Content, Support, CRM, Roadmap, Personal, and Goals.

## Manage tasks

- Add a task from the top toolbar.
- Click a task title or **Details** to edit its description and due date.
- Use **Priority · low/medium/high** to change priority quickly.
- Use the stage control to move between To Do, In Progress, and Done.
- Drag a card into another column for the same stage change.
- Add a label from `+ Label`.
- Assign a task to a board member.
- Add comments at the bottom of a task.
- Delete a task with the trash control and restore it with Undo.

### Stage buttons

The stage control is a button group rather than a checkbox. It shows the current state, uses distinct colors, and gives keyboard and pointer users a precise alternative to drag-and-drop.

## Shared board notes

The **Board notes** editor is for meeting notes, decisions, links, and shared context. It autosaves after you stop typing. The toolbar provides formatting helpers for headings, bold, italic, underline, lists, and links.

## Search and filtering

Use **Search tasks** to match titles and descriptions. Use priority and label filters to narrow the board. Clear filters to restore the full board.

## Private boards and one-time invite codes

Public boards can be opened from their shared link. Use the **Share link** button in the board toolbar to copy the current board URL. Private boards require a one-time access code.

Administrators generate codes from the board management panel and choose the access granted by each code:

- **Role:** Editor, Commenter, or Viewer.
- **View:** open and read board content.
- **Comment:** add task comments.
- **Interact:** change tasks, stages, labels, and assignments.
- **Manage:** manage members and board settings.

Codes expire after 24 hours and are invalid after one successful redemption. The database stores only a hash of each code. Share the displayed code securely because it cannot be recovered later.

## Collaboration

Boardly refreshes task data periodically and shows the current member count. Open the same board in two browser windows to test collaboration. The activity panel records important board changes, and comments remain attached to their tasks.

## Administration and white-label settings

Only global administrators can create boards. The global administrator can use `/admin` to:

- Create, edit, promote, demote, and delete accounts.
- Create and delete boards.
- Change board mode, purpose, and visibility.
- Review memberships and configure per-member permissions.
- Generate one-time private-board invite codes.
- Edit the product name, tagline, description, logo, and accent color.

Environment branding values provide defaults:

```env
NEXT_PUBLIC_BRAND_NAME=Acme Workspace
NEXT_PUBLIC_BRAND_TAGLINE=Plan and ship together.
NEXT_PUBLIC_BRAND_DESCRIPTION=Acme's shared workspace for teams.
NEXT_PUBLIC_BRAND_LOGO=/icon.png
NEXT_PUBLIC_BRAND_ACCENT=#635bff
```

Saved branding from the admin dashboard takes precedence and applies without restarting the app.

## Accounts, roles, and permissions

Boardly supports local email/password accounts at `/auth` and guest display-name sessions for trusted local use. Account passwords are hashed and sessions use expiring httpOnly cookies.

Board roles are:

- **Owner** — manage members and roles, edit tasks, comments, notes, and board content.
- **Editor** — create and edit tasks, labels, assignments, stages, and board notes.
- **Commenter** — add comments and read board content, but cannot change tasks.
- **Viewer** — read-only access.

Owners can change non-owner roles or remove members. The owner cannot be removed or restricted through the member panel. Permission checks run on the server for every mutation.

## Theme preferences

Use the theme button on major pages to switch between light and dark mode. The choice is stored in the browser and restored after reload.

## Production guidance

For public deployments:

- Put the app behind HTTPS and a reverse proxy.
- Keep the SQLite database on persistent storage.
- Back up the database before upgrades or schema changes.
- Keep environment files, passwords, sessions, and invite codes private.
- Do not rely on guest joining for sensitive boards.

For local or LAN testing, use `http://`. HTTPS requires TLS configuration outside the Next.js app.

## Automated VPS prerequisites

Run `./deploy.sh` as root or as a user with passwordless/interactive `sudo` access. The script detects Debian/Ubuntu, RHEL/Fedora, and Arch Linux and installs missing Node.js, npm, native compilation tools, Python, and SQLite tools using the available package manager. It then runs `npm ci` before building. Unsupported distributions should install Node.js 20+ and npm manually.

## VPS deployment troubleshooting

On a source checkout, install dependencies before running any npm command that invokes Next.js:

```bash
cd /path/to/boardly
npm ci
npm run build
NODE_ENV=production TODO_DB_PATH=/var/lib/boardly/todo.db PORT=3000 npm start
```

If the shell reports `next: not found`, `node_modules` is missing; run `npm ci` from the repository root. For the standalone deployment, run `node .next/standalone/server.js` instead of `npm start` and copy `.next/static/` and `public/` alongside the standalone output.
