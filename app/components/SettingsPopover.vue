<script setup lang="ts">
const { status, loading: connectionLoading, checkConnection } = useGitlabAuth();
const { autoRefreshInterval } = usePreferences();
const { enabled: worktreesEnabled, configured, scanDirs } = useWorktrees();
const { helpOpen } = useHelp();
const { resetWelcome } = useOnboarding();
const colorMode = useColorMode();

const intervalOptions = [
  { label: "Disabled", value: 0 },
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
];

function toggleColorMode() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>

<template>
  <UPopover :popper="{ placement: 'bottom-end' }">
    <UButton
      icon="i-lucide-settings"
      variant="ghost"
      color="neutral"
      aria-label="Settings"
    />

    <template #content>
      <div class="w-64 space-y-4 p-4 sm:w-72">
        <!-- Connection -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-dimmed">Connection</p>
          <div class="flex items-center gap-1.5 text-sm">
            <span
              class="size-2 shrink-0 rounded-full"
              :class="status?.connected ? 'bg-success' : 'bg-error'"
            />
            <span v-if="status?.connected">
              {{ status.username }}
              <span class="text-xs text-dimmed">@ {{ status.host }}</span>
            </span>
            <span v-else-if="status" class="text-error">Disconnected</span>
            <span v-else class="text-dimmed">Checking...</span>
          </div>
          <div v-if="status && !status.connected" class="space-y-1.5">
            <p class="text-xs text-dimmed">
              Run
              <code class="rounded bg-muted px-1 py-0.5">glab auth login</code>
              or add to
              <code class="rounded bg-muted px-1 py-0.5">.env</code>:
            </p>
            <pre
              class="rounded-md bg-muted px-2 py-1 text-xs leading-relaxed"
            ><code>GITLAB_HOST=gitlab.example.com
GITLAB_PRIVATE_TOKEN=glpat-xxxx</code></pre>
            <p class="text-xs text-dimmed">Then restart the dev server.</p>
          </div>
        </div>

        <USeparator />

        <!-- Auto-refresh -->
        <div>
          <p class="mb-2 text-xs font-medium text-dimmed">Auto-refresh</p>
          <USelect
            v-model="autoRefreshInterval"
            :items="intervalOptions"
            value-key="value"
            variant="soft"
            aria-label="Auto-refresh interval"
            class="w-full"
          />
        </div>

        <USeparator />

        <!-- Worktrees -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium text-dimmed">Worktrees</p>
            <USwitch
              v-model="worktreesEnabled"
              size="sm"
              aria-label="Enable worktrees"
            />
          </div>
          <template v-if="worktreesEnabled">
            <div v-if="configured" class="flex flex-wrap gap-1">
              <UBadge
                v-for="dir in scanDirs"
                :key="dir"
                color="neutral"
                variant="subtle"
                size="sm"
                icon="i-lucide-folder"
                :label="dir"
              />
            </div>
            <p v-else class="text-xs text-dimmed">
              Set
              <code class="rounded bg-muted px-1 py-0.5">WORKTREE_SCAN_DIRS</code>
              in your
              <code class="rounded bg-muted px-1 py-0.5">.env</code>
              to scan for git worktrees, then restart the dev server.
            </p>
          </template>
        </div>

        <USeparator />

        <!-- Theme -->
        <div>
          <button
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-elevated"
            @click="toggleColorMode"
          >
            <UIcon
              :name="colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
              class="size-4 text-dimmed"
            />
            <span>{{ colorMode.value === "dark" ? "Dark mode" : "Light mode" }}</span>
            <span class="ml-auto text-xs text-dimmed">Toggle</span>
          </button>
        </div>

        <USeparator />

        <!-- Help -->
        <div class="space-y-1">
          <button
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-elevated"
            @click="helpOpen = true"
          >
            <UIcon name="i-lucide-keyboard" class="size-4 text-dimmed" />
            <span>Keyboard shortcuts</span>
            <UKbd value="?" size="sm" class="ml-auto" />
          </button>
          <button
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-elevated"
            @click="resetWelcome"
          >
            <UIcon name="i-lucide-hand" class="size-4 text-dimmed" />
            <span>Show welcome guide</span>
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>
