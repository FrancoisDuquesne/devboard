<script setup lang="ts">
defineProps<{
  count: number;
}>();
</script>

<template>
  <UBadge
    v-if="count > 0"
    color="warning"
    variant="subtle"
    size="sm"
    icon="i-lucide-message-circle"
    :label="`${count}`"
  />
</template>
