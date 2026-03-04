import type { ActionRequired, DevBoardMR } from "~/types";

export function getActionRequired(
  mr: DevBoardMR,
  currentUsername: string,
): ActionRequired {
  const isAuthor = mr.author.username === currentUsername;
  const isReviewer = mr.reviewers.some((r) => r.username === currentUsername);

  // Reviewer who hasn't approved yet
  if (isReviewer && !isAuthor) {
    const hasApproved = mr.approvals.approvedByUsernames.includes(currentUsername);
    if (!hasApproved) return "review";
  }

  if (isAuthor) {
    if (mr.pipeline.status === "failed") return "fix-pipeline";
    if (mr.needsRebase) return "rebase";
    if (mr.unresolvedThreads > 0) return "resolve-threads";
    if (mr.status !== "draft" && mr.reviewers.length === 0) return "assign-reviewer";
  }

  return "waiting";
}

export type ActionColor = "warning" | "error" | "neutral";

export const actionConfig: Record<
  ActionRequired,
  { label: string; icon: string; color: ActionColor }
> = {
  review: {
    label: "Review needed",
    icon: "i-lucide-eye",
    color: "warning",
  },
  "assign-reviewer": {
    label: "Assign reviewer",
    icon: "i-lucide-user-plus",
    color: "warning",
  },
  "fix-pipeline": {
    label: "Fix pipeline",
    icon: "i-lucide-x-circle",
    color: "error",
  },
  rebase: {
    label: "Rebase needed",
    icon: "i-lucide-git-branch",
    color: "error",
  },
  "resolve-threads": {
    label: "Resolve threads",
    icon: "i-lucide-message-circle",
    color: "warning",
  },
  waiting: {
    label: "Awaiting review",
    icon: "i-lucide-hourglass",
    color: "neutral",
  },
};
