<script setup lang="ts">
const config = useRuntimeConfig();
const demoMode = config.public.demoMode as boolean;
const dismissed = ref(false);
</script>

<template>
  <div
    v-if="demoMode && !dismissed"
    class="fixed inset-x-0 top-3 z-50 flex justify-center px-4"
  >
    <UAlert
      title="Demo Mode — viewing sample data"
      icon="i-lucide-eye"
      color="primary"
      variant="solid"
      :close="{
        icon: 'i-lucide-x',
        color: 'primary',
        variant: 'link',
      }"
      :ui="{ root: 'max-w-md shadow-lg rounded-lg' }"
      @close="dismissed = true"
    />
  </div>
</template>
