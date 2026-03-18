<script setup lang="ts">
import type { DevBoardIssue, DevBoardMR } from "~/types";

const { mrs, loading, error, projects, fetchMrs, startAutoRefresh, stopAutoRefresh } =
  useGitlab();
const {
  todos,
  mentionMrs,
  pendingCount: todoPendingCount,
  panelOpen: todoPanelOpen,
  fetchTodos,
  fetchMentionMrs,
  startAutoRefresh: startTodosRefresh,
  stopAutoRefresh: stopTodosRefresh,
} = useTodos();
const {
  issues,
  fetchIssues,
  startAutoRefresh: startIssuesRefresh,
  stopAutoRefresh: stopIssuesRefresh,
} = useIssues();
const {
  enabled: worktreesEnabled,
  panelOpen: worktreePanelOpen,
  fetchWorktrees,
  startAutoRefresh: startWorktreesRefresh,
  stopAutoRefresh: stopWorktreesRefresh,
} = useWorktrees();

const { selectedMr: searchSelectedMr } = useSearch();
const { helpOpen } = useHelp();
const { activeTool } = useAnnotations();
const { welcomeOpen, showWelcomeIfFirstRun } = useOnboarding();
const selectedMr = ref<DevBoardMR | null>(null);
const drawerOpen = ref(false);
const selectedIssue = ref<DevBoardIssue | null>(null);
const issueDrawerOpen = ref(false);

function onSelectMr(mr: DevBoardMR) {
  issueDrawerOpen.value = false;
  selectedMr.value = mr;
  drawerOpen.value = true;
}

function onSelectIssue(issue: DevBoardIssue) {
  drawerOpen.value = false;
  selectedIssue.value = issue;
  issueDrawerOpen.value = true;
}

watch(searchSelectedMr, (mr) => {
  if (mr) {
    onSelectMr(mr);
    searchSelectedMr.value = null;
  }
});

// Deduplicate MRs: regular MRs take precedence
const mentionMrIds = computed(() => {
  const regularIds = new Set(mrs.value.map((mr) => mr.id));
  return new Set(
    mentionMrs.value.filter((mr) => !regularIds.has(mr.id)).map((mr) => mr.id),
  );
});

const allMrs = computed(() => {
  const regularIds = new Set(mrs.value.map((mr) => mr.id));
  const uniqueMentions = mentionMrs.value.filter((mr) => !regularIds.has(mr.id));
  return [...mrs.value, ...uniqueMentions];
});

// All fetched issues (assigned to me) — shown as standalone nodes on the graph
// even if also linked from MR descriptions, so edges can connect to them
const standaloneIssues = computed(() => issues.value);

// Collect project paths from all node types for the project filter
const allProjects = computed(() => {
  const paths = new Set<string>();
  for (const mr of allMrs.value) paths.add(mr.projectPath);
  for (const issue of standaloneIssues.value) paths.add(issue.projectPath);
  for (const todo of todos.value) paths.add(todo.projectPath);
  return [...paths].sort();
});

onMounted(() => {
  fetchMrs();
  fetchTodos();
  fetchMentionMrs();
  fetchIssues();
  fetchWorktrees();
  startAutoRefresh();
  startTodosRefresh();
  startIssuesRefresh();
  startWorktreesRefresh();
  showWelcomeIfFirstRun();
});

watch(worktreesEnabled, (val) => {
  if (val) {
    fetchWorktrees();
    startWorktreesRefresh();
  } else {
    stopWorktreesRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
  stopTodosRefresh();
  stopIssuesRefresh();
  stopWorktreesRefresh();
});

// Guard: skip shortcuts when user is typing or a panel/drawer is open
function canUseShortcut() {
  const tag = document.activeElement?.tagName;
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    document.activeElement?.isContentEditable
  )
    return false;
  if (drawerOpen.value || issueDrawerOpen.value) return false;
  if (todoPanelOpen.value || worktreePanelOpen.value) return false;
  return true;
}

// Keyboard shortcuts
defineShortcuts({
  r: () => {
    if (canUseShortcut()) {
      fetchMrs();
      fetchTodos();
      fetchMentionMrs();
      fetchIssues();
      fetchWorktrees();
    }
  },
  t: () => {
    if (canUseShortcut()) todoPanelOpen.value = !todoPanelOpen.value;
  },
  w: () => {
    if (canUseShortcut() && worktreesEnabled.value)
      worktreePanelOpen.value = !worktreePanelOpen.value;
  },
  "?": () => {
    if (canUseShortcut() && !welcomeOpen.value) helpOpen.value = !helpOpen.value;
  },
  v: () => {
    if (canUseShortcut()) activeTool.value = "select";
  },
  n: () => {
    if (canUseShortcut()) activeTool.value = "sticky";
  },
  p: () => {
    if (canUseShortcut()) activeTool.value = "freehand";
  },
  a: () => {
    if (canUseShortcut()) activeTool.value = "arrow";
  },
  e: () => {
    if (canUseShortcut()) activeTool.value = "eraser";
  },
  escape: () => {
    // First, deactivate annotation tool
    if (activeTool.value !== "select") {
      activeTool.value = "select";
    } else if (helpOpen.value) {
      helpOpen.value = false;
    } else if (worktreePanelOpen.value) {
      worktreePanelOpen.value = false;
    } else if (todoPanelOpen.value) {
      todoPanelOpen.value = false;
    } else if (drawerOpen.value) {
      drawerOpen.value = false;
    } else {
      issueDrawerOpen.value = false;
    }
  },
});

// Favicon badge — show total unresolved threads
const totalThreads = computed(() =>
  mrs.value.reduce((sum, mr) => sum + mr.unresolvedThreads, 0),
);

const pageTitle = computed(() => {
  const parts: string[] = [];
  if (todoPendingCount.value > 0) parts.push(`${todoPendingCount.value} todos`);
  if (totalThreads.value > 0) parts.push(`${totalThreads.value} threads`);
  return parts.length > 0 ? `(${parts.join(", ")}) DevBoard` : "DevBoard";
});

watch(pageTitle, (title) => useHead({ title }), { immediate: true });
</script>

<template>
  <div class="fixed inset-0">
    <MrDependencyGraph
      :mrs="allMrs"
      :projects="allProjects"
      :loading="loading"
      :mention-mr-ids="mentionMrIds"
      :issues="standaloneIssues"
      :todos="todos"
      :focused-node-id="drawerOpen && selectedMr ? String(selectedMr.id) : issueDrawerOpen && selectedIssue ? String(selectedIssue.id) : null"
      @select="onSelectMr"
      @select-issue="onSelectIssue"
    />
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="error"
        class="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-sm"
      >
        <UAlert
          color="error"
          variant="subtle"
          icon="i-lucide-alert-circle"
          title="Connection error"
          :description="error"
          close
          @update:open="error = null"
        />
      </div>
    </Transition>
  </div>

  <TodoPanel @select-mr="onSelectMr" />
  <WorktreePanel v-if="worktreesEnabled" @select-mr="onSelectMr" />
  <MrDetailDrawer v-model:open="drawerOpen" :mr="selectedMr" />
  <IssueDetailDrawer v-model:open="issueDrawerOpen" :issue="selectedIssue" />
  <HelpModal />
  <WelcomeOverlay />
</template>
