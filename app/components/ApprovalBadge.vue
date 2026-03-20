<script setup lang="ts">
const props = defineProps<{
  approved: number;
  required: number;
}>();

const isFullyApproved = computed(
  () => props.required > 0 && props.approved >= props.required,
);

const color = computed(() => {
  if (isFullyApproved.value) return "success" as const;
  // Unknown required count (GitHub): show success if any approvals exist
  if (props.required < 0 && props.approved > 0) return "success" as const;
  return "warning" as const;
});

const label = computed(() =>
  props.required < 0 ? String(props.approved) : `${props.approved}/${props.required}`,
);
</script>

<template>
  <UBadge
    v-if="required > 0 || approved > 0"
    :color="color"
    variant="subtle"
    size="sm"
    icon="i-lucide-thumbs-up"
    :label="label"
  />
</template>
