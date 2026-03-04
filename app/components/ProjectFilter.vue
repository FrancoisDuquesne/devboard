<script setup lang="ts">
const ALL = "__all__";

const props = defineProps<{
  projects: string[];
}>();

const model = defineModel<string | null>();

const items = computed(() => [
  { label: "All projects", value: ALL },
  ...props.projects.map((p) => ({
    label: p.split("/").pop() ?? p,
    value: p,
  })),
]);

const selected = computed({
  get: () => model.value ?? ALL,
  set: (val: string) => {
    model.value = val === ALL ? null : val;
  },
});
</script>

<template>
  <USelect
    v-model="selected"
    :items="items"
    value-key="value"
    variant="soft"
    aria-label="Filter by project"
    class="w-full"
  />
</template>
