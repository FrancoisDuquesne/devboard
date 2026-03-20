import { describe, expect, it } from "vitest";
import { actionConfig, getActionRequired } from "~/composables/useActionStatus";
import type { DevBoardMR } from "~/types/devboard";

function makeMr(overrides: Partial<DevBoardMR> = {}): DevBoardMR {
  return {
    id: 1,
    iid: 10,
    projectId: 100,
    projectPath: "org/repo",
    title: "Test MR",
    description: "",
    status: "open",
    webUrl: "https://example.com/mr/10",
    sourceBranch: "feature",
    targetBranch: "main",
    author: { username: "alice", name: "Alice", avatarUrl: "" },
    reviewers: [],
    labels: [],
    hasConflicts: false,
    pipeline: { status: null, webUrl: null },
    unresolvedThreads: 0,
    approvals: {
      approved: 0,
      required: 1,
      approvedByUsernames: [],
    },
    linkedIssues: [],
    dependsOnMrs: [],
    needsRebase: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getActionRequired", () => {
  describe("as a reviewer", () => {
    it('returns "review" when reviewer has not approved', () => {
      const mr = makeMr({
        reviewers: [{ username: "bob", name: "Bob", avatarUrl: "" }],
      });
      expect(getActionRequired(mr, "bob")).toBe("review");
    });

    it('returns "waiting" when reviewer has already approved', () => {
      const mr = makeMr({
        reviewers: [{ username: "bob", name: "Bob", avatarUrl: "" }],
        approvals: {
          approved: 1,
          required: 1,
          approvedByUsernames: ["bob"],
        },
      });
      expect(getActionRequired(mr, "bob")).toBe("waiting");
    });
  });

  describe("as the author", () => {
    it('returns "fix-pipeline" when pipeline failed', () => {
      const mr = makeMr({
        pipeline: { status: "failed", webUrl: "https://ci/1" },
      });
      expect(getActionRequired(mr, "alice")).toBe("fix-pipeline");
    });

    it('returns "rebase" when MR needs rebase', () => {
      const mr = makeMr({ needsRebase: true });
      expect(getActionRequired(mr, "alice")).toBe("rebase");
    });

    it('returns "resolve-threads" when there are unresolved threads', () => {
      const mr = makeMr({ unresolvedThreads: 3 });
      expect(getActionRequired(mr, "alice")).toBe("resolve-threads");
    });

    it('returns "assign-reviewer" when open MR has no reviewers', () => {
      const mr = makeMr({ status: "open", reviewers: [] });
      expect(getActionRequired(mr, "alice")).toBe("assign-reviewer");
    });

    it('does not return "assign-reviewer" for drafts', () => {
      const mr = makeMr({ status: "draft", reviewers: [] });
      expect(getActionRequired(mr, "alice")).toBe("waiting");
    });

    it("prioritises fix-pipeline over rebase", () => {
      const mr = makeMr({
        pipeline: { status: "failed", webUrl: "https://ci/1" },
        needsRebase: true,
      });
      expect(getActionRequired(mr, "alice")).toBe("fix-pipeline");
    });

    it("prioritises rebase over resolve-threads", () => {
      const mr = makeMr({ needsRebase: true, unresolvedThreads: 2 });
      expect(getActionRequired(mr, "alice")).toBe("rebase");
    });
  });

  describe("as an unrelated user", () => {
    it('returns "waiting"', () => {
      const mr = makeMr();
      expect(getActionRequired(mr, "charlie")).toBe("waiting");
    });
  });

  describe("author who is also a reviewer", () => {
    it("does not trigger review action", () => {
      const mr = makeMr({
        reviewers: [{ username: "alice", name: "Alice", avatarUrl: "" }],
      });
      expect(getActionRequired(mr, "alice")).not.toBe("review");
    });
  });
});

describe("actionConfig", () => {
  it("has an entry for every ActionRequired value", () => {
    const actions = [
      "review",
      "assign-reviewer",
      "fix-pipeline",
      "rebase",
      "resolve-threads",
      "waiting",
    ] as const;
    for (const action of actions) {
      expect(actionConfig[action]).toBeDefined();
      expect(actionConfig[action].label).toBeTruthy();
      expect(actionConfig[action].icon).toMatch(/^i-lucide-/);
    }
  });
});
