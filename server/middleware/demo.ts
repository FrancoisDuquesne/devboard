import {
  demoIssues,
  demoMentionMrs,
  demoMrs,
  demoStatus,
  demoTodos,
  demoWorktrees,
  getDemoIssueDetail,
  getDemoMrDetail,
} from "../fixtures";

export default defineEventHandler((event) => {
  if (!process.env.DEMO_MODE) return;

  if (process.env.NODE_ENV === "production" && !process.env.GITHUB_PAGES) {
    console.error("DEMO_MODE must not be enabled in production — ignoring");
    return;
  }

  const pathname = getRequestURL(event).pathname;

  // GET /api/worktrees
  if (pathname === "/api/worktrees") {
    return demoWorktrees;
  }

  if (!pathname.startsWith("/api/gitlab/") && !pathname.startsWith("/api/github/"))
    return;

  // Normalize: treat /api/github/* the same as /api/gitlab/* for demo data
  const normalized = pathname.replace(/^\/api\/github\//, "/api/gitlab/");

  // GET /api/gitlab/status or /api/github/status
  if (normalized === "/api/gitlab/status") {
    const isGitHub = pathname.startsWith("/api/github/");
    return isGitHub ? { ...demoStatus, host: "github.com" } : demoStatus;
  }

  // GET /api/gitlab/mrs or /api/github/mrs (exact match, not sub-routes)
  if (normalized === "/api/gitlab/mrs") {
    return demoMrs;
  }

  // GET /api/gitlab/mrs/:projectId/:iid or /api/github/mrs/:projectId/:iid
  const mrDetailMatch = normalized.match(/^\/api\/gitlab\/mrs\/(\d+)\/(\d+)$/);
  if (mrDetailMatch) {
    const projectId = Number(mrDetailMatch[1]);
    const iid = Number(mrDetailMatch[2]);
    const detail = getDemoMrDetail(projectId, iid);
    if (detail) return detail;
    throw createError({ statusCode: 404, statusMessage: "MR not found" });
  }

  // GET /api/gitlab/issues/:projectId/:iid or /api/github/issues/:projectId/:iid
  const issueDetailMatch = normalized.match(/^\/api\/gitlab\/issues\/(\d+)\/(\d+)$/);
  if (issueDetailMatch) {
    const projectId = Number(issueDetailMatch[1]);
    const iid = Number(issueDetailMatch[2]);
    const detail = getDemoIssueDetail(projectId, iid);
    if (detail) return detail;
    throw createError({ statusCode: 404, statusMessage: "Issue not found" });
  }

  // GET /api/gitlab/issues or /api/github/issues
  if (normalized === "/api/gitlab/issues") {
    return demoIssues;
  }

  // GET /api/gitlab/todos or POST /api/gitlab/todos/:id (or /api/github/ variants)
  if (normalized === "/api/gitlab/todos") {
    return demoTodos;
  }
  if (/^\/api\/gitlab\/todos\/\d+$/.test(normalized)) {
    return { success: true };
  }

  // GET /api/gitlab/mention-mrs or /api/github/mention-mrs
  if (normalized === "/api/gitlab/mention-mrs") {
    return demoMentionMrs;
  }

  // Catch-all: block unhandled provider routes in demo mode
  throw createError({
    statusCode: 501,
    statusMessage: "Not available in demo mode",
  });
});
