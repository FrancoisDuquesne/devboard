import { stat } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { saveConfig } from "~~/server/utils/config";
import { invalidateWorktreeCache } from "~~/server/utils/worktree";

const MAX_DIRS = 20;

export default defineEventHandler(async (event) => {
  if (process.env.WORKTREE_SCAN_DIRS) {
    throw createError({
      statusCode: 409,
      message: "Scan dirs are configured via WORKTREE_SCAN_DIRS environment variable",
    });
  }

  const body = await readBody<{ scanDirs: string[] }>(event);

  if (!Array.isArray(body?.scanDirs)) {
    throw createError({ statusCode: 400, message: "scanDirs must be an array" });
  }

  const scanDirs = body.scanDirs
    .filter((d): d is string => typeof d === "string")
    .map((d) => d.trim())
    .filter(Boolean)
    .slice(0, MAX_DIRS);

  for (const dir of scanDirs) {
    if (!isAbsolute(dir)) {
      throw createError({
        statusCode: 400,
        message: `Path must be absolute: ${dir}`,
      });
    }
  }

  const warnings: string[] = [];
  for (const dir of scanDirs) {
    try {
      const s = await stat(dir);
      if (!s.isDirectory()) {
        warnings.push(`${dir} is not a directory`);
      }
    } catch {
      warnings.push(`${dir} does not exist`);
    }
  }

  await saveConfig({ scanDirs });
  invalidateWorktreeCache();

  return { success: true, scanDirs, warnings };
});
