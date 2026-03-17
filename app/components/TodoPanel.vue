<script setup lang="ts">
import type { DevBoardMR, DevBoardTodo } from "~/types";

const emit = defineEmits<{
  "select-mr": [mr: DevBoardMR];
}>();

const { todos, mentions, pendingCount, panelOpen, markAsDone, markAllAsDone } =
  useTodos();
const { actionItems, actionCount, totalCount } = useNotifications();
const { mrs } = useGitlab();
const { status } = useGitlabAuth();

const gitlabTodosUrl = computed(() => {
  if (!status.value?.host) return null;
  return `https://${status.value.host}/dashboard/todos`;
});

const activeTab = ref<string>("all");

const tabItems = computed(() => [
  { label: "All", value: "all" },
  { label: "Mentions", icon: "i-lucide-at-sign", value: "mentions" },
  {
    label: "Actions",
    icon: "i-lucide-alert-triangle",
    value: "actions",
    badge:
      actionCount.value > 0
        ? {
            label: String(actionCount.value),
            color: "error" as const,
            variant: "subtle" as const,
          }
        : undefined,
  },
]);

const displayedTodos = computed(() =>
  activeTab.value === "mentions" ? mentions.value : todos.value,
);

function findMrForTodo(todo: DevBoardTodo): DevBoardMR | undefined {
  if (todo.targetType !== "MergeRequest") return undefined;
  return mrs.value.find(
    (mr) => mr.iid === todo.target.iid && mr.projectPath === todo.projectPath,
  );
}

function onNavigate(todo: DevBoardTodo) {
  const mr = findMrForTodo(todo);
  if (mr) {
    emit("select-mr", mr);
    panelOpen.value = false;
  } else {
    safeOpen(todo.targetUrl);
  }
}

function onNavigateMr(mr: DevBoardMR) {
  emit("select-mr", mr);
  panelOpen.value = false;
}
</script>

<template>
  <USlideover v-model:open="panelOpen" side="right" :overlay="false" :ui="{ content: 'max-w-xl' }">
    <template #title>
      <div class="flex items-center gap-2">
        <span>Inbox</span>
        <UBadge
          v-if="totalCount > 0"
          color="primary"
          variant="subtle"
          size="sm"
          :label="String(totalCount)"
        />
      </div>
    </template>

    <template #body>
      <div class="flex flex-col gap-3 p-2">
        <div class="flex items-center gap-1">
          <UButton
            v-if="todos.length > 0 && activeTab !== 'actions'"
            label="Mark all done"
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-lucide-check-check"
            @click="markAllAsDone"
          />
          <UButton
            v-if="gitlabTodosUrl"
            :to="gitlabTodosUrl"
            target="_blank"
            label="Open in GitLab"
            icon="i-lucide-external-link"
            variant="ghost"
            color="neutral"
            size="xs"
          />
        </div>
        <UTabs
          v-model="activeTab"
          :items="tabItems"
          :content="false"
          :ui="{ list: 'w-full', trigger: 'flex-1 justify-center' }"
        />

        <!-- Todos (All / Mentions tabs) -->
        <template v-if="activeTab !== 'actions'">
          <div
            v-if="displayedTodos.length === 0"
            class="flex flex-col items-center justify-center py-12 text-dimmed"
          >
            <UIcon name="i-lucide-inbox" class="size-10 mb-2 opacity-50" />
            <p class="text-sm">No pending todos</p>
          </div>

          <div v-else class="flex flex-col gap-0.5">
            <TodoItem
              v-for="todo in displayedTodos"
              :key="todo.id"
              :todo="todo"
              @done="markAsDone"
              @navigate="onNavigate"
            />
          </div>
        </template>

        <!-- Actions tab -->
        <template v-else>
          <div
            v-if="actionItems.length === 0"
            class="flex flex-col items-center justify-center py-12 text-dimmed"
          >
            <UIcon name="i-lucide-circle-check" class="size-10 mb-2 opacity-50" />
            <p class="text-sm">No actions required</p>
          </div>

          <div v-else class="flex flex-col gap-0.5">
            <MrActionItem
              v-for="item in actionItems"
              :key="`${item.mr.projectId}-${item.mr.iid}`"
              :mr="item.mr"
              :action="item.action"
              @navigate="onNavigateMr"
            />
          </div>
        </template>
      </div>
    </template>
  </USlideover>
</template>
