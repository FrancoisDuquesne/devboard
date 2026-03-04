import { gitlabFetch } from "~~/server/utils/gitlab-client";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid todo id" });
  }
  try {
    await gitlabFetch(`/todos/${encodeURIComponent(id)}/mark_as_done`, {
      method: "POST",
    });
  } catch (e: unknown) {
    console.error(`Failed to mark todo ${id} as done:`, e);
    const status =
      e && typeof e === "object" && "statusCode" in e
        ? (e as { statusCode: number }).statusCode
        : 500;
    throw createError({
      statusCode: status,
      statusMessage: "Failed to mark todo as done",
    });
  }
  return { success: true };
});
