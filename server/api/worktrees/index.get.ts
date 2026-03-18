import { getWorktrees } from "~~/server/utils/worktree";

export default defineEventHandler(async () => {
  return await getWorktrees();
});
