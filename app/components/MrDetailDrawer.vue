<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import { getActionRequired } from "~/composables/useActionStatus";
import type { DevBoardMR, DevBoardMRDetail } from "~/types";
import { getProjectInitials } from "~/utils/projectAlias";

const props = defineProps<{
  mr: DevBoardMR | null;
}>();

const open = defineModel<boolean>("open", { default: false });

const { fetchMrDetail } = useGitlab();
const { status: authStatus } = useGitlabAuth();
const now = useNow();
const { copy } = useClipboard();

const detail = ref<DevBoardMRDetail | null>(null);
const loadingDetail = ref(false);
const copiedField = ref<string | null>(null);

const action = computed(() => {
  if (!detail.value) return "waiting";
  return getActionRequired(detail.value, authStatus.value?.username ?? "");
});

function copyToClipboard(value: string, field: string) {
  copy(value);
  copiedField.value = field;
  setTimeout(() => {
    copiedField.value = null;
  }, COPY_FEEDBACK_MS);
}

const SAFE_PATH_RE = /^[\w.\-/]+$/;

function getDependencyUrl(dep: string): string | null {
  if (!detail.value?.webUrl) return null;
  const match = dep.match(/^(?:(.+)!)?!?(\d+)$/);
  if (!match) return null;
  const projectPath = match[1];
  const iid = match[2];
  const baseMatch = detail.value.webUrl.match(/^(https?:\/\/[^/]+)/);
  if (!baseMatch) return null;
  const host = baseMatch[1];
  if (projectPath) {
    if (!SAFE_PATH_RE.test(projectPath)) return null;
    return `${host}/${projectPath}/-/merge_requests/${iid}`;
  }
  const projectMatch = detail.value.webUrl.match(
    /^https?:\/\/[^/]+\/(.+)\/-\/merge_requests/,
  );
  if (!projectMatch) return null;
  return `${host}/${projectMatch[1]}/-/merge_requests/${iid}`;
}

watch(
  () => props.mr,
  async (newMr) => {
    if (!newMr) {
      detail.value = null;
      return;
    }
    loadingDetail.value = true;
    detail.value = await fetchMrDetail(newMr.projectId, newMr.iid);
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
    :title="mr ? `!${mr.iid} ${mr.title}` : ''"
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
                aria-label="Copy MR reference"
                @click="copyToClipboard(`${detail.projectPath}!${detail.iid}`, 'ref')"
              />
            </div>
            <h2
              class="truncate text-lg font-semibold"
              :title="`!${detail.iid} ${detail.title}`"
            >
              !{{ detail.iid }} {{ detail.title }}
            </h2>
          </div>
          <StatusBadge :status="detail.status" />
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <ActionBadge :action="action" />
          <PipelineBadge
            :status="detail.pipeline.status"
            :web-url="detail.pipeline.webUrl"
          />
          <ThreadsBadge :count="detail.unresolvedThreads" />
          <ApprovalBadge
            :approved="detail.approvals.approved"
            :required="detail.approvals.required"
          />
          <UBadge
            v-if="detail.hasConflicts"
            color="error"
            variant="subtle"
            size="sm"
            icon="i-lucide-alert-triangle"
            label="Conflicts"
          />
          <UBadge
            v-if="detail.needsRebase && action !== 'rebase'"
            color="error"
            variant="subtle"
            size="sm"
            icon="i-lucide-git-branch"
            label="Rebase needed"
          />
        </div>

        <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <p class="text-dimmed text-xs">Source</p>
            <div class="flex items-center gap-1">
              <p
                class="min-w-0 truncate font-mono text-xs"
                :title="detail.sourceBranch"
              >
                {{ detail.sourceBranch }}
              </p>
              <UButton
                :icon="copiedField === 'source' ? 'i-lucide-check' : 'i-lucide-copy'"
                :color="copiedField === 'source' ? 'success' : 'neutral'"
                variant="ghost"
                size="xs"
                class="shrink-0"
                aria-label="Copy source branch"
                @click="copyToClipboard(detail.sourceBranch, 'source')"
              />
            </div>
          </div>
          <div>
            <p class="text-dimmed text-xs">Target</p>
            <div class="flex items-center gap-1">
              <p
                class="min-w-0 truncate font-mono text-xs"
                :title="detail.targetBranch"
              >
                {{ detail.targetBranch }}
              </p>
              <UButton
                :icon="copiedField === 'target' ? 'i-lucide-check' : 'i-lucide-copy'"
                :color="copiedField === 'target' ? 'success' : 'neutral'"
                variant="ghost"
                size="xs"
                class="shrink-0"
                aria-label="Copy target branch"
                @click="copyToClipboard(detail.targetBranch, 'target')"
              />
            </div>
          </div>
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
        </div>

        <div v-if="detail.reviewers.length > 0">
          <p class="text-dimmed text-xs mb-1">Reviewers</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="reviewer in detail.reviewers"
              :key="reviewer.username"
              class="flex items-center gap-1.5 text-sm"
            >
              <UAvatar :src="reviewer.avatarUrl" :alt="reviewer.name" size="xs" />
              <span>{{ reviewer.name }}</span>
            </div>
          </div>
        </div>

        <div v-if="detail.labels.length > 0">
          <p class="text-dimmed text-xs mb-1">Labels</p>
          <div class="flex flex-wrap gap-1">
            <ScopedLabel v-for="label in detail.labels" :key="label" :label="label" />
          </div>
        </div>

        <div v-if="detail.closingIssues.length > 0">
          <p class="text-dimmed text-xs mb-1">Closing issues</p>
          <div class="flex flex-col gap-1">
            <a
              v-for="issue in detail.closingIssues"
              :key="issue.id"
              :href="isSafeUrl(issue.webUrl) ? issue.webUrl : undefined"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <UIcon name="i-lucide-circle-dot" class="size-4" />
              {{ issue.reference }} — {{ issue.title }}
            </a>
          </div>
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
              <UIcon name="i-lucide-git-pull-request" class="size-4" />
              {{ rmr.reference }} — {{ rmr.title }}
              <StatusBadge :status="rmr.status" />
            </a>
          </div>
        </div>

        <div v-if="detail.dependsOnMrs.length > 0">
          <p class="text-dimmed text-xs mb-1">Dependencies</p>
          <div class="flex flex-wrap gap-1">
            <a
              v-for="dep in detail.dependsOnMrs"
              :key="dep"
              :href="isSafeUrl(getDependencyUrl(dep)) ? getDependencyUrl(dep) : undefined"
              :target="getDependencyUrl(dep) ? '_blank' : undefined"
              rel="noopener noreferrer"
            >
              <UBadge
                color="neutral"
                variant="subtle"
                size="sm"
                icon="i-lucide-link"
                :label="dep"
                :class="{ 'cursor-pointer hover:opacity-80': getDependencyUrl(dep) }"
              />
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
