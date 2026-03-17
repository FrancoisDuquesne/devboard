import { getWorktrees } from "../utils/worktree";

export default defineEventHandler(async () => {
  return await getWorktrees();
});
