# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **GitHub Pages demo site** — static build deployed automatically on push to master via GitHub Actions (`gh-pages.yml`)
- **Demo banner** — sticky "Demo Mode" indicator shown when running with fixture data

## [1.0.0] — 2026-03-20

First public release of DevBoard.

### Added

- **Interactive dependency graph** — full-screen Vue Flow graph with Dagre auto-layout, project grouping, and edge rendering for MR dependencies
- **Multi-provider support** — GitLab and GitHub providers with shared normalization layer, runtime provider selection, and parity contract (`PROVIDER_PARITY.md`)
- **MR detail drawer** — slide-over panel with description, pipeline status, approvals, unresolved threads, and quick links
- **Issue tracking** — issue nodes on the graph linked to MRs via closing references, with detail drawer
- **Todo / notification inbox** — panel showing GitLab todos and GitHub notifications with mark-as-done support
- **Worktree panel** — local git worktree tracking with branch-to-MR linking
- **Annotation tools** — sticky notes (markdown-enabled, draggable, resizable) and freehand/arrow/rectangle drawings on an SVG overlay
- **Search palette** — Cmd+K fuzzy search across MRs, issues, and todos
- **Auto-refresh** — configurable polling interval with toast notifications on changes
- **Filters** — role filter (author/reviewer/assignee), project filter, pipeline status filter with dismissible chips
- **Keyboard shortcuts** — `r` to refresh, `Escape` to close, `v`/`n`/`p`/`a`/`e` for annotation tools, `?` for help
- **Demo mode** — `npm run demo` serves fixture data with no provider connection needed
- **Security headers** — CSP, HSTS, X-Frame-Options, and other hardening headers via Nitro route rules
- **Scoped labels** — GitLab-style `key::value` label rendering with color coding
- **Theme support** — light/dark mode toggle
- **Welcome overlay** — first-run onboarding with feature highlights
- **Screenshot automation** — Playwright-based screenshot capture script for documentation
- **Unit tests** — Vitest test suite covering composables, server utilities, and frontend utils
