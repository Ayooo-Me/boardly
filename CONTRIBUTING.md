# Contributing to Boardly

Thanks for helping improve Boardly.

## Development setup

Requirements:

- Node.js 20 or newer
- npm
- SQLite support through `better-sqlite3`

```bash
git clone <repository-url>
cd boardly
npm ci
npm run dev
```

Open <http://localhost:3000>. A fresh database redirects to `/setup`, where you create the first administrator.

## Before opening a pull request

Run the complete local verification suite:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four commands should pass. Add or update tests when changing database behavior, authorization, or server actions.

## Change guidelines

- Keep server-side authorization as the security boundary; do not rely only on hidden UI controls.
- Preserve compatibility with existing SQLite databases by using additive migrations where possible.
- Do not commit databases, credentials, `.env` files, invite codes, or generated build output.
- Match the existing TypeScript, React, CSS, and naming conventions.
- Keep changes focused and document user-visible behavior.

## Pull requests

1. Create a focused branch from `main`.
2. Describe the problem and the behavior you changed.
3. Include screenshots or a short recording for UI changes when useful.
4. Mention migrations, security implications, and manual verification steps.
5. Keep unrelated formatting or refactoring out of the same pull request.

## Reporting security issues

Do not disclose exploitable vulnerabilities in a public issue. Follow the process in [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE).
