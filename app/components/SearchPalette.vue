<script setup lang="ts">
import type { MrStatus } from "~/types";
import { todoActionConfig } from "~/utils/todoAction";

const { searchOpen, selectedMr } = useSearch();
const { mrs: regularMrs } = useGitlab();
const { todos, mentionMrs } = useTodos();
const { issues } = useIssues();

const allMrs = computed(() => {
  const regularIds = new Set(regularMrs.value.map((mr) => mr.id));
  const uniqueMentions = mentionMrs.value.filter((mr) => !regularIds.has(mr.id));
  return [...regularMrs.value, ...uniqueMentions];
});

function statusIcon(status: MrStatus) {
  switch (status) {
    case "draft":
      return "i-lucide-pencil-line";
    case "open":
      return "i-lucide-git-pull-request";
    case "merged":
      return "i-lucide-git-merge";
    case "closed":
      return "i-lucide-git-pull-request-closed";
  }
}

const groups = computed(() => [
  {
    id: "mrs",
    label: "Merge Requests",
    items: allMrs.value.map((mr) => ({
      id: `mr-${mr.projectId}-${mr.iid}`,
      label: `!${mr.iid} ${mr.title}`,
      suffix: mr.sourceBranch,
      description: `${mr.projectPath} · ${mr.author.name}`,
      icon: statusIcon(mr.status),
      reviewerNames: mr.reviewers.map((r) => r.name).join(" "),
      issueRefs: mr.linkedIssues.map((i) => i.reference).join(" "),
      onSelect() {
        selectedMr.value = mr;
        searchOpen.value = false;
      },
    })),
  },
  {
    id: "issues",
    label: "Issues",
    items: issues.value.map((issue) => ({
      id: `issue-${issue.projectId}-${issue.iid}`,
      label: `#${issue.iid} ${issue.title}`,
      description: issue.projectPath ?? "",
      icon: issue.state === "closed" ? "i-lucide-circle-check" : "i-lucide-circle-dot",
      onSelect() {
        window.open(issue.webUrl, "_blank", "noopener,noreferrer");
        searchOpen.value = false;
      },
    })),
  },
  {
    id: "todos",
    label: "Todos",
    items: todos.value.map((todo) => {
      const config = todoActionConfig[todo.action];
      return {
        id: `todo-${todo.id}`,
        label: `${config.label} !${todo.target.iid} ${todo.target.title}`,
        description: `${todo.projectPath} · ${todo.author.name}`,
        icon: config.icon,
        onSelect() {
          const mr = allMrs.value.find(
            (m) =>
              todo.targetType === "MergeRequest" &&
              m.iid === todo.target.iid &&
              m.projectPath === todo.projectPath,
          );
          if (mr) {
            selectedMr.value = mr;
          } else {
            window.open(todo.targetUrl, "_blank", "noopener,noreferrer");
          }
          searchOpen.value = false;
        },
      };
    }),
  },
]);

defineShortcuts({
  meta_k: {
    usingInput: true,
    handler: () => {
      searchOpen.value = !searchOpen.value;
    },
  },
  escape: {
    usingInput: true,
    handler: () => {
      if (searchOpen.value) {
        searchOpen.value = false;
      }
    },
  },
});
</script>

<template>
  <UModal v-model:open="searchOpen" :ui="{ content: 'sm:max-w-3xl' }">
    <UButton
      label="Search..."
      icon="i-lucide-search"
      color="neutral"
      variant="ghost"
      class="hidden sm:inline-flex"
    >
      <template #trailing>
        <UKbd value="meta" size="sm" />
        <UKbd value="K" size="sm" />
      </template>
    </UButton>
    <UButton
      icon="i-lucide-search"
      color="neutral"
      variant="ghost"
      class="sm:hidden"
      aria-label="Search"
    />

    <template #content>
      <UCommandPalette
        :groups="groups"
        placeholder="Search merge requests, issues and todos..."
        :fuse="{
          fuseOptions: {
            keys: ['label', 'suffix', 'description', 'reviewerNames', 'issueRefs'],
            threshold: 0.2,
            ignoreLocation: true,
          },
          resultLimit: 20,
        }"
        class="h-72 p-2 sm:h-96"
      />
    </template>
  </UModal>
</template>
