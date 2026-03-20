import type {
  GitHubCheckRunsResponse,
  GitHubIssue,
  GitHubNotification,
  GitHubPullRequest,
  GitHubReview,
} from "~~/app/types";
import {
  githubFetch,
  githubFetchAllPages,
  mapWithConcurrency,
} from "~~/server/utils/github-client";
import { normalizePr } from "~~/server/utils/github-normalize";
import { errorMessage } from "~~/server/utils/log";

export default defineEventHandler(async () => {
  const notifications = await githubFetchAllPages<GitHubNotification>(
    "/notifications",
    { all: false },
  );

  // Filter to mention/team_mention on PRs
  const mentionNotifications = notifications.filter(
    (n) =>
      (n.reason === "mention" || n.reason === "team_mention") &&
      n.subject.type === "PullRequest",
  );

  // Deduplicate by owner/repo#number
  const seen = new Set<string>();
  const uniqueNotifications: GitHubNotification[] = [];
  for (const n of mentionNotifications) {
    const prNumber = n.subject.url?.match(/\/pulls\/(\d+)$/)?.[1];
    if (!prNumber) continue;
    const key = `${n.repository.full_name}#${prNumber}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueNotifications.push(n);
    }
  }

  // Fetch full PR data for each mention
  const results = await mapWithConcurrency(uniqueNotifications, async (n) => {
    const ownerRepo = n.repository.full_name;
    const prNumber = n.subject.url?.match(/\/pulls\/(\d+)$/)?.[1];
    if (!prNumber) return null;

    const pr = await githubFetch<GitHubPullRequest>(
      `/repos/${ownerRepo}/pulls/${prNumber}`,
    );

    // Skip closed/merged PRs
    if (pr.state !== "open") return null;

    const [reviews, checkRunsResp] = await Promise.all([
      githubFetch<GitHubReview[]>(
        `/repos/${ownerRepo}/pulls/${prNumber}/reviews`,
      ).catch((e) => {
        console.warn(`Failed to fetch reviews for PR #${prNumber}: ${errorMessage(e)}`);
        return [] as GitHubReview[];
      }),
      githubFetch<GitHubCheckRunsResponse>(
        `/repos/${ownerRepo}/commits/${pr.head.sha}/check-runs`,
      ).catch((e) => {
        console.warn(
          `Failed to fetch check runs for PR #${prNumber}: ${errorMessage(e)}`,
        );
        return { total_count: 0, check_runs: [] } as GitHubCheckRunsResponse;
      }),
    ]);

    const normalized = normalizePr(pr, reviews, checkRunsResp.check_runs);

    // Enrich linked issues
    if (normalized.linkedIssues.length > 0) {
      await Promise.all(
        normalized.linkedIssues.map(async (issue) => {
          try {
            const ghIssue = await githubFetch<GitHubIssue>(
              `/repos/${ownerRepo}/issues/${issue.iid}`,
            );
            issue.title = ghIssue.title;
            issue.webUrl = ghIssue.html_url;
            issue.id = ghIssue.id;
            issue.state = ghIssue.state === "open" ? "opened" : "closed";
            issue.projectId = pr.base.repo.id;
          } catch {
            // Issue not found or no access — keep stub
          }
        }),
      );
    }

    return normalized;
  });

  return results
    .filter(
      (
        r,
      ): r is PromiseFulfilledResult<
        NonNullable<Awaited<ReturnType<typeof normalizePr>>>
      > => r.status === "fulfilled" && r.value != null,
    )
    .map((r) => r.value)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
});
