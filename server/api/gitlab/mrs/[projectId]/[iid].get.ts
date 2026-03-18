import type {
  DevBoardMRDetail,
  GitLabApprovals,
  GitLabDiscussion,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabProject,
} from "~~/app/types";
import { gitlabFetch, gitlabFetchAllPages } from "~~/server/utils/gitlab-client";
import { errorMessage } from "~~/server/utils/log";
import {
  normalizeIssue,
  normalizeMr,
  resolveMrStatus,
} from "~~/server/utils/normalize";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId");
  const iid = getRouterParam(event, "iid");

  if (!projectId || !iid || !/^\d+$/.test(projectId) || !/^\d+$/.test(iid)) {
    throw createError({ statusCode: 400, message: "Invalid projectId or iid" });
  }

  const encodedProject = encodeURIComponent(projectId);

  const [mr, approvals, discussions, project] = await Promise.all([
    gitlabFetch<GitLabMergeRequest>(
      `/projects/${encodedProject}/merge_requests/${iid}`,
    ),
    gitlabFetch<GitLabApprovals>(
      `/projects/${encodedProject}/merge_requests/${iid}/approvals`,
    ).catch((e) => {
      console.warn(`Failed to fetch approvals for MR ${iid}: ${errorMessage(e)}`);
      return undefined;
    }),
    gitlabFetchAllPages<GitLabDiscussion>(
      `/projects/${encodedProject}/merge_requests/${iid}/discussions`,
    ).catch((e) => {
      console.warn(`Failed to fetch discussions for MR ${iid}: ${errorMessage(e)}`);
      return [];
    }),
    gitlabFetch<GitLabProject>(`/projects/${encodedProject}`),
  ]);

  const projectPath = project.path_with_namespace;
  const normalized = normalizeMr(mr, projectPath, approvals, discussions);

  const closingIssues = await gitlabFetchAllPages<GitLabIssue>(
    `/projects/${encodedProject}/merge_requests/${iid}/closes_issues`,
  ).catch((e) => {
    console.warn(`Failed to fetch closing issues for MR ${iid}: ${errorMessage(e)}`);
    return [];
  });

  const relatedMrs = await gitlabFetchAllPages<GitLabMergeRequest>(
    `/projects/${encodedProject}/merge_requests/${iid}/related_merge_requests`,
  ).catch((e) => {
    console.warn(`Failed to fetch related MRs for MR ${iid}: ${errorMessage(e)}`);
    return [];
  });

  const detail: DevBoardMRDetail = {
    ...normalized,
    description: mr.description ?? "",
    closingIssues: closingIssues.map(normalizeIssue),
    relatedMrs: relatedMrs.map((rmr) => ({
      iid: rmr.iid,
      title: rmr.title,
      status: resolveMrStatus(rmr),
      webUrl: rmr.web_url,
      reference: rmr.references?.full ?? `!${rmr.iid}`,
    })),
  };

  return detail;
});
