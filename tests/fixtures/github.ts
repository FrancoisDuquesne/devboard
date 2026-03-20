import type { GitHubPullRequest, GitHubUser } from "~~/app/types/github";

export function makeGitHubUser(overrides: Partial<GitHubUser> = {}): GitHubUser {
  return {
    id: 1,
    login: "alice",
    name: "Alice",
    avatar_url: "https://img/alice.png",
    html_url: "https://github.com/alice",
    ...overrides,
  };
}

export function makeGitHubPr(
  overrides: Partial<GitHubPullRequest> = {},
): GitHubPullRequest {
  return {
    id: 100,
    number: 10,
    title: "Add feature",
    body: "Some description",
    state: "open",
    draft: false,
    merged: false,
    merged_at: null,
    html_url: "https://github.com/org/repo/pull/10",
    head: {
      ref: "feature",
      sha: "abc123",
      repo: { id: 42, full_name: "org/repo" },
    },
    base: {
      ref: "main",
      repo: { id: 42, full_name: "org/repo" },
    },
    user: makeGitHubUser(),
    requested_reviewers: [],
    labels: [],
    mergeable: true,
    mergeable_state: "clean",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}
