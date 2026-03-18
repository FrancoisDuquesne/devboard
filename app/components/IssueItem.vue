<script setup lang="ts">
import type { DevBoardIssue } from "~/types";

const props = defineProps<{
  issue: DevBoardIssue;
  projectInitials?: string;
}>();

const selectIssue = inject<((issue: DevBoardIssue) => void) | null>(
  "select-issue",
  null,
);

function handleClick(event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) {
    event.stopPropagation();
    safeOpen(props.issue.webUrl);
    return;
  }
  if (selectIssue) {
    event.stopPropagation();
    selectIssue(props.issue);
  } else {
    event.stopPropagation();
    safeOpen(props.issue.webUrl);
  }
}
</script>

<template>
  <UTooltip :text="issue.title"><span class="inline-flex w-full">
    <UButton
      variant="outline"
      color="neutral"
      size="sm"
      :aria-label="`Issue ${issue.reference || `#${issue.iid}`}`"
      class="w-full justify-start truncate"
      @click="handleClick"
    >
      <UIcon name="i-lucide-circle-dot" class="size-3 shrink-0 text-primary" />
      <span
        v-if="projectInitials"
        class="shrink-0 text-xs text-dimmed"
        :title="issue.projectPath"
      >
        {{ projectInitials }}
      </span>
      <span class="shrink-0 text-dimmed">#{{ issue.iid }}</span>
      <span class="min-w-0 truncate font-medium">{{ issue.title }}</span>
    </UButton>
  </span></UTooltip>
</template>
