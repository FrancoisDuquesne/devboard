import type {
  GitLabApprovals,
  GitLabDiscussion,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabProject,
} from "~~/app/types";
import { TtlCache } from "~~/server/utils/cache";
import {
  gitlabFetch,
  gitlabFetchAllPages,
  mapWithConcurrency,
} from "~~/server/utils/gitlab-client";
import { errorMessage } from "~~/server/utils/log";
import { normalizeMr } from "~~/server/utils/normalize";

const projectCache = new TtlCache<number, string>();

async function getProjectPath(projectId: number): Promise<string> {
  const cached = projectCache.get(projectId);
  if (cached) return cached;
  const project = await gitlabFetch<GitLabProject>(`/projects/${projectId}`);
  projectCache.set(projectId, project.path_with_namespace);
  return project.path_with_namespace;
}

export default defineEventHandler(async () => {
  // Fetch current user to query reviewer MRs
  const user = await gitlabFetch<{ username: string }>("/user");

  const [authoredMrs, assignedMrs, reviewerMrs] = await Promise.all([
    gitlabFetchAllPages<GitLabMergeRequest>("/merge_requests", {
      scope: "created_by_me",
      state: "opened",
    }),
    gitlabFetchAllPages<GitLabMergeRequest>("/merge_requests", {
      scope: "assigned_to_me",
      state: "opened",
    }),
    gitlabFetchAllPages<GitLabMergeRequest>("/merge_requests", {
      scope: "all",
      reviewer_username: user.username,
      state: "opened",
    }),
  ]);

  const mrMap = new Map<number, GitLabMergeRequest>();
  for (const mr of [...authoredMrs, ...assignedMrs, ...reviewerMrs]) {
    mrMap.set(mr.id, mr);
  }

  const uniqueMrs = Array.from(mrMap.values());

  const results = await mapWithConcurrency(uniqueMrs, async (mr) => {
    const encodedProject = encodeURIComponent(await getProjectPath(mr.project_id));

    const [approvals, discussions] = await Promise.all([
      gitlabFetch<GitLabApprovals>(
        `/projects/${encodedProject}/merge_requests/${mr.iid}/approvals`,
      ).catch((e) => {
        console.warn(`Failed to fetch approvals for MR ${mr.iid}: ${errorMessage(e)}`);
        return undefined;
      }),
      gitlabFetchAllPages<GitLabDiscussion>(
        `/projects/${encodedProject}/merge_requests/${mr.iid}/discussions`,
      ).catch((e) => {
        console.warn(
          `Failed to fetch discussions for MR ${mr.iid}: ${errorMessage(e)}`,
        );
        return [];
      }),
    ]);

    const projectPath = await getProjectPath(mr.project_id);
    const normalized = normalizeMr(mr, projectPath, approvals, discussions);

    // Enrich linked issues with titles and URLs
    if (normalized.linkedIssues.length > 0) {
      await Promise.all(
        normalized.linkedIssues.map(async (issue) => {
          try {
            const gitlabIssue = await gitlabFetch<GitLabIssue>(
              `/projects/${encodedProject}/issues/${issue.iid}`,
            );
            issue.title = gitlabIssue.title;
            issue.webUrl = gitlabIssue.web_url;
            issue.id = gitlabIssue.id;
            issue.state = gitlabIssue.state;
            issue.projectId = mr.project_id;
            if (gitlabIssue.references?.full) {
              issue.reference = gitlabIssue.references.full;
            }
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
      (r): r is PromiseFulfilledResult<ReturnType<typeof normalizeMr>> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);

  for (const r of results) {
    if (r.status === "rejected") {
      console.warn(`Failed to enrich MR: ${errorMessage(r.reason)}`);
    }
  }

  return enriched.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
});
