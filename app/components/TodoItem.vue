<script setup lang="ts">
import type { DevBoardTodo } from "~/types";
import { getProjectInitials } from "~/utils/projectAlias";
import { todoActionConfig } from "~/utils/todoAction";

const props = defineProps<{
  todo: DevBoardTodo;
}>();

defineEmits<{
  done: [id: number];
  navigate: [todo: DevBoardTodo];
}>();

const now = useNow();

const config = computed(() => todoActionConfig[props.todo.action]);

const isMention = computed(
  () => props.todo.action === "mentioned" || props.todo.action === "directly_addressed",
);
</script>

<template>
  <button
    type="button"
    class="group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-elevated/50 cursor-pointer transition-colors"
    @click="$emit('navigate', todo)"
  >
    <UAvatar
      :src="todo.author.avatarUrl"
      :alt="todo.author.name"
      size="sm"
      class="mt-0.5 shrink-0"
    />

    <div class="min-w-0 flex-1">
      <p
        class="flex items-baseline gap-1 text-sm leading-snug"
        :title="`!${todo.target.iid} ${todo.target.title}`"
      >
        <span class="shrink-0 font-medium">{{ todo.author.name }}</span>
        <span class="shrink-0 text-dimmed">{{ config.label }}</span>
        <span class="min-w-0 truncate font-medium"
          >!{{ todo.target.iid }} {{ todo.target.title }}</span
        >
      </p>

      <p
        v-if="isMention && todo.body"
        class="mt-1 text-xs text-dimmed line-clamp-2 italic"
      >
        {{ todo.body }}
      </p>

      <div class="mt-1 flex items-center gap-2 text-xs text-dimmed">
        <UIcon :name="config.icon" class="size-3.5 shrink-0" />
        <span :title="todo.projectPath"
          >{{ getProjectInitials(todo.projectPath) }}</span
        >
        <span>&middot;</span>
        <span>{{ timeAgo(todo.createdAt, now) }}</span>
        <UBadge
          v-if="todo.targetState === 'merged'"
          color="success"
          variant="subtle"
          size="xs"
          label="Merged"
        />
        <UBadge
          v-else-if="todo.targetState === 'closed'"
          color="info"
          variant="subtle"
          size="xs"
          label="Closed"
        />
      </div>
    </div>

    <UButton
      icon="i-lucide-check"
      variant="ghost"
      color="neutral"
      size="xs"
      aria-label="Mark as done"
      class="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:max-lg:opacity-0 max-sm:opacity-100"
      @click.stop="$emit('done', todo.id)"
    />
  </button>
</template>
