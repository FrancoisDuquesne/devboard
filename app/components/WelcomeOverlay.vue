<script setup lang="ts">
const { welcomeOpen, dismissWelcome } = useOnboarding();
const { helpOpen } = useHelp();
const { meta } = useProvider();

const features = [
  {
    icon: "i-lucide-plug",
    title: `Connect to ${meta.name}`,
    description: `Run "${meta.authCliCommand}" to connect instantly, or set ${meta.authEnvVars.host} and ${meta.authEnvVars.token} in a .env file. The token needs ${meta.authTokenScope} scope.`,
  },
  {
    icon: "i-lucide-workflow",
    title: "MR dependency graph",
    description:
      'Your merge requests as an interactive graph. Add "Depends on !N" in MR descriptions to see dependency edges.',
  },
  {
    icon: "i-lucide-search",
    title: "Quick search",
    description:
      "Press Cmd+K to instantly find any merge request by title, branch, or project.",
    kbd: ["Cmd", "K"],
  },
  {
    icon: "i-lucide-bell",
    title: "Inbox & notifications",
    description:
      "Press T to open your inbox with todos, mentions, and items needing attention.",
    kbd: ["T"],
  },
  {
    icon: "i-lucide-filter",
    title: "Filters & grouping",
    description:
      "Filter by role, project, or pipeline status. Group nodes by project or status.",
  },
  {
    icon: "i-lucide-keyboard",
    title: "Keyboard shortcuts",
    description: "Press ? anytime to see all available shortcuts and pro tips.",
    kbd: ["?"],
  },
];

function viewShortcuts() {
  dismissWelcome();
  helpOpen.value = true;
}
</script>

<template>
  <UModal v-model:open="welcomeOpen" prevent-close :ui="{ width: 'sm:max-w-xl' }">
    <template #content>
      <UCard
        :ui="{
          header: 'text-center pb-0',
          body: 'space-y-4',
          footer: 'flex items-center justify-between',
        }"
      >
        <template #header>
          <div class="flex flex-col items-center gap-2 py-2">
            <div
              class="flex items-center justify-center size-12 rounded-xl bg-primary/10"
            >
              <UIcon name="i-lucide-workflow" class="size-6 text-primary" />
            </div>
            <h2 class="text-lg font-semibold">Welcome to DevBoard</h2>
            <p class="text-sm text-dimmed">
              Your real-time {{ meta.name }} {{ meta.mrLabel }} dashboard. Here's how to
              get started.
            </p>
          </div>
        </template>

        <div class="grid gap-3">
          <div
            v-for="(feature, i) in features"
            :key="feature.title"
            class="flex items-start gap-3 rounded-lg border border-muted p-3"
          >
            <div
              class="flex items-center justify-center size-8 shrink-0 rounded-lg bg-primary/10"
            >
              <UIcon :name="feature.icon" class="size-4 text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-primary">{{ i + 1 }}</span>
                <span class="text-sm font-medium">{{ feature.title }}</span>
                <span v-if="feature.kbd" class="ml-auto flex items-center gap-0.5">
                  <UKbd v-for="key in feature.kbd" :key="key" :value="key" size="sm" />
                </span>
              </div>
              <p class="mt-0.5 text-xs text-dimmed leading-relaxed">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>

        <template #footer>
          <UButton
            label="View shortcuts"
            variant="ghost"
            color="neutral"
            icon="i-lucide-keyboard"
            @click="viewShortcuts"
          />
          <UButton
            label="Get started"
            icon="i-lucide-arrow-right"
            trailing
            @click="dismissWelcome"
          />
        </template>
      </UCard>
    </template>
  </UModal>
</template>
