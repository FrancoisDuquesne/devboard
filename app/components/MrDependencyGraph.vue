<script setup lang="ts">
import { Background } from "@vue-flow/background";
import type { NodeDragEvent, NodeMouseEvent } from "@vue-flow/core";
import { Panel, useVueFlow, VueFlow } from "@vue-flow/core";
import { useLocalStorage } from "@vueuse/core";
import GraphGroupNode from "~/components/graph/GroupNode.vue";
import GraphIssueGraphNode from "~/components/graph/IssueGraphNode.vue";
import GraphMrGraphNode from "~/components/graph/MrGraphNode.vue";
import GraphPhantomNode from "~/components/graph/PhantomNode.vue";
import GraphTodoGraphNode from "~/components/graph/TodoGraphNode.vue";
import type { DevBoardIssue, DevBoardMR, DevBoardTodo } from "~/types";
import { computeProjectAliases } from "~/utils/projectAlias";

const props = defineProps<{
  mrs: DevBoardMR[];
  projects: string[];
  loading?: boolean;
  mentionMrIds?: Set<number>;
  issues?: DevBoardIssue[];
  todos?: DevBoardTodo[];
  focusedNodeId?: string | null;
}>();

const emit = defineEmits<{
  select: [mr: DevBoardMR];
  "select-issue": [issue: DevBoardIssue];
}>();

provide("select-issue", (issue: DevBoardIssue) => {
  emit("select-issue", issue);
});

const {
  roleFilter,
  projectFilter,
  pipelineFilter,
  sortField,
  sortDirection,
  nodeTypeFilter,
  graphGroupBy,
} = usePreferences();
const { status, checkConnection, loading: connectionLoading } = useGitlabAuth();
const { loading: refreshLoading, fetchMrs } = useGitlab();
const { helpOpen } = useHelp();
const { panelOpen, fetchTodos } = useTodos();
const { totalCount } = useNotifications();
const {
  enabled: worktreeEnabled,
  panelOpen: worktreePanelOpen,
  worktrees: worktreeList,
} = useWorktrees();

// Filter and sort MRs before feeding to graph
const filteredAndSortedMrs = computed(() => {
  let result = [...props.mrs];

  if (roleFilter.value !== "all" && status.value?.username) {
    const username = status.value.username;
    result = result.filter((mr) => {
      if (roleFilter.value === "author") return mr.author.username === username;
      if (roleFilter.value === "reviewer")
        return mr.reviewers.some((r) => r.username === username);
      if (roleFilter.value === "mentioned")
        return props.mentionMrIds?.has(mr.id) ?? false;
      return true;
    });
  }

  if (projectFilter.value) {
    result = result.filter((mr) => mr.projectPath === projectFilter.value);
  }

  if (pipelineFilter.value !== "all") {
    result = result.filter((mr) => mr.pipeline.status === pipelineFilter.value);
  }

  result.sort((a, b) => {
    let cmp = 0;
    if (sortField.value === "updated") {
      cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    } else if (sortField.value === "created") {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      cmp = a.title.localeCompare(b.title);
    }
    return sortDirection.value === "desc" ? -cmp : cmp;
  });

  return result;
});

// Compute aliases and inject into MR data for graph nodes
const aliases = computed(() => {
  const paths = [...new Set(props.mrs.map((mr) => mr.projectPath))];
  return computeProjectAliases(paths);
});

const mrsWithAliases = computed(() =>
  filteredAndSortedMrs.value.map((mr) => ({
    ...mr,
    projectAlias: aliases.value.get(mr.projectPath),
    isMention: props.mentionMrIds?.has(mr.id) ?? false,
  })),
);

const showMrs = computed(() => nodeTypeFilter.value.includes("mr"));
const showIssues = computed(() => nodeTypeFilter.value.includes("issue"));
const showTodos = computed(() => nodeTypeFilter.value.includes("todo"));
const filteredMrs = computed(() => (showMrs.value ? mrsWithAliases.value : []));

const filteredIssues = computed(() => {
  if (!nodeTypeFilter.value.includes("issue")) return [];
  let result = [...(props.issues ?? [])];
  if (projectFilter.value) {
    result = result.filter((i) => i.projectPath === projectFilter.value);
  }
  result.sort((a, b) => {
    let cmp = 0;
    if (sortField.value === "updated" || sortField.value === "created") {
      const dateA = new Date(a.updatedAt ?? 0).getTime();
      const dateB = new Date(b.updatedAt ?? 0).getTime();
      cmp = dateA - dateB;
    } else {
      cmp = a.title.localeCompare(b.title);
    }
    return sortDirection.value === "desc" ? -cmp : cmp;
  });
  return result;
});

const filteredTodos = computed(() => {
  if (!nodeTypeFilter.value.includes("todo")) return [];
  let result = [...(props.todos ?? [])];
  if (projectFilter.value) {
    result = result.filter((t) => t.projectPath === projectFilter.value);
  }
  result.sort((a, b) => {
    let cmp = 0;
    if (sortField.value === "updated" || sortField.value === "created") {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      cmp = a.target.title.localeCompare(b.target.title);
    }
    return sortDirection.value === "desc" ? -cmp : cmp;
  });
  return result;
});

const { nodes, edges } = useMrGraph(
  filteredMrs,
  filteredIssues,
  filteredTodos,
  graphGroupBy,
);

// Persistent positions
const storedPositions = useLocalStorage<Record<string, { x: number; y: number }>>(
  "devboard:graph-positions",
  {},
);

// Clear stored positions when filter/sort changes to force fresh layout
const filterSortSignature = computed(
  () =>
    `${roleFilter.value}|${projectFilter.value}|${pipelineFilter.value}|${sortField.value}|${sortDirection.value}|${nodeTypeFilter.value.join(",")}|${graphGroupBy.value}`,
);
watch(filterSortSignature, () => {
  storedPositions.value = {};
  nextTick(() => fitView({ duration: 300 }));
});

// Apply stored positions on top of computed layout (skip group nodes)
const positionedNodes = computed(() =>
  nodes.value.map((node) => {
    if (node.type === "group-node") return node;
    const stored = storedPositions.value[node.id];
    if (stored) {
      return { ...node, position: stored };
    }
    return node;
  }),
);

// biome-ignore lint/suspicious/noExplicitAny: Vue Flow node types require loose typing for custom components
const nodeTypes: Record<string, any> = {
  "mr-node": markRaw(GraphMrGraphNode),
  "issue-node": markRaw(GraphIssueGraphNode),
  "todo-node": markRaw(GraphTodoGraphNode),
  phantom: markRaw(GraphPhantomNode),
  "group-node": markRaw(GraphGroupNode),
};

const { zoomIn, zoomOut, fitView, findNode, removeSelectedNodes, addSelectedNodes } =
  useVueFlow();

// Sync focused node with Vue Flow selection state
const hasFocusedNode = computed(() => !!props.focusedNodeId);

watch(
  () => props.focusedNodeId,
  (id, oldId) => {
    if (oldId) {
      const prev = findNode(oldId);
      if (prev) removeSelectedNodes([prev]);
    }
    if (id) {
      const node = findNode(id);
      if (node) addSelectedNodes([node]);
    }
  },
);

const sortOptions = [
  { label: "Updated", value: "updated" },
  { label: "Created", value: "created" },
  { label: "Title", value: "title" },
];

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === "desc" ? "asc" : "desc";
}

// Only fitView when node set structurally changes (added/removed), not on data updates
const nodeIdSignature = computed(() =>
  nodes.value
    .map((n) => n.id)
    .sort()
    .join(","),
);
watch(nodeIdSignature, () => {
  nextTick(() => fitView({ duration: 300 }));
});

const hasEdges = computed(() => edges.value.length > 0);

function onNodeClick({ node }: NodeMouseEvent) {
  if (node.type === "group-node") return;
  if (node.type === "mr-node" && node.data) {
    emit("select", node.data as DevBoardMR);
  }
  if (node.type === "issue-node" && node.data) {
    emit("select-issue", node.data as DevBoardIssue);
  }
}

function onNodeDragStop({ node }: NodeDragEvent) {
  if (node.type === "group-node") return;
  storedPositions.value = {
    ...storedPositions.value,
    [node.id]: { x: node.position.x, y: node.position.y },
  };
}

const isFiltered = computed(
  () =>
    roleFilter.value !== "all" ||
    projectFilter.value !== null ||
    pipelineFilter.value !== "all" ||
    nodeTypeFilter.value.length < 3,
);
</script>

<template>
  <div class="relative h-full">
    <!-- Top-left: branding + graph controls pill -->
    <div class="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
      <nav
        class="flex items-center gap-1.5 rounded-lg border border-muted bg-default/90 px-2 sm:px-3 py-1.5 backdrop-blur"
      >
        <div class="flex items-center gap-1.5 px-1">
          <UIcon name="i-lucide-workflow" class="size-4 text-primary" />
          <span class="hidden text-sm font-semibold sm:inline">DevBoard</span>
        </div>

        <USeparator orientation="vertical" class="h-5" />

        <GraphMrGraphToolbar :projects="projects" />

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
      </nav>
    </div>

    <!-- Top-right: search, notifications, settings -->
    <div class="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
      <nav
        class="flex items-center gap-1 rounded-lg border border-muted bg-default/90 px-2 py-1.5 backdrop-blur"
      >
        <SearchPalette />

        <div v-if="worktreeEnabled" class="relative">
          <UButton
            icon="i-lucide-folder-git-2"
            variant="ghost"
            color="neutral"
            aria-label="Worktrees"
            @click="worktreePanelOpen = !worktreePanelOpen"
          />
          <span
            v-if="worktreeList.length > 0"
            class="absolute -top-1 -right-1 flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-info text-white text-xs font-bold leading-none pointer-events-none"
          >
            {{ worktreeList.length > 9 ? "9+" : worktreeList.length }}
          </span>
        </div>

        <div class="relative">
          <UButton
            icon="i-lucide-bell"
            variant="ghost"
            color="neutral"
            aria-label="Notifications"
            @click="panelOpen = !panelOpen"
          />
          <span
            v-if="totalCount > 0"
            class="absolute -top-1 -right-1 flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-error text-white text-xs font-bold leading-none pointer-events-none"
          >
            {{ totalCount > 9 ? "9+" : totalCount }}
          </span>
        </div>

        <SettingsPopover />
      </nav>
    </div>

    <div
      v-if="loading && mrs.length === 0"
      class="flex h-full items-center justify-center"
    >
      <UIcon name="i-lucide-loader" class="size-8 animate-spin text-dimmed" />
    </div>

    <div
      v-else-if="positionedNodes.length === 0"
      class="flex h-full flex-col items-center justify-center gap-4 px-4"
    >
      <template v-if="mrs.length === 0 && !issues?.length && !todos?.length">
        <!-- Connected but no items -->
        <template v-if="!status || status.connected">
          <UAlert
            color="info"
            variant="subtle"
            icon="i-lucide-inbox"
            title="No open items found"
            description="You have no open MRs, assigned issues, or pending todos."
            class="max-w-md"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            label="Refresh"
            variant="soft"
            color="neutral"
            :loading="refreshLoading"
            @click="() => { fetchMrs(); fetchTodos(); }"
          />
        </template>

        <!-- Not connected — setup guide -->
        <template v-else>
          <div class="max-w-sm space-y-4 text-center">
            <div class="flex flex-col items-center gap-2">
              <div
                class="flex items-center justify-center size-12 rounded-xl bg-warning/10"
              >
                <UIcon name="i-lucide-plug-zap" class="size-6 text-warning" />
              </div>
              <h3 class="text-base font-semibold">Connect to GitLab</h3>
              <p class="text-sm text-dimmed">
                DevBoard needs a GitLab host and access token to display your merge
                requests.
              </p>
            </div>

            <div class="space-y-3 rounded-lg border border-muted p-4 text-left">
              <p class="text-xs font-semibold uppercase tracking-wide text-dimmed">
                Option 1 — glab CLI (easiest)
              </p>
              <div class="space-y-1.5 text-sm">
                <p class="text-dimmed">
                  If you have
                  <code class="rounded bg-muted px-1 py-0.5 text-xs">glab</code>
                  installed:
                </p>
                <pre
                  class="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed"
                ><code>glab auth login</code></pre>
                <p class="text-xs text-dimmed">
                  Host and token are stored in
                  <code class="rounded bg-muted px-1 py-0.5 text-xs">
                    ~/.config/glab-cli/config.yml
                  </code>
                  and picked up automatically. Then restart the dev server.
                </p>
              </div>
            </div>

            <div class="space-y-3 rounded-lg border border-muted p-4 text-left">
              <p class="text-xs font-semibold uppercase tracking-wide text-dimmed">
                Option 2 — Environment file
              </p>
              <div class="space-y-1.5 text-sm">
                <p class="text-dimmed">
                  Create a<code class="rounded bg-muted px-1 py-0.5 text-xs">.env</code>
                  file in the project root:
                </p>
                <pre
                  class="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed"
                ><code>GITLAB_HOST=gitlab.example.com
GITLAB_PRIVATE_TOKEN=glpat-xxxx</code></pre>
                <p class="text-xs text-dimmed">
                  The token needs
                  <code class="rounded bg-muted px-1 py-0.5 text-xs">api</code>
                  scope. Then restart the dev server.
                </p>
              </div>
            </div>

            <UButton
              icon="i-lucide-plug"
              label="Test connection"
              variant="soft"
              :loading="connectionLoading"
              @click="checkConnection"
            />
          </div>
        </template>
      </template>
      <template v-else>
        <div class="flex flex-col items-center text-dimmed">
          <UIcon name="i-lucide-filter-x" class="mb-2 size-12" />
          <p class="text-lg font-medium">No matching items</p>
          <p class="text-sm">Try adjusting your filters.</p>
        </div>
      </template>
    </div>

    <VueFlow
      v-else
      :class="['absolute inset-0 bg-muted', { 'has-focus': hasFocusedNode }]"
      :nodes="positionedNodes"
      :edges="edges"
      :node-types="nodeTypes"
      :default-edge-options="{ type: 'smoothstep' }"
      fit-view-on-init
      @node-click="onNodeClick"
      @node-drag-stop="onNodeDragStop"
    >
      <Background
        variant="dots"
        :size="1"
        :gap="20"
        pattern-color="currentColor"
        class="text-muted"
      />

      <Panel position="bottom-right">
        <div
          class="flex items-center gap-1 rounded-lg border border-muted bg-default/90 p-1 backdrop-blur"
        >
          <UTooltip
            :text="status?.connected ? `Connected to ${status.host} as ${status.username}` : status?.error || 'Disconnected from GitLab'"
          >
            <span
              class="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-dimmed"
            >
              <span
                class="size-2 shrink-0 rounded-full"
                :class="status?.connected ? 'bg-success' : 'bg-error'"
              />
              <span v-if="status?.connected" class="hidden sm:inline">
                {{ status.username }}
              </span>
            </span>
          </UTooltip>

          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="refreshLoading"
            aria-label="Refresh"
            @click="() => { fetchMrs(); fetchTodos(); }"
          />

          <USeparator orientation="vertical" class="h-4" />

          <UButton
            icon="i-lucide-zoom-in"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Zoom in"
            @click="zoomIn()"
          />
          <UButton
            icon="i-lucide-zoom-out"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Zoom out"
            @click="zoomOut()"
          />
          <UButton
            icon="i-lucide-maximize"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Fit to view"
            @click="fitView({ duration: 300 })"
          />

          <USeparator orientation="vertical" class="h-4" />

          <UTooltip text="Keyboard shortcuts (?)">
            <UButton
              icon="i-lucide-circle-help"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Help"
              @click="helpOpen = true"
            />
          </UTooltip>
        </div>
      </Panel>

      <Panel position="bottom-left">
        <div
          class="flex flex-col gap-y-1 rounded-lg border border-muted bg-default/90 px-3 py-1.5 text-xs text-dimmed backdrop-blur"
        >
          <template v-if="hasEdges">
            <span class="font-medium">Edges:</span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-0.5 w-4 bg-emerald-500" /> Healthy
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-0.5 w-4 bg-red-500" /> Blocked
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-0.5 w-4 bg-amber-500" /> In progress
            </span>
            <span class="flex items-center gap-1">
              <span
                class="inline-block h-0.5 w-4 border-t-2 border-dashed border-gray-400"
              />
              Unresolved
            </span>
            <span class="my-1 w-full border-b border-accented" />
          </template>
          <span class="font-medium">Nodes:</span>
          <span v-if="showMrs" class="flex items-center gap-1">
            <UIcon name="i-lucide-git-pull-request" class="size-3 text-primary" />
            Merge request
          </span>
          <span v-if="showIssues" class="flex items-center gap-1">
            <UIcon name="i-lucide-circle-dot" class="size-3 text-primary" />
            Issue
          </span>
          <span v-if="showTodos" class="flex items-center gap-1">
            <UIcon name="i-lucide-list-todo" class="size-3 text-primary" />
            Todo
          </span>
          <template v-if="showMrs">
            <span class="my-1 w-full border-b border-accented" />
            <span class="font-medium">MR status:</span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-3 w-1 rounded-full bg-primary" /> On track
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-3 w-1 rounded-full bg-warning" /> Needs
              attention
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-3 w-1 rounded-full bg-error" /> Action needed
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-3 w-1 rounded-full bg-success" /> Merged
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-3 w-1 rounded-full bg-info" /> Mentioned
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-3 w-1 rounded-full bg-dimmed" /> Draft
            </span>
          </template>
          <UTooltip
            v-if="!hasEdges && !isFiltered"
            text="Add &quot;Depends on !N&quot; in MR descriptions to see dependency edges."
          >
            <UIcon name="i-lucide-info" class="mt-1 size-3.5 cursor-help text-dimmed" />
          </UTooltip>
        </div>
      </Panel>
    </VueFlow>
  </div>
</template>
