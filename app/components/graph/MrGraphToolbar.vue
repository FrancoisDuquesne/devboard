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
  sortField,
  sortDirection,
  mrScopes,
  fetchTodosEnabled,
  fetchIssuesEnabled,
  resetAllFilters,
} = usePreferences();

const availableNodeTypes = computed(() =>
  nodeTypeItems.filter((item) => {
    if (item.value === "mr") return mrScopes.value.length > 0;
    if (item.value === "todo") return fetchTodosEnabled.value;
    if (item.value === "issue") return fetchIssuesEnabled.value;
    return true;
  }),
);

// Clean up nodeTypeFilter when a data source is turned off
watch(
  [mrScopes, fetchTodosEnabled, fetchIssuesEnabled],
  () => {
    const available = new Set(availableNodeTypes.value.map((i) => i.value));
    const cleaned = nodeTypeFilter.value.filter((t) => available.has(t));
    // If all remaining types got removed, select whatever is available
    if (cleaned.length === 0 && available.size > 0) {
      nodeTypeFilter.value = [...available];
    } else if (cleaned.length !== nodeTypeFilter.value.length) {
      nodeTypeFilter.value = cleaned;
    }
  },
  { deep: true },
);

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

const sortOptions = [
  { label: "Updated", value: "updated" },
  { label: "Created", value: "created" },
  { label: "Title", value: "title" },
];

const nodeTypeItems: { label: string; value: GraphNodeType; icon: string }[] = [
  { label: "MRs", value: "mr", icon: "i-lucide-git-pull-request" },
  { label: "Issues", value: "issue", icon: "i-lucide-circle-dot" },
  { label: "Todos", value: "todo", icon: "i-lucide-list-todo" },
];

function toggleNodeType(type: GraphNodeType) {
  const idx = nodeTypeFilter.value.indexOf(type);
  if (idx >= 0) {
    if (nodeTypeFilter.value.length > 1) {
      nodeTypeFilter.value = nodeTypeFilter.value.filter((t) => t !== type);
    }
  } else {
    nodeTypeFilter.value = [...nodeTypeFilter.value, type];
  }
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === "desc" ? "asc" : "desc";
}

const mrTypeEnabled = computed(() => nodeTypeFilter.value.includes("mr"));

const activeFilterCount = computed(() => {
  let count = 0;
  if (roleFilter.value !== "all") count++;
  if (projectFilter.value.length > 0) count++;
  if (pipelineFilter.value !== "all") count++;
  return count;
});
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Mobile: single "Controls" dropdown with everything -->
    <UPopover :popper="{ placement: 'bottom-start' }" class="sm:hidden">
      <UButton
        icon="i-lucide-sliders-horizontal"
        trailing-icon="i-lucide-chevron-down"
        variant="soft"
        :color="activeFilterCount > 0 ? 'filter' : 'neutral'"
      >
        <UBadge
          v-if="activeFilterCount > 0"
          :label="String(activeFilterCount)"
          color="filter"
          variant="solid"
          size="sm"
        />
      </UButton>

      <template #content>
        <div class="w-72 space-y-4 p-4">
          <!-- Filters -->
          <div>
            <p class="mb-1.5 text-xs font-medium text-dimmed">Project</p>
            <ProjectFilter v-model="projectFilter" :projects="projects" />
          </div>

          <div>
            <div class="mb-1.5 flex items-center gap-1.5">
              <UIcon name="i-lucide-git-pull-request" class="size-3.5 text-dimmed" />
              <p class="text-xs font-medium text-dimmed">MR filters</p>
            </div>
            <p v-if="!mrTypeEnabled" class="mb-2 text-xs text-dimmed italic">
              Enable MR nodes to use these filters
            </p>
            <div class="space-y-2">
              <USelect
                v-model="roleFilter"
                :items="roleOptions"
                value-key="value"
                variant="soft"
                :disabled="!mrTypeEnabled"
                aria-label="Filter by role"
                class="w-full"
              />
              <USelect
                v-model="pipelineFilter"
                :items="pipelineOptions"
                value-key="value"
                variant="soft"
                :disabled="!mrTypeEnabled"
                aria-label="Filter by pipeline"
                class="w-full"
              />
            </div>
          </div>

          <!-- Show -->
          <div v-if="availableNodeTypes.length > 1">
            <p class="mb-1.5 text-xs font-medium text-dimmed">Show</p>
            <UFieldGroup>
              <UButton
                v-for="item in availableNodeTypes"
                :key="item.value"
                :icon="item.icon"
                :variant="nodeTypeFilter.includes(item.value) ? 'soft' : 'outline'"
                :color="nodeTypeFilter.includes(item.value) ? 'primary' : 'neutral'"
                size="sm"
                @click="toggleNodeType(item.value)"
              >
                {{ item.label }}
              </UButton>
            </UFieldGroup>
          </div>

          <!-- Group by -->
          <div>
            <p class="mb-1.5 text-xs font-medium text-dimmed">Group by</p>
            <UFieldGroup>
              <UButton
                v-for="item in groupByItems"
                :key="item.value"
                :icon="item.icon"
                variant="soft"
                :color="graphGroupBy === item.value ? 'primary' : 'neutral'"
                size="sm"
                @click="graphGroupBy = item.value"
              >
                {{ item.label }}
              </UButton>
            </UFieldGroup>
          </div>

          <!-- Sort -->
          <div>
            <p class="mb-1.5 text-xs font-medium text-dimmed">Sort by</p>
            <div class="flex items-center gap-1">
              <USelect
                v-model="sortField"
                :items="sortOptions"
                value-key="value"
                variant="soft"
                aria-label="Sort by"
                class="flex-1"
              />
              <UButton
                :icon="sortDirection === 'desc' ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-up-narrow-wide'"
                variant="soft"
                color="neutral"
                size="sm"
                :aria-label="sortDirection === 'desc' ? 'Sort ascending' : 'Sort descending'"
                @click="toggleSortDirection"
              />
            </div>
          </div>

          <UButton
            v-if="activeFilterCount > 0"
            icon="i-lucide-rotate-ccw"
            label="Reset filters"
            variant="ghost"
            color="neutral"
            size="sm"
            block
            @click="resetAllFilters()"
          />
        </div>
      </template>
    </UPopover>

    <!-- Desktop: inline controls -->
    <UPopover :popper="{ placement: 'bottom-start' }" class="hidden sm:flex">
      <UButton
        icon="i-lucide-filter"
        trailing-icon="i-lucide-chevron-down"
        variant="soft"
        :color="activeFilterCount > 0 ? 'filter' : 'neutral'"
      >
        Filters
        <UBadge
          v-if="activeFilterCount > 0"
          :label="String(activeFilterCount)"
          color="filter"
          variant="solid"
          size="sm"
        />
      </UButton>

      <template #content>
        <div class="w-72 space-y-4 p-4">
          <div>
            <p class="mb-1.5 text-xs font-medium text-dimmed">Project</p>
            <ProjectFilter v-model="projectFilter" :projects="projects" />
          </div>

          <div>
            <div class="mb-1.5 flex items-center gap-1.5">
              <UIcon name="i-lucide-git-pull-request" class="size-3.5 text-dimmed" />
              <p class="text-xs font-medium text-dimmed">MR filters</p>
            </div>
            <p v-if="!mrTypeEnabled" class="mb-2 text-xs text-dimmed italic">
              Enable MR nodes to use these filters
            </p>
            <div class="space-y-2">
              <USelect
                v-model="roleFilter"
                :items="roleOptions"
                value-key="value"
                variant="soft"
                :disabled="!mrTypeEnabled"
                aria-label="Filter by role"
                class="w-full"
              />
              <USelect
                v-model="pipelineFilter"
                :items="pipelineOptions"
                value-key="value"
                variant="soft"
                :disabled="!mrTypeEnabled"
                aria-label="Filter by pipeline"
                class="w-full"
              />
            </div>
          </div>

          <UButton
            v-if="activeFilterCount > 0"
            icon="i-lucide-rotate-ccw"
            label="Reset filters"
            variant="ghost"
            color="neutral"
            size="sm"
            block
            @click="resetAllFilters()"
          />
        </div>
      </template>
    </UPopover>

    <template v-if="availableNodeTypes.length > 1">
      <USeparator orientation="vertical" class="hidden h-5 sm:block" />

      <UFieldGroup class="hidden sm:flex">
        <UButton
          v-for="item in availableNodeTypes"
          :key="item.value"
          :icon="item.icon"
          :variant="nodeTypeFilter.includes(item.value) ? 'soft' : 'outline'"
          :color="nodeTypeFilter.includes(item.value) ? 'primary' : 'neutral'"
          @click="toggleNodeType(item.value)"
        >
          {{ item.label }}
        </UButton>
      </UFieldGroup>
    </template>

    <USeparator orientation="vertical" class="hidden h-5 sm:block" />

    <UFieldGroup class="hidden sm:flex">
      <UButton
        v-for="item in groupByItems"
        :key="item.value"
        :icon="item.icon"
        variant="soft"
        :color="graphGroupBy === item.value ? 'primary' : 'neutral'"
        @click="graphGroupBy = item.value"
      >
        {{ item.label }}
      </UButton>
    </UFieldGroup>

    <USeparator orientation="vertical" class="hidden h-5 sm:block" />

    <UFieldGroup class="hidden sm:flex">
      <USelect
        v-model="sortField"
        :items="sortOptions"
        value-key="value"
        variant="soft"
        aria-label="Sort by"
        class="w-28"
      />
      <UButton
        :icon="sortDirection === 'desc' ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-up-narrow-wide'"
        variant="soft"
        color="neutral"
        :aria-label="sortDirection === 'desc' ? 'Sort ascending' : 'Sort descending'"
        @click="toggleSortDirection"
      />
    </UFieldGroup>
  </div>
</template>
