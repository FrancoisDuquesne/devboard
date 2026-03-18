export type AnnotationTool =
  | "select"
  | "sticky"
  | "freehand"
  | "arrow"
  | "rectangle"
  | "eraser";

export type StickyColor = "yellow" | "blue" | "green" | "pink" | "purple";

export interface StickyNote {
  id: string;
  text: string;
  color: StickyColor;
  position: { x: number; y: number };
  width: number;
  height: number;
  markdown?: boolean;
  createdAt: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export type DrawingType = "freehand" | "arrow" | "rectangle";

export interface Drawing {
  id: string;
  type: DrawingType;
  points: DrawingPoint[];
  color: string;
  strokeWidth: number;
  createdAt: string;
}
