import type { GitHubIssue } from "~~/app/types";
import { githubFetchAllPages } from "~~/server/utils/github-client";
import { normalizeGitHubIssue } from "~~/server/utils/github-normalize";

export default defineEventHandler(async () => {
  // Fetch both assigned and created issues (like MRs fetch multiple scopes)
  const [assigned, created] = await Promise.all([
    githubFetchAllPages<GitHubIssue>("/issues", {
      filter: "assigned",
      state: "open",
    }),
    githubFetchAllPages<GitHubIssue>("/issues", {
      filter: "created",
      state: "open",
    }),
  ]);

  // Deduplicate by issue id
  const issueMap = new Map<number, GitHubIssue>();
  for (const issue of [...assigned, ...created]) {
    issueMap.set(issue.id, issue);
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
