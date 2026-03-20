import type {
  GitHubCheckRunsResponse,
  GitHubIssue,
  GitHubPullRequest,
  GitHubReview,
  GitHubSearchResult,
} from "~~/app/types";
import { githubFetch, mapWithConcurrency } from "~~/server/utils/github-client";
import { normalizePr } from "~~/server/utils/github-normalize";
import { errorMessage } from "~~/server/utils/log";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const scopesParam =
    typeof query.scopes === "string" ? query.scopes : "authored,assigned,reviewer";
  const scopes = scopesParam
    .split(",")
    .filter((s): s is "authored" | "assigned" | "reviewer" =>
      ["authored", "assigned", "reviewer"].includes(s),
    );

  if (scopes.length === 0) return [];

  // Use Search API to find PRs by scope
  const searches: Promise<GitHubPullRequest[]>[] = [];

  if (scopes.includes("authored")) {
    searches.push(
      githubFetch<GitHubSearchResult<GitHubPullRequest[]>>("/search/issues", {
        params: { q: "type:pr state:open author:@me" },
      }).then((r) => r.items),
    );
  }
  if (scopes.includes("assigned")) {
    searches.push(
      githubFetch<GitHubSearchResult<GitHubPullRequest[]>>("/search/issues", {
        params: { q: "type:pr state:open assignee:@me" },
      }).then((r) => r.items),
    );
  }
  if (scopes.includes("reviewer")) {
    searches.push(
      githubFetch<GitHubSearchResult<GitHubPullRequest[]>>("/search/issues", {
        params: { q: "type:pr state:open review-requested:@me" },
      }).then((r) => r.items),
    );
  }

  const scopeResults = await Promise.all(searches);

  // Deduplicate by PR id
  const prMap = new Map<number, GitHubPullRequest>();
  for (const scopePrs of scopeResults) {
    for (const pr of scopePrs) {
      prMap.set(pr.id, pr);
    }
  }

  const uniquePrs = Array.from(prMap.values());

  // Enrich each PR with full PR data, reviews, and check runs
  const results = await mapWithConcurrency(uniquePrs, async (searchPr) => {
    // Search results are issue objects — need to parse owner/repo from html_url
    const repoMatch =
      searchPr.html_url.match(/github\.com\/([^/]+\/[^/]+)\/pull\/\d+/) ??
      searchPr.html_url.match(/\/([^/]+\/[^/]+)\/pull\/\d+$/);
    if (!repoMatch) throw new Error(`Cannot parse repo from ${searchPr.html_url}`);
    const ownerRepo = repoMatch[1];

    const prNumber = searchPr.number ?? Number(searchPr.html_url.split("/").pop());

    // Fetch full PR first — search results lack head.sha needed for check-runs
    const pr = await githubFetch<GitHubPullRequest>(
      `/repos/${ownerRepo}/pulls/${prNumber}`,
    );

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

    // Enrich linked issues with titles and URLs
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

  const enriched = results
    .filter(
      (r): r is PromiseFulfilledResult<ReturnType<typeof normalizePr>> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);

  for (const r of results) {
    if (r.status === "rejected") {
      console.warn(`Failed to enrich PR: ${errorMessage(r.reason)}`);
    }
  }

  return enriched.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
});
