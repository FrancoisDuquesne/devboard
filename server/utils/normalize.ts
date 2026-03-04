import type {
  DevBoardIssue,
  DevBoardMR,
  DevBoardTodo,
  GitLabApprovals,
  GitLabDiscussion,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabTodo,
  MrStatus,
  PipelineStatus,
  TodoAction,
} from "~~/app/types";

export function resolveMrStatus(mr: GitLabMergeRequest): MrStatus {
  if (mr.state === "merged") return "merged";
  if (mr.state === "closed") return "closed";
  if (mr.draft) return "draft";
  return "open";
}

function parseDependencies(description: string | null): string[] {
  if (!description) return [];
  const pattern = /[Dd]epends\s+on\s+(!?\d+|[\w./-]+!(\d+))/g;
  return Array.from(description.matchAll(pattern), (m) => m[1]);
}

function parseLinkedIssues(description: string | null): DevBoardIssue[] {
  if (!description) return [];
  const pattern = /[Cc]loses?\s+#(\d+)/g;
  const seen = new Set<number>();
  const issues: DevBoardIssue[] = [];
  for (const m of description.matchAll(pattern)) {
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

export function normalizeMr(
  mr: GitLabMergeRequest,
  projectPath: string,
  approvals?: GitLabApprovals,
  discussions?: GitLabDiscussion[],
): DevBoardMR {
  const unresolvedThreads = discussions
    ? discussions.reduce((count, d) => {
        const resolvableNotes = d.notes.filter((n) => n.resolvable);
        const hasUnresolved = resolvableNotes.some((n) => !n.resolved);
        return count + (hasUnresolved ? 1 : 0);
      }, 0)
    : 0;

  return {
    id: mr.id,
    iid: mr.iid,
    projectId: mr.project_id,
    projectPath,
    title: mr.title,
    description: mr.description ?? "",
    status: resolveMrStatus(mr),
    webUrl: mr.web_url,
    sourceBranch: mr.source_branch,
    targetBranch: mr.target_branch,
    author: {
      username: mr.author.username,
      name: mr.author.name,
      avatarUrl: mr.author.avatar_url,
    },
    reviewers: mr.reviewers.map((r) => ({
      username: r.username,
      name: r.name,
      avatarUrl: r.avatar_url,
    })),
    labels: mr.labels,
    hasConflicts: mr.has_conflicts,
    pipeline: {
      status: (mr.head_pipeline?.status as PipelineStatus) ?? null,
      webUrl: mr.head_pipeline?.web_url ?? null,
    },
    unresolvedThreads,
    approvals: {
      approved: approvals?.approved_by?.length ?? 0,
      required: approvals?.approvals_required ?? 0,
      approvedByUsernames: approvals?.approved_by?.map((a) => a.user.username) ?? [],
    },
    linkedIssues: parseLinkedIssues(mr.description),
    dependsOnMrs: parseDependencies(mr.description),
    needsRebase:
      mr.has_conflicts ||
      (mr.merge_status !== "can_be_merged" && mr.state === "opened"),
    createdAt: mr.created_at,
    updatedAt: mr.updated_at,
  };
}

export function normalizeTodo(todo: GitLabTodo): DevBoardTodo {
  return {
    id: todo.id,
    action: todo.action_name as TodoAction,
    targetType: todo.target_type,
    target: todo.target,
    body: todo.body,
    author: {
      username: todo.author.username,
      name: todo.author.name,
      avatarUrl: todo.author.avatar_url,
    },
    projectPath: todo.project.path_with_namespace,
    projectName: todo.project.name,
    targetUrl: todo.target_url,
    createdAt: todo.created_at,
  };
}

export function normalizeIssue(
  issue: GitLabIssue,
  projectPath?: string,
): DevBoardIssue {
  return {
    id: issue.id,
    iid: issue.iid,
    title: issue.title,
    state: issue.state,
    webUrl: issue.web_url,
    reference: issue.references?.full ?? `#${issue.iid}`,
    projectId: issue.project_id,
    projectPath,
    labels: issue.labels,
    updatedAt: issue.updated_at,
  };
}
