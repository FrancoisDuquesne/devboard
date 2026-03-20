import type { GitLabMergeRequest, GitLabUser } from "~~/app/types/gitlab";

export function makeGitLabUser(overrides: Partial<GitLabUser> = {}): GitLabUser {
  return {
    id: 1,
    username: "alice",
    name: "Alice",
    avatar_url: "https://img/alice.png",
    web_url: "https://gitlab/alice",
    ...overrides,
  };
}

export function makeGitLabMr(
  overrides: Partial<GitLabMergeRequest> = {},
): GitLabMergeRequest {
  return {
    id: 100,
    iid: 10,
    title: "Add feature",
    description: "Some description",
    state: "opened",
    draft: false,
    web_url: "https://gitlab/mr/10",
    source_branch: "feature",
    target_branch: "main",
    author: makeGitLabUser(),
    assignees: [],
    reviewers: [],
    labels: ["bug"],
    has_conflicts: false,
    merge_status: "can_be_merged",
    head_pipeline: null,
    user_notes_count: 0,
    upvotes: 0,
    downvotes: 0,
    project_id: 42,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    merged_at: null,
    closed_at: null,
    references: { full: "org/repo!10", relative: "!10", short: "!10" },
    ...overrides,
  };
}
