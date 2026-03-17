import {
  demoIssues,
  demoMentionMrs,
  demoMrs,
  demoStatus,
  demoTodos,
  getDemoMrDetail,
} from "../fixtures";

export default defineEventHandler((event) => {
  if (!process.env.DEMO_MODE) return;

  const path = event.path;

  if (!path.startsWith("/api/gitlab/")) return;

  // GET /api/gitlab/status
  if (path === "/api/gitlab/status") {
    return demoStatus;
  }

  // GET /api/gitlab/mrs (exact match, not sub-routes)
  if (path === "/api/gitlab/mrs") {
    return demoMrs;
  }

  // GET /api/gitlab/mrs/:projectId/:iid
  const mrDetailMatch = path.match(/^\/api\/gitlab\/mrs\/(\d+)\/(\d+)$/);
  if (mrDetailMatch) {
    const projectId = Number(mrDetailMatch[1]);
    const iid = Number(mrDetailMatch[2]);
    const detail = getDemoMrDetail(projectId, iid);
    if (detail) return detail;
    throw createError({ statusCode: 404, statusMessage: "MR not found" });
  }

  // GET /api/gitlab/issues
  if (path === "/api/gitlab/issues") {
    return demoIssues;
  }

  // GET /api/gitlab/todos or POST /api/gitlab/todos/:id
  if (path === "/api/gitlab/todos") {
    return demoTodos;
  }
  const todoMarkMatch = path.match(/^\/api\/gitlab\/todos\/\d+$/);
  if (todoMarkMatch) {
    return { success: true };
  }

  // GET /api/gitlab/mention-mrs
  if (path === "/api/gitlab/mention-mrs") {
    return demoMentionMrs;
  }
});
