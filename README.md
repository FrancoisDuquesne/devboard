# DevBoard

A real-time GitLab dashboard that visualizes your merge requests, issues, and todos as an interactive dependency graph.

Built with Nuxt 4, Vue Flow, and Nuxt UI v4.

![DevBoard toolbar](image.png)

## Features

**Interactive dependency graph** — MRs, issues, and todos rendered as draggable nodes with edges showing dependencies (`Depends on !N`), linked issues (`Closes #N`), and todo targets. Edges are color-coded: green for healthy, red (animated) for blocked, amber (animated) for in-progress, gray dashed for unresolved references.

**MR cards at a glance** — Each node displays title, branch, author/reviewer avatars, pipeline status, approval ratio, unresolved threads, required action, labels, linked issues, and time since last update. A colored left border signals urgency.

**Detail drawer** — Click any MR node to open a slide-over with full details: branches, reviewers, labels, closing issues, related MRs, and dependencies.

**Smart action badges** — DevBoard determines what you need to do next for each MR: review, fix pipeline, rebase, resolve threads, or assign a reviewer.

**Filtering and sorting** — Filter by role (my MRs, to review, mentioned), project, or pipeline status. Sort by updated, created, or title. Toggle node types (MRs, issues, todos) independently.

**Group by project** — Organize the graph into project-scoped boxes for a high-level view.

**Search palette** — Fuzzy search across all MRs, issues, and todos with `Ctrl+K`.

**Inbox panel** — A todo/notification panel (`t` to toggle) with tabs for all todos, mentions, and required actions. Mark todos as done individually or in bulk.

**Auto-refresh** — Configurable interval (30s to 5min) with toast notifications for new MRs, pipeline failures, recoveries, and incoming todos.

**Persistent layout** — Dragged node positions are saved to localStorage and restored on reload.

**Dark mode** — Toggle between light and dark themes.

## Quick start

### Prerequisites

- Node.js 20+
- A GitLab instance with API access
- A GitLab personal access token (PAT) with `api` scope, **or** the [`glab` CLI](https://gitlab.com/gitlab-org/cli) authenticated

### Setup

```bash
git clone <repo-url> && cd devboard
npm install
```

Create a `.env` file (see `.env.example`):

```env
# GitLab host (defaults to gitlab.aerospacelab.be)
GITLAB_HOST=gitlab.example.com

# GitLab personal access token (falls back to glab CLI config if not set)
GITLAB_PRIVATE_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
```

If you have `glab` configured and your GitLab host matches, no `.env` is needed — DevBoard reads the token from `~/.config/glab-cli/config.yml` automatically.

### Run

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run start     # Start production server
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Open search palette |
| `r` | Refresh all data |
| `t` | Toggle inbox/todo panel |
| `Escape` | Close panel or drawer |
| `Ctrl+click` / `Cmd+click` node | Open in GitLab |

## Architecture

DevBoard is a Nuxt 4 SPA (SSR disabled). The frontend renders the dashboard; a Nitro server layer proxies GitLab API calls to avoid exposing tokens to the browser.

```
app/                          # Frontend (Vue 3 + Composition API)
├── pages/index.vue           # Full-screen graph dashboard
├── components/
│   ├── graph/                # Graph node components (MR, issue, todo, phantom, group)
│   ├── MrDetailDrawer.vue    # MR detail slide-over
│   ├── SearchPalette.vue     # Cmd+K fuzzy search
│   ├── TodoPanel.vue         # Inbox panel (todos + actions)
│   └── *Badge.vue            # Status, pipeline, approval, threads, action badges
├── composables/              # Reactive state and data fetching
└── types/                    # TypeScript definitions

server/                       # Nitro API proxy
├── api/gitlab/
│   ├── mrs.get.ts            # List MRs (authored + reviewing, enriched)
│   ├── mrs/[projectId]/[iid].get.ts  # Single MR detail
│   ├── issues.get.ts         # Assigned issues
│   ├── todos.get.ts          # Pending todos
│   ├── todos/[id].post.ts    # Mark todo as done
│   ├── mention-mrs.get.ts    # MRs where user is mentioned
│   └── status.get.ts         # Connection check
└── utils/
    ├── gitlab-client.ts      # Paginated GitLab API client
    ├── gitlab-auth.ts        # Token resolution (env var → glab CLI)
    └── normalize.ts          # Response normalization + dependency parsing
```

### Key composables

| Composable | Purpose |
|---|---|
| `useGitlab` | MR fetching, auto-refresh, change detection toasts |
| `useTodos` | Todo and mention-MR fetching, mark as done |
| `useIssues` | Assigned issues fetching |
| `useGitlabAuth` | Connection status (host, username, avatar) |
| `useMrGraph` | Dagre layout computation for the graph |
| `useActionStatus` | Derives the required action per MR for the current user |
| `useNotifications` | Aggregates todos + action items for the inbox badge |
| `usePreferences` | LocalStorage-backed filters, sort, and settings |

### Data flow

1. On page load, the frontend fetches MRs, issues, todos, and mention-MRs in parallel via the Nitro API proxy
2. The server enriches each MR with approvals, unresolved thread count, linked issues, and parsed dependency refs
3. `useMrGraph` computes a Dagre layout from the enriched data, creating nodes and edges
4. Vue Flow renders the interactive graph with custom node components
5. Auto-refresh polls on the configured interval and fires toast notifications on changes

## Configuration

All user preferences are stored in `localStorage` and persist across sessions:

| Setting | Options | Default |
|---|---|---|
| Role filter | All MRs / My MRs / To review / Mentioned | All MRs |
| Project filter | Per-project | All projects |
| Pipeline filter | All / Passed / Failed / Running | All |
| Sort | Updated / Created / Title, asc/desc | Updated, desc |
| Node types | MRs, Issues, Todos (toggles) | All enabled |
| Group by | None / Project | None |
| Auto-refresh | Disabled / 30s / 1min / 2min / 5min | 1 min |
| Theme | Light / Dark | System |

## Development

```bash
npm run dev          # Start dev server (no fork mode)
npm run build        # Production build
npm run lint         # Check with Biome
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Biome
```

## Tech stack

- [Nuxt 4](https://nuxt.com) — Vue 3 framework
- [Nuxt UI v4](https://ui.nuxt.com) — Component library (Reka UI + Tailwind CSS)
- [Tailwind CSS v4](https://tailwindcss.com) — Utility-first CSS
- [Vue Flow](https://vueflow.dev) — Interactive graph visualization
- [Dagre](https://github.com/dagrejs/dagre) — Graph layout algorithm
- [VueUse](https://vueuse.org) — Composable utilities
- [Biome](https://biomejs.dev) — Linting and formatting

## License

Private project.
