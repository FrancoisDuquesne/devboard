<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import type { DevBoardMR } from "~/types";

const emit = defineEmits<{
  "select-mr": [mr: DevBoardMR];
}>();

const { worktrees, worktreesByRepo, panelOpen } = useWorktrees();
const { mrs } = useGitlab();
const { hiddenWorktreePaths, hideWorktree, unhideWorktree } = usePreferences();
const { copy } = useClipboard();
const copiedPath = ref<string | null>(null);
const showHidden = ref(false);
const searchQuery = ref("");

function copyPath(path: string) {
  copy(path);
  copiedPath.value = path;
  setTimeout(() => {
    copiedPath.value = null;
  }, COPY_FEEDBACK_MS);
}

const branchMrMap = computed(() => {
  const map = new Map<string, DevBoardMR>();
  for (const mr of mrs.value) {
    map.set(mr.sourceBranch, mr);
  }
  return map;
});

const visibleWorktreesByRepo = computed(() => {
  const query = searchQuery.value.toLowerCase();
  const map = new Map<string, Worktree[]>();
  for (const [repo, wts] of worktreesByRepo.value) {
    const visible = wts.filter((wt) => {
      if (hiddenWorktreePaths.value.includes(wt.path)) return false;
      if (query) {
        const matchesBranch = wt.branch?.toLowerCase().includes(query);
        const matchesPath = wt.path.toLowerCase().includes(query);
        return matchesBranch || matchesPath;
      }
      return true;
    });
    if (visible.length > 0) map.set(repo, visible);
  }
  return map;
});

const hiddenWorktreesList = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return worktrees.value.filter((wt) => {
    if (!hiddenWorktreePaths.value.includes(wt.path)) return false;
    if (query) {
      const matchesBranch = wt.branch?.toLowerCase().includes(query);
      const matchesPath = wt.path.toLowerCase().includes(query);
      return matchesBranch || matchesPath;
    }
    return true;
  });
});

const visibleWorktreeCount = computed(() => {
  let count = 0;
  for (const wts of visibleWorktreesByRepo.value.values()) {
    count += wts.length;
  }
  return count;
});

function getMrForBranch(branch: string | null): DevBoardMR | undefined {
  if (!branch) return undefined;
  return branchMrMap.value.get(branch);
}

function onNavigateMr(mr: DevBoardMR) {
  emit("select-mr", mr);
  panelOpen.value = false;
}
</script>

<template>
  <USlideover v-model:open="panelOpen" side="right" :overlay="false">
    <template #title>
      <div class="flex items-center gap-2">
        <span>Worktrees</span>
        <UBadge
          v-if="worktrees.length > 0"
          color="primary"
          variant="subtle"
          size="sm"
          :label="String(visibleWorktreeCount)"
        />
      </div>
    </template>

    <template #body>
      <div class="flex flex-col gap-3 p-2">
        <div
          v-if="worktrees.length === 0"
          class="flex flex-col items-center justify-center py-12 text-dimmed"
        >
          <UIcon name="i-lucide-folder-git-2" class="size-10 mb-2 opacity-50" />
          <p class="text-sm">No worktrees found</p>
          <p class="mt-1 text-xs text-center">
            Set <code class="font-mono">WORKTREE_SCAN_DIRS</code> to scan for git
            worktrees.
          </p>
        </div>

        <template v-else>
          <UInput
            v-model="searchQuery"
            placeholder="Filter worktrees..."
            icon="i-lucide-search"
            size="sm"
            class="mb-2"
          />
          <div
            v-for="[repoName, repoWorktrees] in visibleWorktreesByRepo"
            :key="repoName"
            class="flex flex-col gap-1"
          >
            <div class="flex items-center gap-1.5 px-1">
              <UIcon name="i-lucide-folder" class="size-3.5 text-dimmed" />
              <span class="text-xs font-medium text-dimmed uppercase">
                {{ repoName }}
              </span>
            </div>

            <div
              v-for="wt in repoWorktrees"
              :key="wt.path"
              class="group flex flex-col gap-0.5 rounded-md px-2 py-1.5 hover:bg-elevated"
            >
              <div class="flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-git-branch"
                  class="size-3.5 shrink-0 text-dimmed"
                />
                <template v-if="wt.branch">
                  <button
                    v-if="getMrForBranch(wt.branch)"
                    class="min-w-0 truncate text-sm font-medium text-primary hover:underline text-left"
                    @click="onNavigateMr(getMrForBranch(wt.branch)!)"
                  >
                    {{ wt.branch }}
                  </button>
                  <span v-else class="min-w-0 truncate text-sm font-medium">
                    {{ wt.branch }}
                  </span>
                </template>
                <span v-else class="text-sm italic text-dimmed">detached</span>
                <UBadge
                  v-if="wt.isMain"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  label="Main"
                />
                <div
                  v-if="wt.branch && getMrForBranch(wt.branch)"
                  class="ml-auto flex items-center gap-0.5"
                >
                  <UButton
                    :to="getMrForBranch(wt.branch)!.webUrl"
                    target="_blank"
                    icon="i-lucide-git-pull-request"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Open merge request"
                  />
                  <UButton
                    v-if="getMrForBranch(wt.branch)!.linkedIssues.length > 0"
                    :to="getMrForBranch(wt.branch)!.linkedIssues[0].webUrl"
                    target="_blank"
                    icon="i-lucide-circle-dot"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Open linked issue"
                  />
                </div>
              </div>
              <div class="flex items-center gap-1">
                <p
                  class="min-w-0 truncate font-mono text-xs text-dimmed"
                  :title="wt.path"
                >
                  {{ wt.path }}
                </p>
                <UButton
                  :icon="copiedPath === wt.path ? 'i-lucide-check' : 'i-lucide-copy'"
                  :color="copiedPath === wt.path ? 'success' : 'neutral'"
                  variant="ghost"
                  size="xs"
                  class="shrink-0"
                  aria-label="Copy worktree path"
                  @click="copyPath(wt.path)"
                />
                <UButton
                  icon="i-lucide-eye-off"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Hide worktree"
                  @click="hideWorktree(wt.path)"
                />
              </div>
            </div>
          </div>

          <!-- Hidden worktrees section -->
          <div v-if="hiddenWorktreesList.length > 0" class="mt-2">
            <button
              class="flex items-center gap-1.5 px-1 text-xs text-dimmed hover:text-default transition-colors"
              @click="showHidden = !showHidden"
            >
              <UIcon name="i-lucide-eye" class="size-3.5" />
              <span>Show hidden ({{ hiddenWorktreesList.length }})</span>
              <UIcon
                :name="showHidden ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="size-3"
              />
            </button>

            <div v-if="showHidden" class="mt-1.5 flex flex-col gap-1">
              <div
                v-for="wt in hiddenWorktreesList"
                :key="wt.path"
                class="flex items-center gap-1.5 rounded-md px-2 py-1 text-dimmed"
              >
                <UIcon
                  name="i-lucide-git-branch"
                  class="size-3.5 shrink-0 opacity-50"
                />
                <span class="min-w-0 truncate text-sm">
                  {{ wt.branch ?? "detached" }}
                </span>
                <span class="min-w-0 truncate font-mono text-xs opacity-60">
                  {{ wt.path }}
                </span>
                <UButton
                  icon="i-lucide-eye"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  class="ml-auto shrink-0"
                  aria-label="Unhide worktree"
                  @click="unhideWorktree(wt.path)"
                />
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </USlideover>
</template>
