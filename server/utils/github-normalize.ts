import type {
  DevBoardIssue,
  DevBoardMR,
  DevBoardTodo,
  GitHubCheckRun,
  GitHubIssue,
  GitHubNotification,
  GitHubPullRequest,
  GitHubReview,
  MrStatus,
  PipelineStatus,
  TodoAction,
} from "~~/app/types";

export function resolvePrStatus(pr: GitHubPullRequest): MrStatus {
  if (pr.merged) return "merged";
  if (pr.state === "closed") return "closed";
  if (pr.draft) return "draft";
  return "open";
}

function parseDependencies(body: string | null): string[] {
  if (!body || body.length > 100_000) return [];
  const pattern = /[Dd]epends\s+on\s+(#\d+|[\w.\-/]{1,200}#(\d+))/g;
  return Array.from(body.matchAll(pattern), (m) => m[1]);
}

function parseLinkedIssues(body: string | null): DevBoardIssue[] {
  if (!body) return [];
  const pattern = /[Cc]loses?\s+#(\d+)/g;
  const seen = new Set<number>();
  const issues: DevBoardIssue[] = [];
  for (const m of body.matchAll(pattern)) {
    const iid = Number(m[1]);
    if (seen.has(iid)) continue;
    seen.add(iid);
    issues.push({
      id: 0,
      iid,
      title: "",
      state: "opened" as const,
      webUrl: "",
      reference: `#${m[1]}`,
      projectId: 0,
    });
  }
  return issues;
}

export function aggregatePipelineStatus(checkRuns: GitHubCheckRun[]): PipelineStatus {
  if (checkRuns.length === 0) return null;

  let hasFailure = false;
  let hasRunning = false;
  let hasPending = false;
  let hasCancelled = false;

  for (const run of checkRuns) {
    if (run.conclusion === "failure") hasFailure = true;
    if (run.status === "in_progress") hasRunning = true;
    if (run.status === "queued") hasPending = true;
    if (run.conclusion === "cancelled") hasCancelled = true;
  }

  if (hasFailure) return "failed";
  if (hasRunning) return "running";
  if (hasPending) return "pending";
  if (hasCancelled) return "canceled";
  return "success";
}

export function normalizePr(
  pr: GitHubPullRequest,
  reviews?: GitHubReview[],
  checkRuns?: GitHubCheckRun[],
): DevBoardMR {
  // Count latest CHANGES_REQUESTED reviews per user as unresolved threads
  const latestReviewByUser = new Map<string, string>();
  if (reviews) {
    for (const review of reviews) {
      if (review.state === "COMMENTED" || review.state === "PENDING") continue;
      latestReviewByUser.set(review.user.login, review.state);
    }
  }
  const unresolvedThreads = [...latestReviewByUser.values()].filter(
    (s) => s === "CHANGES_REQUESTED",
  ).length;

  // Compute approvals
  const approvedByUsernames: string[] = [];
  if (reviews) {
    for (const [username, state] of latestReviewByUser) {
      if (state === "APPROVED") approvedByUsernames.push(username);
    }
  }

  const pipelineStatus = checkRuns ? aggregatePipelineStatus(checkRuns) : null;

  return {
    id: pr.id,
    iid: pr.number,
    projectId: pr.base.repo.id,
    projectPath: pr.base.repo.full_name,
    title: pr.title,
    description: pr.body ?? "",
    status: resolvePrStatus(pr),
    webUrl: pr.html_url,
    sourceBranch: pr.head.ref,
    targetBranch: pr.base.ref,
    author: {
      username: pr.user.login,
      name: pr.user.name || pr.user.login,
      avatarUrl: pr.user.avatar_url,
    },
    reviewers: pr.requested_reviewers.map((r) => ({
      username: r.login,
      name: r.name || r.login,
      avatarUrl: r.avatar_url,
    })),
    labels: pr.labels.map((l) => l.name),
    hasConflicts: pr.mergeable_state === "dirty",
    pipeline: {
      status: pipelineStatus,
      webUrl: pipelineStatus ? `${pr.html_url}/checks` : null,
    },
    unresolvedThreads,
    approvals: {
      approved: approvedByUsernames.length,
      required: -1,
      approvedByUsernames,
    },
    linkedIssues: parseLinkedIssues(pr.body),
    dependsOnMrs: parseDependencies(pr.body),
    needsRebase: pr.mergeable_state === "dirty" || pr.mergeable_state === "behind",
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
  };
}

function resolveNotificationAction(reason: string): TodoAction {
  switch (reason) {
    case "mention":
    case "team_mention":
      return "mentioned";
    case "assign":
      return "assigned";
    case "review_requested":
      return "review_requested";
    case "state_change":
    case "author":
      return "marked";
    case "comment":
      return "directly_addressed";
    default:
      return "mentioned";
  }
}

function parseTargetIid(url: string | null): number {
  if (!url) return 0;
  const match = url.match(/\/(?:pulls|issues)\/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function resolveTargetType(subjectType: string): string {
  if (subjectType === "PullRequest") return "MergeRequest";
  if (subjectType === "Issue") return "Issue";
  return subjectType;
}

export function normalizeNotification(notification: GitHubNotification): DevBoardTodo {
  const iid = parseTargetIid(notification.subject.url);
  const repo = notification.repository.full_name;
  const subjectType = notification.subject.type;
  const pathSegment =
    subjectType === "PullRequest" ? "pull" : subjectType === "Issue" ? "issues" : "";
  const targetUrl =
    iid > 0 && pathSegment ? `https://github.com/${repo}/${pathSegment}/${iid}` : "";

  return {
    id: Number(notification.id),
    action: resolveNotificationAction(notification.reason),
    targetType: resolveTargetType(subjectType),
    target: {
      id: 0,
      iid,
      title: notification.subject.title,
    },
    targetState: "open",
    body: notification.subject.title,
    author: { username: "", name: "", avatarUrl: "" },
    projectPath: repo,
    projectName: repo.split("/").pop() ?? "",
    targetUrl,
    createdAt: notification.updated_at,
  };
}

export function normalizeGitHubIssue(
  issue: GitHubIssue,
  projectPath?: string,
): DevBoardIssue {
  const repoFullName = projectPath ?? issue.repository?.full_name ?? "";
  const repoId = issue.repository?.id ?? 0;

  return {
    id: issue.id,
    iid: issue.number,
    title: issue.title,
    state: issue.state === "open" ? "opened" : "closed",
    webUrl: issue.html_url,
    reference: `#${issue.number}`,
    projectId: repoId,
    projectPath: repoFullName,
    labels: issue.labels.map((l) => l.name),
    updatedAt: issue.updated_at,
  };
}
