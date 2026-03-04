<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import { useClipboard } from "@vueuse/core";
import { actionConfig, getActionRequired } from "~/composables/useActionStatus";
import { NODE_WIDTH } from "~/composables/useMrGraph";
import type { DevBoardMR } from "~/types";

const props = defineProps<{
  data: DevBoardMR & { projectAlias?: string; isMention?: boolean };
}>();

const { status } = useGitlabAuth();
const now = useNow();
const { copy } = useClipboard();
const copiedBranch = ref(false);

function copyBranch() {
  copy(props.data.sourceBranch);
  copiedBranch.value = true;
  setTimeout(() => {
    copiedBranch.value = false;
  }, COPY_FEEDBACK_MS);
}

const action = computed(() =>
  getActionRequired(props.data, status.value?.username ?? ""),
);

const statusBorderColor = computed(() => {
  if (props.data.status === "merged") return "var(--color-success)";
  if (props.data.status === "draft") return "var(--color-neutral)";
  const a = action.value;
  if (a === "fix-pipeline" || a === "rebase") return "var(--color-error)";
  if (a === "review" || a === "assign-reviewer" || a === "resolve-threads")
    return "var(--color-warning)";
  if (props.data.isMention) return "var(--color-info)";
  return "var(--color-primary)";
});

const isDraft = computed(() => props.data.status === "draft");

function handleClick(event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) {
    event.stopPropagation();
    window.open(props.data.webUrl, "_blank", "noopener,noreferrer");
  }
}
</script>

<template>
  <div
    class="cursor-pointer rounded-lg border border-muted bg-default shadow-sm"
    :class="{ 'opacity-75': isDraft }"
    :style="{
      width: `${NODE_WIDTH}px`,
      borderLeftWidth: statusBorderColor ? '4px' : undefined,
      borderLeftColor: statusBorderColor || undefined,
    }"
    @click="handleClick"
  >
    <Handle type="target" :position="Position.Top" class="invisible!" />
    <div class="flex flex-col gap-1 p-3">
      <div class="flex items-center justify-between gap-1">
        <UTooltip :text="data.title">
          <a
            :href="data.webUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 truncate text-sm font-medium leading-snug hover:underline"
            @click.stop
          >
            <UIcon
              name="i-lucide-git-pull-request"
              class="size-3.5 shrink-0 text-primary"
            />
            <span class="text-dimmed">!{{ data.iid }}</span>
            <span class="truncate">{{ data.title }}</span>
          </a>
        </UTooltip>
        <div class="flex shrink-0 items-center gap-1">
          <UAvatar
            :src="data.author.avatarUrl"
            :alt="data.author.name"
            size="3xs"
            class="ring-2 ring-default"
          />
          <UAvatarGroup v-if="data.reviewers.length > 0" :max="2" size="3xs">
            <UAvatar
              v-for="r in data.reviewers"
              :key="r.username"
              :src="r.avatarUrl"
              :alt="r.name"
            />
          </UAvatarGroup>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <UIcon name="i-lucide-git-branch" class="size-3 shrink-0 text-dimmed" />
        <p
          class="min-w-0 truncate font-mono text-xs text-dimmed"
          :title="data.sourceBranch"
        >
          {{ data.sourceBranch }}
        </p>
        <UButton
          :icon="copiedBranch ? 'i-lucide-check' : 'i-lucide-copy'"
          :color="copiedBranch ? 'success' : 'neutral'"
          variant="ghost"
          size="xs"
          class="shrink-0"
          aria-label="Copy source branch"
          @click.stop="copyBranch"
        />
      </div>
      <div class="flex flex-wrap items-center gap-1">
        <StatusBadge :status="data.status" />
        <PipelineBadge :status="data.pipeline.status" :web-url="data.pipeline.webUrl" />
        <ThreadsBadge :count="data.unresolvedThreads" />
        <ApprovalBadge
          :approved="data.approvals.approved"
          :required="data.approvals.required"
        />
        <ActionBadge :action="action" />
        <UBadge
          v-if="data.isMention"
          color="info"
          variant="subtle"
          size="sm"
          icon="i-lucide-at-sign"
          label="Mentioned"
        />
        <UBadge
          v-if="data.hasConflicts"
          color="error"
          variant="subtle"
          size="sm"
          icon="i-lucide-alert-triangle"
          label="Conflicts"
        />
        <UBadge
          v-if="data.needsRebase && action !== 'rebase'"
          color="error"
          variant="subtle"
          size="sm"
          icon="i-lucide-git-branch"
          label="Rebase"
        />
      </div>
      <div v-if="data.labels.length > 0" class="flex flex-wrap items-center gap-1">
        <ScopedLabel
          v-for="label in data.labels.slice(0, 2)"
          :key="label"
          :label="label"
        />
        <UBadge
          v-if="data.labels.length > 2"
          color="neutral"
          variant="soft"
          size="sm"
          :label="`+${data.labels.length - 2}`"
        />
      </div>
      <div v-if="data.linkedIssues.length > 0" class="mt-0.5 flex flex-col gap-1">
        <IssueItem v-for="issue in data.linkedIssues" :key="issue.iid" :issue="issue" />
      </div>
      <div class="flex items-center justify-between text-xs text-dimmed">
        <span class="truncate">{{ data.author.username }}</span>
        <span class="shrink-0">{{ timeAgo(data.updatedAt, now) }}</span>
      </div>
      <p class="truncate text-xs text-dimmed" :title="data.projectPath">
        {{ data.projectAlias ?? data.projectPath }}
      </p>
    </div>
    <Handle type="source" :position="Position.Bottom" class="invisible!" />
  </div>
</template>
