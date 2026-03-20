# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in DevBoard, please report it responsibly.

Open a [GitHub Security Advisory](https://github.com/FrancoisDuquesne/devboard/security/advisories/new) (private by default).

Please **do not** open a public issue for security vulnerabilities.

## Scope

DevBoard proxies GitLab and GitHub API calls through Nitro server routes. Provider tokens (personal access tokens or CLI-derived credentials) are handled exclusively on the server side and are **never** sent to the browser client.

The main areas of security concern are:

- Token handling in `server/utils/` (auth modules, API clients)
- Server API routes in `server/api/`
- Environment variable exposure

## Response Timeline

- **Acknowledgement**: within 48 hours of the report.
- **Initial assessment**: within 7 days.
- **Fix for critical issues**: within 30 days.

We will coordinate disclosure with the reporter before making any fix public.
