<script setup lang="ts">
import type { AnnotationTool, StickyColor } from "~/types/annotations";

const {
  activeTool,
  drawingColor,
  strokeWidth,
  stickyColor,
  drawingsVisible,
  drawings,
  clearAllDrawings,
} = useAnnotations();

const stickyColors: { id: StickyColor; class: string }[] = [
  { id: "yellow", class: "bg-amber-400" },
  { id: "blue", class: "bg-sky-400" },
  { id: "green", class: "bg-emerald-400" },
  { id: "pink", class: "bg-pink-400" },
  { id: "purple", class: "bg-violet-400" },
];

const drawColors = [
  { value: "#f59e0b", class: "bg-amber-500" },
  { value: "#ef4444", class: "bg-red-500" },
  { value: "#3b82f6", class: "bg-blue-500" },
  { value: "#10b981", class: "bg-emerald-500" },
  { value: "#8b5cf6", class: "bg-violet-500" },
  { value: "#6b7280", class: "bg-gray-500" },
];

const showColorPicker = computed(
  () =>
    activeTool.value === "freehand" ||
    activeTool.value === "arrow" ||
    activeTool.value === "rectangle",
);

const showStickyColorPicker = computed(() => activeTool.value === "sticky");

function selectTool(tool: AnnotationTool) {
  activeTool.value = tool;
}
</script>

<template>
  <div class="flex gap-1.5 items-start">
    <!-- Vertical toolbar pill -->
    <div
      class="flex flex-col items-center gap-1 rounded-lg border border-muted bg-default/90 px-1 py-1.5 backdrop-blur shadow-lg"
    >
      <!-- Select -->
      <UTooltip text="Select (V)" :popper="{ placement: 'right' }">
        <UButton
          icon="i-lucide-mouse-pointer-2"
          :variant="activeTool === 'select' ? 'soft' : 'ghost'"
          :color="activeTool === 'select' ? 'primary' : 'neutral'"
          size="xs"
          @click="selectTool('select')"
        />
      </UTooltip>

      <!-- Sticky notes section -->
      <USeparator class="w-4" />

      <UTooltip text="Sticky note (N)" :popper="{ placement: 'right' }">
        <UButton
          icon="i-lucide-sticky-note"
          :variant="activeTool === 'sticky' ? 'soft' : 'ghost'"
          :color="activeTool === 'sticky' ? 'primary' : 'neutral'"
          size="xs"
          @click="selectTool('sticky')"
        />
      </UTooltip>

      <!-- Drawing tools section -->
      <USeparator class="w-4" />

      <UTooltip text="Freehand draw (P)" :popper="{ placement: 'right' }">
        <UButton
          icon="i-lucide-pencil"
          :variant="activeTool === 'freehand' ? 'soft' : 'ghost'"
          :color="activeTool === 'freehand' ? 'primary' : 'neutral'"
          size="xs"
          @click="selectTool('freehand')"
        />
      </UTooltip>

      <UTooltip text="Arrow (A)" :popper="{ placement: 'right' }">
        <UButton
          icon="i-lucide-move-right"
          :variant="activeTool === 'arrow' ? 'soft' : 'ghost'"
          :color="activeTool === 'arrow' ? 'primary' : 'neutral'"
          size="xs"
          @click="selectTool('arrow')"
        />
      </UTooltip>

      <UTooltip text="Rectangle" :popper="{ placement: 'right' }">
        <UButton
          icon="i-lucide-square"
          :variant="activeTool === 'rectangle' ? 'soft' : 'ghost'"
          :color="activeTool === 'rectangle' ? 'primary' : 'neutral'"
          size="xs"
          @click="selectTool('rectangle')"
        />
      </UTooltip>

      <UTooltip
        text="Eraser — click a drawing to delete (E)"
        :popper="{ placement: 'right' }"
      >
        <UButton
          icon="i-lucide-eraser"
          :variant="activeTool === 'eraser' ? 'soft' : 'ghost'"
          :color="activeTool === 'eraser' ? 'primary' : 'neutral'"
          size="xs"
          @click="selectTool('eraser')"
        />
      </UTooltip>

      <!-- Drawing actions -->
      <USeparator class="w-4" />

      <UTooltip
        :text="drawingsVisible ? 'Hide drawings' : 'Show drawings'"
        :popper="{ placement: 'right' }"
      >
        <UButton
          :icon="drawingsVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
          variant="ghost"
          color="neutral"
          size="xs"
          @click="drawingsVisible = !drawingsVisible"
        />
      </UTooltip>

      <UPopover v-if="drawings.length > 0" :popper="{ placement: 'right' }">
        <UTooltip text="Clear all drawings" :popper="{ placement: 'right' }">
          <UButton icon="i-lucide-trash-2" variant="ghost" color="neutral" size="xs" />
        </UTooltip>
        <template #content>
          <div class="p-2 text-center">
            <p class="text-xs text-dimmed mb-2">
              Delete all {{ drawings.length }} drawing
              {{ drawings.length > 1 ? "s" : "" }}?
            </p>
            <UButton
              label="Delete"
              icon="i-lucide-trash-2"
              variant="soft"
              color="error"
              size="xs"
              block
              @click="clearAllDrawings()"
            />
          </div>
        </template>
      </UPopover>
    </div>

    <!-- Side panels: color/width pickers appear to the right of the toolbar -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-x-1"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 -translate-x-1"
    >
      <div
        v-if="showColorPicker"
        class="flex flex-col gap-1.5 rounded-lg border border-muted bg-default/90 px-1.5 py-2 backdrop-blur shadow-lg self-start"
      >
        <div class="flex flex-col items-center gap-1.5">
          <button
            v-for="c in drawColors"
            :key="c.value"
            :class="[
              'size-4 rounded-full border-2 transition-transform',
              c.class,
              drawingColor === c.value ? 'border-white scale-125 shadow-sm' : 'border-transparent hover:scale-110',
            ]"
            @click="drawingColor = c.value"
          />
        </div>
        <USeparator class="w-4 mx-auto" />
        <div class="flex flex-col items-center gap-0.5">
          <UTooltip text="Thin" :popper="{ placement: 'right' }">
            <UButton
              label="S"
              :variant="strokeWidth === 2 ? 'soft' : 'ghost'"
              :color="strokeWidth === 2 ? 'primary' : 'neutral'"
              size="xs"
              @click="strokeWidth = 2"
            />
          </UTooltip>
          <UTooltip text="Medium" :popper="{ placement: 'right' }">
            <UButton
              label="M"
              :variant="strokeWidth === 3 ? 'soft' : 'ghost'"
              :color="strokeWidth === 3 ? 'primary' : 'neutral'"
              size="xs"
              @click="strokeWidth = 3"
            />
          </UTooltip>
          <UTooltip text="Thick" :popper="{ placement: 'right' }">
            <UButton
              label="L"
              :variant="strokeWidth === 5 ? 'soft' : 'ghost'"
              :color="strokeWidth === 5 ? 'primary' : 'neutral'"
              size="xs"
              @click="strokeWidth = 5"
            />
          </UTooltip>
        </div>
      </div>
    </Transition>

    <!-- Sticky note color picker -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-x-1"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 -translate-x-1"
    >
      <div
        v-if="showStickyColorPicker"
        class="flex flex-col items-center gap-1.5 rounded-lg border border-muted bg-default/90 px-1.5 py-2 backdrop-blur shadow-lg self-start"
      >
        <button
          v-for="c in stickyColors"
          :key="c.id"
          :class="[
            'size-4 rounded-sm border-2 transition-transform',
            c.class,
            stickyColor === c.id ? 'border-white scale-125 shadow-sm' : 'border-transparent hover:scale-110',
          ]"
          @click="stickyColor = c.id"
        />
      </div>
    </Transition>
  </div>
</template>
