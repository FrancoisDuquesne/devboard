<script setup lang="ts">
const { status, loading: connectionLoading, checkConnection } = useGitlabAuth();
const { autoRefreshInterval, mrScopes, fetchTodosEnabled, fetchIssuesEnabled } =
  usePreferences();
const { enabled: worktreesEnabled, configured, scanDirs } = useWorktrees();

function toggleScope(scope: "authored" | "assigned" | "reviewer") {
  const idx = mrScopes.value.indexOf(scope);
  if (idx >= 0) {
    if (mrScopes.value.length > 1) {
      mrScopes.value.splice(idx, 1);
    }
  } else {
    mrScopes.value.push(scope);
  }
}

const connectionStatus = computed(() => {
  if (connectionLoading.value) return "loading";
  if (!status.value) return "unknown";
  return status.value.connected ? "connected" : "disconnected";
});
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
        <!-- GitLab -->
        <div class="space-y-3">
          <p class="text-xs font-medium text-dimmed">GitLab</p>
          <div class="flex items-center gap-1.5 rounded-md bg-muted p-1.5 text-sm">
            <UIcon
              v-if="connectionStatus === 'connected'"
              name="i-lucide-check-circle"
              class="size-3.5 shrink-0 text-success"
            />
            <UIcon
              v-else-if="connectionStatus === 'loading'"
              name="i-lucide-loader"
              class="size-3.5 shrink-0 animate-spin text-dimmed"
            />
            <UIcon
              v-else
              name="i-lucide-x-circle"
              class="size-3.5 shrink-0 text-error"
            />
            <span v-if="status?.connected">
              {{ status.username }}
              <span class="text-xs text-dimmed">@ {{ status.host }}</span>
            </span>
            <span v-else-if="connectionStatus === 'loading'" class="text-dimmed">
              Connecting...
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
              class="rounded-md bg-elevated px-2 py-1 text-xs leading-relaxed"
            ><code>GITLAB_HOST=gitlab.example.com
GITLAB_PRIVATE_TOKEN=glpat-xxxx</code></pre>
            <p class="text-xs text-dimmed">Then restart the dev server.</p>
            <UButton
              icon="i-lucide-refresh-cw"
              label="Retry connection"
              variant="soft"
              color="neutral"
              size="xs"
              block
              :loading="connectionLoading"
              @click="checkConnection()"
            />
          </div>

          <template v-if="status?.connected">
            <!-- Data sources -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 px-2">
                <UIcon name="i-lucide-git-pull-request" class="size-4 text-dimmed" />
                <span class="text-sm">Merge requests</span>
              </div>
              <div class="flex flex-wrap gap-1 pl-8">
                <UButton
                  v-for="scope in (['authored', 'assigned', 'reviewer'] as const)"
                  :key="scope"
                  :variant="mrScopes.includes(scope) ? 'soft' : 'outline'"
                  :color="mrScopes.includes(scope) ? 'primary' : 'neutral'"
                  size="xs"
                  :aria-label="`Fetch ${scope} MRs`"
                  @click="toggleScope(scope)"
                >
                  {{ scope.charAt(0).toUpperCase() + scope.slice(1) }}
                </UButton>
              </div>
            </div>

            <div class="flex items-center justify-between px-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-list-todo" class="size-4 text-dimmed" />
                <span class="text-sm">Todos</span>
              </div>
              <USwitch v-model="fetchTodosEnabled" size="sm" aria-label="Fetch todos" />
            </div>

            <div class="flex items-center justify-between px-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-circle-dot" class="size-4 text-dimmed" />
                <span class="text-sm">Issues</span>
              </div>
              <USwitch
                v-model="fetchIssuesEnabled"
                size="sm"
                aria-label="Fetch issues"
              />
            </div>

            <!-- Auto-refresh -->
            <div class="flex items-center justify-between gap-3 px-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-refresh-cw" class="size-4 text-dimmed" />
                <span class="text-sm">Auto-refresh</span>
              </div>
              <USelect
                v-model="autoRefreshInterval"
                :items="intervalOptions"
                value-key="value"
                variant="soft"
                aria-label="Auto-refresh interval"
                class="w-28"
              />
            </div>
          </template>
        </div>

        <USeparator />

        <!-- Worktrees -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-dimmed">Worktrees</p>
          <div class="flex items-center justify-between px-2">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-git-branch" class="size-4 text-dimmed" />
              <span class="text-sm">Scan directories</span>
            </div>
            <USwitch
              v-model="worktreesEnabled"
              size="sm"
              aria-label="Enable worktrees"
            />
          </div>
          <template v-if="worktreesEnabled">
            <div v-if="configured" class="flex flex-wrap gap-1 pl-8">
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
            <p v-else class="pl-8 text-xs text-dimmed">
              Set
              <code class="rounded bg-muted px-1 py-0.5">WORKTREE_SCAN_DIRS</code>
              in your
              <code class="rounded bg-muted px-1 py-0.5">.env</code>
              to scan for git worktrees, then restart the dev server.
            </p>
          </template>
        </div>

        <USeparator />

        <!-- Quick actions -->
        <div class="space-y-0.5">
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
            <UIcon name="i-lucide-circle-help" class="size-4 text-dimmed" />
            <span>Welcome guide</span>
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>
