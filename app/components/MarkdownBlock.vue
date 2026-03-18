<script setup lang="ts">
import DOMPurify from "dompurify";
import { marked } from "marked";

const COLLAPSED_HEIGHT = 512; // 32rem

const props = defineProps<{
  content: string;
}>();

const rendered = computed(() => {
  const raw = marked.parse(props.content, { async: false }) as string;
  return DOMPurify.sanitize(raw);
});

const expanded = ref(false);
const contentRef = ref<HTMLElement | null>(null);
const isOverflowing = ref(false);
const scrollHeight = ref(COLLAPSED_HEIGHT);

function measure() {
  if (!contentRef.value) return;
  scrollHeight.value = contentRef.value.scrollHeight;
  isOverflowing.value = scrollHeight.value > COLLAPSED_HEIGHT;
}

watch(rendered, () => {
  expanded.value = false;
  nextTick(measure);
});

onMounted(measure);

const maxHeight = computed(() =>
  expanded.value ? `${scrollHeight.value}px` : `${COLLAPSED_HEIGHT}px`,
);
</script>

<template>
  <div class="relative">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div
      ref="contentRef"
      class="prose prose-sm dark:prose-invert max-w-none p-4 shadow-inner rounded-lg bg-muted overflow-hidden transition-[max-height] duration-300 ease-in-out"
      :style="{ maxHeight }"
      v-html="rendered"
    />
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOverflowing && !expanded"
        class="absolute inset-x-0 bottom-0 flex justify-center rounded-b-lg bg-linear-to-t from-muted to-transparent pt-8 pb-1"
      >
        <UButton
          label="See more"
          icon="i-lucide-chevron-down"
          variant="soft"
          color="neutral"
          size="xs"
          @click="expanded = true"
        />
      </div>
    </Transition>
    <div v-if="expanded && isOverflowing" class="flex justify-center pt-1">
      <UButton
        label="See less"
        icon="i-lucide-chevron-up"
        variant="soft"
        color="neutral"
        size="xs"
        @click="expanded = false"
      />
    </div>
  </div>
</template>
