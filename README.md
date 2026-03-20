<div align="center">

<img src="docs/hero.png" alt="DevBoard — Real-time GitLab dashboard with interactive dependency graphs" width="100%" />

[![CI](https://github.com/FrancoisDuquesne/devboard/actions/workflows/ci.yml/badge.svg)](https://github.com/FrancoisDuquesne/devboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

</div>

---

DevBoard connects to your GitLab or GitHub instance and renders merge requests, issues, and todos as an interactive dependency graph. It highlights what needs your attention — blocked pipelines, pending reviews, unresolved threads — so you can focus on what matters. Everything runs as a lightweight Nuxt SPA with no database required.

## Features

### Interactive dependency graph

Merge requests, issues, and todos rendered as draggable nodes with color-coded edges showing dependencies, linked issues, and todo targets. Green = healthy, red (animated) = blocked, amber (animated) = in-progress.

<img src="docs/screenshots/graph-dark.png" alt="Graph view — dark mode" width="100%" />

### Detail drawer

Click any MR node to open a slide-over with branches, reviewers, labels, closing issues, related MRs, and dependencies.

<img src="docs/screenshots/drawer-open.png" alt="MR detail drawer" width="100%" />

### Command palette

Fuzzy search across all MRs, issues, and todos with `Ctrl+K` / `Cmd+K`.

<img src="docs/screenshots/search-open.png" alt="Search palette" width="100%" />

### Smart inbox

Todo and notification panel with tabs for all todos, mentions, and required actions. Mark items done individually or in bulk.

<img src="docs/screenshots/todo-panel.png" alt="Todo panel" width="100%" />

### Worktree tracking

See your local git worktrees alongside MRs. DevBoard scans configured directories, links worktrees to MRs by branch name, and shows a "Local" badge on graph nodes that have a local checkout. Copy paths, jump to linked MRs or issues, and hide worktrees you don't need.

<img src="docs/screenshots/worktree-panel.png" alt="Worktree panel" width="100%" />

### Annotations & drawing tools

Add sticky notes and freehand drawings directly on the board. Notes support markdown rendering, resizing, and color-coded backgrounds. Drawing tools include freehand, arrows, and rectangles with color and stroke width options. An eraser tool lets you click any drawing to delete it. Everything persists locally.

<img src="docs/screenshots/annotations.png" alt="Annotation toolbar with sticky note" width="100%" />

### And more

- **Smart action badges** — DevBoard determines what you need to do next: review, fix pipeline, rebase, resolve threads, or assign a reviewer
- **Filtering and sorting** — Filter by role, project, or pipeline status; sort by updated, created, or title
- **Group by project** — Organize the graph into project-scoped boxes
- **Auto-refresh** — Configurable interval (30s–5min) with toast notifications for changes
- **Persistent layout** — Dragged node positions saved to localStorage
- **Collapsible legend** — Graph legend collapses to save space, peeks on hover
- **Dark mode** — Toggle between light and dark themes

---

## Quick start

### Prerequisites

- Node.js 20+
- A GitLab instance with API access, **or** a GitHub account
- A personal access token (GitLab PAT with `api` scope, or GitHub PAT with `repo` scope), **or** the [`glab`](https://gitlab.com/gitlab-org/cli) / [`gh`](https://cli.github.com) CLI authenticated

### Install

```bash
git clone https://github.com/FrancoisDuquesne/devboard.git && cd devboard
npm install
```

### Configure

Create a `.env` file for your provider:

```env
# GitLab
GITLAB_HOST=gitlab.example.com
GITLAB_PRIVATE_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx

# GitHub
GITHUB_HOST=github.com
GITHUB_PRIVATE_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Optional: enable worktree tracking
WORKTREE_SCAN_DIRS=/home/user/repos,/home/user/projects
```

Or, if you have `glab` / `gh` CLI configured, no `.env` is needed — DevBoard reads your token from CLI config automatically.

### Run

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run start     # Start production server
```

---

## Demo mode

Try DevBoard without any provider connection — realistic mock data included:

```bash
npm run demo
```

This starts the dev server with pre-built fixtures: 11 MRs across 3 projects with dependency chains, issues, and todos.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Open search palette |
| `r` | Refresh all data |
| `t` | Toggle inbox / todo panel |
| `w` | Toggle worktree panel |
| `?` | Show keyboard shortcuts |
| `Escape` | Close panel, drawer, or deactivate tool |
| `Ctrl+click` / `Cmd+click` node | Open MR in GitLab |
| `v` | Select tool |
| `n` | Sticky note tool |
| `p` | Freehand draw tool |
| `a` | Arrow tool |
| `e` | Eraser tool |

<img src="docs/screenshots/help.png" alt="Keyboard shortcuts modal" width="100%" />

---

## Tech stack

| Technology | Purpose |
|---|---|
| [Nuxt 4](https://nuxt.com) | Vue 3 framework with Nitro server |
| [Nuxt UI v4](https://ui.nuxt.com) | Component library (Reka UI + Tailwind) |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first CSS |
| [Vue Flow](https://vueflow.dev) | Interactive graph visualization |
| [Dagre](https://github.com/dagrejs/dagre) | Graph layout algorithm |
| [VueUse](https://vueuse.org) | Composable utilities |
| [Marked](https://marked.js.org) + [DOMPurify](https://github.com/cure53/DOMPurify) | Markdown rendering |
| [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) | Unit and E2E testing |
| [Biome](https://biomejs.dev) | Linting and formatting |

---

## Architecture

DevBoard is a Nuxt 4 SPA (SSR disabled). The frontend renders the dashboard; a Nitro server layer proxies provider API calls to keep tokens server-side. Both GitLab and GitHub are supported via a provider abstraction — see `PROVIDER_PARITY.md`.

```
app/                          # Frontend (Vue 3 + Composition API)
├── pages/index.vue           # Full-screen graph dashboard
├── providers/                # Provider metadata (GitLab, GitHub)
├── components/
│   ├── graph/                # Graph node + annotation components
│   │   ├── MrGraphNode.vue       # MR/PR node (custom Vue Flow node)
│   │   ├── IssueGraphNode.vue    # Issue node
│   │   ├── TodoGraphNode.vue     # Todo/notification node
│   │   ├── StickyNoteNode.vue    # Draggable sticky note with markdown toggle
│   │   ├── DrawingLayer.vue      # SVG overlay for freehand/arrow/rectangle drawings
│   │   └── AnnotationToolbar.vue # Vertical tool picker with color/width pickers
│   ├── MrDetailDrawer.vue    # MR detail slide-over
│   ├── SearchPalette.vue     # Cmd+K fuzzy search
│   ├── TodoPanel.vue         # Inbox panel
│   ├── WorktreePanel.vue     # Local worktree tracking panel
│   └── *Badge.vue            # Status, pipeline, approval, threads badges
├── composables/              # Reactive state and data fetching
│   ├── useProvider.ts        # Provider factory — returns correct composables
│   └── useAnnotations.ts     # Sticky notes + drawings state (localStorage)
└── types/                    # TypeScript definitions

server/                       # Nitro API proxy
├── api/gitlab/               # 8 API routes (mrs, issues, todos, mention-mrs, status)
├── api/github/               # 8 API routes (same pattern as GitLab)
├── api/worktrees/            # Worktree scanning endpoint
├── middleware/demo.ts        # Demo mode interceptor
├── fixtures/                 # Mock data for demo mode
└── utils/                    # Provider clients, auth, normalization, cache, worktree scanner

tests/                        # Test suite
├── fixtures/                 # Shared test data (GitLab + GitHub shapes)
└── unit/                     # Vitest unit tests (composables, server utils, frontend utils)
```

### Data flow

1. `useProvider()` selects the active provider (GitLab or GitHub) and returns the matching composables
2. Frontend fetches MRs, issues, todos, mention-MRs, and worktrees in parallel via the Nitro proxy
3. Server enriches each MR with approvals, threads, linked issues, and dependency refs
4. Worktree scanner reads `WORKTREE_SCAN_DIRS`, runs `git worktree list` on each repo, and caches results (30s TTL)
5. `useMrGraph` computes a Dagre layout, creating nodes and edges
6. Vue Flow renders the interactive graph with custom node components
7. Auto-refresh polls at the configured interval with toast notifications on changes

---

## Development

```bash
npm run dev          # Start dev server
npm run demo         # Start with demo data (no provider connection needed)
npm run build        # Production build
npm run lint         # Check with Biome
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Biome
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run screenshot   # Capture screenshots (requires demo mode)
```

---

## License

MIT
