import { githubFetch } from "~~/server/utils/github-client";
import { errorMessage } from "~~/server/utils/log";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid notification id" });
  }
  try {
    await githubFetch(`/notifications/threads/${id}`, {
      method: "PATCH",
    });
  } catch (e: unknown) {
    console.error(`Failed to mark notification ${id} as read: ${errorMessage(e)}`);
    const status =
      e && typeof e === "object" && "statusCode" in e
        ? (e as { statusCode: number }).statusCode
        : 500;
    throw createError({
      statusCode: status,
      statusMessage: "Failed to mark notification as read",
    });
  }
  return { success: true };
});
