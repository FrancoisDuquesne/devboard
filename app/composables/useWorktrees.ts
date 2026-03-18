import { useLocalStorage } from "@vueuse/core";
import type { ScanDirsConfigResponse, Worktree, WorktreeResponse } from "~/types";
import { usePreferences } from "./usePreferences";

const worktrees = ref<Worktree[]>([]);
const configured = ref(false);
const scanDirs = ref<string[]>([]);
const configLocked = ref(false);
const enabled = useLocalStorage("devboard:worktrees-enabled", false);
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
    if (!enabled.value) return;

    if (controller) controller.abort();
    controller = new AbortController();
    const signal = controller.signal;

    loading.value = true;
    error.value = null;
    try {
      const response = await $fetch<WorktreeResponse>("/api/worktrees", {
        signal,
      });
      configured.value = response.configured;
      scanDirs.value = response.scanDirs;
      configLocked.value = response.locked;
      worktrees.value = response.worktrees;
    } catch (e) {
      if (signal.aborted) return;
      error.value = e instanceof Error ? e.message : "Failed to fetch worktrees";
    } finally {
      if (!signal.aborted) loading.value = false;
    }
  }

  async function fetchScanDirsConfig(): Promise<ScanDirsConfigResponse | null> {
    try {
      return await $fetch<ScanDirsConfigResponse>("/api/worktrees/scan-dirs");
    } catch {
      return null;
    }
  }

  async function saveScanDirs(dirs: string[]): Promise<boolean> {
    try {
      await $fetch("/api/worktrees/scan-dirs", {
        method: "PUT",
        body: { scanDirs: dirs },
      });
      await fetchWorktrees();
      return true;
    } catch {
      return false;
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
    configured,
    scanDirs,
    configLocked,
    enabled,
    loading,
    error,
    panelOpen,
    worktreeByBranch,
    worktreesByRepo,
    fetchWorktrees,
    fetchScanDirsConfig,
    saveScanDirs,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
