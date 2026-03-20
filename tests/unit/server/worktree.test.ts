import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getWorktrees", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("WORKTREE_SCAN_DIRS", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns not configured when WORKTREE_SCAN_DIRS is empty", async () => {
    const { getWorktrees } = await import("~~/server/utils/worktree");
    const result = await getWorktrees();

    expect(result.configured).toBe(false);
    expect(result.scanDirs).toEqual([]);
    expect(result.worktrees).toEqual([]);
  });

  it("returns not configured when WORKTREE_SCAN_DIRS is unset", async () => {
    delete process.env.WORKTREE_SCAN_DIRS;
    const { getWorktrees } = await import("~~/server/utils/worktree");
    const result = await getWorktrees();

    expect(result.configured).toBe(false);
    expect(result.scanDirs).toEqual([]);
    expect(result.worktrees).toEqual([]);
  });
});
