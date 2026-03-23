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
const { isUnseen } = useSeenNodes();

const isCurrentIteration = computed(
  () => !!props.data.milestone && props.data.milestone.state === "active",
);
const recentlyUpdated = computed(
  () =>
    isRecentlyUpdated(
      props.data.updatedAt,
      now.value,
      recentlyUpdatedThreshold.value,
    ) && isUnseen(`issue-${props.data.id}`, props.data.updatedAt),
);
</script>

<template>
  <div
    class="rounded-md"
    :style="{ width: `${ISSUE_NODE_WIDTH}px` }"
    :class="{
      'ring-2 ring-primary shadow-lg shadow-primary/40': isCurrentIteration && !recentlyUpdated,
      'ring-2 ring-info shadow-lg shadow-info/40': recentlyUpdated && !isCurrentIteration,
      'ring-2 ring-primary shadow-lg shadow-primary/40 outline-2 outline-info outline-offset-4': recentlyUpdated && isCurrentIteration,
    }"
  >
    <Handle type="target" :position="Position.Top" class="invisible!" />
    <IssueItem :issue="data" :project-initials="getProjectInitials(data.projectPath)" />
    <Handle type="source" :position="Position.Bottom" class="invisible!" />
  </div>
</template>
