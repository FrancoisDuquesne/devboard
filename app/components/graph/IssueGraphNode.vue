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
  () =>
    props.data.iteration?.state === "active" ||
    (!!props.data.milestone && props.data.milestone.state === "active"),
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
    class="relative rounded-md"
    :style="{ width: `${ISSUE_NODE_WIDTH}px` }"
    :class="{
      'ring-2 ring-primary shadow-lg shadow-primary/40': isCurrentIteration,
    }"
  >
    <span v-if="recentlyUpdated" class="absolute -right-2 -top-2 z-10 flex size-4">
      <span
        class="absolute inline-flex size-full animate-ping rounded-full bg-info opacity-75"
      />
      <span class="relative inline-flex size-4 rounded-full bg-info" />
    </span>
    <Handle type="target" :position="Position.Top" class="invisible!" />
    <IssueItem :issue="data" :project-initials="getProjectInitials(data.projectPath)" />
    <Handle type="source" :position="Position.Bottom" class="invisible!" />
  </div>
</template>
