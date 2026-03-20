<script setup lang="ts">
const { helpOpen } = useHelp();
const { meta } = useProvider();

const shortcutGroups = [
  {
    title: "Navigation",
    icon: "i-lucide-compass",
    shortcuts: [
      { keys: ["Cmd", "K"], description: "Quick search" },
      { keys: ["T"], description: "Toggle inbox panel" },
      { keys: ["W"], description: "Toggle worktree panel" },
      { keys: ["Escape"], description: "Close panel / drawer" },
    ],
  },
  {
    title: "Actions",
    icon: "i-lucide-zap",
    shortcuts: [
      { keys: ["R"], description: "Refresh all data" },
      { keys: ["Cmd", "Click"], description: `Open MR in ${meta.name}` },
    ],
  },
  {
    title: "Annotations",
    icon: "i-lucide-pencil",
    shortcuts: [
      { keys: ["V"], description: "Select tool" },
      { keys: ["N"], description: "Sticky note tool" },
      { keys: ["P"], description: "Freehand draw tool" },
      { keys: ["A"], description: "Arrow tool" },
      { keys: ["E"], description: "Eraser — click a drawing to delete" },
      { keys: ["Escape"], description: "Back to select tool" },
    ],
  },
  {
    title: "Help",
    icon: "i-lucide-life-buoy",
    shortcuts: [{ keys: ["?"], description: "Toggle this shortcuts panel" }],
  },
];

const tips = [
  {
    icon: "i-lucide-git-branch",
    text: 'Add "Depends on !N" in MR descriptions to see dependency edges.',
  },
  {
    icon: "i-lucide-move",
    text: "Drag nodes to rearrange — positions are saved automatically.",
  },
  {
    icon: "i-lucide-filter",
    text: "Use filters to focus on your role, project, or pipeline status.",
  },
  {
    icon: "i-lucide-group",
    text: "Group nodes by project or status using the toolbar.",
  },
  {
    icon: "i-lucide-sticky-note",
    text: "Add sticky notes and drawings to annotate your board — they persist locally.",
  },
];
</script>

<template>
  <UModal v-model:open="helpOpen" :ui="{ width: 'sm:max-w-lg' }">
    <template #content>
      <UCard
        :ui="{
          header: 'flex items-center justify-between',
          body: 'space-y-5',
        }"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-keyboard" class="size-5 text-primary" />
            <h3 class="text-base font-semibold">Keyboard shortcuts</h3>
          </div>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            size="xs"
            aria-label="Close"
            @click="helpOpen = false"
          />
        </template>

        <div v-for="group in shortcutGroups" :key="group.title" class="space-y-2">
          <div class="flex items-center gap-1.5">
            <UIcon :name="group.icon" class="size-3.5 text-dimmed" />
            <span class="text-xs font-medium text-dimmed uppercase">
              {{ group.title }}
            </span>
          </div>
          <div class="space-y-1">
            <div
              v-for="shortcut in group.shortcuts"
              :key="shortcut.description"
              class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-elevated"
            >
              <span>{{ shortcut.description }}</span>
              <span class="flex items-center gap-1">
                <UKbd v-for="key in shortcut.keys" :key="key" :value="key" size="sm" />
              </span>
            </div>
          </div>
        </div>

        <USeparator />

        <div class="space-y-2">
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-lightbulb" class="size-3.5 text-dimmed" />
            <span class="text-xs font-medium text-dimmed uppercase">Tips</span>
          </div>
          <div class="space-y-1">
            <div
              v-for="tip in tips"
              :key="tip.text"
              class="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm"
            >
              <UIcon :name="tip.icon" class="mt-0.5 size-4 shrink-0 text-dimmed" />
              <span class="text-dimmed">{{ tip.text }}</span>
            </div>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
