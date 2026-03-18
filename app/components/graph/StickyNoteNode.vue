<script setup lang="ts">
import DOMPurify from "dompurify";
import { marked } from "marked";
import type { StickyColor } from "~/types/annotations";

const props = defineProps<{
  id: string;
  data: {
    text: string;
    color: StickyColor;
    width: number;
    height: number;
    markdown: boolean;
  };
}>();

const { updateStickyNote, removeStickyNote, activeTool } = useAnnotations();

const CONTENT_PADDING = 20;

const isEditing = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const localText = ref(props.data.text);

// Resize state
const isResizing = ref(false);
const resizeStart = ref({ x: 0, y: 0, w: 0, h: 0 });
const localWidth = ref(props.data.width);
const localHeight = ref(props.data.height);

watch(
  () => [props.data.width, props.data.height],
  ([w, h]) => {
    if (!isResizing.value) {
      localWidth.value = w;
      localHeight.value = h;
    }
  },
);

const renderedMarkdown = computed(() => {
  if (!props.data.markdown || !props.data.text) return "";
  const raw = marked.parse(props.data.text, { async: false }) as string;
  return DOMPurify.sanitize(raw);
});

const markdownRef = ref<HTMLElement | null>(null);
const isOverflowing = ref(false);

function measureOverflow() {
  if (!markdownRef.value) {
    isOverflowing.value = false;
    return;
  }
  isOverflowing.value = markdownRef.value.scrollHeight > markdownRef.value.clientHeight;
}

watch(renderedMarkdown, () => nextTick(measureOverflow));
watch(
  () => [props.data.width, props.data.height],
  () => nextTick(measureOverflow),
);

const colorMap: Record<StickyColor, { bg: string; border: string; shadow: string }> = {
  yellow: {
    bg: "bg-amber-100/60 dark:bg-amber-900/40",
    border: "border-amber-300/50 dark:border-amber-700/50",
    shadow: "shadow-amber-200/50 dark:shadow-amber-900/30",
  },
  blue: {
    bg: "bg-sky-100/60 dark:bg-sky-900/40",
    border: "border-sky-300/50 dark:border-sky-700/50",
    shadow: "shadow-sky-200/50 dark:shadow-sky-900/30",
  },
  green: {
    bg: "bg-emerald-100/60 dark:bg-emerald-900/40",
    border: "border-emerald-300/50 dark:border-emerald-700/50",
    shadow: "shadow-emerald-200/50 dark:shadow-emerald-900/30",
  },
  pink: {
    bg: "bg-pink-100/60 dark:bg-pink-900/40",
    border: "border-pink-300/50 dark:border-pink-700/50",
    shadow: "shadow-pink-200/50 dark:shadow-pink-900/30",
  },
  purple: {
    bg: "bg-violet-100/60 dark:bg-violet-900/40",
    border: "border-violet-300/50 dark:border-violet-700/50",
    shadow: "shadow-violet-200/50 dark:shadow-violet-900/30",
  },
};

const colors = computed(() => colorMap[props.data.color]);

function startEdit() {
  if (activeTool.value !== "select") return;
  isEditing.value = true;
  localText.value = props.data.text;
  nextTick(() => textareaRef.value?.focus());
}

function finishEdit() {
  isEditing.value = false;
  updateStickyNote(props.id, { text: localText.value });
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    finishEdit();
    e.stopPropagation();
  }
  e.stopPropagation();
}

function onDelete() {
  removeStickyNote(props.id);
}

function toggleMarkdown() {
  updateStickyNote(props.id, { markdown: !props.data.markdown });
}

function onResizeStart(e: PointerEvent) {
  e.preventDefault();
  e.stopPropagation();
  isResizing.value = true;
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    w: localWidth.value,
    h: localHeight.value,
  };
  document.addEventListener("pointermove", onResizeMove);
  document.addEventListener("pointerup", onResizeEnd);
}

function onResizeMove(e: PointerEvent) {
  if (!isResizing.value) return;
  const dx = e.clientX - resizeStart.value.x;
  const dy = e.clientY - resizeStart.value.y;
  localWidth.value = Math.max(120, resizeStart.value.w + dx);
  localHeight.value = Math.max(80, resizeStart.value.h + dy);
}

function onResizeEnd() {
  isResizing.value = false;
  document.removeEventListener("pointermove", onResizeMove);
  document.removeEventListener("pointerup", onResizeEnd);
  updateStickyNote(props.id, {
    width: localWidth.value,
    height: localHeight.value,
  });
}

onUnmounted(() => {
  document.removeEventListener("pointermove", onResizeMove);
  document.removeEventListener("pointerup", onResizeEnd);
});
</script>

<template>
  <div
    :class="[
      'group/sticky relative rounded-sm border shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg',
      colors.bg,
      colors.border,
      colors.shadow,
    ]"
    :style="{ width: `${localWidth}px`, minHeight: `${localHeight}px` }"
    @dblclick="startEdit"
  >
    <!-- Action buttons (top-right) -->
    <div
      class="nodrag absolute -top-3 -right-3 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover/sticky:opacity-100"
    >
      <button
        class="flex size-7 items-center justify-center rounded-full bg-default border border-muted text-dimmed transition-colors shadow-sm"
        :class="data.markdown ? 'text-primary' : 'hover:text-primary'"
        @click.stop="toggleMarkdown"
      >
        <UIcon name="i-lucide-pilcrow" class="size-4" />
      </button>
      <button
        class="flex size-7 items-center justify-center rounded-full bg-default border border-muted text-dimmed hover:text-error transition-colors shadow-sm"
        @click.stop="onDelete"
      >
        <UIcon name="i-lucide-x" class="size-4" />
      </button>
    </div>

    <!-- Content -->
    <div class="p-2.5 overflow-hidden">
      <textarea
        v-if="isEditing"
        ref="textareaRef"
        v-model="localText"
        class="nodrag nowheel size-full resize-none border-none bg-transparent text-xs leading-relaxed outline-none placeholder:text-current/40"
        :style="{ minHeight: `${localHeight - CONTENT_PADDING}px` }"
        placeholder="Type your note..."
        @blur="finishEdit"
        @keydown="onKeydown"
      />
      <!-- biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by DOMPurify -->
      <div
        v-else-if="data.markdown && data.text"
        ref="markdownRef"
        :class="[
          'prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed overflow-auto',
          { nowheel: isOverflowing },
        ]"
        :style="{ maxHeight: `${localHeight - CONTENT_PADDING}px` }"
        v-html="renderedMarkdown"
      />
      <div
        v-else
        class="whitespace-pre-wrap text-xs leading-relaxed"
        :class="data.text ? 'text-current' : 'text-current/40 italic'"
      >
        {{ data.text || "Double-click to edit" }}
      </div>
    </div>

    <!-- Resize handle -->
    <div
      class="nodrag absolute right-0 bottom-0 size-3 cursor-nwse-resize opacity-0 transition-opacity group-hover/sticky:opacity-60"
      @pointerdown="onResizeStart"
    >
      <svg class="size-3" viewBox="0 0 12 12">
        <path
          d="M11 1v10H1"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </div>
  </div>
</template>
