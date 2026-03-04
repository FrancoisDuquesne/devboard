<template>
  <UApp :tooltip="{delayDuration: 150}">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <UMain class="relative">
        <NuxtPage />
      </UMain>
    </NuxtLayout>
  </UApp>
</template>
