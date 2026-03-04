import type { DevBoardMR, DevBoardMRDetail } from "~/types";
import { usePreferences } from "./usePreferences";

const mrs = ref<DevBoardMR[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let intervalWatcherActive = false;
let fetchController: AbortController | null = null;

export function useGitlab() {
  const { autoRefreshInterval } = usePreferences();
  const toast = useToast();

  // Restart auto-refresh when interval setting changes
  if (!intervalWatcherActive) {
    intervalWatcherActive = true;
    watch(autoRefreshInterval, (newVal) => {
      if (refreshTimer !== null) {
        clearInterval(refreshTimer);
        refreshTimer = null;
        if (newVal > 0) {
          refreshTimer = setInterval(() => fetchMrs(), newVal * 1000);
        }
      }
    });
  }

  const { status: authStatus, checkConnection } = useGitlabAuth();

  async function fetchMrs() {
    if (fetchController) fetchController.abort();
    fetchController = new AbortController();
    const signal = fetchController.signal;

    loading.value = true;
    error.value = null;
    try {
      const previous = mrs.value;
      const fresh = await $fetch<DevBoardMR[]>("/api/gitlab/mrs", { signal });

      // Detect changes for toast notifications
      if (previous.length > 0) {
        detectChanges(previous, fresh);
      }

      mrs.value = fresh;

      // Self-heal: if data loaded but status shows disconnected, re-check
      if (!authStatus.value?.connected) {
        checkConnection({ silent: true });
      }
    } catch (e) {
      if (signal.aborted) return;
      error.value = e instanceof Error ? e.message : "Failed to fetch merge requests";
    } finally {
      if (!signal.aborted) loading.value = false;
    }
  }

  function detectChanges(previous: DevBoardMR[], fresh: DevBoardMR[]) {
    const prevMap = new Map(previous.map((mr) => [mr.id, mr]));
    const freshMap = new Map(fresh.map((mr) => [mr.id, mr]));

    // New MRs
    for (const mr of fresh) {
      if (!prevMap.has(mr.id)) {
        toast.add({
          title: `New MR: !${mr.iid} ${mr.title}`,
          icon: "i-lucide-git-pull-request",
          color: "info",
        });
      }
    }

    // Removed (merged/closed)
    for (const mr of previous) {
      if (!freshMap.has(mr.id)) {
        toast.add({
          title: `MR removed: !${mr.iid} ${mr.title}`,
          icon: "i-lucide-git-merge",
          color: "success",
        });
      }
    }

    // Pipeline status changes
    for (const mr of fresh) {
      const prev = prevMap.get(mr.id);
      if (!prev) continue;
      if (prev.pipeline.status !== mr.pipeline.status) {
        if (mr.pipeline.status === "failed") {
          toast.add({
            title: `Pipeline failed: !${mr.iid}`,
            icon: "i-lucide-x-circle",
            color: "error",
          });
        } else if (
          mr.pipeline.status === "success" &&
          prev.pipeline.status === "failed"
        ) {
          toast.add({
            title: `Pipeline recovered: !${mr.iid}`,
            icon: "i-lucide-check-circle",
            color: "success",
          });
        }
      }
    }
  }

  async function fetchMrDetail(
    projectId: number,
    iid: number,
  ): Promise<DevBoardMRDetail | null> {
    try {
      return await $fetch<DevBoardMRDetail>(`/api/gitlab/mrs/${projectId}/${iid}`);
    } catch {
      return null;
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    if (autoRefreshInterval.value > 0) {
      refreshTimer = setInterval(() => fetchMrs(), autoRefreshInterval.value * 1000);
    }
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  const projects = computed(() => {
    const paths = new Set(mrs.value.map((mr) => mr.projectPath));
    return Array.from(paths).sort();
  });

  return {
    mrs,
    loading,
    error,
    projects,
    fetchMrs,
    fetchMrDetail,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
