# CLAUDE.md

## Project Overview

DevBoard is a Nuxt 4 SPA that provides a real-time dashboard for GitLab and GitHub merge requests, issues, and todos. It renders everything as an interactive dependency graph, highlights what needs your attention, and supports annotations, worktree tracking, and auto-refresh. No database required.

## Tech Stack

- **Nuxt 4** (Vue 3, Composition API, TypeScript)
- **Nuxt UI v4** — component library (Reka UI + Tailwind CSS)
- **Tailwind CSS v4** via Vite plugin
- **Vue Flow** (`@vue-flow/core`) — interactive dependency graph
- **Dagre** (`@dagrejs/dagre`) — graph layout engine
- **VueUse** — composable utilities (`useLocalStorage`, etc.)
- **Marked** + **DOMPurify** — markdown rendering (MR descriptions, sticky notes)
- **Biome** — linting and formatting

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (no fork mode)
npm run demo         # Start with demo data (no provider connection needed)
npm run build        # Production build
npm run lint         # Check linting (Biome)
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Biome
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run screenshot   # Capture screenshots (requires demo mode)
```

## Architecture

### Multi-Provider System

DevBoard supports multiple Git providers via a provider abstraction layer. Each provider implements the same set of server routes, normalization logic, and client composables. See `PROVIDER_PARITY.md` for the full contract.

```
app/providers/
├── gitlab.ts          # GitLab provider metadata
├── github.ts          # GitHub provider metadata
└── index.ts           # Factory exports

app/types/provider.ts  # ProviderId, ProviderMeta interfaces
```

The active provider is selected at runtime. `useProvider()` returns the correct composables and metadata.

### Frontend (`app/`)

```
app/
├── app.vue                        # Root — UApp > NuxtLayout > UMain > NuxtPage
├── layouts/default.vue            # UContainer with side borders
├── pages/
│   └── index.vue                  # Full-screen graph dashboard (single page)
├── components/
│   ├── MrDependencyGraph.vue      # Vue Flow graph + floating control panels
│   ├── MrDetailDrawer.vue         # MR detail slide-over
│   ├── IssueDetailDrawer.vue      # Issue detail slide-over
│   ├── SearchPalette.vue          # Cmd+K fuzzy search
│   ├── TodoPanel.vue              # Inbox panel (todos, mentions, actions)
│   ├── WorktreePanel.vue          # Local worktree tracking panel
│   ├── HelpModal.vue              # Keyboard shortcuts modal
│   ├── WelcomeOverlay.vue         # First-run onboarding
│   ├── SettingsPopover.vue        # Connection status, auto-refresh, theme toggle
│   ├── ProjectFilter.vue          # Project dropdown filter
│   ├── MarkdownBlock.vue          # Markdown renderer (marked + DOMPurify)
│   ├── ScopedLabel.vue            # GitLab-style scoped label
│   ├── StatusBadge.vue            # MR status badge
│   ├── PipelineBadge.vue          # CI pipeline badge
│   ├── ApprovalBadge.vue          # Approval count badge
│   ├── ThreadsBadge.vue           # Unresolved threads badge
│   ├── ActionBadge.vue            # Required action badge
│   ├── MrActionItem.vue           # MR row in action lists
│   ├── IssueItem.vue              # Issue row in lists
│   ├── TodoItem.vue               # Todo row in lists
│   └── graph/                     # Graph-specific node components
│       ├── MrGraphNode.vue        # MR node (custom Vue Flow node)
│       ├── IssueGraphNode.vue     # Issue node
│       ├── TodoGraphNode.vue      # Todo node
│       ├── GroupNode.vue          # Project group container node
│       ├── PhantomNode.vue        # Placeholder for unloaded dependencies
│       ├── MrGraphToolbar.vue     # Floating toolbar (graph controls, filters)
│       ├── StickyNoteNode.vue     # Sticky note with markdown toggle + resize
│       ├── DrawingLayer.vue       # SVG overlay for freehand/arrow/rectangle
│       └── AnnotationToolbar.vue  # Vertical tool picker + color/width pickers
├── composables/
│   ├── useProvider.ts             # Provider factory — returns correct composables
│   ├── useGitlab.ts               # GitLab MR fetching, auto-refresh, change detection
│   ├── useGitlabAuth.ts           # GitLab connection status checking
│   ├── useGithub.ts               # GitHub PR fetching, auto-refresh, change detection
│   ├── useGithubAuth.ts           # GitHub connection status checking
│   ├── useIssues.ts               # GitLab issue fetching
│   ├── useGithubIssues.ts         # GitHub issue fetching
│   ├── useTodos.ts                # GitLab todo fetching + mark-done
│   ├── useGithubTodos.ts          # GitHub notification fetching + mark-done
│   ├── usePreferences.ts          # LocalStorage-backed user preferences
│   ├── useMrGraph.ts              # Graph layout computation (Dagre)
│   ├── useActionStatus.ts         # Derive required action per MR
│   ├── useAnnotations.ts          # Sticky notes + drawings state (localStorage)
│   ├── useSearch.ts               # Command palette search logic
│   ├── useNotifications.ts        # Toast notifications for data changes
│   ├── useWorktrees.ts            # Local worktree tracking
│   ├── useHelp.ts                 # Help modal state
│   ├── useOnboarding.ts           # First-run welcome overlay
│   └── useNow.ts                  # Reactive current time
├── plugins/
│   └── demo-fetch.client.ts       # Client-side fetch interceptor for demo/static builds
├── providers/                     # Provider metadata (see above)
├── types/                         # TypeScript type definitions
│   ├── annotations.ts             # Annotation types (sticky notes, drawings)
│   ├── devboard.ts                # Normalized types (DevBoardMR, DevBoardIssue, etc.)
│   ├── provider.ts                # ProviderId, ProviderMeta
│   ├── gitlab.ts                  # GitLab API response types
│   ├── github.ts                  # GitHub API response types
│   └── index.ts                   # Re-exports
└── utils/                         # Pure utility functions
    ├── constants.ts               # Shared constants
    ├── projectAlias.ts            # Project name aliasing
    ├── time.ts                    # Date/time formatting
    ├── todoAction.ts              # Todo action mapping
    └── url.ts                     # URL helpers
```

### Server (`server/`)

Nitro API routes that proxy provider API calls (tokens stay server-side):

```
server/
├── api/
│   ├── gitlab/                    # GitLab API routes (8 routes)
│   │   ├── mrs.get.ts             # GET /api/gitlab/mrs — list MRs
│   │   ├── mrs/[projectId]/[iid].get.ts  # GET /api/gitlab/mrs/:id/:iid — detail
│   │   ├── issues.get.ts          # GET /api/gitlab/issues — list issues
│   │   ├── issues/[projectId]/[iid].get.ts  # GET /api/gitlab/issues/:id/:iid
│   │   ├── todos.get.ts           # GET /api/gitlab/todos — list todos
│   │   ├── todos/[id].post.ts     # POST /api/gitlab/todos/:id — mark done
│   │   ├── mention-mrs.get.ts     # GET /api/gitlab/mention-mrs
│   │   └── status.get.ts          # GET /api/gitlab/status — connection check
│   ├── github/                    # GitHub API routes (8 routes, same pattern)
│   │   ├── mrs.get.ts
│   │   ├── mrs/[projectId]/[iid].get.ts
│   │   ├── issues.get.ts
│   │   ├── issues/[projectId]/[iid].get.ts
│   │   ├── todos.get.ts
│   │   ├── todos/[id].post.ts
│   │   ├── mention-mrs.get.ts
│   │   └── status.get.ts
│   └── worktrees/
│       └── index.get.ts           # GET /api/worktrees — scan local worktrees
├── middleware/
│   └── demo.ts                    # Demo mode interceptor (serves fixtures from shared/)
└── utils/
    ├── gitlab-auth.ts             # GitLab auth (PAT or glab CLI)
    ├── gitlab-client.ts           # GitLab API client
    ├── github-auth.ts             # GitHub auth (PAT or gh CLI)
    ├── github-client.ts           # GitHub API client
    ├── normalize.ts               # GitLab response normalization
    ├── github-normalize.ts        # GitHub response normalization
    ├── cache.ts                   # Shared TTL cache
    ├── worktree.ts                # Worktree scanner
    └── log.ts                     # Structured logging utility
```

### Shared (`shared/`)

```
shared/
└── fixtures/                      # Mock data for demo mode (used by server + client)
    ├── index.ts                   # Barrel re-exports
    ├── constants.ts               # Demo users, projects, URL helpers
    ├── mrs.ts                     # Demo MR list
    ├── mention-mrs.ts             # Demo mention-MRs
    ├── mr-detail.ts               # MR detail lookup
    ├── issues.ts                  # Demo issue list + detail lookup
    ├── todos.ts                   # Demo todos
    ├── status.ts                  # Demo connection status
    └── worktrees.ts               # Demo worktree data
```

### Tests (`tests/`)

```
tests/
├── fixtures/                      # Shared test data (GitLab + GitHub shapes)
│   ├── gitlab.ts
│   └── github.ts
└── unit/
    ├── composables/               # Composable unit tests
    ├── server/                    # Server utility unit tests
    └── utils/                     # Frontend utility unit tests
```

Test stack: **Vitest** for unit tests, **Playwright** for E2E, **happy-dom** for DOM environment, **@vue/test-utils** for component testing.

## Code Conventions

- **Biome** for linting and formatting (2-space indent, 88 line width, LF endings)
- **No arbitrary Tailwind values** — use standard utilities only
- **Nuxt UI v4 patterns**: `UModal` uses `v-model:open`, `UBadge` uses `color="success"/"error"/"neutral"` with `variant="subtle"`
- **Composables** use `useLocalStorage` from VueUse for persistent preferences
- **No console.log** — only `console.warn` and `console.error` allowed
- **Provider parity** — when changing a feature on one provider, update the other (see `PROVIDER_PARITY.md`)

## Key Patterns

- **Graph-only UI**: single-page app with a full-screen interactive graph (no list view)
- **Floating panels**: top-left (branding + graph controls), top-right (search/notifications/settings), bottom-left (legend), bottom-right (connection + refresh + zoom) — all inside `MrDependencyGraph.vue`
- **Filters**: role, project, pipeline status — accessed via a popover button with badge count; active filters shown as dismissible chips in the toolbar; `resetAllFilters()` in `usePreferences` clears all at once; role and pipeline filters are MR-only (visually disabled when MR node type is off, and do not suppress issues/todos)
- **Project filter**: derives project list from all node types (MRs + issues + todos), not just MRs
- **Auto-refresh**: configurable interval, with toast notifications on changes
- **Node focus**: clicking a node opens the detail drawer and highlights it — selected node gets a primary-colored glow via CSS (`has-focus` class on VueFlow wrapper), other nodes and edges dim to ~35% opacity; selection synced via `focusedNodeId` prop from `index.vue` to `MrDependencyGraph`
- **Keyboard shortcuts**: `r` to refresh, `Escape` to close drawer, `v`/`n`/`p`/`a`/`e` for annotation tools; all single-letter shortcuts guarded by `canUseShortcut()` which checks for focused inputs
- **Annotations**: sticky notes are Vue Flow custom nodes (drag/zoom for free), drawings are an SVG overlay outside VueFlow at `z-[5]`; toolbar at `z-10` above the drawing layer; `drawingsVisible` controls SVG visibility only, not sticky notes
- **Demo mode**: `npm run demo` serves fixtures via `server/middleware/demo.ts` (dev) or `app/plugins/demo-fetch.client.ts` (static build) — no provider connection needed
