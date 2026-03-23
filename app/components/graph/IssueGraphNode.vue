<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import { ISSUE_NODE_WIDTH } from "~/composables/useMrGraph";
import type { DevBoardIssue } from "~/types";
import { getProjectInitials } from "~/utils/projectAlias";

const props = defineProps<{
  data: DevBoardIssue;
}>();

const now = useNow();
const { recentlyUpdatedThreshold } = usePreferences();

const isCurrentIteration = computed(
  () => !!props.data.milestone && props.data.milestone.state === "active",
);
const recentlyUpdated = computed(() =>
  isRecentlyUpdated(props.data.updatedAt, now.value, recentlyUpdatedThreshold.value),
);
</script>

<template>
  <div
    :style="{ width: `${ISSUE_NODE_WIDTH}px` }"
    :class="{
      'iteration-ring': isCurrentIteration,
      'recently-updated-ring': recentlyUpdated,
    }"
  >
    <Handle type="target" :position="Position.Top" class="invisible!" />
    <IssueItem :issue="data" :project-initials="getProjectInitials(data.projectPath)" />
    <Handle type="source" :position="Position.Bottom" class="invisible!" />
  </div>
</template>
