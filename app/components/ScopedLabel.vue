<script setup lang="ts">
const props = defineProps<{
  label: string;
}>();

const isScoped = computed(() => props.label.includes("::"));

const scope = computed(() => {
  const idx = props.label.indexOf("::");
  return idx >= 0 ? props.label.slice(0, idx).trim() : "";
});

const value = computed(() => {
  const idx = props.label.indexOf("::");
  return idx >= 0 ? props.label.slice(idx + 2).trim() : props.label;
});
</script>

<template>
  <span
    v-if="isScoped"
    class="inline-flex items-center overflow-hidden rounded-md text-xs leading-none"
  >
    <span class="bg-elevated px-1.5 py-0.5 font-medium text-dimmed">{{ scope }}</span>
    <span class="bg-muted px-1.5 py-0.5 text-default">{{ value }}</span>
  </span>
  <UBadge v-else color="neutral" variant="soft" size="sm" :label="label" />
</template>
