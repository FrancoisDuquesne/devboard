import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import type { ScanDirSuggestion, ScanDirsConfigResponse } from "~~/app/types";
import { getConfig } from "~~/server/utils/config";

const CANDIDATE_DIRS = [
  "projects",
  "repos",
  "src",
  "code",
  "work",
  "dev",
  "git",
  "workspace",
];

async function getSuggestions(): Promise<ScanDirSuggestion[]> {
  const home = homedir();
  const suggestions: ScanDirSuggestion[] = [];

  for (const name of CANDIDATE_DIRS) {
    const fullPath = resolve(home, name);
    try {
      const s = await stat(fullPath);
      if (s.isDirectory()) {
        suggestions.push({ path: fullPath, label: `~/${name}` });
      }
    } catch {
      // directory doesn't exist, skip
    }
  }

  return suggestions;
}

export default defineEventHandler(async (): Promise<ScanDirsConfigResponse> => {
  const envDirs = process.env.WORKTREE_SCAN_DIRS;

  if (envDirs) {
    const scanDirs = envDirs
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    return {
      source: "env",
      scanDirs,
      locked: true,
      suggestions: [],
    };
  }

  const config = await getConfig();
  const suggestions = await getSuggestions();

  return {
    source: "config",
    scanDirs: config.scanDirs,
    locked: false,
    suggestions,
  };
});
