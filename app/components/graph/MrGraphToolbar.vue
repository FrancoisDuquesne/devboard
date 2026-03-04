<script setup lang="ts">
import type { GraphGroupBy, GraphNodeType } from "~/types";

defineProps<{
  projects: string[];
}>();

const {
  roleFilter,
  projectFilter,
  pipelineFilter,
  nodeTypeFilter,
  graphGroupBy,
  resetAllFilters,
} = usePreferences();

const groupByItems: { label: string; value: GraphGroupBy; icon: string }[] = [
  { label: "All", value: "none", icon: "i-lucide-layout-list" },
  { label: "Project", value: "project", icon: "i-lucide-folder" },
];

const roleOptions = [
  { label: "All MRs", value: "all" },
  { label: "My MRs", value: "author" },
  { label: "To review", value: "reviewer" },
  { label: "Mentioned", value: "mentioned" },
];

const pipelineOptions = [
  { label: "All pipelines", value: "all" },
  { label: "Passed", value: "success" },
  { label: "Failed", value: "failed" },
  { label: "Running", value: "running" },
];

const nodeTypeItems: { label: string; value: GraphNodeType; icon: string }[] = [
  { label: "MRs", value: "mr", icon: "i-lucide-git-pull-request" },
  { label: "Issues", value: "issue", icon: "i-lucide-circle-dot" },
  { label: "Todos", value: "todo", icon: "i-lucide-list-todo" },
];

function toggleNodeType(type: GraphNodeType) {
  const idx = nodeTypeFilter.value.indexOf(type);
  if (idx >= 0) {
    // Don't allow deselecting all
    if (nodeTypeFilter.value.length > 1) {
      nodeTypeFilter.value = nodeTypeFilter.value.filter((t) => t !== type);
    }
  } else {
    nodeTypeFilter.value = [...nodeTypeFilter.value, type];
  }
}

const mrTypeEnabled = computed(() => nodeTypeFilter.value.includes("mr"));

const activeFilterCount = computed(() => {
  let count = 0;
  if (roleFilter.value !== "all") count++;
  if (projectFilter.value !== null) count++;
  if (pipelineFilter.value !== "all") count++;
  return count;
});

const roleLabelMap: Record<string, string> = {
  author: "My MRs",
  reviewer: "To review",
  mentioned: "Mentioned",
};

const pipelineLabelMap: Record<string, string> = {
  success: "Passed",
  failed: "Failed",
  running: "Running",
};

const activeChips = computed(() => {
  const chips: { key: string; label: string }[] = [];
  if (roleFilter.value !== "all") {
    chips.push({
      key: "role",
      label: roleLabelMap[roleFilter.value] ?? roleFilter.value,
    });
  }
  if (projectFilter.value) {
    chips.push({
      key: "project",
      label: projectFilter.value.split("/").pop() ?? projectFilter.value,
    });
  }
  if (pipelineFilter.value !== "all") {
    chips.push({
      key: "pipeline",
      label: pipelineLabelMap[pipelineFilter.value] ?? pipelineFilter.value,
    });
  }
  return chips;
});

function dismissChip(key: string) {
  if (key === "role") roleFilter.value = "all";
  else if (key === "project") projectFilter.value = null;
  else if (key === "pipeline") pipelineFilter.value = "all";
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UPopover :popper="{ placement: 'bottom-start' }">
      <UButton
        icon="i-lucide-filter"
        :variant="activeFilterCount > 0 ? 'soft' : 'ghost'"
        :color="activeFilterCount > 0 ? 'violet' : 'neutral'"
      >
        <span class="hidden sm:inline">Filters</span>
        <template #trailing>
          <UBadge
            v-if="activeFilterCount > 0"
            :label="String(activeFilterCount)"
            color="violet"
            variant="solid"
          />
        </template>
      </UButton>

      <template #content>
        <div class="w-64 space-y-4 p-4 sm:w-72">
          <div>
            <p class="mb-1.5 text-xs font-medium text-dimmed">Project</p>
            <ProjectFilter v-model="projectFilter" :projects="projects" />
          </div>

          <div :class="{ 'opacity-40 pointer-events-none': !mrTypeEnabled }">
            <div class="mb-1.5 flex items-center gap-1.5">
              <UIcon name="i-lucide-git-pull-request" class="size-3.5 text-dimmed" />
              <p class="text-xs font-medium text-dimmed">MR filters</p>
            </div>
            <p v-if="!mrTypeEnabled" class="mb-2 text-xs text-dimmed/60 italic">
              Enable MR nodes to use these filters
            </p>
            <div class="space-y-2">
              <USelect
                v-model="roleFilter"
                :items="roleOptions"
                value-key="value"
                variant="soft"
                aria-label="Filter by role"
                class="w-full"
              />
              <USelect
                v-model="pipelineFilter"
                :items="pipelineOptions"
                value-key="value"
                variant="soft"
                aria-label="Filter by pipeline"
                class="w-full"
              />
            </div>
          </div>

          <UButton
            v-if="activeFilterCount > 0"
            icon="i-lucide-rotate-ccw"
            label="Reset all filters"
            variant="ghost"
            color="neutral"
            size="sm"
            block
            @click="resetAllFilters()"
          />
        </div>
      </template>
    </UPopover>

    <button
      v-for="chip in activeChips"
      :key="chip.key"
      class="hidden items-center gap-1 rounded-md bg-violet-500/10 px-2 py-1 text-xs text-violet-600 transition-colors hover:bg-violet-500/20 sm:flex dark:text-violet-400"
      @click="dismissChip(chip.key)"
    >
      {{ chip.label }}
      <UIcon name="i-lucide-x" class="size-3" />
    </button>

    <USeparator orientation="vertical" class="hidden h-6 sm:block" />

    <UFieldGroup>
      <UButton
        v-for="item in nodeTypeItems"
        :key="item.value"
        :icon="item.icon"
        :variant="nodeTypeFilter.includes(item.value) ? 'soft' : 'ghost'"
        :color="nodeTypeFilter.includes(item.value) ? 'primary' : 'neutral'"
        @click="toggleNodeType(item.value)"
      >
        <span class="hidden sm:inline">{{ item.label }}</span>
      </UButton>
    </UFieldGroup>

    <USeparator orientation="vertical" class="hidden h-6 sm:block" />

    <UFieldGroup>
      <UButton
        v-for="item in groupByItems"
        :key="item.value"
        :icon="item.icon"
        :variant="graphGroupBy === item.value ? 'soft' : 'ghost'"
        :color="graphGroupBy === item.value ? 'primary' : 'neutral'"
        @click="graphGroupBy = item.value"
      >
        <span class="hidden sm:inline">{{ item.label }}</span>
      </UButton>
    </UFieldGroup>
  </div>
</template>
