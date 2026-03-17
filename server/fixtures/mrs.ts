import type { DevBoardMR } from "~/types";

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${seed}`;

export const demoMrs: DevBoardMR[] = [
  // ── Dependency chain root ──────────────────────────────────────
  {
    id: 1014,
    iid: 14,
    projectId: 103,
    projectPath: "acme/infra",
    title: "Update K8s manifests for subscription pods",
    description:
      "Adds deployment manifests, HPA config, and service mesh entries for the new GraphQL subscription workers.\n\nCloses #8",
    status: "open",
    webUrl: "https://gitlab.example.com/acme/infra/-/merge_requests/14",
    sourceBranch: "infra/k8s-subscriptions",
    targetBranch: "main",
    author: {
      username: "alex.dev",
      name: "Alex Chen",
      avatarUrl: avatar("alex.dev"),
    },
    reviewers: [
      {
        username: "priya.ops",
        name: "Priya Sharma",
        avatarUrl: avatar("priya.ops"),
      },
      {
        username: "jordan.sre",
        name: "Jordan Rivera",
        avatarUrl: avatar("jordan.sre"),
      },
    ],
    labels: ["infrastructure", "priority::high", "workflow::approved"],
    hasConflicts: false,
    pipeline: {
      status: "success",
      webUrl: "https://gitlab.example.com/acme/infra/-/pipelines/9021",
    },
    unresolvedThreads: 0,
    approvals: {
      approved: 2,
      required: 2,
      approvedByUsernames: ["priya.ops", "jordan.sre"],
    },
    linkedIssues: [
      {
        id: 3008,
        iid: 8,
        title: "Provision subscription worker pods",
        state: "opened",
        webUrl: "https://gitlab.example.com/acme/infra/-/issues/8",
        reference: "acme/infra#8",
        projectId: 103,
        projectPath: "acme/infra",
        labels: ["infrastructure"],
      },
    ],
    dependsOnMrs: [],
    needsRebase: false,
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-16T14:30:00.000Z",
  },

  // ── Core API MR (depends on infra!14) ─────────────────────────
  {
    id: 1042,
    iid: 42,
    projectId: 101,
    projectPath: "acme/platform",
    title: "Implement GraphQL subscriptions API",
    description:
      "Adds WebSocket transport and subscription resolvers for real-time events.\n\nDepends on acme/infra!14\nCloses #21",
    status: "open",
    webUrl: "https://gitlab.example.com/acme/platform/-/merge_requests/42",
    sourceBranch: "feature/graphql-subscriptions",
    targetBranch: "main",
    author: {
      username: "alex.dev",
      name: "Alex Chen",
      avatarUrl: avatar("alex.dev"),
    },
    reviewers: [
      {
        username: "sam.backend",
        name: "Sam Nakamura",
        avatarUrl: avatar("sam.backend"),
      },
    ],
    labels: ["backend", "priority::high", "workflow::in-review"],
    hasConflicts: false,
    pipeline: {
      status: "running",
      webUrl: "https://gitlab.example.com/acme/platform/-/pipelines/8842",
    },
    unresolvedThreads: 1,
    approvals: {
      approved: 1,
      required: 2,
      approvedByUsernames: ["sam.backend"],
    },
    linkedIssues: [
      {
        id: 3021,
        iid: 21,
        title: "Add real-time event streaming",
        state: "opened",
        webUrl: "https://gitlab.example.com/acme/platform/-/issues/21",
        reference: "acme/platform#21",
        projectId: 101,
        projectPath: "acme/platform",
        labels: ["backend", "feature"],
      },
    ],
    dependsOnMrs: ["acme/infra!14"],
    needsRebase: false,
    createdAt: "2026-03-08T11:00:00.000Z",
    updatedAt: "2026-03-17T08:15:00.000Z",
  },

  // ── Frontend MR (depends on platform!42) ──────────────────────
  {
    id: 1087,
    iid: 87,
    projectId: 102,
    projectPath: "acme/frontend",
    title: "Real-time notification bell component",
    description:
      "Adds the notification bell with WebSocket-powered live updates and toast popups.\n\nDepends on acme/platform!42\nCloses #55",
    status: "open",
    webUrl: "https://gitlab.example.com/acme/frontend/-/merge_requests/87",
    sourceBranch: "feature/notification-bell",
    targetBranch: "main",
    author: {
      username: "mika.ui",
      name: "Mika Johansson",
      avatarUrl: avatar("mika.ui"),
    },
    reviewers: [
      {
        username: "alex.dev",
        name: "Alex Chen",
        avatarUrl: avatar("alex.dev"),
      },
    ],
    labels: ["frontend", "priority::medium", "workflow::in-review"],
    hasConflicts: false,
    pipeline: {
      status: "failed",
      webUrl: "https://gitlab.example.com/acme/frontend/-/pipelines/7803",
    },
    unresolvedThreads: 2,
    approvals: { approved: 0, required: 1, approvedByUsernames: [] },
    linkedIssues: [
      {
        id: 3055,
        iid: 55,
        title: "Build notification bell UI",
        state: "opened",
        webUrl: "https://gitlab.example.com/acme/frontend/-/issues/55",
        reference: "acme/frontend#55",
        projectId: 102,
        projectPath: "acme/frontend",
        labels: ["frontend", "feature"],
      },
    ],
    dependsOnMrs: ["acme/platform!42"],
    needsRebase: false,
    createdAt: "2026-03-12T14:00:00.000Z",
    updatedAt: "2026-03-17T07:45:00.000Z",
  },

  // ── Auth middleware (depends on platform!42) ──────────────────
  {
    id: 1043,
    iid: 43,
    projectId: 101,
    projectPath: "acme/platform",
    title: "WebSocket auth middleware",
    description:
      "Token validation and session binding for persistent WebSocket connections.\n\nDepends on !42",
    status: "draft",
    webUrl: "https://gitlab.example.com/acme/platform/-/merge_requests/43",
    sourceBranch: "feature/ws-auth",
    targetBranch: "main",
    author: {
      username: "alex.dev",
      name: "Alex Chen",
      avatarUrl: avatar("alex.dev"),
    },
    reviewers: [],
    labels: ["backend", "security", "workflow::draft"],
    hasConflicts: false,
    pipeline: { status: null, webUrl: null },
    unresolvedThreads: 0,
    approvals: { approved: 0, required: 1, approvedByUsernames: [] },
    linkedIssues: [],
    dependsOnMrs: ["!42"],
    needsRebase: false,
    createdAt: "2026-03-14T16:00:00.000Z",
    updatedAt: "2026-03-16T10:00:00.000Z",
  },

  // ── Isolated: ready to merge ──────────────────────────────────
  {
    id: 1038,
    iid: 38,
    projectId: 101,
    projectPath: "acme/platform",
    title: "Optimize database connection pooling",
    description: "Switches to PgBouncer and adds health-check probes.",
    status: "open",
    webUrl: "https://gitlab.example.com/acme/platform/-/merge_requests/38",
    sourceBranch: "perf/connection-pool",
    targetBranch: "main",
    author: {
      username: "alex.dev",
      name: "Alex Chen",
      avatarUrl: avatar("alex.dev"),
    },
    reviewers: [
      {
        username: "sam.backend",
        name: "Sam Nakamura",
        avatarUrl: avatar("sam.backend"),
      },
    ],
    labels: ["backend", "performance", "workflow::approved"],
    hasConflicts: false,
    pipeline: {
      status: "success",
      webUrl: "https://gitlab.example.com/acme/platform/-/pipelines/8801",
    },
    unresolvedThreads: 0,
    approvals: {
      approved: 2,
      required: 2,
      approvedByUsernames: ["sam.backend", "priya.ops"],
    },
    linkedIssues: [],
    dependsOnMrs: [],
    needsRebase: false,
    createdAt: "2026-03-05T08:30:00.000Z",
    updatedAt: "2026-03-15T17:00:00.000Z",
  },

  // ── Isolated: needs review ────────────────────────────────────
  {
    id: 1091,
    iid: 91,
    projectId: 102,
    projectPath: "acme/frontend",
    title: "Migrate dashboard to CSS grid layout",
    description:
      "Replaces flex-based grid with native CSS grid for better responsive behavior.",
    status: "open",
    webUrl: "https://gitlab.example.com/acme/frontend/-/merge_requests/91",
    sourceBranch: "refactor/css-grid",
    targetBranch: "main",
    author: {
      username: "mika.ui",
      name: "Mika Johansson",
      avatarUrl: avatar("mika.ui"),
    },
    reviewers: [
      {
        username: "alex.dev",
        name: "Alex Chen",
        avatarUrl: avatar("alex.dev"),
      },
    ],
    labels: ["frontend", "refactor"],
    hasConflicts: false,
    pipeline: {
      status: "running",
      webUrl: "https://gitlab.example.com/acme/frontend/-/pipelines/7810",
    },
    unresolvedThreads: 0,
    approvals: { approved: 0, required: 1, approvedByUsernames: [] },
    linkedIssues: [],
    dependsOnMrs: [],
    needsRebase: false,
    createdAt: "2026-03-15T13:00:00.000Z",
    updatedAt: "2026-03-17T06:00:00.000Z",
  },

  // ── Isolated: failed pipeline ─────────────────────────────────
  {
    id: 1039,
    iid: 39,
    projectId: 101,
    projectPath: "acme/platform",
    title: "Add rate limiting to public API endpoints",
    description: "Adds sliding-window rate limiter with Redis backend.",
    status: "open",
    webUrl: "https://gitlab.example.com/acme/platform/-/merge_requests/39",
    sourceBranch: "feature/rate-limiting",
    targetBranch: "main",
    author: {
      username: "alex.dev",
      name: "Alex Chen",
      avatarUrl: avatar("alex.dev"),
    },
    reviewers: [
      {
        username: "jordan.sre",
        name: "Jordan Rivera",
        avatarUrl: avatar("jordan.sre"),
      },
    ],
    labels: ["backend", "security", "priority::high"],
    hasConflicts: false,
    pipeline: {
      status: "failed",
      webUrl: "https://gitlab.example.com/acme/platform/-/pipelines/8830",
    },
    unresolvedThreads: 0,
    approvals: { approved: 0, required: 1, approvedByUsernames: [] },
    linkedIssues: [],
    dependsOnMrs: [],
    needsRebase: false,
    createdAt: "2026-03-13T10:00:00.000Z",
    updatedAt: "2026-03-16T22:00:00.000Z",
  },

  // ── Mentioned MR (in the main list too, user is reviewer) ─────
  {
    id: 1009,
    iid: 9,
    projectId: 103,
    projectPath: "acme/infra",
    title: "Terraform module for Redis cluster",
    description:
      "Provisions a 3-node Redis Sentinel cluster with automatic failover.\n\n/cc @alex.dev for review on the sentinel config",
    status: "open",
    webUrl: "https://gitlab.example.com/acme/infra/-/merge_requests/9",
    sourceBranch: "infra/redis-cluster",
    targetBranch: "main",
    author: {
      username: "priya.ops",
      name: "Priya Sharma",
      avatarUrl: avatar("priya.ops"),
    },
    reviewers: [
      {
        username: "alex.dev",
        name: "Alex Chen",
        avatarUrl: avatar("alex.dev"),
      },
    ],
    labels: ["infrastructure", "workflow::in-review"],
    hasConflicts: false,
    pipeline: {
      status: "success",
      webUrl: "https://gitlab.example.com/acme/infra/-/pipelines/9010",
    },
    unresolvedThreads: 0,
    approvals: { approved: 1, required: 1, approvedByUsernames: ["alex.dev"] },
    linkedIssues: [],
    dependsOnMrs: [],
    needsRebase: false,
    createdAt: "2026-03-06T15:00:00.000Z",
    updatedAt: "2026-03-15T11:00:00.000Z",
  },
];
