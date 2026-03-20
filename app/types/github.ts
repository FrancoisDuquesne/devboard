export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  draft: boolean;
  merged: boolean;
  merged_at: string | null;
  html_url: string;
  head: {
    ref: string;
    sha: string;
    repo: { id: number; full_name: string } | null;
  };
  base: {
    ref: string;
    repo: { id: number; full_name: string };
  };
  user: GitHubUser;
  requested_reviewers: GitHubUser[];
  labels: GitHubLabel[];
  mergeable: boolean | null;
  mergeable_state: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T;
}

export interface GitHubReview {
  id: number;
  user: GitHubUser;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING";
  submitted_at: string;
}

export interface GitHubCheckRun {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  html_url: string;
}

export interface GitHubCheckRunsResponse {
  total_count: number;
  check_runs: GitHubCheckRun[];
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  html_url: string;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  user: GitHubUser;
  repository?: { id: number; full_name: string };
  repository_url?: string;
  pull_request?: { url: string };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface GitHubNotification {
  id: string;
  reason: string;
  subject: {
    title: string;
    url: string | null;
    type: "PullRequest" | "Issue" | "Release" | "Discussion" | string;
  };
  repository: {
    id: number;
    full_name: string;
  };
  updated_at: string;
}
