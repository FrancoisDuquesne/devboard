<script setup lang="ts">
const props = defineProps<{
  projects: string[];
}>();

const model = defineModel<string[]>({ default: () => [] });

const items = computed(() =>
  props.projects.map((p) => ({
    label: p.split("/").pop() ?? p,
    value: p,
  })),
);

function toggle(value: string) {
  const idx = model.value.indexOf(value);
  if (idx >= 0) {
    model.value = model.value.filter((v) => v !== value);
  } else {
    model.value = [...model.value, value];
  }
}

function clearAll() {
  model.value = [];
}
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex flex-wrap gap-1">
      <UButton
        v-for="item in items"
        :key="item.value"
        :variant="model.includes(item.value) ? 'soft' : 'outline'"
        :color="model.includes(item.value) ? 'primary' : 'neutral'"
        size="xs"
        :aria-label="`Filter by ${item.label}`"
        @click="toggle(item.value)"
      >
        {{ item.label }}
      </UButton>
    </div>
    <UButton
      v-if="model.length > 0"
      icon="i-lucide-x"
      label="Clear"
      variant="ghost"
      color="neutral"
      size="xs"
      @click="clearAll"
    />
  </div>
</template>
