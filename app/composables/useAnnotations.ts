import { useLocalStorage } from "@vueuse/core";
import type {
  AnnotationTool,
  Drawing,
  DrawingType,
  StickyColor,
  StickyNote,
} from "~/types/annotations";

/** Ramer-Douglas-Peucker path simplification to reduce freehand point count */
function simplifyPath(
  points: { x: number; y: number }[],
  epsilon: number,
): { x: number; y: number }[] {
  if (points.length <= 2) return points;

  const first = points[0];
  const last = points[points.length - 1];
  let maxDist = 0;
  let maxIdx = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDist(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPath(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function perpendicularDist(
  pt: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(pt.x - lineStart.x, pt.y - lineStart.y);
  return (
    Math.abs(
      dy * pt.x - dx * pt.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x,
    ) / Math.sqrt(lenSq)
  );
}

const stickyNotes = useLocalStorage<StickyNote[]>("devboard:sticky-notes", []);
const drawings = useLocalStorage<Drawing[]>("devboard:drawings", []);
const activeTool = ref<AnnotationTool>("select");
const drawingColor = ref("#f59e0b");
const strokeWidth = ref(3);
const stickyColor = ref<StickyColor>("yellow");
const drawingsVisible = ref(true);

export function useAnnotations() {
  function addStickyNote(position: { x: number; y: number }) {
    const note: StickyNote = {
      id: `sticky-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: "",
      color: stickyColor.value,
      position,
      width: 200,
      height: 160,
      createdAt: new Date().toISOString(),
    };
    stickyNotes.value = [...stickyNotes.value, note];
    // Revert to select so the user can immediately interact with the note
    activeTool.value = "select";
    return note;
  }

  function updateStickyNote(id: string, updates: Partial<StickyNote>) {
    stickyNotes.value = stickyNotes.value.map((n) =>
      n.id === id ? { ...n, ...updates } : n,
    );
  }

  function removeStickyNote(id: string) {
    stickyNotes.value = stickyNotes.value.filter((n) => n.id !== id);
  }

  function addDrawing(type: DrawingType, points: { x: number; y: number }[]) {
    const simplified = type === "freehand" ? simplifyPath(points, 1.5) : points;
    const drawing: Drawing = {
      id: `drawing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      points: simplified,
      color: drawingColor.value,
      strokeWidth: strokeWidth.value,
      createdAt: new Date().toISOString(),
    };
    drawings.value = [...drawings.value, drawing];
    return drawing;
  }

  function removeDrawing(id: string) {
    drawings.value = drawings.value.filter((d) => d.id !== id);
  }

  function clearAllDrawings() {
    drawings.value = [];
  }

  return {
    stickyNotes: readonly(stickyNotes),
    drawings: readonly(drawings),
    activeTool,
    drawingColor,
    strokeWidth,
    stickyColor,
    drawingsVisible,
    addStickyNote,
    updateStickyNote,
    removeStickyNote,
    addDrawing,
    removeDrawing,
    clearAllDrawings,
  };
}
