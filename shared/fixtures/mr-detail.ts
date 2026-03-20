import type { DevBoardMRDetail } from "~/types";
import { demoUrl } from "./constants";
import { demoMentionMrs } from "./mention-mrs";
import { demoMrs } from "./mrs";

const detailExtras: Record<
  number,
  {
    description: string;
    closingIssues: DevBoardMRDetail["closingIssues"];
    relatedMrs: DevBoardMRDetail["relatedMrs"];
  }
> = {
  // acme/infra!14
  1014: {
    description:
      "## Summary\n\nAdds dedicated K8s pod manifests for the subscription worker service.\n\n- Resource limits: `256Mi` memory, `200m` CPU\n- HPA configured for 2–8 replicas based on CPU utilization\n- Readiness probe on `/healthz`\n\nDepends on acme/platform!42",
    closingIssues: [
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
      },
    ],
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

  // acme/platform!42
  1042: {
    description:
      "## What\n\nImplements the server-side GraphQL subscriptions layer using `graphql-ws`.\n\n### Changes\n\n- New `SubscriptionServer` class wrapping the WebSocket transport\n- Redis pub/sub adapter for multi-instance broadcasting\n- Schema stitching for `Subscription` root type\n\n### Testing\n\n```bash\nnpm run test:subscriptions\n```\n\nCloses acme/platform#21",
    closingIssues: [
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
      },
    ],
    relatedMrs: [
      {
        iid: 14,
        title: "Update K8s manifests for subscription pods",
        status: "open",
        webUrl: demoUrl("acme/infra", "merge_requests/14"),
        reference: "acme/infra!14",
      },
      {
        iid: 87,
        title: "Real-time notification bell component",
        status: "open",
        webUrl: demoUrl("acme/frontend", "merge_requests/87"),
        reference: "acme/frontend!87",
      },
      {
        iid: 43,
        title: "WebSocket auth middleware",
        status: "draft",
        webUrl: demoUrl("acme/platform", "merge_requests/43"),
        reference: "acme/platform!43",
      },
    ],
  },

  // acme/frontend!87
  1087: {
    description:
      "Adds the notification bell component to the app header.\n\n- Displays unread count badge\n- Dropdown with recent notifications\n- Mark-as-read on click\n- Uses the new subscription endpoint from acme/platform!42",
    closingIssues: [
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
      },
    ],
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

  // acme/platform!43
  1043: {
    description:
      "WIP: Adds JWT-based auth for WebSocket connections.\n\n- Validates token on `connection_init`\n- Attaches user context to subscription resolvers\n- Rejects expired tokens with `4401` close code",
    closingIssues: [],
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

  // acme/platform!38
  1038: { description: "", closingIssues: [], relatedMrs: [] },

  // acme/frontend!91
  1091: { description: "", closingIssues: [], relatedMrs: [] },

  // acme/platform!39
  1039: { description: "", closingIssues: [], relatedMrs: [] },

  // acme/infra!9
  1009: { description: "", closingIssues: [], relatedMrs: [] },

  // acme/infra!12 (mention-only MR)
  1112: { description: "", closingIssues: [], relatedMrs: [] },
};

export function getDemoMrDetail(
  projectId: number,
  iid: number,
): DevBoardMRDetail | null {
  const allMrs = [...demoMrs, ...demoMentionMrs];
  const mr = allMrs.find((m) => m.projectId === projectId && m.iid === iid);
  if (!mr) return null;

  const extras = detailExtras[mr.id] ?? {
    description: "",
    closingIssues: [],
    relatedMrs: [],
  };

  return { ...mr, ...extras };
}
