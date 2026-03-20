import { githubMeta, gitlabMeta } from "~/providers";

let gitlabCached: ReturnType<typeof createGitLabProvider> | null = null;
let githubCached: ReturnType<typeof createGitHubProvider> | null = null;

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
    status,
    authLoading,
    checkConnection,
    mrs,
    mrsLoading,
    mrsError,
    projects,
    fetchMrs,
    fetchMrDetail,
    startMrsAutoRefresh,
    stopMrsAutoRefresh,
    issues,
    issuesLoading,
    fetchIssues,
    fetchIssueDetail,
    startIssuesAutoRefresh,
    stopIssuesAutoRefresh,
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
    meta,
  };
}

function createGitHubProvider() {
  const { status, loading: authLoading, checkConnection } = useGithubAuth();
  const {
    mrs,
    loading: mrsLoading,
    error: mrsError,
    projects,
    fetchMrs,
    fetchMrDetail,
    startAutoRefresh: startMrsAutoRefresh,
    stopAutoRefresh: stopMrsAutoRefresh,
  } = useGithub({ mrPrefix: githubMeta.mrPrefix });
  const {
    issues,
    loading: issuesLoading,
    fetchIssues,
    fetchIssueDetail,
    startAutoRefresh: startIssuesAutoRefresh,
    stopAutoRefresh: stopIssuesAutoRefresh,
  } = useGithubIssues();
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
  } = useGithubTodos();

  const meta = githubMeta;

  return {
    status,
    authLoading,
    checkConnection,
    mrs,
    mrsLoading,
    mrsError,
    projects,
    fetchMrs,
    fetchMrDetail,
    startMrsAutoRefresh,
    stopMrsAutoRefresh,
    issues,
    issuesLoading,
    fetchIssues,
    fetchIssueDetail,
    startIssuesAutoRefresh,
    stopIssuesAutoRefresh,
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
    meta,
  };
}

/**
 * Returns the active provider instance.
 * Reads `provider` imperatively (not reactively) — switching providers
 * requires a full page reload via `switchProvider()` in SettingsPopover.
 */
export function useProvider() {
  const { provider } = usePreferences();

  if (provider.value === "github") {
    if (!githubCached) {
      githubCached = createGitHubProvider();
    }
    return githubCached;
  }

  if (!gitlabCached) {
    gitlabCached = createGitLabProvider();
  }
  return gitlabCached;
}
