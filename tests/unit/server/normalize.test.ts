import { describe, expect, it } from "vitest";
import type {
  GitLabApprovals,
  GitLabDiscussion,
  GitLabIssue,
  GitLabTodo,
} from "~~/app/types/gitlab";
import {
  normalizeIssue,
  normalizeMr,
  normalizeTodo,
  resolveMrStatus,
} from "~~/server/utils/normalize";
import { makeGitLabMr, makeGitLabUser } from "~~/tests/fixtures/gitlab";

describe("resolveMrStatus", () => {
  it('returns "merged" for merged state', () => {
    expect(resolveMrStatus(makeGitLabMr({ state: "merged" }))).toBe("merged");
  });

  it('returns "closed" for closed state', () => {
    expect(resolveMrStatus(makeGitLabMr({ state: "closed" }))).toBe("closed");
  });

  it('returns "draft" when draft is true', () => {
    expect(resolveMrStatus(makeGitLabMr({ draft: true }))).toBe("draft");
  });

  it('returns "open" for a non-draft opened MR', () => {
    expect(resolveMrStatus(makeGitLabMr())).toBe("open");
  });

  it("merged takes precedence over draft", () => {
    expect(resolveMrStatus(makeGitLabMr({ state: "merged", draft: true }))).toBe(
      "merged",
    );
  });
});

describe("normalizeMr", () => {
  it("maps basic fields correctly", () => {
    const mr = makeGitLabMr();
    const result = normalizeMr(mr, "org/repo");

    expect(result.id).toBe(100);
    expect(result.iid).toBe(10);
    expect(result.projectId).toBe(42);
    expect(result.projectPath).toBe("org/repo");
    expect(result.title).toBe("Add feature");
    expect(result.webUrl).toBe("https://gitlab/mr/10");
    expect(result.sourceBranch).toBe("feature");
    expect(result.targetBranch).toBe("main");
    expect(result.labels).toEqual(["bug"]);
    expect(result.createdAt).toBe("2026-01-01T00:00:00Z");
    expect(result.updatedAt).toBe("2026-01-02T00:00:00Z");
  });

  it("maps author", () => {
    const result = normalizeMr(makeGitLabMr(), "org/repo");
    expect(result.author).toEqual({
      username: "alice",
      name: "Alice",
      avatarUrl: "https://img/alice.png",
    });
  });

  it("maps reviewers", () => {
    const mr = makeGitLabMr({
      reviewers: [makeGitLabUser({ username: "bob", name: "Bob" })],
    });
    const result = normalizeMr(mr, "org/repo");
    expect(result.reviewers).toHaveLength(1);
    expect(result.reviewers[0].username).toBe("bob");
  });

  it("defaults description to empty string when null", () => {
    const mr = makeGitLabMr({ description: null });
    const result = normalizeMr(mr, "org/repo");
    expect(result.description).toBe("");
  });

  it("maps pipeline status from head_pipeline", () => {
    const mr = makeGitLabMr({
      head_pipeline: {
        id: 1,
        iid: 1,
        status: "success",
        web_url: "https://ci/1",
        source: "push",
        ref: "main",
        sha: "abc",
        created_at: "",
        updated_at: "",
      },
    });
    const result = normalizeMr(mr, "org/repo");
    expect(result.pipeline.status).toBe("success");
    expect(result.pipeline.webUrl).toBe("https://ci/1");
  });

  it("pipeline is null when head_pipeline is missing", () => {
    const result = normalizeMr(makeGitLabMr(), "org/repo");
    expect(result.pipeline.status).toBeNull();
    expect(result.pipeline.webUrl).toBeNull();
  });

  it("counts unresolved threads from discussions", () => {
    const discussions: GitLabDiscussion[] = [
      {
        id: "d1",
        notes: [{ id: 1, resolvable: true, resolved: false }],
      },
      {
        id: "d2",
        notes: [{ id: 2, resolvable: true, resolved: true }],
      },
      {
        id: "d3",
        notes: [
          { id: 3, resolvable: true, resolved: false },
          { id: 4, resolvable: true, resolved: true },
        ],
      },
    ];
    const result = normalizeMr(makeGitLabMr(), "org/repo", undefined, discussions);
    expect(result.unresolvedThreads).toBe(2); // d1 and d3
  });

  it("unresolvedThreads is 0 when no discussions", () => {
    const result = normalizeMr(makeGitLabMr(), "org/repo");
    expect(result.unresolvedThreads).toBe(0);
  });

  it("maps approvals", () => {
    const approvals: GitLabApprovals = {
      approved: true,
      approvals_required: 2,
      approvals_left: 1,
      approved_by: [{ user: makeGitLabUser({ username: "bob" }) }],
    };
    const result = normalizeMr(makeGitLabMr(), "org/repo", approvals);
    expect(result.approvals.approved).toBe(1);
    expect(result.approvals.required).toBe(2);
    expect(result.approvals.approvedByUsernames).toEqual(["bob"]);
  });

  it("approvals default to zero when not provided", () => {
    const result = normalizeMr(makeGitLabMr(), "org/repo");
    expect(result.approvals.approved).toBe(0);
    expect(result.approvals.required).toBe(0);
    expect(result.approvals.approvedByUsernames).toEqual([]);
  });

  it("parses depends-on references from description", () => {
    const mr = makeGitLabMr({
      description: "Depends on !42\nDepends on org/repo!99",
    });
    const result = normalizeMr(mr, "org/repo");
    expect(result.dependsOnMrs).toEqual(["!42", "org/repo!99"]);
  });

  it("parses linked issues from description", () => {
    const mr = makeGitLabMr({ description: "Closes #5\nCloses #12" });
    const result = normalizeMr(mr, "org/repo");
    expect(result.linkedIssues).toHaveLength(2);
    expect(result.linkedIssues[0].iid).toBe(5);
    expect(result.linkedIssues[1].iid).toBe(12);
  });

  it("deduplicates linked issues", () => {
    const mr = makeGitLabMr({ description: "Closes #5\nCloses #5" });
    const result = normalizeMr(mr, "org/repo");
    expect(result.linkedIssues).toHaveLength(1);
  });

  it("needsRebase is true when has_conflicts", () => {
    const mr = makeGitLabMr({ has_conflicts: true });
    const result = normalizeMr(mr, "org/repo");
    expect(result.needsRebase).toBe(true);
    expect(result.hasConflicts).toBe(true);
  });

  it("needsRebase is true when merge_status is not can_be_merged and opened", () => {
    const mr = makeGitLabMr({
      merge_status: "cannot_be_merged",
      state: "opened",
    });
    const result = normalizeMr(mr, "org/repo");
    expect(result.needsRebase).toBe(true);
  });

  it("needsRebase is false when merge_status is can_be_merged", () => {
    const mr = makeGitLabMr({ merge_status: "can_be_merged", state: "opened" });
    const result = normalizeMr(mr, "org/repo");
    expect(result.needsRebase).toBe(false);
  });

  it("handles very large descriptions safely (>100k chars)", () => {
    const huge = "x".repeat(200_000);
    const mr = makeGitLabMr({ description: huge });
    const result = normalizeMr(mr, "org/repo");
    expect(result.dependsOnMrs).toEqual([]);
  });
});

describe("normalizeTodo", () => {
  it("maps basic fields", () => {
    const todo: GitLabTodo = {
      id: 1,
      state: "pending",
      action_name: "assigned",
      target_type: "MergeRequest",
      target: { id: 10, iid: 5, title: "Fix bug", state: "opened" },
      body: "You were assigned",
      author: makeGitLabUser(),
      project: {
        id: 1,
        name: "repo",
        path_with_namespace: "org/repo",
      },
      target_url: "https://gitlab/mr/5",
      created_at: "2026-01-01T00:00:00Z",
    };
    const result = normalizeTodo(todo);

    expect(result.id).toBe(1);
    expect(result.action).toBe("assigned");
    expect(result.targetType).toBe("MergeRequest");
    expect(result.target.iid).toBe(5);
    expect(result.targetState).toBe("open");
    expect(result.author.username).toBe("alice");
    expect(result.projectPath).toBe("org/repo");
    expect(result.projectName).toBe("repo");
  });

  it('resolves targetState "merged" for MergeRequest', () => {
    const todo: GitLabTodo = {
      id: 2,
      state: "pending",
      action_name: "mentioned",
      target_type: "MergeRequest",
      target: { id: 10, iid: 5, title: "Old MR", state: "merged" },
      body: "",
      author: makeGitLabUser(),
      project: {
        id: 1,
        name: "repo",
        path_with_namespace: "org/repo",
      },
      target_url: "",
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(normalizeTodo(todo).targetState).toBe("merged");
  });

  it('resolves targetState "closed"', () => {
    const todo: GitLabTodo = {
      id: 3,
      state: "pending",
      action_name: "mentioned",
      target_type: "Issue",
      target: { id: 10, iid: 5, title: "Issue", state: "closed" },
      body: "",
      author: makeGitLabUser(),
      project: {
        id: 1,
        name: "repo",
        path_with_namespace: "org/repo",
      },
      target_url: "",
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(normalizeTodo(todo).targetState).toBe("closed");
  });

  it("handles null project gracefully", () => {
    const todo: GitLabTodo = {
      id: 4,
      state: "pending",
      action_name: "mentioned",
      target_type: "MergeRequest",
      target: { id: 10, iid: 5, title: "MR", state: "opened" },
      body: "",
      author: makeGitLabUser(),
      project: null,
      target_url: "",
      created_at: "2026-01-01T00:00:00Z",
    };
    const result = normalizeTodo(todo);
    expect(result.projectPath).toBe("");
    expect(result.projectName).toBe("");
  });
});

describe("normalizeIssue", () => {
  const baseIssue: GitLabIssue = {
    id: 200,
    iid: 15,
    title: "Bug report",
    description: "Steps to reproduce...",
    state: "opened",
    web_url: "https://gitlab/issues/15",
    labels: ["bug", "P1"],
    assignees: [],
    author: makeGitLabUser(),
    project_id: 42,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    closed_at: null,
    references: { full: "org/repo#15", relative: "#15", short: "#15" },
  };

  it("maps basic fields", () => {
    const result = normalizeIssue(baseIssue, "org/repo");
    expect(result.id).toBe(200);
    expect(result.iid).toBe(15);
    expect(result.title).toBe("Bug report");
    expect(result.state).toBe("opened");
    expect(result.webUrl).toBe("https://gitlab/issues/15");
    expect(result.reference).toBe("org/repo#15");
    expect(result.projectId).toBe(42);
    expect(result.projectPath).toBe("org/repo");
    expect(result.labels).toEqual(["bug", "P1"]);
  });

  it("falls back to #iid when references.full is missing", () => {
    const issue = {
      ...baseIssue,
      references: undefined as unknown as GitLabIssue["references"],
    };
    const result = normalizeIssue(issue);
    expect(result.reference).toBe("#15");
  });
});
