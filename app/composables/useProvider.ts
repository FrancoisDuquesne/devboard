import { gitlabMeta } from "~/providers";

// TODO: clear cache when provider switching is implemented
let cached: ReturnType<typeof createGitLabProvider> | null = null;

function createGitLabProvider() {
  const { status, loading: authLoading, checkConnection } = useGitlabAuth();
  const {
    mrs,
    loading: mrsLoading,
    error: mrsError,
    projects,
    fetchMrs,
    fetchMrDetail,
    startAutoRefresh: startMrsAutoRefresh,
    stopAutoRefresh: stopMrsAutoRefresh,
  } = useGitlab({ mrPrefix: gitlabMeta.mrPrefix });
  const {
    issues,
    loading: issuesLoading,
    fetchIssues,
    fetchIssueDetail,
    startAutoRefresh: startIssuesAutoRefresh,
    stopAutoRefresh: stopIssuesAutoRefresh,
  } = useIssues();
  const {
    todos,
    mentionMrs,
    loading: todosLoading,
    mentionMrsLoading,
    error: todosError,
    panelOpen: todoPanelOpen,
    mentions,
    pendingCount,
    fetchTodos,
    fetchMentionMrs,
    markAsDone,
    markAllAsDone,
    startAutoRefresh: startTodosAutoRefresh,
    stopAutoRefresh: stopTodosAutoRefresh,
  } = useTodos();

  const meta = gitlabMeta;

  return {
    // Auth
    status,
    authLoading,
    checkConnection,

    // MRs
    mrs,
    mrsLoading,
    mrsError,
    projects,
    fetchMrs,
    fetchMrDetail,
    startMrsAutoRefresh,
    stopMrsAutoRefresh,

    // Issues
    issues,
    issuesLoading,
    fetchIssues,
    fetchIssueDetail,
    startIssuesAutoRefresh,
    stopIssuesAutoRefresh,

    // Todos
    todos,
    mentionMrs,
    todosLoading,
    mentionMrsLoading,
    todosError,
    todoPanelOpen,
    mentions,
    pendingCount,
    fetchTodos,
    fetchMentionMrs,
    markAsDone,
    markAllAsDone,
    startTodosAutoRefresh,
    stopTodosAutoRefresh,

    // Metadata
    meta,
  };
}

export function useProvider() {
  if (!cached) {
    cached = createGitLabProvider();
  }
  return cached;
}
