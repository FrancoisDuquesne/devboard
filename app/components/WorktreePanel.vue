<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import type { DevBoardMR } from "~/types";

const emit = defineEmits<{
  "select-mr": [mr: DevBoardMR];
}>();

const { worktrees, worktreesByRepo, panelOpen } = useWorktrees();
const { mrs } = useGitlab();
const { copy } = useClipboard();
const copiedPath = ref<string | null>(null);

function copyPath(path: string) {
  copy(path);
  copiedPath.value = path;
  setTimeout(() => {
    copiedPath.value = null;
  }, COPY_FEEDBACK_MS);
}

function findMrForBranch(branch: string | null): DevBoardMR | undefined {
  if (!branch) return undefined;
  return mrs.value.find((mr) => mr.sourceBranch === branch);
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
          :label="String(worktrees.length)"
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
          <div
            v-for="[repoName, repoWorktrees] in worktreesByRepo"
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
              class="flex flex-col gap-0.5 rounded-md px-2 py-1.5 hover:bg-elevated"
            >
              <div class="flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-git-branch"
                  class="size-3.5 shrink-0 text-dimmed"
                />
                <template v-if="wt.branch">
                  <button
                    v-if="findMrForBranch(wt.branch)"
                    class="min-w-0 truncate text-sm font-medium text-primary hover:underline text-left"
                    @click="onNavigateMr(findMrForBranch(wt.branch)!)"
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
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </USlideover>
</template>
