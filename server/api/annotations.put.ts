import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { getAnnotationsPath } from "~~/server/utils/annotations";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body || !Array.isArray(body.stickyNotes) || !Array.isArray(body.drawings)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Body must contain stickyNotes and drawings arrays",
    });
  }

  const filePath = getAnnotationsPath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(body, null, 2), "utf-8");

  return { success: true };
});
