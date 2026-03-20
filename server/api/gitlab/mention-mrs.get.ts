import type {
  GitLabApprovals,
  GitLabDiscussion,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabTodo,
} from "~~/app/types";
import {
  gitlabFetch,
  gitlabFetchAllPages,
  mapWithConcurrency,
} from "~~/server/utils/gitlab-client";
import { errorMessage } from "~~/server/utils/log";
import { normalizeMr } from "~~/server/utils/normalize";

export default defineEventHandler(async () => {
  const todos = await gitlabFetchAllPages<GitLabTodo>("/todos", {
    state: "pending",
  });

  // Filter to mention/directly_addressed targeting MergeRequests (skip todos without a project)
  const mentionTodos = todos.filter(
    (t) =>
      (t.action_name === "mentioned" || t.action_name === "directly_addressed") &&
      t.target_type === "MergeRequest" &&
      t.project != null,
  );

  // Deduplicate by project_path + iid
  const seen = new Set<string>();
  const uniqueTodos: GitLabTodo[] = [];
  for (const todo of mentionTodos) {
    const key = `${todo.project.path_with_namespace}!${todo.target.iid}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTodos.push(todo);
    }
  }

  // Fetch full MR data for each mention
  const results = await mapWithConcurrency(uniqueTodos, async (todo) => {
    const projectPath = todo.project.path_with_namespace;
    const encodedProject = encodeURIComponent(projectPath);

    const mr = await gitlabFetch<GitLabMergeRequest>(
      `/projects/${encodedProject}/merge_requests/${todo.target.iid}`,
    );

    // Skip closed/merged MRs
    if (mr.state !== "opened") return null;

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

    const normalized = normalizeMr(mr, projectPath, approvals, discussions);

    // Enrich linked issues
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

  return results
    .filter(
      (
        r,
      ): r is PromiseFulfilledResult<
        NonNullable<Awaited<ReturnType<typeof normalizeMr>>>
      > => r.status === "fulfilled" && r.value != null,
    )
    .map((r) => r.value)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
});
