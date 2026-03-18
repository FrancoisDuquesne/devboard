import type {
  DevBoardIssueDetail,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabProject,
} from "~~/app/types";
import { gitlabFetch, gitlabFetchAllPages } from "~~/server/utils/gitlab-client";
import { errorMessage } from "~~/server/utils/log";
import { normalizeIssue, resolveMrStatus } from "~~/server/utils/normalize";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId");
  const iid = getRouterParam(event, "iid");

  if (!projectId || !iid || !/^\d+$/.test(projectId) || !/^\d+$/.test(iid)) {
    throw createError({ statusCode: 400, message: "Invalid projectId or iid" });
  }

  const encodedProject = encodeURIComponent(projectId);

  const [issue, project] = await Promise.all([
    gitlabFetch<GitLabIssue>(`/projects/${encodedProject}/issues/${iid}`),
    gitlabFetch<GitLabProject>(`/projects/${encodedProject}`),
  ]);

  const projectPath = project.path_with_namespace;
  const normalized = normalizeIssue(issue, projectPath);

  const relatedMrs = await gitlabFetchAllPages<GitLabMergeRequest>(
    `/projects/${encodedProject}/issues/${iid}/related_merge_requests`,
  ).catch((e) => {
    console.warn(`Failed to fetch related MRs for issue ${iid}: ${errorMessage(e)}`);
    return [];
  });

  const detail: DevBoardIssueDetail = {
    ...normalized,
    description: issue.description ?? "",
    author: {
      username: issue.author.username,
      name: issue.author.name,
      avatarUrl: issue.author.avatar_url,
    },
    assignees: issue.assignees.map((a) => ({
      username: a.username,
      name: a.name,
      avatarUrl: a.avatar_url,
    })),
    createdAt: issue.created_at,
    closedAt: issue.closed_at,
    relatedMrs: relatedMrs.map((mr) => ({
      iid: mr.iid,
      title: mr.title,
      status: resolveMrStatus(mr),
      webUrl: mr.web_url,
      reference: mr.references?.full ?? `!${mr.iid}`,
    })),
  };

  return detail;
});
