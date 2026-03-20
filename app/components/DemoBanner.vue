<script setup lang="ts">
const config = useRuntimeConfig();
const dismissed = ref(false);
const visible = (config.public.demoMode as boolean) && !dismissed.value;
</script>

<template>
  <div
    v-if="visible && !dismissed"
    class="sticky top-0 z-30 flex items-center justify-center gap-2 rounded-b-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white"
  >
    <UIcon name="i-lucide-eye" class="size-4 shrink-0" />
    <span>Demo Mode — viewing sample data</span>
    <button
      class="ml-2 rounded-md p-0.5 hover:bg-primary-600"
      aria-label="Dismiss demo banner"
      @click="dismissed = true"
    >
      <UIcon name="i-lucide-x" class="size-3.5" />
    </button>
  </div>
</template>
