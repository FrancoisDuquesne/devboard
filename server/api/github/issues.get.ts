import type { GitHubIssue } from "~~/app/types";
import { githubFetchAllPages } from "~~/server/utils/github-client";
import { normalizeGitHubIssue } from "~~/server/utils/github-normalize";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const scopesParam =
    typeof query.scopes === "string" ? query.scopes : "assigned,created";
  const scopes = scopesParam
    .split(",")
    .filter((s): s is "assigned" | "created" => ["assigned", "created"].includes(s));

  if (scopes.length === 0) return [];

  const fetches: Promise<GitHubIssue[]>[] = [];

  if (scopes.includes("assigned")) {
    fetches.push(
      githubFetchAllPages<GitHubIssue>("/issues", {
        filter: "assigned",
        state: "open",
      }),
    );
  }
  if (scopes.includes("created")) {
    fetches.push(
      githubFetchAllPages<GitHubIssue>("/issues", {
        filter: "created",
        state: "open",
      }),
    );
  }

  const scopeResults = await Promise.all(fetches);

  // Deduplicate by issue id
  const issueMap = new Map<number, GitHubIssue>();
  for (const scopeIssues of scopeResults) {
    for (const issue of scopeIssues) {
      issueMap.set(issue.id, issue);
    }
  }

  // GitHub returns PRs mixed with issues — filter them out
  const pureIssues = Array.from(issueMap.values()).filter((i) => !i.pull_request);

  const enriched = pureIssues.map((issue) => {
    const projectPath = issue.repository?.full_name ?? "";
    return normalizeGitHubIssue(issue, projectPath);
  });

  return enriched.sort(
    (a, b) =>
      new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime(),
  );
});
