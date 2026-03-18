<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import { ISSUE_NODE_WIDTH } from "~/composables/useMrGraph";
import type { DevBoardIssue } from "~/types";
import { getProjectInitials } from "~/utils/projectAlias";

const props = defineProps<{
  data: DevBoardIssue;
}>();

function handleClick(event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) {
    event.stopPropagation();
    safeOpen(props.data.webUrl);
  }
}
</script>

<template>
  <div :style="{ width: `${ISSUE_NODE_WIDTH}px` }" @click="handleClick">
    <Handle type="target" :position="Position.Top" class="invisible!" />
    <IssueItem
      :issue="data"
      :clickable="false"
      :project-initials="getProjectInitials(data.projectPath)"
    />
    <Handle type="source" :position="Position.Bottom" class="invisible!" />
  </div>
</template>
