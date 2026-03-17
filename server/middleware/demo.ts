import {
  demoIssues,
  demoMentionMrs,
  demoMrs,
  demoStatus,
  demoTodos,
  getDemoIssueDetail,
  demoWorktrees,
  getDemoMrDetail,
} from "../fixtures";

export default defineEventHandler((event) => {
  if (!process.env.DEMO_MODE) return;

  if (process.env.NODE_ENV === "production") {
    console.error("DEMO_MODE must not be enabled in production — ignoring");
    return;
  }

  const pathname = getRequestURL(event).pathname;

  // GET /api/worktrees
  if (pathname === "/api/worktrees") {
    return demoWorktrees;
  }

  if (!pathname.startsWith("/api/gitlab/")) return;

  // GET /api/gitlab/status
  if (pathname === "/api/gitlab/status") {
    return demoStatus;
  }

  // GET /api/gitlab/mrs (exact match, not sub-routes)
  if (pathname === "/api/gitlab/mrs") {
    return demoMrs;
  }

  // GET /api/gitlab/mrs/:projectId/:iid
  const mrDetailMatch = pathname.match(/^\/api\/gitlab\/mrs\/(\d+)\/(\d+)$/);
  if (mrDetailMatch) {
    const projectId = Number(mrDetailMatch[1]);
    const iid = Number(mrDetailMatch[2]);
    const detail = getDemoMrDetail(projectId, iid);
    if (detail) return detail;
    throw createError({ statusCode: 404, statusMessage: "MR not found" });
  }

  // GET /api/gitlab/issues/:projectId/:iid
  const issueDetailMatch = pathname.match(/^\/api\/gitlab\/issues\/(\d+)\/(\d+)$/);
  if (issueDetailMatch) {
    const projectId = Number(issueDetailMatch[1]);
    const iid = Number(issueDetailMatch[2]);
    const detail = getDemoIssueDetail(projectId, iid);
    if (detail) return detail;
    throw createError({ statusCode: 404, statusMessage: "Issue not found" });
  }

  // GET /api/gitlab/issues
  if (pathname === "/api/gitlab/issues") {
    return demoIssues;
  }

  // GET /api/gitlab/todos or POST /api/gitlab/todos/:id
  if (pathname === "/api/gitlab/todos") {
    return demoTodos;
  }
  if (/^\/api\/gitlab\/todos\/\d+$/.test(pathname)) {
    return { success: true };
  }

  // GET /api/gitlab/mention-mrs
  if (pathname === "/api/gitlab/mention-mrs") {
    return demoMentionMrs;
  }

  // Catch-all: block unhandled /api/gitlab/ routes in demo mode
  throw createError({
    statusCode: 501,
    statusMessage: "Not available in demo mode",
  });
});
