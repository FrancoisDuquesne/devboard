<script setup lang="ts">
import type { Drawing, DrawingPoint } from "~/types/annotations";

const props = defineProps<{
  viewport: { x: number; y: number; zoom: number };
}>();

const { drawings, activeTool, drawingColor, strokeWidth, addDrawing, removeDrawing } =
  useAnnotations();

const svgRef = ref<SVGSVGElement | null>(null);
const isDrawing = ref(false);
const currentPoints = ref<DrawingPoint[]>([]);

const isDrawingTool = computed(
  () =>
    activeTool.value === "freehand" ||
    activeTool.value === "arrow" ||
    activeTool.value === "rectangle",
);

const isEraser = computed(() => activeTool.value === "eraser");

// Interactive mode: drawing tools or eraser need pointer events
const isInteractive = computed(() => isDrawingTool.value || isEraser.value);

function screenToGraph(clientX: number, clientY: number): DrawingPoint {
  if (!svgRef.value) return { x: 0, y: 0 };
  const rect = svgRef.value.getBoundingClientRect();
  const { x: vx, y: vy, zoom } = props.viewport;
  return {
    x: (clientX - rect.left - vx) / zoom,
    y: (clientY - rect.top - vy) / zoom,
  };
}

function onPointerDown(e: PointerEvent) {
  if (!isDrawingTool.value) return;
  if (e.button !== 0) return;

  isDrawing.value = true;
  const pt = screenToGraph(e.clientX, e.clientY);
  currentPoints.value = [pt];

  (e.target as Element)?.setPointerCapture?.(e.pointerId);
  e.preventDefault();
  e.stopPropagation();
}

function onPointerMove(e: PointerEvent) {
  if (!isDrawing.value) return;
  const pt = screenToGraph(e.clientX, e.clientY);

  if (activeTool.value === "freehand") {
    currentPoints.value = [...currentPoints.value, pt];
  } else {
    currentPoints.value = [currentPoints.value[0], pt];
  }
  e.preventDefault();
  e.stopPropagation();
}

function onPointerUp(e: PointerEvent) {
  if (!isDrawing.value) return;
  isDrawing.value = false;

  if (currentPoints.value.length < 2) {
    currentPoints.value = [];
    return;
  }

  const start = currentPoints.value[0];
  const end = currentPoints.value[currentPoints.value.length - 1];
  const dist = Math.hypot(end.x - start.x, end.y - start.y);
  if (dist < 5) {
    currentPoints.value = [];
    return;
  }

  addDrawing(activeTool.value as "freehand" | "arrow" | "rectangle", [
    ...currentPoints.value,
  ]);
  currentPoints.value = [];
  e.preventDefault();
  e.stopPropagation();
}

function onEraserClick(drawing: Drawing) {
  if (!isEraser.value) return;
  removeDrawing(drawing.id);
}

function buildFreehandPath(points: DrawingPoint[]): string {
  if (points.length < 2) return "";
  const parts = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`L ${points[i].x} ${points[i].y}`);
  }
  return parts.join(" ");
}

function buildArrowPath(points: DrawingPoint[]): { line: string; head: string } | null {
  if (points.length < 2) return null;
  const start = points[0];
  const end = points[points.length - 1];
  const line = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLen = 14;
  const a1 = angle - Math.PI / 6;
  const a2 = angle + Math.PI / 6;
  const head = `M ${end.x - headLen * Math.cos(a1)} ${end.y - headLen * Math.sin(a1)} L ${end.x} ${end.y} L ${end.x - headLen * Math.cos(a2)} ${end.y - headLen * Math.sin(a2)}`;

  return { line, head };
}

function buildRectPath(points: DrawingPoint[]): string {
  if (points.length < 2) return "";
  const [p1, p2] = [points[0], points[points.length - 1]];
  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  const w = Math.abs(p2.x - p1.x);
  const h = Math.abs(p2.y - p1.y);
  return `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
}

function getDrawingPath(drawing: Drawing) {
  if (drawing.type === "freehand")
    return { type: "path" as const, d: buildFreehandPath(drawing.points) };
  if (drawing.type === "arrow")
    return { type: "arrow" as const, ...buildArrowPath(drawing.points) };
  return { type: "path" as const, d: buildRectPath(drawing.points) };
}

const drawingPaths = computed(() =>
  drawings.value.map((drawing) => ({
    drawing,
    path: getDrawingPath(drawing),
  })),
);

const previewPath = computed(() => {
  if (!isDrawing.value || currentPoints.value.length < 2) return null;
  if (activeTool.value === "freehand")
    return { type: "path" as const, d: buildFreehandPath(currentPoints.value) };
  if (activeTool.value === "arrow")
    return { type: "arrow" as const, ...buildArrowPath(currentPoints.value) };
  if (activeTool.value === "rectangle")
    return { type: "path" as const, d: buildRectPath(currentPoints.value) };
  return null;
});

// Hit area padding for easier eraser clicks on thin strokes
const eraserHitPadding = 8;
</script>

<template>
  <!-- Interactive layer: drawing tools or eraser -->
  <svg
    v-if="isInteractive"
    ref="svgRef"
    class="absolute inset-0 z-[5] h-full w-full"
    :class="isEraser ? 'cursor-pointer' : 'cursor-crosshair'"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <g
      :transform="`translate(${props.viewport.x}, ${props.viewport.y}) scale(${props.viewport.zoom})`"
    >
      <!-- Saved drawings -->
      <template v-for="{ drawing, path } in drawingPaths" :key="drawing.id">
        <template v-if="path.type === 'arrow'">
          <!-- Invisible wide hit area for eraser -->
          <path
            v-if="isEraser"
            :d="(path as any).line"
            stroke="transparent"
            :stroke-width="drawing.strokeWidth + eraserHitPadding * 2"
            fill="none"
            class="cursor-pointer"
            @click.stop="onEraserClick(drawing)"
          />
          <path
            :d="(path as any).line"
            :stroke="drawing.color"
            :stroke-width="drawing.strokeWidth"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="isEraser ? 'pointer-events-none' : ''"
          />
          <path
            :d="(path as any).head"
            :stroke="drawing.color"
            :stroke-width="drawing.strokeWidth"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="pointer-events-none"
          />
        </template>
        <template v-else>
          <!-- Invisible wide hit area for eraser -->
          <path
            v-if="isEraser"
            :d="(path as any).d"
            stroke="transparent"
            :stroke-width="drawing.strokeWidth + eraserHitPadding * 2"
            fill="transparent"
            class="cursor-pointer"
            @click.stop="onEraserClick(drawing)"
          />
          <path
            :d="(path as any).d"
            :stroke="drawing.color"
            :stroke-width="drawing.strokeWidth"
            :fill="drawing.type === 'rectangle' ? `${drawing.color}15` : 'none'"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="isEraser ? 'pointer-events-none' : ''"
          />
        </template>
      </template>

      <!-- Preview of current drawing -->
      <template v-if="previewPath">
        <template v-if="previewPath.type === 'arrow'">
          <path
            :d="(previewPath as any).line"
            :stroke="drawingColor"
            :stroke-width="strokeWidth"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.7"
            class="pointer-events-none"
          />
          <path
            :d="(previewPath as any).head"
            :stroke="drawingColor"
            :stroke-width="strokeWidth"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.7"
            class="pointer-events-none"
          />
        </template>
        <path
          v-else
          :d="(previewPath as any).d"
          :stroke="drawingColor"
          :stroke-width="strokeWidth"
          :fill="activeTool === 'rectangle' ? `${drawingColor}15` : 'none'"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.7"
          class="pointer-events-none"
        />
      </template>
    </g>
  </svg>

  <!-- Read-only render (fully non-interactive) -->
  <svg v-else class="absolute inset-0 z-[5] pointer-events-none h-full w-full">
    <g
      :transform="`translate(${props.viewport.x}, ${props.viewport.y}) scale(${props.viewport.zoom})`"
    >
      <template v-for="{ drawing, path } in drawingPaths" :key="drawing.id">
        <template v-if="path.type === 'arrow'">
          <path
            :d="(path as any).line"
            :stroke="drawing.color"
            :stroke-width="drawing.strokeWidth"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            :d="(path as any).head"
            :stroke="drawing.color"
            :stroke-width="drawing.strokeWidth"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </template>
        <path
          v-else
          :d="(path as any).d"
          :stroke="drawing.color"
          :stroke-width="drawing.strokeWidth"
          :fill="drawing.type === 'rectangle' ? `${drawing.color}15` : 'none'"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </template>
    </g>
  </svg>
</template>
