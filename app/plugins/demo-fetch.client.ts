/**
 * Client-side fetch interceptor for demo mode.
 *
 * On a static host (GitHub Pages) there is no server to handle API requests.
 * This plugin intercepts outgoing fetch calls that target `/api/` routes and
 * returns fixture data directly, mirroring the logic in server/middleware/demo.ts.
 */
export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig();
  if (!config.public.demoMode) return;

  // Dynamic imports so fixture data is only bundled when demo mode is active
  const [
    { demoMrs },
    { demoMentionMrs },
    { demoIssues, getDemoIssueDetail },
    { getDemoMrDetail },
    { demoStatus },
    { demoTodos },
    { demoWorktrees },
  ] = await Promise.all([
    import("~~/shared/fixtures/mrs"),
    import("~~/shared/fixtures/mention-mrs"),
    import("~~/shared/fixtures/issues"),
    import("~~/shared/fixtures/mr-detail"),
    import("~~/shared/fixtures/status"),
    import("~~/shared/fixtures/todos"),
    import("~~/shared/fixtures/worktrees"),
  ]);

  function matchDemoRoute(pathname: string): unknown | undefined {
    if (pathname === "/api/worktrees") return demoWorktrees;

    if (!pathname.startsWith("/api/gitlab/") && !pathname.startsWith("/api/github/"))
      return undefined;

    const isGitHub = pathname.startsWith("/api/github/");
    const normalized = pathname.replace(/^\/api\/github\//, "/api/gitlab/");

    if (normalized === "/api/gitlab/status") {
      return isGitHub ? { ...demoStatus, host: "github.com" } : demoStatus;
    }
    if (normalized === "/api/gitlab/mrs") return demoMrs;
    if (normalized === "/api/gitlab/issues") return demoIssues;
    if (normalized === "/api/gitlab/todos") return demoTodos;
    if (normalized === "/api/gitlab/mention-mrs") return demoMentionMrs;

    const mrMatch = normalized.match(/^\/api\/gitlab\/mrs\/(\d+)\/(\d+)$/);
    if (mrMatch) {
      return getDemoMrDetail(Number(mrMatch[1]), Number(mrMatch[2]));
    }

    const issueMatch = normalized.match(/^\/api\/gitlab\/issues\/(\d+)\/(\d+)$/);
    if (issueMatch) {
      return getDemoIssueDetail(Number(issueMatch[1]), Number(issueMatch[2]));
    }

    if (/^\/api\/gitlab\/todos\/\d+$/.test(normalized)) {
      return { success: true };
    }

    return undefined;
  }

  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const raw =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    // Extract pathname, stripping origin and query string
    let pathname: string;
    try {
      pathname = new URL(raw, window.location.origin).pathname;
    } catch {
      pathname = raw.split("?")[0];
    }

    // Strip baseURL prefix (e.g. "/devboard/")
    const base = config.app.baseURL;
    if (base && base !== "/" && pathname.startsWith(base)) {
      pathname = `/${pathname.slice(base.length)}`;
    }

    const data = matchDemoRoute(pathname);
    if (data !== undefined) {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return originalFetch(input, init);
  };
});
