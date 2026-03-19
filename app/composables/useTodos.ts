import type { DevBoardMR, DevBoardTodo } from "~/types";
import { usePreferences } from "./usePreferences";

const todos = ref<DevBoardTodo[]>([]);
const mentionMrs = ref<DevBoardMR[]>([]);
const loading = ref(false);
const mentionMrsLoading = ref(false);
const error = ref<string | null>(null);
const panelOpen = ref(false);
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let intervalWatcherActive = false;
let todosController: AbortController | null = null;
let mentionController: AbortController | null = null;

let todosEnabledWatcherActive = false;

export function useTodos() {
  const { autoRefreshInterval, fetchTodosEnabled } = usePreferences();
  const toast = useToast();

  if (!intervalWatcherActive) {
    intervalWatcherActive = true;
    watch(autoRefreshInterval, (newVal) => {
      if (refreshTimer !== null) {
        clearInterval(refreshTimer);
        refreshTimer = null;
        if (newVal > 0) {
          refreshTimer = setInterval(() => {
            fetchTodos();
            fetchMentionMrs();
          }, newVal * 1000);
        }
      }
    });
  }

  // Re-fetch or clear when toggle changes
  if (!todosEnabledWatcherActive) {
    todosEnabledWatcherActive = true;
    watch(fetchTodosEnabled, (enabled) => {
      if (enabled) {
        fetchTodos();
        fetchMentionMrs();
      } else {
        todos.value = [];
        mentionMrs.value = [];
      }
    });
  }

  async function fetchTodos() {
    if (!fetchTodosEnabled.value) {
      todos.value = [];
      return;
    }
    if (todosController) todosController.abort();
    todosController = new AbortController();
    const signal = todosController.signal;

    loading.value = true;
    error.value = null;
    try {
      const previous = todos.value;
      const fresh = await $fetch<DevBoardTodo[]>("/api/gitlab/todos", { signal });

      if (previous.length > 0) {
        const prevIds = new Set(previous.map((t) => t.id));
        const newTodos = fresh.filter((t) => !prevIds.has(t.id));
        if (newTodos.length > 0) {
          toast.add({
            title: `${newTodos.length} new todo${newTodos.length > 1 ? "s" : ""}`,
            icon: "i-lucide-list-todo",
            color: "info",
          });
        }
      }

      todos.value = fresh;
    } catch (e) {
      if (signal.aborted) return;
      error.value = e instanceof Error ? e.message : "Failed to fetch todos";
    } finally {
      if (!signal.aborted) loading.value = false;
    }
  }

  async function markAsDone(id: number) {
    const index = todos.value.findIndex((t) => t.id === id);
    if (index === -1) return;

    const removed = todos.value[index];
    todos.value.splice(index, 1);

    try {
      await $fetch(`/api/gitlab/todos/${id}`, { method: "POST" });
    } catch (e) {
      todos.value.splice(index, 0, removed);
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.add({
        title: "Failed to mark todo as done",
        description: message,
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    }
  }

  async function markAllAsDone() {
    const backup = [...todos.value];
    todos.value = [];

    try {
      await Promise.all(
        backup.map((t) => $fetch(`/api/gitlab/todos/${t.id}`, { method: "POST" })),
      );
    } catch (e) {
      todos.value = backup;
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.add({
        title: "Failed to mark all todos as done",
        description: message,
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    }
  }

  async function fetchMentionMrs() {
    if (!fetchTodosEnabled.value) {
      mentionMrs.value = [];
      return;
    }
    if (mentionController) mentionController.abort();
    mentionController = new AbortController();
    const signal = mentionController.signal;

    mentionMrsLoading.value = true;
    try {
      mentionMrs.value = await $fetch<DevBoardMR[]>("/api/gitlab/mention-mrs", {
        signal,
      });
    } catch (e) {
      if (signal.aborted) return;
      console.warn("Failed to fetch mention MRs:", e);
    } finally {
      if (!signal.aborted) mentionMrsLoading.value = false;
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    if (autoRefreshInterval.value > 0) {
      refreshTimer = setInterval(() => {
        fetchTodos();
        fetchMentionMrs();
      }, autoRefreshInterval.value * 1000);
    }
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  const mentions = computed(() =>
    todos.value.filter(
      (t) => t.action === "mentioned" || t.action === "directly_addressed",
    ),
  );

  const pendingCount = computed(() => todos.value.length);

  return {
    todos,
    mentionMrs,
    loading,
    mentionMrsLoading,
    error,
    panelOpen,
    mentions,
    pendingCount,
    fetchTodos,
    fetchMentionMrs,
    markAsDone,
    markAllAsDone,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
