import type {
  DevBoardMRDetail,
  GitHubCheckRunsResponse,
  GitHubIssue,
  GitHubPullRequest,
  GitHubReview,
} from "~~/app/types";
import { githubFetch } from "~~/server/utils/github-client";
import {
  normalizeGitHubIssue,
  normalizePr,
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

  const pr = await githubFetch<GitHubPullRequest>(`/repos/${ownerRepo}/pulls/${iid}`);

  const [reviews, checkRunsResp] = await Promise.all([
    githubFetch<GitHubReview[]>(`/repos/${ownerRepo}/pulls/${iid}/reviews`).catch(
      (e) => {
        console.warn(`Failed to fetch reviews for PR #${iid}: ${errorMessage(e)}`);
        return [] as GitHubReview[];
      },
    ),
    githubFetch<GitHubCheckRunsResponse>(
      `/repos/${ownerRepo}/commits/${pr.head.sha}/check-runs`,
    ).catch((e) => {
      console.warn(`Failed to fetch check runs for PR #${iid}: ${errorMessage(e)}`);
      return { total_count: 0, check_runs: [] } as GitHubCheckRunsResponse;
    }),
  ]);

  const normalized = normalizePr(pr, reviews, checkRunsResp.check_runs);

  // Fetch closing issues from body references
  const closingIssues = await Promise.all(
    normalized.linkedIssues.map(async (stub) => {
      try {
        const ghIssue = await githubFetch<GitHubIssue>(
          `/repos/${ownerRepo}/issues/${stub.iid}`,
        );
        return normalizeGitHubIssue(ghIssue, ownerRepo);
      } catch {
        return stub;
      }
    }),
  );

  // Find related PRs via cross-references in body
  const relatedPrNumbers = new Set<number>();
  const refPattern = /#(\d+)/g;
  for (const m of (pr.body ?? "").matchAll(refPattern)) {
    const num = Number(m[1]);
    if (num !== pr.number) relatedPrNumbers.add(num);
  }

  const relatedMrs = [];
  for (const num of relatedPrNumbers) {
    try {
      const relatedPr = await githubFetch<GitHubPullRequest>(
        `/repos/${ownerRepo}/pulls/${num}`,
      );
      relatedMrs.push({
        iid: relatedPr.number,
        title: relatedPr.title,
        status: resolvePrStatus(relatedPr),
        webUrl: relatedPr.html_url,
        reference: `#${relatedPr.number}`,
      });
    } catch {
      // Not a PR or no access — skip
    }
  }

  const detail: DevBoardMRDetail = {
    ...normalized,
    closingIssues,
    relatedMrs,
  };

  return detail;
});
