<script setup lang="ts">
const props = defineProps<{
  approved: number;
  required: number;
}>();

const isFullyApproved = computed(
  () => props.required > 0 && props.approved >= props.required,
);

const color = computed(
  () => (isFullyApproved.value ? "success" : "warning") as "success" | "warning",
);

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
