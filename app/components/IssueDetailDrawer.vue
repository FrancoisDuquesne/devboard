<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import type { DevBoardIssue, DevBoardIssueDetail } from "~/types";
import { getProjectInitials } from "~/utils/projectAlias";

const props = defineProps<{
  issue: DevBoardIssue | null;
}>();

const open = defineModel<boolean>("open", { default: false });

const { fetchIssueDetail } = useIssues();
const now = useNow();
const { copy } = useClipboard();

const detail = ref<DevBoardIssueDetail | null>(null);
const loadingDetail = ref(false);
const copiedField = ref<string | null>(null);

function copyToClipboard(value: string, field: string) {
  copy(value);
  copiedField.value = field;
  setTimeout(() => {
    copiedField.value = null;
  }, COPY_FEEDBACK_MS);
}

watch(
  () => props.issue,
  async (newIssue) => {
    if (!newIssue) {
      detail.value = null;
      return;
    }
    loadingDetail.value = true;
    detail.value = await fetchIssueDetail(newIssue.projectId, newIssue.iid);
    loadingDetail.value = false;
  },
);

function openInGitLab() {
  safeOpen(detail.value?.webUrl);
}
</script>

<template>
  <USlideover
    v-model:open="open"
    side="right"
    :overlay="false"
    :title="issue ? `#${issue.iid} ${issue.title}` : ''"
  >
    <template #body>
      <div v-if="loadingDetail" class="flex flex-col gap-4 p-4">
        <USkeleton class="h-6 w-3/4 rounded" />
        <USkeleton class="h-4 w-1/2 rounded" />
        <USkeleton class="h-20 rounded" />
        <USkeleton class="h-4 w-2/3 rounded" />
      </div>

      <div v-else-if="detail" class="flex flex-col gap-5 p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1">
              <p class="text-sm text-dimmed truncate" :title="detail.projectPath">
                {{ getProjectInitials(detail.projectPath) }}
              </p>
              <UButton
                :icon="copiedField === 'ref' ? 'i-lucide-check' : 'i-lucide-copy'"
                :color="copiedField === 'ref' ? 'success' : 'neutral'"
                variant="ghost"
                size="xs"
                class="shrink-0"
                aria-label="Copy issue reference"
                @click="copyToClipboard(`${detail.projectPath}#${detail.iid}`, 'ref')"
              />
            </div>
            <h2
              class="truncate text-lg font-semibold"
              :title="`#${detail.iid} ${detail.title}`"
            >
              #{{ detail.iid }} {{ detail.title }}
            </h2>
          </div>
          <UBadge
            :color="detail.state === 'closed' ? 'info' : 'success'"
            variant="subtle"
            size="sm"
            :icon="detail.state === 'closed' ? 'i-lucide-circle-check' : 'i-lucide-circle-dot'"
            :label="detail.state === 'closed' ? 'Closed' : 'Open'"
          />
        </div>

        <div v-if="detail.labels.length > 0">
          <p class="text-dimmed text-xs mb-1">Labels</p>
          <div class="flex flex-wrap gap-1">
            <ScopedLabel v-for="label in detail.labels" :key="label" :label="label" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <p class="text-dimmed text-xs">Author</p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <UAvatar
                :src="detail.author.avatarUrl"
                :alt="detail.author.name"
                size="xs"
              />
              <span>{{ detail.author.name }}</span>
            </div>
          </div>
          <div>
            <p class="text-dimmed text-xs">Updated</p>
            <p>{{ timeAgo(detail.updatedAt, now) }}</p>
          </div>
          <div>
            <p class="text-dimmed text-xs">Created</p>
            <p>{{ timeAgo(detail.createdAt, now) }}</p>
          </div>
          <div v-if="detail.closedAt">
            <p class="text-dimmed text-xs">Closed</p>
            <p>{{ timeAgo(detail.closedAt, now) }}</p>
          </div>
        </div>

        <div v-if="detail.assignees.length > 0">
          <p class="text-dimmed text-xs mb-1">Assignees</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="assignee in detail.assignees"
              :key="assignee.username"
              class="flex items-center gap-1.5 text-sm"
            >
              <UAvatar :src="assignee.avatarUrl" :alt="assignee.name" size="xs" />
              <span>{{ assignee.name }}</span>
            </div>
          </div>
        </div>

        <div v-if="detail.description" class="text-sm">
          <p class="text-dimmed text-xs mb-1">Description</p>
          <MarkdownBlock :content="detail.description" />
        </div>

        <div v-if="detail.relatedMrs.length > 0">
          <p class="text-dimmed text-xs mb-1">Related merge requests</p>
          <div class="flex flex-col gap-1">
            <a
              v-for="rmr in detail.relatedMrs"
              :key="rmr.iid"
              :href="isSafeUrl(rmr.webUrl) ? rmr.webUrl : undefined"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <UIcon name="i-lucide-git-pull-request" class="size-4 shrink-0" />
              {{ rmr.reference }} — {{ rmr.title }}
              <StatusBadge :status="rmr.status" />
            </a>
          </div>
        </div>

        <UButton
          label="Open in GitLab"
          icon="i-lucide-external-link"
          variant="soft"
          color="primary"
          block
          @click="openInGitLab"
        />
      </div>
    </template>
  </USlideover>
</template>
