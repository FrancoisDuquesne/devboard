export type MrStatus = "draft" | "open" | "merged" | "closed";

export type PipelineStatus =
  | "success"
  | "failed"
  | "running"
  | "pending"
  | "canceled"
  | "skipped"
  | "created"
  | "manual"
  | null;

export interface DevBoardIssue {
  id: number;
  iid: number;
  title: string;
  state: "opened" | "closed";
  webUrl: string;
  reference: string;
  projectId: number;
  projectPath?: string;
  labels?: string[];
  updatedAt?: string;
}

export interface DevBoardMR {
  id: number;
  iid: number;
  projectId: number;
  projectPath: string;
  title: string;
  description: string;
  status: MrStatus;
  webUrl: string;
  sourceBranch: string;
  targetBranch: string;
  author: {
    username: string;
    name: string;
    avatarUrl: string;
  };
  reviewers: {
    username: string;
    name: string;
    avatarUrl: string;
  }[];
  labels: string[];
  hasConflicts: boolean;
  pipeline: {
    status: PipelineStatus;
    webUrl: string | null;
  };
  unresolvedThreads: number;
  approvals: {
    approved: number;
    required: number;
    approvedByUsernames: string[];
  };
  linkedIssues: DevBoardIssue[];
  dependsOnMrs: string[];
  needsRebase: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ActionRequired =
  | "review"
  | "assign-reviewer"
  | "fix-pipeline"
  | "rebase"
  | "resolve-threads"
  | "waiting";

export type MrRole = "author" | "reviewer" | "mentioned" | "all";
export type GraphNodeType = "mr" | "issue" | "todo";
export type GraphGroupBy = "none" | "project";
export type MrSortField = "updated" | "created" | "title";
export type MrSortDirection = "asc" | "desc";

export type TodoAction =
  | "mentioned"
  | "directly_addressed"
  | "assigned"
  | "approval_required"
  | "build_failed"
  | "marked"
  | "unmergeable"
  | "review_requested";

export interface DevBoardTodo {
  id: number;
  action: TodoAction;
  targetType: string;
  target: { id: number; iid: number; title: string };
  body: string;
  author: { username: string; name: string; avatarUrl: string };
  projectPath: string;
  projectName: string;
  targetUrl: string;
  createdAt: string;
}

export interface DevBoardMRDetail extends DevBoardMR {
  closingIssues: DevBoardIssue[];
  relatedMrs: {
    iid: number;
    title: string;
    status: MrStatus;
    webUrl: string;
    reference: string;
  }[];
}
