import type { GitHubNotification } from "~~/app/types";
import { githubFetchAllPages } from "~~/server/utils/github-client";
import { normalizeNotification } from "~~/server/utils/github-normalize";

export default defineEventHandler(async () => {
  const notifications = await githubFetchAllPages<GitHubNotification>(
    "/notifications",
    { all: false },
  );

  // Filter to PR and Issue notifications only
  const relevant = notifications.filter(
    (n) => n.subject.type === "PullRequest" || n.subject.type === "Issue",
  );

  return relevant
    .map(normalizeNotification)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});
