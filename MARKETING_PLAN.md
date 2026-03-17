# Marketing Package for DevBoard

## Context

DevBoard was just published to GitHub as a public repo. It needs a compelling README with real screenshots and a landing page to attract users. Since there's no live GitLab connection available for screenshots, we'll create a demo mode with realistic mock data, then use Playwright to capture polished screenshots automatically.

## Deliverables

1. **Demo mode** — `DEMO_MODE=true npm run dev` serves mock data, no GitLab needed
2. **Automated screenshots** — Playwright captures 7 key views (light + dark)
3. **Marketing README** — hero banner, feature gallery, quick start, badges
4. **Landing page** — static `docs/index.html` for GitHub Pages

---

## Phase 1: Mock Data Fixtures

Create `server/fixtures/` with pre-built `DevBoardMR[]`, `DevBoardIssue[]`, `DevBoardTodo[]` objects (already in the normalized DevBoard format, bypassing the GitLab → normalize pipeline entirely).

### Files to create

| File | Returns | Content |
|---|---|---|
| `server/fixtures/mrs.ts` | `DevBoardMR[]` | 8 MRs across 3 projects with dependencies, mixed statuses |
| `server/fixtures/mr-detail.ts` | `(iid) => DevBoardMRDetail` | Detail with closingIssues + relatedMrs |
| `server/fixtures/issues.ts` | `DevBoardIssue[]` | 3 assigned issues |
| `server/fixtures/todos.ts` | `DevBoardTodo[]` | 5 pending todos (review_requested, mentioned, build_failed, etc.) |
| `server/fixtures/mention-mrs.ts` | `DevBoardMR[]` | 2 MRs user is mentioned in |
| `server/fixtures/status.ts` | `{ connected, username, host }` | `{ connected: true, username: "alex.dev", host: "gitlab.example.com" }` |
| `server/fixtures/index.ts` | Re-exports all above | — |

### Mock data scenario (coherent story)

Three projects: `acme/platform` (id: 101), `acme/frontend` (id: 102), `acme/infra` (id: 103)

**Dependency chain:**
```
[infra] !14 "Update K8s manifests"  ──→  [platform] !42 "GraphQL subscriptions API"
         (success, 2/2 approved)           (running, 1/2 approved)
                                              │
                                              ├──→  [frontend] !87 "Real-time notifications"
                                              │      (failed, 0/1 approved, 2 threads)
                                              │
                                              └──→  [platform] !43 "WebSocket auth middleware"
                                                     (draft, no pipeline)
```

**Isolated MRs:**
- `[platform] !38` — open, success, approved, waiting (ready to merge)
- `[frontend] !91` — open, running, needs review
- `[infra] !9` — mentioned MR, success
- `[platform] !39` — open, failed pipeline (fix-pipeline action)

**Key:** `dependsOnMrs` uses `"!14"` for same-project refs and `"acme/platform!42"` for cross-project refs. These are parsed by `parseDependencyRef` in `useMrGraph.ts`.

Avatar URLs: `https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=<username>` for consistent fake avatars.

Labels include scoped labels like `workflow::in-review`, `priority::high` and regular labels like `backend`, `frontend`.

### Middleware interceptor

**File:** `server/middleware/demo.ts`

- Checks `process.env.DEMO_MODE` — if falsy, returns immediately (no-op)
- Matches `event.path` against `/api/gitlab/*` patterns
- Returns fixture data directly, short-circuiting real API handlers
- Routes: `status`, `mrs`, `mrs/:projectId/:iid`, `issues`, `todos`, `todos/:id` (POST → `{ success: true }`), `mention-mrs`

---

## Phase 2: Playwright Screenshots

### Install
```
npm install -D playwright tsx
npx playwright install chromium
```

### Script: `scripts/screenshots.ts`

Captures these scenes at 1440x900 viewport:

| Scene | File | How |
|---|---|---|
| Graph (dark) | `graph-dark.png` | Main view, dark mode — **hero image** |
| Graph (light) | `graph-light.png` | Main view, light mode |
| Detail drawer | `drawer-open.png` | Click MR !42 node, drawer slides in |
| Search palette | `search-open.png` | Press Cmd+K, type partial query |
| Todo panel | `todo-panel.png` | Press T to open inbox |
| Welcome overlay | `welcome.png` | Clear `devboard:has-seen-welcome` localStorage |
| Help modal | `help.png` | Press `?` |

**Key timing:** Wait for `.vue-flow__node` selector + 2s settle time after `fitView` animation.

**localStorage control between scenes:** Set `devboard:has-seen-welcome` = `true` for most scenes, remove it for welcome screenshot. Set `nuxt-color-mode` for theme switching.

### Output
- Working dir: `scripts/screenshots/` (gitignored)
- Final dir: `docs/screenshots/` (committed to repo)
- Copy step: manual or scripted `cp`

### npm script
```json
"demo": "DEMO_MODE=true nuxt dev --no-fork",
"screenshot": "DEMO_MODE=true npx tsx scripts/screenshots.ts"
```

---

## Phase 3: Marketing README

Replace `README.md` entirely. Structure:

```
<div align="center">
  [hero: graph-dark.png]
  <h1>DevBoard</h1>
  <p>A real-time GitLab merge request dashboard with interactive dependency graphs</p>
  [badges: Nuxt 4 | Vue 3 | TypeScript | Tailwind CSS v4]
</div>

## Features
  - Interactive dependency graph  [screenshot: graph-light.png]
  - Detail drawer                 [screenshot: drawer-open.png]
  - Command palette (Cmd+K)       [screenshot: search-open.png]
  - Smart inbox                   [screenshot: todo-panel.png]
  - Auto-refresh with notifications
  - Dark mode                     [screenshot: graph-dark.png]
  - Keyboard shortcuts            [screenshot: help.png]

## Quick Start
  Prerequisites, install, connect to GitLab (.env or glab), run

## Demo Mode
  DEMO_MODE=true npm run dev

## Keyboard Shortcuts (table)

## Tech Stack (table with logos)

## Architecture (condensed from current CLAUDE.md)

## License (MIT)
```

Screenshots referenced as `docs/screenshots/<name>.png` (relative paths work on GitHub).

---

## Phase 4: Landing Page

**File:** `docs/index.html` — standalone static HTML, no build step.

Uses Tailwind CDN (`<script src="https://cdn.tailwindcss.com">`), dark theme, responsive.

Sections:
1. **Hero** — tagline + graph-dark.png hero banner + CTA buttons (Get Started / GitHub)
2. **Features grid** — 3-column cards with screenshot thumbnails
3. **Quick start** — code blocks with install/run commands
4. **Tech stack** — logo row
5. **Footer** — GitHub link + "Built with Nuxt 4"

Enable GitHub Pages on `docs/` folder in repo settings.

---

## File Summary

| Action | File |
|---|---|
| Create | `server/fixtures/status.ts` |
| Create | `server/fixtures/mrs.ts` |
| Create | `server/fixtures/mr-detail.ts` |
| Create | `server/fixtures/issues.ts` |
| Create | `server/fixtures/todos.ts` |
| Create | `server/fixtures/mention-mrs.ts` |
| Create | `server/fixtures/index.ts` |
| Create | `server/middleware/demo.ts` |
| Create | `scripts/screenshots.ts` |
| Create | `docs/index.html` |
| Replace | `README.md` |
| Edit | `package.json` (add `demo` + `screenshot` scripts) |
| Edit | `.gitignore` (add `scripts/screenshots/`) |

---

## Verification

1. `DEMO_MODE=true npm run dev` → app loads with 8 MR nodes, dependency edges, issues, todos
2. Click MR node → detail drawer opens with data
3. Press Cmd+K → search palette finds mock MRs
4. Press T → inbox shows mock todos
5. `npm run screenshot` → 7 PNG files generated in `scripts/screenshots/`
6. Copy to `docs/screenshots/`, verify README renders on GitHub
7. Open `docs/index.html` locally → landing page renders with screenshots
