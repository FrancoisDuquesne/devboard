<script setup lang="ts">
import { actionConfig } from "~/composables/useActionStatus";
import type { ActionRequired } from "~/types";

const props = defineProps<{
  action: ActionRequired;
}>();

const config = computed(() => actionConfig[props.action]);
</script>

<template>
  <UBadge
    v-if="action !== 'waiting'"
    :color="config.color"
    variant="subtle"
    size="sm"
    :icon="config.icon"
    :label="config.label"
  />
</template>
