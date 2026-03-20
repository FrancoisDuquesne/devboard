import dagre from "@dagrejs/dagre";
import { type Edge, MarkerType, type Node, Position } from "@vue-flow/core";

import type { DevBoardIssue, DevBoardMR, DevBoardTodo, GraphGroupBy } from "~/types";

interface EdgeColors {
  healthy: string;
  blocked: string;
  progress: string;
  unresolved: string;
  todo: string;
}

export const NODE_WIDTH = 384;
export const BASE_NODE_HEIGHT = 150;
const ISSUE_ROW_HEIGHT = 28;
export const LABEL_ROW_HEIGHT = 24;
export const GRID_GAP_X = 60;
export const GRID_GAP_Y = 80;
export const ISSUE_NODE_WIDTH = 240;
export const ISSUE_NODE_HEIGHT = 80;
export const TODO_NODE_WIDTH = 240;
export const TODO_NODE_HEIGHT = 90;

const GROUP_PADDING_X = 40;
const GROUP_PADDING_Y = 60;
const GROUP_PADDING_BOTTOM = 30;
const GROUP_GAP = 60;

interface ParsedRef {
  projectPath: string | null;
  iid: number;
}

/**
 * Parse a dependency reference string.
 *   "!123"              → same-project, iid 123
 *   "group/project!456" → cross-project
 */
function parseDependencyRef(ref: string): ParsedRef | null {
  const match = ref.match(/^(?:(.+)!)?!?(\d+)$/);
  if (!match) return null;
  return {
    projectPath: match[1] || null,
    iid: Number(match[2]),
  };
}

/**
 * Resolve a parsed reference to an MR in the collection.
 */
function resolveRef(
  parsed: ParsedRef,
  sourceMr: DevBoardMR,
  allMrs: DevBoardMR[],
): DevBoardMR | undefined {
  for (const mr of allMrs) {
    if (parsed.projectPath) {
      if (mr.projectPath === parsed.projectPath && mr.iid === parsed.iid) {
        return mr;
      }
    } else {
      if (mr.projectPath === sourceMr.projectPath && mr.iid === parsed.iid) {
        return mr;
      }
    }
  }
  return undefined;
}

/**
 * Edge styling based on the dependency MR's health.
 * Simplified to 4 states: healthy, blocked, in-progress, unresolved.
 */
function getEdgeStyle(
  depMr: DevBoardMR | null,
  colors: EdgeColors,
): {
  stroke: string;
  animated: boolean;
  strokeDasharray?: string;
} {
  if (!depMr) {
    return { stroke: colors.unresolved, animated: false, strokeDasharray: "5 5" };
  }
  if (depMr.status === "merged") {
    return { stroke: colors.healthy, animated: false };
  }
  switch (depMr.pipeline.status) {
    case "success":
      return { stroke: colors.healthy, animated: false };
    case "failed":
      return { stroke: colors.blocked, animated: true };
    case "running":
    case "pending":
      return { stroke: colors.progress, animated: true };
    default:
      return { stroke: colors.unresolved, animated: false };
  }
}

function estimateNodeHeight(node: Node): number {
  if (node.type === "phantom") return 50;
  if (node.type === "issue-node") return ISSUE_NODE_HEIGHT;
  if (node.type === "todo-node") return TODO_NODE_HEIGHT;
  const mr = node.data as DevBoardMR;
  const issueRows = mr.linkedIssues?.length ?? 0;
  const hasLabels = mr.labels?.length > 0;
  return (
    BASE_NODE_HEIGHT + issueRows * ISSUE_ROW_HEIGHT + (hasLabels ? LABEL_ROW_HEIGHT : 0)
  );
}

function estimateNodeWidth(node: Node): number {
  if (node.type === "issue-node") return ISSUE_NODE_WIDTH;
  if (node.type === "todo-node") return TODO_NODE_WIDTH;
  return NODE_WIDTH;
}

function runTightPackLayout(nodes: Node[], maxRowWidth?: number): void {
  const maxW = maxRowWidth ?? (NODE_WIDTH + GRID_GAP_X) * 4;
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const node of nodes) {
    const w = estimateNodeWidth(node);
    const h = estimateNodeHeight(node);

    if (cursorX > 0 && cursorX + w > maxW) {
      cursorX = 0;
      cursorY += rowHeight + GRID_GAP_Y;
      rowHeight = 0;
    }

    node.position = { x: cursorX, y: cursorY };
    cursorX += w + GRID_GAP_X;
    rowHeight = Math.max(rowHeight, h);
  }
}

interface BBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

function computeBbox(nodes: Node[]): BBox {
  if (nodes.length === 0) return { minX: 0, minY: 0, width: 0, height: 0 };

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const w = estimateNodeWidth(node);
    const h = estimateNodeHeight(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

function getNodeProjectPath(node: Node): string | null {
  if (node.type === "mr-node") return (node.data as DevBoardMR).projectPath;
  if (node.type === "issue-node")
    return (node.data as DevBoardIssue).projectPath ?? null;
  if (node.type === "todo-node") return (node.data as DevBoardTodo).projectPath;
  return null;
}

function runGroupLayout(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  // Partition nodes into groups by project path
  const groups = new Map<string, Node[]>();
  for (const node of nodes) {
    const project = getNodeProjectPath(node) ?? "__ungrouped__";
    if (!groups.has(project)) groups.set(project, []);
    groups.get(project)?.push(node);
  }

  // Sort groups alphabetically, ungrouped last
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === "__ungrouped__") return 1;
    if (b === "__ungrouped__") return -1;
    return a.localeCompare(b);
  });

  const groupNodes: Node[] = [];
  const allChildNodes: Node[] = [];
  let groupY = 0;

  for (const groupKey of sortedKeys) {
    const groupChildNodes = groups.get(groupKey) ?? [];

    // Build set of node IDs in this group
    const groupNodeIds = new Set(groupChildNodes.map((n) => n.id));

    // Find intra-group edges
    const intraEdges = edges.filter(
      (e) => groupNodeIds.has(e.source) && groupNodeIds.has(e.target),
    );

    // Separate connected vs disconnected nodes
    const connectedIds = new Set<string>();
    for (const edge of intraEdges) {
      connectedIds.add(edge.source);
      connectedIds.add(edge.target);
    }

    const connectedNodes = groupChildNodes.filter((n) => connectedIds.has(n.id));
    const disconnectedNodes = groupChildNodes.filter((n) => !connectedIds.has(n.id));

    // Layout connected nodes with dagre
    if (connectedNodes.length > 0) {
      runDagreLayout(connectedNodes, intraEdges);
    }

    // Layout disconnected nodes with tight packing
    if (disconnectedNodes.length > 0) {
      runTightPackLayout(disconnectedNodes);
    }

    // Merge sub-layouts vertically: connected on top, disconnected below
    const connectedBbox = computeBbox(connectedNodes);
    const disconnectedBbox = computeBbox(disconnectedNodes);

    // Shift disconnected nodes below connected ones
    if (connectedNodes.length > 0 && disconnectedNodes.length > 0) {
      const offsetY = connectedBbox.minY + connectedBbox.height + GRID_GAP_Y;
      const shiftY = offsetY - disconnectedBbox.minY;
      for (const node of disconnectedNodes) {
        node.position.y += shiftY;
      }
    }

    // Compute combined bounding box of all children
    const allGroupChildren = [...connectedNodes, ...disconnectedNodes];
    const combinedBbox = computeBbox(allGroupChildren);

    // Shift all children so they start at (GROUP_PADDING_X, GROUP_PADDING_Y) relative to group
    const shiftX = GROUP_PADDING_X - combinedBbox.minX;
    const shiftY = GROUP_PADDING_Y - combinedBbox.minY;
    for (const node of allGroupChildren) {
      node.position.x += shiftX;
      node.position.y += shiftY;
    }

    // Recompute bbox after shifting
    const finalBbox = computeBbox(allGroupChildren);
    const groupWidth = finalBbox.width + GROUP_PADDING_X * 2;
    const groupHeight = finalBbox.minY + finalBbox.height + GROUP_PADDING_BOTTOM;

    // Create group parent node
    const groupId = `group-${groupKey}`;
    const label = groupKey === "__ungrouped__" ? "Ungrouped" : groupKey;
    groupNodes.push({
      id: groupId,
      type: "group-node",
      position: { x: 0, y: groupY },
      data: { label, count: allGroupChildren.length },
      style: { width: `${groupWidth}px`, height: `${groupHeight}px` },
      selectable: false,
      focusable: false,
      zIndex: -1,
    });

    // Set parentNode on all children
    for (const node of allGroupChildren) {
      node.parentNode = groupId;
      node.expandParent = false;
    }

    allChildNodes.push(...allGroupChildren);
    groupY += groupHeight + GROUP_GAP;
  }

  return {
    nodes: [...groupNodes, ...allChildNodes],
    edges,
  };
}

function runDagreLayout(nodes: Node[], edges: Edge[]): void {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60 });

  for (const node of nodes) {
    const h = estimateNodeHeight(node);
    const w = estimateNodeWidth(node);
    g.setNode(node.id, { width: w, height: h });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  for (const node of nodes) {
    const pos = g.node(node.id);
    const w = estimateNodeWidth(node);
    const h = estimateNodeHeight(node);
    node.position = {
      x: pos.x - w / 2,
      y: pos.y - h / 2,
    };
  }
}

/**
 * Find connected components in the graph.
 * Returns an array of node-ID sets, one per component.
 */
function findConnectedComponents(nodeIds: Set<string>, edges: Edge[]): Set<string>[] {
  const parent = new Map<string, string>();
  for (const id of nodeIds) parent.set(id, id);

  function find(x: string): string {
    let root = x;
    let next = parent.get(root);
    while (next !== undefined && next !== root) {
      root = next;
      next = parent.get(root);
    }
    // Path compression
    let curr = x;
    while (curr !== root) {
      const p = parent.get(curr) ?? root;
      parent.set(curr, root);
      curr = p;
    }
    return root;
  }

  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      union(edge.source, edge.target);
    }
  }

  const groups = new Map<string, Set<string>>();
  for (const id of nodeIds) {
    const root = find(id);
    const group = groups.get(root);
    if (group) {
      group.add(id);
    } else {
      groups.set(root, new Set([id]));
    }
  }

  return [...groups.values()];
}

/**
 * Layout connected clusters with Dagre, then pack all clusters + isolated
 * nodes in a grid-like arrangement so the graph uses available space.
 */
function runClusterLayout(nodes: Node[], edges: Edge[]): void {
  const nodeMap = new Map<string, Node>();
  for (const node of nodes) nodeMap.set(node.id, node);

  const allIds = new Set(nodes.map((n) => n.id));
  const components = findConnectedComponents(allIds, edges);

  // Separate clusters (2+ nodes with edges) from isolated nodes
  const clusters: { nodes: Node[]; edges: Edge[]; bbox: BBox }[] = [];
  const isolatedNodes: Node[] = [];

  for (const comp of components) {
    if (comp.size === 1) {
      const node = nodeMap.get([...comp][0]);
      if (node) isolatedNodes.push(node);
      continue;
    }

    const clusterNodes = [...comp]
      .map((id) => nodeMap.get(id))
      .filter((n): n is Node => n !== undefined);
    const clusterEdges = edges.filter((e) => comp.has(e.source) && comp.has(e.target));

    if (clusterEdges.length === 0) {
      // Connected by component detection but no edges — treat as isolated
      for (const n of clusterNodes) isolatedNodes.push(n);
      continue;
    }

    runDagreLayout(clusterNodes, clusterEdges);

    // Normalize positions so each cluster starts at (0,0)
    const bbox = computeBbox(clusterNodes);
    for (const n of clusterNodes) {
      n.position.x -= bbox.minX;
      n.position.y -= bbox.minY;
    }

    clusters.push({
      nodes: clusterNodes,
      edges: clusterEdges,
      bbox: { ...bbox, minX: 0, minY: 0 },
    });
  }

  // Sort clusters by height descending for better packing
  clusters.sort((a, b) => b.bbox.height - a.bbox.height);

  // Pack clusters into rows using a simple shelf algorithm
  const MAX_ROW_WIDTH = (NODE_WIDTH + GRID_GAP_X) * 4;
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const cluster of clusters) {
    const w = cluster.bbox.width;
    const h = cluster.bbox.height;

    if (cursorX > 0 && cursorX + w > MAX_ROW_WIDTH) {
      cursorX = 0;
      cursorY += rowHeight + GRID_GAP_Y;
      rowHeight = 0;
    }

    for (const node of cluster.nodes) {
      node.position.x += cursorX;
      node.position.y += cursorY;
    }

    cursorX += w + GRID_GAP_X;
    rowHeight = Math.max(rowHeight, h);
  }

  // Pack isolated nodes below the clusters
  if (isolatedNodes.length > 0) {
    if (cursorX > 0 || clusters.length > 0) {
      cursorY += rowHeight + GRID_GAP_Y;
    }
    runTightPackLayout(isolatedNodes, MAX_ROW_WIDTH);
    // Shift isolated nodes below clusters
    for (const node of isolatedNodes) {
      node.position.y += cursorY;
    }
  }
}

export function useMrGraph(
  mrs: Readonly<Ref<DevBoardMR[]>>,
  issues?: Readonly<Ref<DevBoardIssue[]>>,
  todos?: Readonly<Ref<DevBoardTodo[]>>,
  groupBy?: Readonly<Ref<GraphGroupBy>>,
) {
  const {
    meta: { mrPrefix },
  } = useProvider();
  const colorMode = useColorMode();

  const edgeColors = computed<EdgeColors>(() => {
    const dark = colorMode.value === "dark";
    return {
      healthy: dark ? "#34d399" : "#10b981",
      blocked: dark ? "#f87171" : "#ef4444",
      progress: dark ? "#fbbf24" : "#f59e0b",
      unresolved: dark ? "#6b7280" : "#9ca3af",
      todo: dark ? "#2dd4bf" : "#14b8a6",
    };
  });

  const graphData = computed(() => {
    const colors = edgeColors.value;
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const phantomIds = new Set<string>();
    const connectedIds = new Set<string>();

    // Build edges from dependency references
    for (const mr of mrs.value) {
      for (const rawRef of mr.dependsOnMrs) {
        const parsed = parseDependencyRef(rawRef);
        if (!parsed) continue;

        const depMr = resolveRef(parsed, mr, mrs.value);

        if (depMr) {
          const sourceId = String(depMr.id);
          const targetId = String(mr.id);
          const style = getEdgeStyle(depMr, colors);

          edges.push({
            id: `e-${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            type: "smoothstep",
            animated: style.animated,
            style: {
              stroke: style.stroke,
              strokeWidth: 2,
              ...(style.strokeDasharray
                ? { strokeDasharray: style.strokeDasharray }
                : {}),
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: style.stroke,
            },
          });
          connectedIds.add(sourceId);
          connectedIds.add(targetId);
        } else {
          // Unresolved → phantom node
          const phantomId = `phantom-${rawRef}`;
          if (!phantomIds.has(phantomId)) {
            phantomIds.add(phantomId);
            nodes.push({
              id: phantomId,
              type: "phantom",
              position: { x: 0, y: 0 },
              data: { label: rawRef },
            });
          }
          const style = getEdgeStyle(null, colors);
          edges.push({
            id: `e-${phantomId}-${mr.id}`,
            source: phantomId,
            target: String(mr.id),
            type: "smoothstep",
            animated: false,
            style: {
              stroke: style.stroke,
              strokeWidth: 2,
              strokeDasharray: style.strokeDasharray,
            },
            markerEnd: {
              type: MarkerType.Arrow,
              color: style.stroke,
            },
          });
          connectedIds.add(phantomId);
          connectedIds.add(String(mr.id));
        }
      }
    }

    // Build MR nodes
    for (const mr of mrs.value) {
      nodes.push({
        id: String(mr.id),
        type: "mr-node",
        position: { x: 0, y: 0 },
        data: mr,
      });
    }

    // Build issue nodes
    if (issues?.value) {
      for (const issue of issues.value) {
        nodes.push({
          id: `issue-${issue.id}`,
          type: "issue-node",
          position: { x: 0, y: 0 },
          data: issue,
        });
      }
    }

    // Build todo nodes
    if (todos?.value) {
      for (const todo of todos.value) {
        nodes.push({
          id: `todo-${todo.id}`,
          type: "todo-node",
          position: { x: 0, y: 0 },
          data: todo,
        });
      }
    }

    // Build lookup maps for cross-node edges
    const mrById = new Map<number, string>();
    const mrByRef = new Map<string, string>();
    for (const mr of mrs.value) {
      const nodeId = String(mr.id);
      mrById.set(mr.id, nodeId);
      mrByRef.set(`${mr.projectPath}${mrPrefix}${mr.iid}`, nodeId);
    }

    const issueById = new Map<number, string>();
    const issueByRef = new Map<string, string>();
    for (const issue of issues?.value ?? []) {
      const nodeId = `issue-${issue.id}`;
      issueById.set(issue.id, nodeId);
      if (issue.projectPath) {
        issueByRef.set(`${issue.projectPath}#${issue.iid}`, nodeId);
      }
    }

    // Build MR → linked issue edges
    for (const mr of mrs.value) {
      const mrNodeId = String(mr.id);
      for (const linked of mr.linkedIssues) {
        const issueNodeId =
          (linked.id ? issueById.get(linked.id) : null) ??
          issueByRef.get(`${mr.projectPath}#${linked.iid}`) ??
          null;
        if (issueNodeId) {
          edges.push({
            id: `e-mr-issue-${mrNodeId}-${issueNodeId}`,
            source: mrNodeId,
            target: issueNodeId,
            type: "smoothstep",
            animated: false,
            style: {
              stroke: colors.healthy,
              strokeWidth: 2,
              strokeDasharray: "6 4",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colors.healthy,
            },
          });
        }
      }
    }

    // Build todo → target edges
    if (todos?.value && todos.value.length > 0) {
      for (const todo of todos.value) {
        let targetNodeId: string | null = null;
        const ref = todo.target.iid;

        if (todo.targetType === "MergeRequest") {
          targetNodeId =
            mrById.get(todo.target.id) ??
            mrByRef.get(`${todo.projectPath}!${ref}`) ??
            null;
        } else if (todo.targetType === "Issue") {
          targetNodeId =
            issueById.get(todo.target.id) ??
            issueByRef.get(`${todo.projectPath}#${ref}`) ??
            null;
        }

        if (targetNodeId) {
          const todoNodeId = `todo-${todo.id}`;
          edges.push({
            id: `e-todo-${todo.id}-${targetNodeId}`,
            source: todoNodeId,
            target: targetNodeId,
            type: "smoothstep",
            animated: false,
            style: {
              stroke: colors.todo,
              strokeWidth: 2,
              strokeDasharray: "6 4",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colors.todo,
            },
          });
        }
      }
    }

    // Layout: group mode, dagre for dependency graphs, tight pack otherwise
    let finalNodes = nodes;
    if (nodes.length > 0) {
      const groupByValue = groupBy?.value ?? "none";
      if (groupByValue !== "none") {
        const result = runGroupLayout(nodes, edges);
        finalNodes = result.nodes;
      } else if (edges.length > 0) {
        runClusterLayout(nodes, edges);
      } else {
        runTightPackLayout(nodes);
      }
    }

    // Set handle positions
    for (const node of finalNodes) {
      node.sourcePosition = Position.Bottom;
      node.targetPosition = Position.Top;
    }

    return { nodes: finalNodes, edges };
  });

  return {
    nodes: computed(() => graphData.value.nodes),
    edges: computed(() => graphData.value.edges),
  };
}
