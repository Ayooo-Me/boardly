# Security Policy

## Supported versions

The latest version on `main` is the actively maintained version.

## Reporting a vulnerability

Please do not open a public issue for a security vulnerability. Contact the repository maintainers privately through GitHub Security Advisories or the maintainer contact listed on the repository profile.

Include:

- A concise description of the issue
- Affected routes, components, or versions
- Reproduction steps or a proof of concept
- Potential impact
- Any suggested mitigation

Please allow reasonable time for investigation and a fix before public disclosure.

## Deployment security

- Put public deployments behind HTTPS and a reverse proxy.
- Keep `.env.production`, the SQLite database, session cookies, and invite codes private.
- Use a persistent database path outside the application checkout.
- Back up the database before upgrades or migrations.
- Complete `/setup` immediately and use a strong administrator password.
- Do not expose SQLite files or the Next.js development server to the public internet.
- Review permissions and expire/revoke shared invite codes as part of normal administration.

## Disclaimer

Boardly is provided under the MIT License and without warranty. Operators are responsible for securing and maintaining their deployments.
