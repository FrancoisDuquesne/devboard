<script setup lang="ts">
import type { ActionRequired, DevBoardMR } from "~/types";
import { getProjectInitials } from "~/utils/projectAlias";

const props = defineProps<{
  mr: DevBoardMR;
  action: ActionRequired;
}>();

defineEmits<{
  navigate: [mr: DevBoardMR];
}>();

const config = computed(() => actionConfig[props.action]);
</script>

<template>
  <button
    class="group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-elevated/50 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
    @click="$emit('navigate', mr)"
  >
    <div
      class="mt-0.5 shrink-0 flex items-center justify-center size-8 rounded-full"
      :class="{
        'bg-amber-500/10 text-amber-600 dark:text-amber-400':
          config.color === 'warning',
        'bg-red-500/10 text-red-600 dark:text-red-400': config.color === 'error',
        'bg-neutral-500/10 text-neutral-500': config.color === 'neutral',
      }"
    >
      <UIcon :name="config.icon" class="size-4" />
      <span class="sr-only">{{ config.label }}</span>
    </div>

    <div class="min-w-0 flex-1">
      <p class="text-sm leading-snug">
        <span class="font-medium">!{{ mr.iid }} {{ mr.title }}</span>
      </p>

      <div class="mt-1 flex items-center gap-2 text-xs text-dimmed">
        <UBadge
          :color="config.color"
          variant="subtle"
          size="xs"
          :label="config.label"
        />
        <span :title="mr.projectPath">{{ getProjectInitials(mr.projectPath) }}</span>
      </div>
    </div>
  </button>
</template>
