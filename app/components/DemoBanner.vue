<script setup lang="ts">
const config = useRuntimeConfig();
const visible = config.public.demoMode as boolean;
</script>

<template>
  <div
    v-if="visible"
    class="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-primary-500 px-4 py-1.5 text-sm font-medium text-white"
  >
    <UIcon name="i-lucide-eye" class="size-4 shrink-0" />
    <span>Demo Mode — viewing sample data</span>
  </div>
</template>
