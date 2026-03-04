<script setup lang="ts">
import type { MrStatus } from "~/types";

const props = defineProps<{
  status: MrStatus;
}>();

const config = computed(() => {
  switch (props.status) {
    case "draft":
      return {
        label: "Draft",
        color: "neutral" as const,
        icon: "i-lucide-pencil-line",
      };
    case "open":
      return {
        label: "Open",
        color: "info" as const,
        icon: "i-lucide-git-pull-request",
      };
    case "merged":
      return { label: "Merged", color: "success" as const, icon: "i-lucide-git-merge" };
    case "closed":
      return {
        label: "Closed",
        color: "error" as const,
        icon: "i-lucide-git-pull-request-closed",
      };
  }
});
</script>

<template>
  <UBadge
    :color="config.color"
    variant="subtle"
    size="sm"
    :icon="config.icon"
    :label="config.label"
  />
</template>
