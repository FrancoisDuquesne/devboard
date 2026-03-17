import type { DevBoardMR } from "~/types";

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${seed}`;

export const demoMentionMrs: DevBoardMR[] = [
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
  {
    id: 1112,
    iid: 12,
    projectId: 103,
    projectPath: "acme/infra",
    title: "Add Datadog monitoring dashboards",
    description:
      "Pre-built dashboards for API latency, error rates, and pod scaling.\n\n@alex.dev FYI — includes alerts for the subscription pods",
    status: "open",
    webUrl: "https://gitlab.example.com/acme/infra/-/merge_requests/12",
    sourceBranch: "infra/datadog-dashboards",
    targetBranch: "main",
    author: {
      username: "jordan.sre",
      name: "Jordan Rivera",
      avatarUrl: avatar("jordan.sre"),
    },
    reviewers: [
      {
        username: "priya.ops",
        name: "Priya Sharma",
        avatarUrl: avatar("priya.ops"),
      },
    ],
    labels: ["infrastructure", "monitoring"],
    hasConflicts: false,
    pipeline: {
      status: "success",
      webUrl: "https://gitlab.example.com/acme/infra/-/pipelines/9015",
    },
    unresolvedThreads: 0,
    approvals: { approved: 1, required: 1, approvedByUsernames: ["priya.ops"] },
    linkedIssues: [],
    dependsOnMrs: [],
    needsRebase: false,
    createdAt: "2026-03-11T09:00:00.000Z",
    updatedAt: "2026-03-16T08:30:00.000Z",
  },
];
