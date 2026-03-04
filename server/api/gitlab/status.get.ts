import { getGitLabHost } from "~~/server/utils/gitlab-auth";
import { gitlabFetch } from "~~/server/utils/gitlab-client";

interface GitLabUserResponse {
  username: string;
  name: string;
  avatar_url: string;
}

export default defineEventHandler(async () => {
  try {
    const user = await gitlabFetch<GitLabUserResponse>("/user");
    return {
      connected: true,
      host: getGitLabHost(),
      username: user.username,
      name: user.name,
      avatarUrl: user.avatar_url,
    };
  } catch (error) {
    console.error("GitLab connection check failed:", error);
    let host = "";
    try {
      host = getGitLabHost();
    } catch {
      // Host not configured — that's the problem
    }
    return {
      connected: false,
      host,
      error: "Unable to connect to GitLab",
    };
  }
});
