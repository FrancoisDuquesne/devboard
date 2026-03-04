<script setup lang="ts">
defineProps<{
  data: { label: string; count: number };
}>();
</script>

<template>
  <div
    class="h-full w-full rounded-xl border-2 border-dashed border-accented bg-elevated/40"
  >
    <div class="flex items-center gap-2 px-3 pt-2">
      <UIcon name="i-lucide-folder" class="size-4 shrink-0 text-dimmed" />
      <span class="text-sm font-medium text-dimmed">{{ data.label }}</span>
      <UBadge :label="String(data.count)" color="neutral" variant="subtle" size="sm" />
    </div>
  </div>
</template>
