import type { Worktree, WorktreeResponse } from "~/types";
import { usePreferences } from "./usePreferences";

const worktrees = ref<Worktree[]>([]);
const enabled = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
const panelOpen = ref(false);
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let intervalWatcherActive = false;
let controller: AbortController | null = null;

export function useWorktrees() {
  const { autoRefreshInterval } = usePreferences();

  if (!intervalWatcherActive) {
    intervalWatcherActive = true;
    watch(autoRefreshInterval, (newVal) => {
      if (refreshTimer !== null) {
        clearInterval(refreshTimer);
        refreshTimer = null;
        if (newVal > 0 && enabled.value) {
          refreshTimer = setInterval(() => fetchWorktrees(), newVal * 1000);
        }
      }
    });
  }

  async function fetchWorktrees() {
    if (controller) controller.abort();
    controller = new AbortController();
    const signal = controller.signal;

    loading.value = true;
    error.value = null;
    try {
      const response = await $fetch<WorktreeResponse>("/api/worktrees", {
        signal,
      });
      enabled.value = response.enabled;
      worktrees.value = response.worktrees;
    } catch (e) {
      if (signal.aborted) return;
      error.value = e instanceof Error ? e.message : "Failed to fetch worktrees";
    } finally {
      if (!signal.aborted) loading.value = false;
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    if (autoRefreshInterval.value > 0 && enabled.value) {
      refreshTimer = setInterval(
        () => fetchWorktrees(),
        autoRefreshInterval.value * 1000,
      );
    }
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  const worktreeByBranch = computed(() => {
    const map = new Map<string, Worktree>();
    for (const wt of worktrees.value) {
      if (wt.branch) {
        map.set(wt.branch, wt);
      }
    }
    return map;
  });

  const worktreesByRepo = computed(() => {
    const map = new Map<string, Worktree[]>();
    for (const wt of worktrees.value) {
      const list = map.get(wt.repoName) ?? [];
      list.push(wt);
      map.set(wt.repoName, list);
    }
    return map;
  });

  return {
    worktrees,
    enabled,
    loading,
    error,
    panelOpen,
    worktreeByBranch,
    worktreesByRepo,
    fetchWorktrees,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
