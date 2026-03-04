import type { GitLabTodo } from "~~/app/types";
import { gitlabFetchAllPages } from "~~/server/utils/gitlab-client";
import { normalizeTodo } from "~~/server/utils/normalize";

export default defineEventHandler(async () => {
  const todos = await gitlabFetchAllPages<GitLabTodo>("/todos", {
    state: "pending",
  });

  return todos
    .map(normalizeTodo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});
