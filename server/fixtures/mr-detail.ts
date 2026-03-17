import type { DevBoardMRDetail } from "~/types";
import { demoUrl } from "./constants";
import { demoMentionMrs } from "./mention-mrs";
import { demoMrs } from "./mrs";

const detailExtras: Record<
  number,
  {
    closingIssues: DevBoardMRDetail["closingIssues"];
    relatedMrs: DevBoardMRDetail["relatedMrs"];
  }
> = {
  // acme/infra!14
  1014: {
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
  1038: { closingIssues: [], relatedMrs: [] },

  // acme/frontend!91
  1091: { closingIssues: [], relatedMrs: [] },

  // acme/platform!39
  1039: { closingIssues: [], relatedMrs: [] },

  // acme/infra!9
  1009: { closingIssues: [], relatedMrs: [] },

  // acme/infra!12 (mention-only MR)
  1112: { closingIssues: [], relatedMrs: [] },
};

export function getDemoMrDetail(
  projectId: number,
  iid: number,
): DevBoardMRDetail | null {
  const allMrs = [...demoMrs, ...demoMentionMrs];
  const mr = allMrs.find((m) => m.projectId === projectId && m.iid === iid);
  if (!mr) return null;

  const extras = detailExtras[mr.id] ?? {
    closingIssues: [],
    relatedMrs: [],
  };

  return { ...mr, ...extras };
}
