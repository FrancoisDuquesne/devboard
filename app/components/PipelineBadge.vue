<script setup lang="ts">
import type { PipelineStatus } from "~/types";

const props = defineProps<{
  status: PipelineStatus;
  webUrl: string | null;
}>();

const { meta } = useProvider();

const config = computed(() => {
  switch (props.status) {
    case "success":
      return {
        label: "Passed",
        color: "success" as const,
        icon: "i-lucide-check-circle",
      };
    case "failed":
      return { label: "Failed", color: "error" as const, icon: "i-lucide-x-circle" };
    case "running":
      return { label: "Running", color: "warning" as const, icon: "i-lucide-loader" };
    case "pending":
      return { label: "Pending", color: "warning" as const, icon: "i-lucide-clock" };
    case "canceled":
      return { label: "Canceled", color: "neutral" as const, icon: "i-lucide-ban" };
    case "manual":
      return { label: "Manual", color: "neutral" as const, icon: "i-lucide-hand" };
    default:
      return {
        label: "Unknown",
        color: "neutral" as const,
        icon: "i-lucide-help-circle",
      };
  }
});

function openPipeline() {
  safeOpen(props.webUrl);
}
</script>

<template>
  <UBadge
    v-if="status"
    :color="config.color"
    variant="subtle"
    size="sm"
    :icon="config.icon"
    :label="config.label"
    :title="webUrl ? `Open pipeline in ${meta.name}` : undefined"
    :class="{ 'cursor-pointer hover:opacity-80': webUrl }"
    @click.stop="openPipeline"
  />
</template>
