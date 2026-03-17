import type { WorktreeResponse } from "~/types";

export const demoWorktrees: WorktreeResponse = {
  enabled: true,
  worktrees: [
    {
      branch: "main",
      path: "/home/user/repos/platform",
      isMain: true,
      repoName: "platform",
    },
    {
      branch: "feature/graphql-subscriptions",
      path: "/home/user/repos/platform-subscriptions",
      isMain: false,
      repoName: "platform",
    },
    {
      branch: "feature/rate-limiting",
      path: "/home/user/repos/platform-rate-limit",
      isMain: false,
      repoName: "platform",
    },
    {
      branch: "main",
      path: "/home/user/repos/frontend",
      isMain: true,
      repoName: "frontend",
    },
    {
      branch: "feature/notification-bell",
      path: "/home/user/repos/frontend-notif",
      isMain: false,
      repoName: "frontend",
    },
    {
      branch: "infra/k8s-subscriptions",
      path: "/home/user/repos/infra-k8s",
      isMain: false,
      repoName: "infra",
    },
  ],
};
