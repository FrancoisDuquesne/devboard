import type { DevBoardTodo } from "~/types";

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${seed}`;

export const demoTodos: DevBoardTodo[] = [
  {
    id: 5001,
    action: "review_requested",
    targetType: "MergeRequest",
    target: { id: 1087, iid: 87, title: "Real-time notification bell component" },
    body: "Mika Johansson requested your review on !87",
    author: {
      username: "mika.ui",
      name: "Mika Johansson",
      avatarUrl: avatar("mika.ui"),
    },
    projectPath: "acme/frontend",
    projectName: "frontend",
    targetUrl: "https://gitlab.example.com/acme/frontend/-/merge_requests/87",
    createdAt: "2026-03-17T07:45:00.000Z",
  },
  {
    id: 5002,
    action: "mentioned",
    targetType: "MergeRequest",
    target: { id: 1009, iid: 9, title: "Terraform module for Redis cluster" },
    body: "@alex.dev could you review the sentinel config?",
    author: {
      username: "priya.ops",
      name: "Priya Sharma",
      avatarUrl: avatar("priya.ops"),
    },
    projectPath: "acme/infra",
    projectName: "infra",
    targetUrl: "https://gitlab.example.com/acme/infra/-/merge_requests/9",
    createdAt: "2026-03-16T11:20:00.000Z",
  },
  {
    id: 5003,
    action: "build_failed",
    targetType: "MergeRequest",
    target: {
      id: 1039,
      iid: 39,
      title: "Add rate limiting to public API endpoints",
    },
    body: "Pipeline failed for !39",
    author: {
      username: "alex.dev",
      name: "Alex Chen",
      avatarUrl: avatar("alex.dev"),
    },
    projectPath: "acme/platform",
    projectName: "platform",
    targetUrl: "https://gitlab.example.com/acme/platform/-/merge_requests/39",
    createdAt: "2026-03-16T22:05:00.000Z",
  },
  {
    id: 5004,
    action: "approval_required",
    targetType: "MergeRequest",
    target: {
      id: 1042,
      iid: 42,
      title: "Implement GraphQL subscriptions API",
    },
    body: "Sam Nakamura approved, waiting for one more approval on !42",
    author: {
      username: "sam.backend",
      name: "Sam Nakamura",
      avatarUrl: avatar("sam.backend"),
    },
    projectPath: "acme/platform",
    projectName: "platform",
    targetUrl: "https://gitlab.example.com/acme/platform/-/merge_requests/42",
    createdAt: "2026-03-16T09:00:00.000Z",
  },
  {
    id: 5005,
    action: "directly_addressed",
    targetType: "Issue",
    target: { id: 3021, iid: 21, title: "Add real-time event streaming" },
    body: "@alex.dev this is ready for your final review before close",
    author: {
      username: "sam.backend",
      name: "Sam Nakamura",
      avatarUrl: avatar("sam.backend"),
    },
    projectPath: "acme/platform",
    projectName: "platform",
    targetUrl: "https://gitlab.example.com/acme/platform/-/issues/21",
    createdAt: "2026-03-15T16:30:00.000Z",
  },
];
