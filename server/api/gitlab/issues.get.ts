import type { GitLabIssue, GitLabProject } from "~~/app/types";
import { TtlCache } from "~~/server/utils/cache";
import { gitlabFetch, gitlabFetchAllPages } from "~~/server/utils/gitlab-client";
import { normalizeIssue } from "~~/server/utils/normalize";

const projectCache = new TtlCache<number, string>();

async function getProjectPath(projectId: number): Promise<string> {
  const cached = projectCache.get(projectId);
  if (cached) return cached;
  const project = await gitlabFetch<GitLabProject>(`/projects/${projectId}`);
  projectCache.set(projectId, project.path_with_namespace);
  return project.path_with_namespace;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const scopesParam =
    typeof query.scopes === "string" ? query.scopes : "assigned,created";
  const scopes = scopesParam
    .split(",")
    .filter((s): s is "assigned" | "created" => ["assigned", "created"].includes(s));

  if (scopes.length === 0) return [];

  const fetches: Promise<GitLabIssue[]>[] = [];

  if (scopes.includes("assigned")) {
    fetches.push(
      gitlabFetchAllPages<GitLabIssue>("/issues", {
        scope: "assigned_to_me",
        state: "opened",
      }),
    );
  }
  if (scopes.includes("created")) {
    fetches.push(
      gitlabFetchAllPages<GitLabIssue>("/issues", {
        scope: "created_by_me",
        state: "opened",
      }),
    );
  }

  const scopeResults = await Promise.all(fetches);

  // Deduplicate by issue id
  const issueMap = new Map<number, GitLabIssue>();
  for (const scopeIssues of scopeResults) {
    for (const issue of scopeIssues) {
      issueMap.set(issue.id, issue);
    }
  }

  const enriched = await Promise.all(
    Array.from(issueMap.values()).map(async (issue) => {
      const projectPath = await getProjectPath(issue.project_id);
      return normalizeIssue(issue, projectPath);
    }),
  );

  return enriched.sort(
    (a, b) =>
      new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime(),
  );
});
