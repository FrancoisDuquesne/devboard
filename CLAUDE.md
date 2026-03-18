# CLAUDE.md

## Project Overview

DevBoard is a Nuxt 4 SPA that provides a real-time dashboard for GitLab merge requests. It connects to a GitLab instance, displays MRs as cards or as a dependency graph, and supports filtering, sorting, and auto-refresh.

## Tech Stack

- **Nuxt 4** (Vue 3, Composition API, TypeScript)
- **Nuxt UI v4** — component library (Reka UI + Tailwind CSS)
- **Tailwind CSS v4** via Vite plugin
- **Vue Flow** (`@vue-flow/core`) — interactive dependency graph
- **Dagre** (`@dagrejs/dagre`) — graph layout engine
- **VueUse** — composable utilities (`useLocalStorage`, etc.)
- **Biome** — linting and formatting

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (no fork mode)
npm run build        # Production build
npm run lint         # Check linting (Biome)
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Biome
```

## Architecture

### Frontend (`app/`)

```
app/
├── app.vue                    # Root — UApp > NuxtLayout > UMain > NuxtPage
├── layouts/default.vue        # Floating pill header + UContainer with side borders
├── pages/
│   ├── index.vue              # Main dashboard — list/graph toggle, MR cards
│   └── settings.vue           # Connection + auto-refresh config
├── components/
│   ├── AppHeader.vue          # Floating pill navigation (portfolio template style)
│   ├── MrList.vue             # Filterable, sortable MR card grid
│   ├── MrCard.vue             # Individual MR card
│   ├── MrDetailDrawer.vue     # Slide-over with MR details
│   ├── MrDependencyGraph.vue  # Vue Flow graph visualization
│   ├── ProjectFilter.vue      # Project dropdown filter
│   ├── graph/                 # Graph-specific node components
│   │   ├── StickyNoteNode.vue     # Sticky note with markdown toggle + resize
│   │   ├── DrawingLayer.vue       # SVG overlay for freehand/arrow/rectangle
│   │   └── AnnotationToolbar.vue  # Vertical tool picker + color/width pickers
│   └── *Badge.vue             # Status, pipeline, approval, threads, action badges
├── composables/
│   ├── useGitlab.ts           # MR fetching, auto-refresh, change detection
│   ├── useGitlabAuth.ts       # Connection status checking
│   ├── usePreferences.ts      # LocalStorage-backed user preferences
│   ├── useMrGraph.ts          # Graph layout computation (Dagre)
│   ├── useActionStatus.ts     # Derive required action per MR
│   ├── useAnnotations.ts      # Sticky notes + drawings state (localStorage)
│   └── useNow.ts              # Reactive current time
├── types/                     # TypeScript type definitions
└── utils/                     # Pure utility functions
```

### Server (`server/`)

Nitro API routes that proxy GitLab API calls:

```
server/
├── api/gitlab/
│   ├── mrs.get.ts             # GET /api/gitlab/mrs — list MRs
│   ├── mrs/[projectId]/[iid].get.ts  # GET /api/gitlab/mrs/:id/:iid — MR detail
│   └── status.get.ts          # GET /api/gitlab/status — connection check
└── utils/
    ├── gitlab-client.ts       # GitLab API client
    ├── gitlab-auth.ts         # Auth token management
    └── normalize.ts           # Response normalization
```

## Code Conventions

- **Biome** for linting and formatting (2-space indent, 88 line width, LF endings)
- **No arbitrary Tailwind values** — use standard utilities only
- **Nuxt UI v4 patterns**: `UModal` uses `v-model:open`, `UBadge` uses `color="success"/"error"/"neutral"` with `variant="subtle"`
- **Composables** use `useLocalStorage` from VueUse for persistent preferences
- **No console.log** — only `console.warn` and `console.error` allowed
- Floating pill navigation follows the Nuxt UI portfolio template pattern

## Key Patterns

- **View modes**: `list` and `graph`, toggled via `usePreferences().viewMode`
- **Filters**: role, project, pipeline status — accessed via a popover button with badge count; active filters shown as dismissible chips in the toolbar; `resetAllFilters()` in `usePreferences` clears all at once; role and pipeline filters are MR-only (visually disabled when MR node type is off, and do not suppress issues/todos)
- **Project filter**: derives project list from all node types (MRs + issues + todos), not just MRs
- **Auto-refresh**: configurable interval, with toast notifications on changes
- **Graph mode**: breaks out of the container with negative margins, fills viewport; the floating pill overlays on top
- **Node focus**: clicking an MR node opens the detail drawer and highlights it — selected node gets a primary-colored glow via CSS (`has-focus` class on VueFlow wrapper), other nodes and edges dim to ~35% opacity; selection synced via `focusedNodeId` prop from `index.vue` to `MrDependencyGraph`
- **Keyboard shortcuts**: `r` to refresh, `Escape` to close drawer, `v`/`n`/`p`/`a`/`e` for annotation tools; all single-letter shortcuts guarded by `canUseShortcut()` which checks for focused inputs
- **Annotations**: sticky notes are Vue Flow custom nodes (drag/zoom for free), drawings are an SVG overlay outside VueFlow at `z-[5]`; toolbar at `z-10` above the drawing layer; `drawingsVisible` controls SVG visibility only, not sticky notes
