<div align="center">

<img src="docs/hero.png" alt="DevBoard — Real-time GitLab dashboard with interactive dependency graphs" width="100%" />

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

DevBoard connects to your GitLab instance and renders merge requests, issues, and todos as an interactive dependency graph. It highlights what needs your attention — blocked pipelines, pending reviews, unresolved threads — so you can focus on what matters. Everything runs as a lightweight Nuxt SPA with no database required.

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

# Optional: enable worktree tracking
WORKTREE_SCAN_DIRS=/home/user/repos,/home/user/projects
```

Or, if you have `glab` configured, no `.env` is needed for GitLab — DevBoard reads your token from `~/.config/glab-cli/config.yml` automatically.

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
| [Biome](https://biomejs.dev) | Linting and formatting |

---

## Architecture

DevBoard is a Nuxt 4 SPA (SSR disabled). The frontend renders the dashboard; a Nitro server layer proxies GitLab API calls to keep tokens server-side.

```
app/                          # Frontend (Vue 3 + Composition API)
├── pages/index.vue           # Full-screen graph dashboard
├── components/
│   ├── graph/                # Graph node components (MR, issue, todo, group)
│   │   ├── StickyNoteNode.vue    # Draggable sticky note with markdown toggle
│   │   ├── DrawingLayer.vue      # SVG overlay for freehand/arrow/rectangle drawings
│   │   └── AnnotationToolbar.vue # Vertical tool picker with color/width pickers
│   ├── MrDetailDrawer.vue    # MR detail slide-over
│   ├── SearchPalette.vue     # Cmd+K fuzzy search
│   ├── TodoPanel.vue         # Inbox panel
│   ├── WorktreePanel.vue     # Local worktree tracking panel
│   └── *Badge.vue            # Status, pipeline, approval, threads badges
├── composables/              # Reactive state and data fetching
│   └── useAnnotations.ts     # Sticky notes + drawings state (localStorage)
└── types/                    # TypeScript definitions

server/                       # Nitro API proxy
├── api/gitlab/               # 7 API routes
├── api/worktrees/            # Worktree scanning endpoint
├── middleware/demo.ts         # Demo mode interceptor
├── fixtures/                  # Mock data for demo mode
└── utils/                    # GitLab client, auth, normalization, worktree scanner
```

### Data flow

1. Frontend fetches MRs, issues, todos, mention-MRs, and worktrees in parallel via the Nitro proxy
2. Server enriches each MR with approvals, threads, linked issues, and dependency refs
3. Worktree scanner reads `WORKTREE_SCAN_DIRS`, runs `git worktree list` on each repo, and caches results (30s TTL)
4. `useMrGraph` computes a Dagre layout, creating nodes and edges
5. Vue Flow renders the interactive graph with custom node components
6. Auto-refresh polls at the configured interval with toast notifications on changes

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
