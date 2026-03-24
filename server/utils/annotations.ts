import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Returns the file path for persisted annotations.
 * Uses DEVBOARD_DATA_DIR env var if set, otherwise ~/.devboard/.
 */
export function getAnnotationsPath(): string {
  const dir = process.env.DEVBOARD_DATA_DIR || join(homedir(), ".devboard");
  return join(dir, "annotations.json");
}
