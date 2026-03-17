<div align="center">

<img src="docs/screenshots/graph-dark.png" alt="DevBoard — interactive dependency graph" width="100%" />

# DevBoard

**A real-time GitLab merge request dashboard with interactive dependency graphs**

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Features

### Interactive dependency graph

Merge requests, issues, and todos rendered as draggable nodes with color-coded edges showing dependencies, linked issues, and todo targets. Green = healthy, red (animated) = blocked, amber (animated) = in-progress.

<img src="docs/screenshots/graph-light.png" alt="Graph view — light mode" width="100%" />

### Detail drawer

Click any MR node to open a slide-over with branches, reviewers, labels, closing issues, related MRs, and dependencies.

<img src="docs/screenshots/drawer-open.png" alt="MR detail drawer" width="100%" />

### Command palette

Fuzzy search across all MRs, issues, and todos with `Ctrl+K` / `Cmd+K`.

<img src="docs/screenshots/search-open.png" alt="Search palette" width="100%" />

### Smart inbox

Todo and notification panel with tabs for all todos, mentions, and required actions. Mark items done individually or in bulk.

<img src="docs/screenshots/todo-panel.png" alt="Todo panel" width="100%" />

### And more

- **Smart action badges** — DevBoard determines what you need to do next: review, fix pipeline, rebase, resolve threads, or assign a reviewer
- **Filtering and sorting** — Filter by role, project, or pipeline status; sort by updated, created, or title
- **Group by project** — Organize the graph into project-scoped boxes
- **Auto-refresh** — Configurable interval (30s–5min) with toast notifications for changes
- **Persistent layout** — Dragged node positions saved to localStorage
- **Dark mode** — Toggle between light and dark themes

---

## Quick start

### Prerequisites

- Node.js 20+
- A GitLab instance with API access
- A GitLab personal access token (PAT) with `api` scope, **or** the [`glab` CLI](https://gitlab.com/gitlab-org/cli) authenticated

### Install

```bash
git clone https://github.com/FrancoisDuquesne/devboard.git && cd devboard
npm install
```

### Configure

Create a `.env` file:

```env
GITLAB_HOST=gitlab.example.com
GITLAB_PRIVATE_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
```

Or, if you have `glab` configured, no `.env` is needed — DevBoard reads your token from `~/.config/glab-cli/config.yml` automatically.

### Run

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run start     # Start production server
```

---

## Demo mode

Try DevBoard without a GitLab connection — realistic mock data included:

```bash
npm run demo
```

This starts the dev server with pre-built fixtures: 8 MRs across 3 projects with a dependency chain, issues, and todos.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Open search palette |
| `r` | Refresh all data |
| `t` | Toggle inbox / todo panel |
| `?` | Show keyboard shortcuts |
| `Escape` | Close panel or drawer |
| `Ctrl+click` / `Cmd+click` node | Open MR in GitLab |

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
| [Biome](https://biomejs.dev) | Linting and formatting |

---

## Architecture

DevBoard is a Nuxt 4 SPA (SSR disabled). The frontend renders the dashboard; a Nitro server layer proxies GitLab API calls to keep tokens server-side.

```
app/                          # Frontend (Vue 3 + Composition API)
├── pages/index.vue           # Full-screen graph dashboard
├── components/
│   ├── graph/                # Graph node components (MR, issue, todo, group)
│   ├── MrDetailDrawer.vue    # MR detail slide-over
│   ├── SearchPalette.vue     # Cmd+K fuzzy search
│   ├── TodoPanel.vue         # Inbox panel
│   └── *Badge.vue            # Status, pipeline, approval, threads badges
├── composables/              # Reactive state and data fetching
└── types/                    # TypeScript definitions

server/                       # Nitro API proxy
├── api/gitlab/               # 7 API routes
├── middleware/demo.ts         # Demo mode interceptor
├── fixtures/                  # Mock data for demo mode
└── utils/                    # GitLab client, auth, normalization
```

### Data flow

1. Frontend fetches MRs, issues, todos, and mention-MRs in parallel via the Nitro proxy
2. Server enriches each MR with approvals, threads, linked issues, and dependency refs
3. `useMrGraph` computes a Dagre layout, creating nodes and edges
4. Vue Flow renders the interactive graph with custom node components
5. Auto-refresh polls at the configured interval with toast notifications on changes

---

## Development

```bash
npm run dev          # Start dev server
npm run demo         # Start with demo data (no GitLab needed)
npm run build        # Production build
npm run lint         # Check with Biome
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Biome
npm run screenshot   # Capture screenshots (requires demo mode)
```

---

## License

MIT
