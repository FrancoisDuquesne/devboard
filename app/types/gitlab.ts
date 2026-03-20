export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  web_url: string;
}

export interface GitLabPipeline {
  id: number;
  iid: number;
  status: string;
  web_url: string;
  source: string;
  ref: string;
  sha: string;
  created_at: string;
  updated_at: string;
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: "opened" | "closed" | "merged" | "locked";
  draft: boolean;
  web_url: string;
  source_branch: string;
  target_branch: string;
  author: GitLabUser;
  assignees: GitLabUser[];
  reviewers: GitLabUser[];
  labels: string[];
  has_conflicts: boolean;
  merge_status: string;
  head_pipeline: GitLabPipeline | null;
  user_notes_count: number;
  upvotes: number;
  downvotes: number;
  project_id: number;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  references: {
    full: string;
    relative: string;
    short: string;
  };
}

export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description: string | null;
  state: "opened" | "closed";
  web_url: string;
  labels: string[];
  assignees: GitLabUser[];
  author: GitLabUser;
  project_id: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  references: {
    full: string;
    relative: string;
    short: string;
  };
}

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  avatar_url: string | null;
}

export interface GitLabApprovals {
  approved: boolean;
  approvals_required: number;
  approvals_left: number;
  approved_by: { user: GitLabUser }[];
}

export interface GitLabDiscussion {
  id: string;
  notes: {
    id: number;
    resolvable: boolean;
    resolved: boolean;
  }[];
}

export interface GitLabTodo {
  id: number;
  state: "pending" | "done";
  action_name: string;
  target_type: string;
  target: { id: number; iid: number; title: string; state: string };
  body: string;
  author: GitLabUser;
  project: { id: number; name: string; path_with_namespace: string } | null;
  target_url: string;
  created_at: string;
}
