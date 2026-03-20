<script setup lang="ts">
const config = useRuntimeConfig();
const demoMode = config.public.demoMode as boolean;
const open = ref(true);
</script>

<template>
  <div
    v-if="demoMode && open"
    class="fixed inset-x-0 top-3 z-50 flex justify-center px-4"
  >
    <UAlert
      v-model:open="open"
      title="Demo Mode — viewing sample data"
      icon="i-lucide-eye"
      color="primary"
      variant="solid"
      close
      :ui="{ root: 'max-w-md shadow-lg rounded-lg' }"
    />
  </div>
</template>
