import type { DevBoardIssue, DevBoardIssueDetail } from "~/types";
import { usePreferences } from "./usePreferences";

const issues = ref<DevBoardIssue[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let intervalWatcherActive = false;
let fetchController: AbortController | null = null;

let issuesEnabledWatcherActive = false;

export function useIssues() {
  const { autoRefreshInterval, fetchIssuesEnabled } = usePreferences();

  if (!intervalWatcherActive) {
    intervalWatcherActive = true;
    watch(autoRefreshInterval, (newVal) => {
      if (refreshTimer !== null) {
        clearInterval(refreshTimer);
        refreshTimer = null;
        if (newVal > 0) {
          refreshTimer = setInterval(() => fetchIssues(), newVal * 1000);
        }
      }
    });
  }

  // Re-fetch or clear when toggle changes
  if (!issuesEnabledWatcherActive) {
    issuesEnabledWatcherActive = true;
    watch(fetchIssuesEnabled, (enabled) => {
      if (enabled) {
        fetchIssues();
      } else {
        issues.value = [];
      }
    });
  }

  async function fetchIssues() {
    if (!fetchIssuesEnabled.value) {
      issues.value = [];
      return;
    }
    if (fetchController) fetchController.abort();
    fetchController = new AbortController();
    const signal = fetchController.signal;

    loading.value = true;
    error.value = null;
    try {
      issues.value = await $fetch<DevBoardIssue[]>("/api/gitlab/issues", { signal });
    } catch (e) {
      if (signal.aborted) return;
      error.value = e instanceof Error ? e.message : "Failed to fetch issues";
    } finally {
      if (!signal.aborted) loading.value = false;
    }
  }

  async function fetchIssueDetail(
    projectId: number,
    iid: number,
  ): Promise<DevBoardIssueDetail | null> {
    try {
      return await $fetch<DevBoardIssueDetail>(
        `/api/gitlab/issues/${projectId}/${iid}`,
      );
    } catch {
      return null;
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    if (autoRefreshInterval.value > 0) {
      refreshTimer = setInterval(() => fetchIssues(), autoRefreshInterval.value * 1000);
    }
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  return {
    issues,
    loading,
    error,
    fetchIssues,
    fetchIssueDetail,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
