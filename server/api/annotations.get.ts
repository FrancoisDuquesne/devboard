import { readFile } from "node:fs/promises";
import { getAnnotationsPath } from "~~/server/utils/annotations";

export default defineEventHandler(async () => {
  const filePath = getAnnotationsPath();
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      return { stickyNotes: [], drawings: [] };
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to read annotations",
    });
  }
});
