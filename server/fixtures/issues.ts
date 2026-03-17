import type { DevBoardIssue } from "~/types";
import { demoUrl } from "./constants";

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
