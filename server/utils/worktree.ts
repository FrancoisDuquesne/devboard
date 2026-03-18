import { execFile } from "node:child_process";
import { readdir, realpath, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { promisify } from "node:util";
import type { Worktree, WorktreeResponse } from "~/types";
import { getConfig } from "./config";

const execFileAsync = promisify(execFile);

const MAX_REPOS_PER_DIR = 100;
const EXEC_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 30000;

let cachedResult: WorktreeResponse | null = null;
let cachedAt = 0;

export function invalidateWorktreeCache() {
  cachedResult = null;
  cachedAt = 0;
}

function parseWorktreePorcelain(output: string, repoName: string): Worktree[] {
  const worktrees: Worktree[] = [];
  const blocks = output.trim().split("\n\n");

  for (const block of blocks) {
    if (!block.trim()) continue;
    const lines = block.split("\n");
    let path = "";
    let branch: string | null = null;
    let isBare = false;

    for (const line of lines) {
      if (line.startsWith("worktree ")) {
        path = line.slice("worktree ".length);
      } else if (line.startsWith("branch ")) {
        branch = line.slice("branch ".length).replace(/^refs\/heads\//, "");
      } else if (line === "bare") {
        isBare = true;
      } else if (line === "detached") {
        branch = null;
      }
    }

    if (path && !isBare) {
      worktrees.push({
        branch,
        path,
        isMain: worktrees.length === 0,
        repoName,
      });
    }
  }

  return worktrees;
}

function isWithinAllowedParent(
  resolvedPath: string,
  allowedParents: string[],
): boolean {
  return allowedParents.some((parent) => resolvedPath.startsWith(parent));
}

async function scanDirectory(
  parentDir: string,
  resolvedParents: string[],
): Promise<Worktree[]> {
  const worktrees: Worktree[] = [];

  let entries: string[];
  try {
    entries = await readdir(parentDir);
  } catch (e) {
    console.warn(`Worktree scan: cannot read directory ${parentDir}:`, e);
    return worktrees;
  }

  const repos = entries.slice(0, MAX_REPOS_PER_DIR);

  for (const entry of repos) {
    const repoPath = resolve(parentDir, entry);

    let resolvedRepoPath: string;
    try {
      const repoStat = await stat(repoPath);
      if (!repoStat.isDirectory()) continue;
      resolvedRepoPath = await realpath(repoPath);
    } catch {
      continue;
    }

    if (!isWithinAllowedParent(resolvedRepoPath, resolvedParents)) {
      console.warn(`Worktree scan: skipping ${repoPath} (symlink escape)`);
      continue;
    }

    try {
      await stat(resolve(resolvedRepoPath, ".git"));
    } catch {
      continue;
    }

    try {
      const { stdout } = await execFileAsync(
        "git",
        ["worktree", "list", "--porcelain"],
        { cwd: resolvedRepoPath, timeout: EXEC_TIMEOUT_MS },
      );
      const repoName = basename(repoPath);
      const allEntries = parseWorktreePorcelain(stdout, repoName);
      const match = allEntries.find((wt) => wt.path === resolvedRepoPath);
      if (match) {
        worktrees.push(match);
      }
    } catch (e) {
      console.warn(`Worktree scan: git failed for ${repoPath}:`, e);
    }
  }

  return worktrees;
}

export async function getWorktrees(): Promise<WorktreeResponse> {
  const now = Date.now();
  if (cachedResult && now - cachedAt < CACHE_TTL_MS) {
    return cachedResult;
  }

  const envDirs = process.env.WORKTREE_SCAN_DIRS;
  const locked = !!envDirs;

  let dirs: string[];
  if (envDirs) {
    dirs = envDirs
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
  } else {
    const config = await getConfig();
    dirs = config.scanDirs;
  }

  if (dirs.length === 0) {
    return { configured: false, scanDirs: [], locked, worktrees: [] };
  }

  const resolvedParents: string[] = [];
  for (const dir of dirs) {
    try {
      resolvedParents.push(await realpath(dir));
    } catch {
      console.warn(`Worktree scan: invalid parent dir ${dir}`);
    }
  }

  const allWorktrees: Worktree[] = [];
  for (const dir of resolvedParents) {
    allWorktrees.push(...(await scanDirectory(dir, resolvedParents)));
  }

  const result: WorktreeResponse = {
    configured: true,
    scanDirs: dirs,
    locked,
    worktrees: allWorktrees,
  };
  cachedResult = result;
  cachedAt = now;
  return result;
}
