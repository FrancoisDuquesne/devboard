<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import { ISSUE_NODE_WIDTH } from "~/composables/useMrGraph";
import type { DevBoardIssue } from "~/types";
import { getProjectInitials } from "~/utils/projectAlias";

defineProps<{
  data: DevBoardIssue;
}>();
</script>

<template>
  <div :style="{ width: `${ISSUE_NODE_WIDTH}px` }">
    <Handle type="target" :position="Position.Top" class="invisible!" />
    <IssueItem :issue="data" :project-initials="getProjectInitials(data.projectPath)" />
    <Handle type="source" :position="Position.Bottom" class="invisible!" />
  </div>
</template>
