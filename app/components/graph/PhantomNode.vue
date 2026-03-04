<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";

defineProps<{
  data: { label: string };
}>();
</script>

<template>
  <div class="w-72 rounded-lg border-2 border-dashed border-muted bg-muted p-3">
    <Handle type="target" :position="Position.Top" class="invisible!" />
    <div class="flex items-center gap-2 text-dimmed">
      <UIcon name="i-lucide-help-circle" class="size-4 shrink-0" />
      <p class="truncate text-sm">
        Unresolved: <span class="font-mono">{{ data.label }}</span>
      </p>
    </div>
    <Handle type="source" :position="Position.Bottom" class="invisible!" />
  </div>
</template>
