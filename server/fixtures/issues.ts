import type { DevBoardIssue, DevBoardIssueDetail } from "~/types";
import { DEMO_USERS, demoUrl } from "./constants";

export const demoIssues: DevBoardIssue[] = [
  {
    id: 3021,
    iid: 21,
    title: "Add real-time event streaming",
    state: "opened",
    webUrl: demoUrl("acme/platform", "issues/21"),
    reference: "acme/platform#21",
    projectId: 101,
    projectPath: "acme/platform",
    labels: ["backend", "feature"],
    updatedAt: "2026-03-17T08:15:00.000Z",
  },
  {
    id: 3055,
    iid: 55,
    title: "Build notification bell UI",
    state: "opened",
    webUrl: demoUrl("acme/frontend", "issues/55"),
    reference: "acme/frontend#55",
    projectId: 102,
    projectPath: "acme/frontend",
    labels: ["frontend", "feature"],
    updatedAt: "2026-03-17T07:45:00.000Z",
  },
  {
    id: 3008,
    iid: 8,
    title: "Provision subscription worker pods",
    state: "opened",
    webUrl: demoUrl("acme/infra", "issues/8"),
    reference: "acme/infra#8",
    projectId: 103,
    projectPath: "acme/infra",
    labels: ["infrastructure"],
    updatedAt: "2026-03-16T14:30:00.000Z",
  },
];

const issueDetailExtras: Record<
  number,
  Pick<
    DevBoardIssueDetail,
    "description" | "author" | "assignees" | "closedAt" | "relatedMrs"
  >
> = {
  // acme/platform#21
  3021: {
    description:
      "We need real-time event streaming via GraphQL subscriptions so the frontend can receive live updates without polling.",
    author: DEMO_USERS.sam,
    assignees: [DEMO_USERS.sam, DEMO_USERS.alex],
    closedAt: null,
    relatedMrs: [
      {
        iid: 42,
        title: "Implement GraphQL subscriptions API",
        status: "open",
        webUrl: demoUrl("acme/platform", "merge_requests/42"),
        reference: "acme/platform!42",
      },
    ],
  },
  // acme/frontend#55
  3055: {
    description:
      "Build a notification bell component that shows unread count and a dropdown of recent notifications.",
    author: DEMO_USERS.mika,
    assignees: [DEMO_USERS.mika],
    closedAt: null,
    relatedMrs: [
      {
        iid: 87,
        title: "Real-time notification bell component",
        status: "open",
        webUrl: demoUrl("acme/frontend", "merge_requests/87"),
        reference: "acme/frontend!87",
      },
    ],
  },
  // acme/infra#8
  3008: {
    description:
      "Provision dedicated Kubernetes pods for the subscription worker service with proper resource limits and HPA.",
    author: DEMO_USERS.priya,
    assignees: [DEMO_USERS.priya, DEMO_USERS.jordan],
    closedAt: null,
    relatedMrs: [
      {
        iid: 14,
        title: "Update K8s manifests for subscription pods",
        status: "open",
        webUrl: demoUrl("acme/infra", "merge_requests/14"),
        reference: "acme/infra!14",
      },
    ],
  },
};

export function getDemoIssueDetail(
  projectId: number,
  iid: number,
): DevBoardIssueDetail | null {
  const issue = demoIssues.find((i) => i.projectId === projectId && i.iid === iid);
  if (!issue) return null;

  const extras = issueDetailExtras[issue.id] ?? {
    description: "",
    author: DEMO_USERS.alex,
    assignees: [],
    closedAt: null,
    relatedMrs: [],
  };

  return {
    ...issue,
    ...extras,
    createdAt: issue.updatedAt ?? "2026-03-15T10:00:00.000Z",
  };
}
