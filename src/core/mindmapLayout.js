// Pure layout for the Home concept map: given the container size and which
// branches are expanded, returns every branch curve and node position.
import { MINDMAP_TREE, MINDMAP_LEVEL1_COLORS, MINDMAP_LEVEL2_COLOR, MINDMAP_LEVEL3_COLOR } from '../content/roadmapContent.js';

// Branch thickness tapers from a thick trunk at the parent end to a thin
// tip at the child end, one pair per tree depth.
const THICKNESS = [[14, 6], [6, 3], [3, 2]];
const CHILD_OFFSETS = [110, 90]; // horizontal distance past the parent, depth 1 and 2
const CHILD_SPACING = 44;
const ROW_GAP = 18;

/** A node's color is a function of its depth: level 1 is colored per
 *  branch, deeper levels each share one uniform shade. */
function colorForDepth(depth, node) {
  if (depth === 0) return MINDMAP_LEVEL1_COLORS[node.id];
  if (depth === 1) return MINDMAP_LEVEL2_COLOR;
  return MINDMAP_LEVEL3_COLOR;
}

/** Filled tapered wedge path from (x0,y0) to (x1,y1) with S-curve edges. */
export function taperedBranchPath(x0, y0, x1, y1, w0, w1) {
  const midX = (x0 + x1) / 2;
  const hw0 = w0 / 2, hw1 = w1 / 2;
  return `M ${x0} ${y0 - hw0} `
    + `C ${midX} ${y0 - hw0}, ${midX} ${y1 - hw1}, ${x1} ${y1 - hw1} `
    + `L ${x1} ${y1 + hw1} `
    + `C ${midX} ${y1 + hw1}, ${midX} ${y0 + hw0}, ${x0} ${y0 + hw0} Z`;
}

/** Centerline the decorative "electron" dots travel along. */
export function branchCenterline(x0, y0, x1, y1) {
  const midX = (x0 + x1) / 2;
  return `M ${x0} ${y0} C ${midX} ${y0}, ${midX} ${y1}, ${x1} ${y1}`;
}

/**
 * @param {{w:number,h:number,expanded:Set<string>}} opts
 * @returns {{height:number, cx:number, cy:number, branches:Array, nodes:Array}}
 */
export function layoutMindmap({ w, h, expanded }) {
  const cx = w / 2;
  const colOffset = Math.min(w * 0.28, 240);
  const rowSpacing = Math.min(90, h / 6);
  const branches = [];
  const nodes = [];

  function subtreeHalfExtent(node) {
    if (!node.children || !expanded.has(node.id)) return 0;
    const n = node.children.length;
    let maxExtent = 0;
    node.children.forEach((child, i) => {
      const extent = Math.abs((i - (n - 1) / 2) * CHILD_SPACING) + subtreeHalfExtent(child);
      if (extent > maxExtent) maxExtent = extent;
    });
    return maxExtent;
  }

  const minRowHalfExtent = (rowSpacing - ROW_GAP) / 2;

  function measureColumn(side) {
    const colNodes = MINDMAP_TREE.filter((n) => n.side === side);
    const halfExtents = colNodes.map((n) => Math.max(minRowHalfExtent, subtreeHalfExtent(n)));
    const centers = [];
    let cursor = 0;
    halfExtents.forEach((half, i) => {
      cursor = i === 0 ? half : cursor + halfExtents[i - 1] + ROW_GAP + half;
      centers.push(cursor);
    });
    const columnHeight = halfExtents.length
      ? centers[centers.length - 1] + halfExtents[halfExtents.length - 1] : 0;
    return { nodes: colNodes, centers, columnHeight };
  }

  const leftCol = measureColumn('left');
  const rightCol = measureColumn('right');
  const height = Math.max(h, Math.max(leftCol.columnHeight, rightCol.columnHeight) + 6);
  const cy = height / 2;

  function addBranch(x0, y0, x1, y1, depth, color) {
    const [w0, w1] = THICKNESS[Math.min(depth, THICKNESS.length - 1)];
    branches.push({
      key: branches.length,
      d: taperedBranchPath(x0, y0, x1, y1, w0, w1),
      center: branchCenterline(x0, y0, x1, y1),
      dist: Math.hypot(x1 - x0, y1 - y0),
      color,
    });
  }

  function placeChildren(parent, parentX, parentY, side, depth) {
    if (!parent.children || !expanded.has(parent.id)) return;
    const offset = CHILD_OFFSETS[depth - 1] || CHILD_OFFSETS[CHILD_OFFSETS.length - 1];
    const x = parentX + (side === 'left' ? -offset : offset);
    const n = parent.children.length;
    parent.children.forEach((child, i) => {
      const y = parentY + (i - (n - 1) / 2) * CHILD_SPACING;
      const color = colorForDepth(depth, child);
      addBranch(parentX, parentY, x, y, depth, color);
      nodes.push({ node: child, x, y, depth, color });
      placeChildren(child, x, y, side, depth + 1);
    });
  }

  const layoutColumn = (col, x) => {
    const yOffset = cy - col.columnHeight / 2;
    return col.nodes.map((node, i) => ({ node, x, y: col.centers[i] + yOffset }));
  };

  [...layoutColumn(leftCol, cx - colOffset), ...layoutColumn(rightCol, cx + colOffset)]
    .forEach(({ node, x, y }) => {
      const color = colorForDepth(0, node);
      addBranch(cx, cy, x, y, 0, color);
      nodes.push({ node, x, y, depth: 0, color });
      placeChildren(node, x, y, node.side, 1);
    });

  return { height, cx, cy, branches, nodes };
}
