<script setup lang="ts">
import type { ScanDirSuggestion } from "~/types";

const {
  configured,
  configLocked,
  scanDirs: currentDirs,
  fetchScanDirsConfig,
  saveScanDirs,
} = useWorktrees();

const suggestions = ref<ScanDirSuggestion[]>([]);
const selectedDirs = ref<string[]>([]);
const customPath = ref("");
const saving = ref(false);
const loadingSuggestions = ref(false);

const hasChanges = computed(() => {
  const current = new Set(currentDirs.value);
  const selected = new Set(selectedDirs.value);
  if (current.size !== selected.size) return true;
  for (const d of current) {
    if (!selected.has(d)) return true;
  }
  return false;
});

async function loadConfig() {
  loadingSuggestions.value = true;
  const config = await fetchScanDirsConfig();
  if (config) {
    suggestions.value = config.suggestions;
    selectedDirs.value = [...config.scanDirs];
  }
  loadingSuggestions.value = false;
}

function toggleDir(path: string) {
  const idx = selectedDirs.value.indexOf(path);
  if (idx >= 0) {
    selectedDirs.value.splice(idx, 1);
  } else {
    selectedDirs.value.push(path);
  }
}

function addCustomPath() {
  const path = customPath.value.trim();
  if (!path || selectedDirs.value.includes(path)) return;
  selectedDirs.value.push(path);
  customPath.value = "";
}

function removeDir(path: string) {
  selectedDirs.value = selectedDirs.value.filter((d) => d !== path);
}

async function save() {
  saving.value = true;
  await saveScanDirs(selectedDirs.value);
  saving.value = false;
}

onMounted(loadConfig);
</script>

<template>
  <div class="space-y-2">
    <!-- Locked: env var controls config -->
    <template v-if="configLocked">
      <p class="text-xs text-dimmed">
        Configured via
        <code class="rounded bg-muted px-1 py-0.5">WORKTREE_SCAN_DIRS</code>
      </p>
      <div class="flex flex-wrap gap-1">
        <UBadge
          v-for="dir in currentDirs"
          :key="dir"
          color="neutral"
          variant="subtle"
          size="sm"
          icon="i-lucide-folder"
          :label="dir"
        />
      </div>
    </template>

    <!-- Editable config -->
    <template v-else>
      <!-- Current dirs as removable chips -->
      <div v-if="selectedDirs.length > 0" class="flex flex-wrap gap-1">
        <UBadge
          v-for="dir in selectedDirs"
          :key="dir"
          color="primary"
          variant="subtle"
          size="sm"
          icon="i-lucide-folder"
          :label="dir"
          class="cursor-pointer"
          @click="removeDir(dir)"
        >
          <template #trailing>
            <UIcon name="i-lucide-x" class="size-3" />
          </template>
        </UBadge>
      </div>

      <!-- Suggestions -->
      <div
        v-if="loadingSuggestions"
        class="flex items-center gap-1.5 text-xs text-dimmed"
      >
        <UIcon name="i-lucide-loader" class="size-3 animate-spin" />
        <span>Scanning directories...</span>
      </div>
      <template v-else-if="suggestions.length > 0">
        <p class="text-xs text-dimmed">Suggested directories:</p>
        <div class="flex flex-wrap gap-1">
          <UBadge
            v-for="s in suggestions"
            :key="s.path"
            :color="selectedDirs.includes(s.path) ? 'primary' : 'neutral'"
            variant="subtle"
            size="sm"
            icon="i-lucide-folder"
            :label="s.label"
            class="cursor-pointer"
            @click="toggleDir(s.path)"
          />
        </div>
      </template>
      <p v-else class="text-xs text-dimmed">
        No common directories found. Add a custom path below.
      </p>

      <!-- Custom path input -->
      <div class="flex items-center gap-1">
        <UInput
          v-model="customPath"
          placeholder="/absolute/path"
          size="xs"
          class="flex-1"
          @keydown.enter="addCustomPath"
        />
        <UButton
          icon="i-lucide-plus"
          size="xs"
          variant="soft"
          color="neutral"
          :disabled="!customPath.trim()"
          aria-label="Add path"
          @click="addCustomPath"
        />
      </div>

      <!-- Save -->
      <UButton
        v-if="hasChanges"
        label="Save"
        size="xs"
        color="primary"
        :loading="saving"
        block
        @click="save"
      />
    </template>
  </div>
</template>
