# Provider Parity Checklist

Both providers (GitLab and GitHub) **must** expose identical behavior for every
feature listed below. When adding or changing a feature on one provider, update
the other and tick both columns.

## Server routes

| Feature | Route pattern | GitLab | GitHub | Notes |
|---------|---------------|:------:|:------:|-------|
| Connection check | `GET /status` | x | x | Returns `{ connected, host, username, name, avatarUrl }` |
| List MRs/PRs | `GET /mrs?scopes=` | x | x | Scopes: authored, assigned, reviewer. Deduplicated, enriched (approvals, CI, linked issues). Sorted by updatedAt desc |
| MR/PR detail | `GET /mrs/:projectId/:iid` | x | x | Returns `DevBoardMRDetail` (closingIssues, relatedMrs) |
| List issues | `GET /issues` | x | x | Fetches **assigned + created**, deduplicates. Sorted by updatedAt desc |
| Issue detail | `GET /issues/:projectId/:iid` | x | x | Returns `DevBoardIssueDetail` (author, assignees, relatedMrs) |
| List todos | `GET /todos` | x | x | Pending/unread only. Sorted by createdAt desc |
| Mark todo done | `POST /todos/:id` | x | x | Returns `{ success: true }` |
| Mention MRs | `GET /mention-mrs` | x | x | Mention/directly-addressed todos targeting MRs. Deduplicated, enriched, open only |

## Normalization contracts

Each normalized type must include the same fields regardless of provider.

| Field | DevBoardMR | Notes |
|-------|:----------:|-------|
| status | x | draft / open / merged / closed |
| pipeline.status | x | Aggregated from CI. `null` when no CI |
| approvals.required | x | GitLab: real count. GitHub: `-1` (unknown) |
| unresolvedThreads | x | GitLab: unresolved discussions. GitHub: CHANGES_REQUESTED review count |
| dependsOnMrs | x | GitLab: `!N` prefix. GitHub: `#N` prefix |
| linkedIssues | x | Parsed from description (`Closes #N`) |
| needsRebase | x | GitLab: merge_status. GitHub: mergeable_state |

| Field | DevBoardTodo | Notes |
|-------|:------------:|-------|
| targetUrl | x | Must use configured host (not hardcoded) |
| action | x | Mapped from provider-specific action names |

## Client composables

| Composable | GitLab | GitHub | Behavior |
|------------|:------:|:------:|----------|
| Auth | `useGitlabAuth` | `useGithubAuth` | Auto-check on init, toast on manual retry |
| MRs | `useGitlab` | `useGithub` | Change detection (new, removed, pipeline status) with toasts |
| Issues | `useIssues` | `useGithubIssues` | Toggle-aware, auto-refresh |
| Todos | `useTodos` | `useGithubTodos` | New-todo detection with toasts, markAsDone, markAllAsDone, mentions computed |

## Provider metadata

| Field | Required | Notes |
|-------|:--------:|-------|
| mrLabel / mrLabelPlural | x | Used in UI text |
| mrPrefix | x | `!` for GitLab, `#` for GitHub |
| icon | x | Simple Icons identifier |
| authCliCommand | x | Shown in connection help |
| authEnvVars | x | `{ host, token }` env var names |
| authTokenScope | x | Required token scopes |
| authTokenExample | x | Shown in `.env` example |
| authHostExample | x | Shown in `.env` example |
| dashboardTodosPath | x | External link to provider's todo/notification page |

## How to add a new provider

1. Add the provider id to `ProviderId` in `app/types/provider.ts`
2. Create `app/providers/{name}.ts` with all `ProviderMeta` fields
3. Create server utils: `server/utils/{name}-auth.ts`, `{name}-client.ts`, `{name}-normalize.ts`
4. Create all 8 server routes under `server/api/{name}/`
5. Create client composables: `useXxxAuth`, `useXxx`, `useXxxIssues`, `useXxxTodos`
6. Wire into `useProvider.ts` factory
7. Add demo routes in `server/middleware/demo.ts`
8. Tick every box in this checklist
