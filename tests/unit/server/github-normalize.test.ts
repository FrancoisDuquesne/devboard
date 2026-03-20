import { describe, expect, it, vi } from "vitest";
import type {
  GitHubCheckRun,
  GitHubIssue,
  GitHubNotification,
  GitHubPullRequest,
  GitHubReview,
  GitHubUser,
} from "~~/app/types/github";

// Mock github-auth before importing the module under test
vi.mock("~~/server/utils/github-auth", () => ({
  getGitHubHost: () => "github.com",
}));

const {
  aggregatePipelineStatus,
  normalizeGitHubIssue,
  normalizeNotification,
  normalizePr,
  resolvePrStatus,
} = await import("~~/server/utils/github-normalize");

function makeUser(overrides: Partial<GitHubUser> = {}): GitHubUser {
  return {
    id: 1,
    login: "alice",
    name: "Alice",
    avatar_url: "https://img/alice.png",
    html_url: "https://github.com/alice",
    ...overrides,
  };
}

function makePr(overrides: Partial<GitHubPullRequest> = {}): GitHubPullRequest {
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
    user: makeUser(),
    requested_reviewers: [],
    labels: [],
    mergeable: true,
    mergeable_state: "clean",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("resolvePrStatus", () => {
  it('returns "merged" when merged', () => {
    expect(resolvePrStatus(makePr({ merged: true }))).toBe("merged");
  });

  it('returns "closed" when state is closed and not merged', () => {
    expect(resolvePrStatus(makePr({ state: "closed", merged: false }))).toBe("closed");
  });

  it('returns "draft" when draft', () => {
    expect(resolvePrStatus(makePr({ draft: true }))).toBe("draft");
  });

  it('returns "open" for normal open PR', () => {
    expect(resolvePrStatus(makePr())).toBe("open");
  });

  it("merged takes precedence over closed", () => {
    expect(resolvePrStatus(makePr({ state: "closed", merged: true }))).toBe("merged");
  });
});

describe("aggregatePipelineStatus", () => {
  it("returns null for empty check runs", () => {
    expect(aggregatePipelineStatus([])).toBeNull();
  });

  it('returns "failed" if any run failed', () => {
    const runs: GitHubCheckRun[] = [
      {
        id: 1,
        name: "test",
        status: "completed",
        conclusion: "success",
        html_url: "",
      },
      {
        id: 2,
        name: "lint",
        status: "completed",
        conclusion: "failure",
        html_url: "",
      },
    ];
    expect(aggregatePipelineStatus(runs)).toBe("failed");
  });

  it('returns "running" if any run is in_progress', () => {
    const runs: GitHubCheckRun[] = [
      {
        id: 1,
        name: "test",
        status: "in_progress",
        conclusion: null,
        html_url: "",
      },
    ];
    expect(aggregatePipelineStatus(runs)).toBe("running");
  });

  it('returns "pending" if any run is queued', () => {
    const runs: GitHubCheckRun[] = [
      {
        id: 1,
        name: "test",
        status: "queued",
        conclusion: null,
        html_url: "",
      },
    ];
    expect(aggregatePipelineStatus(runs)).toBe("pending");
  });

  it('returns "canceled" if any run is cancelled', () => {
    const runs: GitHubCheckRun[] = [
      {
        id: 1,
        name: "test",
        status: "completed",
        conclusion: "cancelled",
        html_url: "",
      },
    ];
    expect(aggregatePipelineStatus(runs)).toBe("canceled");
  });

  it('returns "success" when all runs succeeded', () => {
    const runs: GitHubCheckRun[] = [
      {
        id: 1,
        name: "test",
        status: "completed",
        conclusion: "success",
        html_url: "",
      },
      {
        id: 2,
        name: "lint",
        status: "completed",
        conclusion: "success",
        html_url: "",
      },
    ];
    expect(aggregatePipelineStatus(runs)).toBe("success");
  });

  it("failure takes precedence over running", () => {
    const runs: GitHubCheckRun[] = [
      {
        id: 1,
        name: "test",
        status: "in_progress",
        conclusion: null,
        html_url: "",
      },
      {
        id: 2,
        name: "lint",
        status: "completed",
        conclusion: "failure",
        html_url: "",
      },
    ];
    expect(aggregatePipelineStatus(runs)).toBe("failed");
  });
});

describe("normalizePr", () => {
  it("maps basic fields correctly", () => {
    const result = normalizePr(makePr());
    expect(result.id).toBe(100);
    expect(result.iid).toBe(10);
    expect(result.projectId).toBe(42);
    expect(result.projectPath).toBe("org/repo");
    expect(result.title).toBe("Add feature");
    expect(result.sourceBranch).toBe("feature");
    expect(result.targetBranch).toBe("main");
    expect(result.author.username).toBe("alice");
  });

  it("maps reviewers from requested_reviewers", () => {
    const pr = makePr({
      requested_reviewers: [makeUser({ login: "bob", name: "Bob" })],
    });
    const result = normalizePr(pr);
    expect(result.reviewers).toHaveLength(1);
    expect(result.reviewers[0].username).toBe("bob");
  });

  it("uses login as fallback when name is null", () => {
    const pr = makePr({
      user: makeUser({ login: "noname", name: null }),
    });
    const result = normalizePr(pr);
    expect(result.author.name).toBe("noname");
  });

  it("maps labels from objects to strings", () => {
    const pr = makePr({
      labels: [
        { id: 1, name: "bug", color: "red" },
        { id: 2, name: "P1", color: "orange" },
      ],
    });
    const result = normalizePr(pr);
    expect(result.labels).toEqual(["bug", "P1"]);
  });

  it("detects conflicts from mergeable_state", () => {
    const pr = makePr({ mergeable_state: "dirty" });
    const result = normalizePr(pr);
    expect(result.hasConflicts).toBe(true);
    expect(result.needsRebase).toBe(true);
  });

  it("detects behind state as needsRebase", () => {
    const pr = makePr({ mergeable_state: "behind" });
    const result = normalizePr(pr);
    expect(result.needsRebase).toBe(true);
    expect(result.hasConflicts).toBe(false);
  });

  it("defaults body to empty string", () => {
    const pr = makePr({ body: null });
    const result = normalizePr(pr);
    expect(result.description).toBe("");
  });

  it("computes approvals from reviews", () => {
    const reviews: GitHubReview[] = [
      {
        id: 1,
        user: makeUser({ login: "bob" }),
        state: "APPROVED",
        submitted_at: "",
      },
      {
        id: 2,
        user: makeUser({ login: "carol" }),
        state: "CHANGES_REQUESTED",
        submitted_at: "",
      },
    ];
    const result = normalizePr(makePr(), reviews);
    expect(result.approvals.approved).toBe(1);
    expect(result.approvals.approvedByUsernames).toEqual(["bob"]);
    expect(result.unresolvedThreads).toBe(1);
  });

  it("uses latest review per user", () => {
    const reviews: GitHubReview[] = [
      {
        id: 1,
        user: makeUser({ login: "bob" }),
        state: "CHANGES_REQUESTED",
        submitted_at: "",
      },
      {
        id: 2,
        user: makeUser({ login: "bob" }),
        state: "APPROVED",
        submitted_at: "",
      },
    ];
    const result = normalizePr(makePr(), reviews);
    expect(result.approvals.approved).toBe(1);
    expect(result.unresolvedThreads).toBe(0);
  });

  it("ignores COMMENTED and PENDING reviews", () => {
    const reviews: GitHubReview[] = [
      {
        id: 1,
        user: makeUser({ login: "bob" }),
        state: "COMMENTED",
        submitted_at: "",
      },
      {
        id: 2,
        user: makeUser({ login: "carol" }),
        state: "PENDING",
        submitted_at: "",
      },
    ];
    const result = normalizePr(makePr(), reviews);
    expect(result.approvals.approved).toBe(0);
    expect(result.unresolvedThreads).toBe(0);
  });

  it("parses dependencies from body", () => {
    const pr = makePr({ body: "Depends on #42\nDepends on org/other#99" });
    const result = normalizePr(pr);
    expect(result.dependsOnMrs).toEqual(["#42", "org/other#99"]);
  });

  it("parses linked issues from body", () => {
    const pr = makePr({ body: "Closes #5\nClose #12" });
    const result = normalizePr(pr);
    expect(result.linkedIssues).toHaveLength(2);
    expect(result.linkedIssues[0].iid).toBe(5);
  });

  it("sets approvals.required to -1 (unknown for GitHub)", () => {
    const result = normalizePr(makePr());
    expect(result.approvals.required).toBe(-1);
  });
});

describe("normalizeNotification", () => {
  const baseNotification: GitHubNotification = {
    id: "123",
    reason: "mention",
    subject: {
      title: "Fix the thing",
      url: "https://api.github.com/repos/org/repo/pulls/42",
      type: "PullRequest",
    },
    repository: { id: 1, full_name: "org/repo" },
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("maps basic fields", () => {
    const result = normalizeNotification(baseNotification);
    expect(result.id).toBe(123);
    expect(result.action).toBe("mentioned");
    expect(result.targetType).toBe("MergeRequest");
    expect(result.target.iid).toBe(42);
    expect(result.body).toBe("Fix the thing");
    expect(result.projectPath).toBe("org/repo");
    expect(result.projectName).toBe("repo");
  });

  it("constructs targetUrl for PRs", () => {
    const result = normalizeNotification(baseNotification);
    expect(result.targetUrl).toBe("https://github.com/org/repo/pull/42");
  });

  it("constructs targetUrl for issues", () => {
    const notification: GitHubNotification = {
      ...baseNotification,
      subject: {
        title: "Bug",
        url: "https://api.github.com/repos/org/repo/issues/7",
        type: "Issue",
      },
    };
    const result = normalizeNotification(notification);
    expect(result.targetUrl).toBe("https://github.com/org/repo/issues/7");
    expect(result.targetType).toBe("Issue");
  });

  it("maps notification reasons to todo actions", () => {
    const cases: [string, string][] = [
      ["mention", "mentioned"],
      ["team_mention", "mentioned"],
      ["assign", "assigned"],
      ["review_requested", "review_requested"],
      ["state_change", "marked"],
      ["author", "marked"],
      ["comment", "directly_addressed"],
      ["unknown_reason", "mentioned"],
    ];
    for (const [reason, expected] of cases) {
      const n = { ...baseNotification, reason };
      expect(normalizeNotification(n).action).toBe(expected);
    }
  });

  it("handles null subject URL", () => {
    const n: GitHubNotification = {
      ...baseNotification,
      subject: { ...baseNotification.subject, url: null },
    };
    const result = normalizeNotification(n);
    expect(result.target.iid).toBe(0);
    expect(result.targetUrl).toBe("");
  });
});

describe("normalizeGitHubIssue", () => {
  const baseIssue: GitHubIssue = {
    id: 200,
    number: 15,
    title: "Bug report",
    body: "Steps...",
    state: "open",
    html_url: "https://github.com/org/repo/issues/15",
    labels: [{ id: 1, name: "bug", color: "red" }],
    assignees: [],
    user: makeUser(),
    repository: { id: 42, full_name: "org/repo" },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    closed_at: null,
  };

  it("maps basic fields", () => {
    const result = normalizeGitHubIssue(baseIssue);
    expect(result.id).toBe(200);
    expect(result.iid).toBe(15);
    expect(result.title).toBe("Bug report");
    expect(result.state).toBe("opened");
    expect(result.webUrl).toBe("https://github.com/org/repo/issues/15");
    expect(result.reference).toBe("#15");
    expect(result.labels).toEqual(["bug"]);
  });

  it('maps closed state to "closed"', () => {
    const issue = { ...baseIssue, state: "closed" as const };
    expect(normalizeGitHubIssue(issue).state).toBe("closed");
  });

  it("uses projectPath override when provided", () => {
    const result = normalizeGitHubIssue(baseIssue, "other/path");
    expect(result.projectPath).toBe("other/path");
  });

  it("falls back to empty strings when repository is missing", () => {
    const issue = { ...baseIssue, repository: undefined };
    const result = normalizeGitHubIssue(issue);
    expect(result.projectPath).toBe("");
    expect(result.projectId).toBe(0);
  });
});
