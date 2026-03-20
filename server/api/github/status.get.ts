import { getGitHubHost } from "~~/server/utils/github-auth";
import { githubFetch } from "~~/server/utils/github-client";
import { errorMessage } from "~~/server/utils/log";

interface GitHubUserResponse {
  login: string;
  name: string | null;
  avatar_url: string;
}

export default defineEventHandler(async () => {
  try {
    const user = await githubFetch<GitHubUserResponse>("/user");
    return {
      connected: true,
      host: getGitHubHost(),
      username: user.login,
      name: user.name ?? user.login,
      avatarUrl: user.avatar_url,
    };
  } catch (error) {
    console.error("GitHub connection check failed:", errorMessage(error));
    let host = "";
    try {
      host = getGitHubHost();
    } catch {
      // Host not configured — that's the problem
    }
    return {
      connected: false,
      host,
      error: "Unable to connect to GitHub",
    };
  }
});
