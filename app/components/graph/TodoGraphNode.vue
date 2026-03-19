<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import { TODO_NODE_WIDTH } from "~/composables/useMrGraph";
import type { DevBoardIssue, DevBoardTodo } from "~/types";
import { getProjectInitials } from "~/utils/projectAlias";
import { todoActionConfig } from "~/utils/todoAction";

const props = defineProps<{
  data: DevBoardTodo;
}>();

const now = useNow();
const { markAsDone } = useTodos();

const { status } = useGitlabAuth();

const todoUrl = computed(() => {
  if (!status.value?.host) return null;
  return `https://${status.value.host}/dashboard/todos`;
});

const isIssue = computed(() => props.data.targetType === "Issue");
const isMr = computed(() => props.data.targetType === "MergeRequest");

const targetIssue = computed<DevBoardIssue | null>(() => {
  if (!isIssue.value) return null;
  return {
    id: props.data.target.id,
    iid: props.data.target.iid,
    title: props.data.target.title,
    state: props.data.targetState === "closed" ? "closed" : "opened",
    webUrl: props.data.targetUrl,
    reference: `#${props.data.target.iid}`,
    projectId: 0,
    projectPath: props.data.projectPath,
  };
});

function openTodoPage(event: MouseEvent) {
  event.stopPropagation();
  if (todoUrl.value) safeOpen(todoUrl.value);
}
</script>

<template>
  <div
    class="cursor-pointer rounded-lg border border-muted bg-default shadow-sm"
    :style="{ width: `${TODO_NODE_WIDTH}px` }"
    @click.stop="openTodoPage"
  >
    <Handle type="target" :position="Position.Top" class="invisible!" />
    <div class="flex flex-col gap-1 p-3">
      <div class="flex items-center gap-1.5">
        <UIcon name="i-lucide-list-todo" class="size-3.5 shrink-0 text-primary" />
        <span class="truncate text-xs text-dimmed">
          {{ todoActionConfig[data.action]?.label ?? data.action }}
        </span>
        <UBadge
          v-if="data.targetState === 'merged'"
          color="success"
          variant="subtle"
          size="xs"
          label="Merged"
          class="ml-auto shrink-0"
        />
        <UBadge
          v-else-if="data.targetState === 'closed'"
          color="info"
          variant="subtle"
          size="xs"
          label="Closed"
          class="ml-auto shrink-0"
        />
        <UButton
          icon="i-lucide-check"
          variant="ghost"
          color="neutral"
          size="xs"
          aria-label="Mark as done"
          :class="data.targetState === 'open' ? 'ml-auto shrink-0' : 'shrink-0'"
          @click.stop="markAsDone(data.id)"
        />
      </div>
      <IssueItem
        v-if="targetIssue"
        :issue="targetIssue"
        :project-initials="getProjectInitials(data.projectPath)"
      />
      <a
        v-else-if="isMr"
        :href="isSafeUrl(data.targetUrl) ? data.targetUrl : undefined"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1 truncate text-sm font-medium leading-snug hover:underline"
        @click.stop
      >
        <UIcon
          name="i-lucide-git-pull-request"
          class="size-3.5 shrink-0 text-primary"
        />
        <span class="text-dimmed">!{{ data.target.iid }}</span>
        <span class="truncate">{{ data.target.title }}</span>
      </a>
      <p v-else class="truncate text-sm font-medium leading-snug">
        {{ data.target.title }}
      </p>
      <div class="flex items-center justify-between text-xs text-dimmed">
        <div class="flex items-center gap-1 truncate">
          <UAvatar :src="data.author.avatarUrl" :alt="data.author.name" size="3xs" />
          <span class="truncate">{{ data.author.name }}</span>
        </div>
        <span class="shrink-0">{{ timeAgo(data.createdAt, now) }}</span>
      </div>
    </div>
    <Handle type="source" :position="Position.Bottom" class="invisible!" />
  </div>
</template>
