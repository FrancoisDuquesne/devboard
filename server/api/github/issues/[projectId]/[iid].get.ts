import type { DevBoardIssueDetail, GitHubIssue, GitHubPullRequest } from "~~/app/types";
import { githubFetch } from "~~/server/utils/github-client";
import {
  normalizeGitHubIssue,
  resolvePrStatus,
} from "~~/server/utils/github-normalize";
import { errorMessage } from "~~/server/utils/log";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId");
  const iid = getRouterParam(event, "iid");

  if (!projectId || !iid || !/^\d+$/.test(projectId) || !/^\d+$/.test(iid)) {
    throw createError({ statusCode: 400, message: "Invalid projectId or iid" });
  }

  // Resolve owner/repo from repository ID
  const repo = await githubFetch<{ full_name: string }>(`/repositories/${projectId}`);
  const ownerRepo = repo.full_name;

  const issue = await githubFetch<GitHubIssue>(`/repos/${ownerRepo}/issues/${iid}`);

  const normalized = normalizeGitHubIssue(issue, ownerRepo);

  // Find related PRs from cross-refs in the body
  const relatedPrNumbers = new Set<number>();
  const refPattern = /#(\d+)/g;
  for (const m of (issue.body ?? "").matchAll(refPattern)) {
    const num = Number(m[1]);
    if (num !== issue.number) relatedPrNumbers.add(num);
  }

  const relatedMrs = [];
  for (const num of relatedPrNumbers) {
    try {
      const pr = await githubFetch<GitHubPullRequest>(
        `/repos/${ownerRepo}/pulls/${num}`,
      );
      relatedMrs.push({
        iid: pr.number,
        title: pr.title,
        status: resolvePrStatus(pr),
        webUrl: pr.html_url,
        reference: `#${pr.number}`,
      });
    } catch (e) {
      // Not a PR or no access — skip
      console.warn(`Skipping #${num} for issue ${iid}: ${errorMessage(e)}`);
    }
  }

  const detail: DevBoardIssueDetail = {
    ...normalized,
    description: issue.body ?? "",
    author: {
      username: issue.user.login,
      name: issue.user.name || issue.user.login,
      avatarUrl: issue.user.avatar_url,
    },
    assignees: issue.assignees.map((a) => ({
      username: a.login,
      name: a.name || a.login,
      avatarUrl: a.avatar_url,
    })),
    createdAt: issue.created_at,
    closedAt: issue.closed_at,
    relatedMrs,
  };

  return detail;
});
