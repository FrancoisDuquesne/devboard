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

export default defineEventHandler(async () => {
  // Fetch both assigned and created issues (mirrors GitHub provider behavior)
  const [assigned, created] = await Promise.all([
    gitlabFetchAllPages<GitLabIssue>("/issues", {
      scope: "assigned_to_me",
      state: "opened",
    }),
    gitlabFetchAllPages<GitLabIssue>("/issues", {
      scope: "created_by_me",
      state: "opened",
    }),
  ]);

  // Deduplicate by issue id
  const issueMap = new Map<number, GitLabIssue>();
  for (const issue of [...assigned, ...created]) {
    issueMap.set(issue.id, issue);
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
