<script setup lang="ts">
import type { DevBoardIssue } from "~/types";

const props = defineProps<{
  issue: DevBoardIssue;
  clickable?: boolean;
  projectInitials?: string;
}>();

defineEmits<{
  click: [];
}>();

function openIssue() {
  safeOpen(props.issue.webUrl);
}
</script>

<template>
  <UTooltip :text="issue.title"><span class="inline-flex w-full">
    <UButton
      variant="outline"
      color="neutral"
      size="sm"
      :aria-label="`${clickable !== false && issue.webUrl ? 'Open issue ' : 'Issue '}${issue.reference || `#${issue.iid}`}`"
      class="w-full justify-start truncate"
      @click.stop="clickable !== false ? openIssue() : $emit('click')"
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
