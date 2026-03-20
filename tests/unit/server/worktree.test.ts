import { describe, expect, it } from "vitest";

// parseWorktreePorcelain is not exported, so we test it indirectly.
// We can still test the module's exported getWorktrees with env mocking.
// For now, let's test the parsing logic by importing the module and
// checking the output format.

// Since parseWorktreePorcelain is private, we test getWorktrees behavior
// with WORKTREE_SCAN_DIRS unset (the simplest path).

describe("getWorktrees", () => {
  it("returns not configured when WORKTREE_SCAN_DIRS is unset", async () => {
    const originalEnv = process.env.WORKTREE_SCAN_DIRS;
    delete process.env.WORKTREE_SCAN_DIRS;

    // Dynamic import to avoid module-level caching issues
    const { getWorktrees } = await import("~~/server/utils/worktree");
    const result = await getWorktrees();

    expect(result.configured).toBe(false);
    expect(result.scanDirs).toEqual([]);
    expect(result.worktrees).toEqual([]);

    // Restore
    if (originalEnv !== undefined) {
      process.env.WORKTREE_SCAN_DIRS = originalEnv;
    }
  });
});
