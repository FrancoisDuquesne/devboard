<script setup lang="ts">
const tooltip = { delayDuration: 150 };
const toaster = { expand: false };
</script>

<template>
  <UApp :tooltip="tooltip" :toaster="toaster">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <UMain class="relative">
        <NuxtPage />
      </UMain>
    </NuxtLayout>
    <DemoBanner />
  </UApp>
</template>
