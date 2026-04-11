// ─── Constants ───
const RADIAL_BASE = 140;
const RADIAL_STEP = 14;
const NODE_H = 32;
const MIN_NODE_GAP = 2;
const MAX_VAL_LEN = 24;
const MAX_NODES = 500;
const CLICK_THRESHOLD = 4;

let treeRoot = null;
let allNodes = [];
let debounceTimer = null;
let currentScale = 1;
let currentOffsetX = 0;
let currentOffsetY = 0;

// ─── DOM refs ───
const jsonInput = document.getElementById('jsonInput');
const vizContainer = document.getElementById('vizContainer');
const edgeSvg = document.getElementById('edgeSvg');
const nodeLayer = document.getElementById('nodeLayer');
const errorBar = document.getElementById('errorBar');
const vizEmpty = document.getElementById('vizEmpty');
const zoomLevelEl = document.getElementById('zoomLevel');

// ─── JSON → Tree model ───
let nodeIdCounter = 0;

function makeNode(key, value, depth) {
  const type = value === null ? 'null'
    : Array.isArray(value) ? 'array'
    : typeof value;

  const node = {
    id: nodeIdCounter++,
    key,
    value,
    type,
    depth,
    children: [],
    collapsed: false,
    x: 0, y: 0,
    el: null,
    leafCount: 0,
    _estW: 0
  };

  if (type === 'object') {
    for (const k of Object.keys(value)) {
      node.children.push(makeNode(k, value[k], depth + 1));
    }
  } else if (type === 'array') {
    for (let i = 0; i < value.length; i++) {
      node.children.push(makeNode(`[${i}]`, value[i], depth + 1));
    }
  }

  return node;
}

function countNodes(node) {
  let c = 1;
  for (const ch of node.children) c += countNodes(ch);
  return c;
}

// Always count all leaves (ignore collapsed) so layout is stable
function countLeaves(node) {
  if (node.children.length === 0) {
    node.leafCount = 1;
    return 1;
  }
  let total = 0;
  for (const ch of node.children) total += countLeaves(ch);
  node.leafCount = total;
  return total;
}

function estimateWidth(node, isRoot) {
  if (isRoot) { node._estW = 56; return; }
  let textLen = node.key.length + 2;
  if (node.type === 'object') textLen += 6;
  else if (node.type === 'array') textLen += 6;
  else if (node.type === 'string') textLen += Math.min(String(node.value).length, MAX_VAL_LEN) + 2;
  else if (node.type === 'null') textLen += 4;
  else textLen += String(node.value).length;
  node._estW = Math.max(56, textLen * 7 + 28);
}

function estimateAllWidths(node, isRoot) {
  estimateWidth(node, isRoot);
  for (const ch of node.children) estimateAllWidths(ch, false);
}

function parseJson(str) {
  try {
    const parsed = JSON.parse(str);
    return { success: true, data: parsed, error: null };
  } catch (e) {
    return { success: false, data: null, error: e.message };
  }
}

// ─── Radial layout (always lays out ALL nodes) ───

function layoutRadial(root) {
  countLeaves(root);
  estimateAllWidths(root, true);

  const vizW = vizContainer.clientWidth || 600;
  const vizH = vizContainer.clientHeight || 600;
  const cx = vizW / 2;
  const cy = 40;

  root.x = cx;
  root.y = cy;

  const halfSpan = (160 / 2) * Math.PI / 180;
  const centerAngle = Math.PI / 2;
  assignRadial(root, centerAngle - halfSpan, centerAngle + halfSpan, cx, cy, RADIAL_BASE);
}

function assignRadial(node, angleStart, angleEnd, cx, cy, parentRadius) {
  if (node.children.length === 0) return;

  const span = angleEnd - angleStart;
  const totalLeaves = node.leafCount || 1;

  const totalFootprint = node.children.reduce(
    (s, ch) => s + Math.max(ch._estW, NODE_H) * 0.3 + MIN_NODE_GAP, 0
  );
  const minRadius = span > 0.01 ? totalFootprint / span : RADIAL_BASE;
  const defaultRadius = parentRadius + RADIAL_STEP;
  const radius = Math.max(defaultRadius, minRadius);

  let currentAngle = angleStart;

  for (const ch of node.children) {
    const share = (ch.leafCount || 1) / totalLeaves;
    const chAngleStart = currentAngle;
    const chAngleEnd = currentAngle + share * span;
    const midAngle = (chAngleStart + chAngleEnd) / 2;

    ch.x = cx + radius * Math.cos(midAngle);
    ch.y = cy + radius * Math.sin(midAngle);

    assignRadial(ch, chAngleStart, chAngleEnd, cx, cy, radius);
    currentAngle = chAngleEnd;
  }
}

// ─── Rendering ───

function formatNodeLabel(node, isRoot) {
  let label = '';

  if (isRoot) {
    label = '<span class="node-key">Root</span>';
  } else {
    const key = `<span class="node-key">${escapeHtml(node.key)}</span>`;

    if (node.type === 'object') {
      label = `${key}`;
    } else if (node.type === 'array') {
      label = `${key}`;
    } else if (node.type === 'string') {
      label = `${key}<span class="node-val">"${escapeHtml(node.value)}"</span>`;
    } else if (node.type === 'null') {
      label = `${key}<span class="node-val">null</span>`;
    } else {
      label = `${key}<span class="node-val">${escapeHtml(String(node.value))}</span>`;
    }
  }

  if (node.collapsed && node.children.length > 0) {
    label += `<span class="node-child-count">child: ${node.children.length}</span>`;
  }

  return label;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Collect ALL nodes regardless of collapse state
function collectAll(node, list) {
  list.push(node);
  for (const ch of node.children) collectAll(ch, list);
}

function createNodeEl(node, isRoot, maxDepth) {
  const div = document.createElement('div');
  div.className = 'node';
  if (node.children.length > 0) div.classList.add('collapsible');
  if (node.collapsed) div.classList.add('collapsed');
  div.dataset.type = isRoot ? 'root' : node.type;
  div.dataset.nodeId = node.id;
  div.innerHTML = formatNodeLabel(node, isRoot);
  div.style.transform = `translate(${node.x}px, ${node.y - NODE_H / 2}px)`;
  div.style.zIndex = maxDepth - node.depth + 1;
  node.el = div;
  nodeLayer.appendChild(div);
  attachDrag(div, node);
}

function drawEdge(parent, child) {
  const ns = 'http://www.w3.org/2000/svg';
  const path = document.createElementNS(ns, 'path');
  path.dataset.from = parent.id;
  path.dataset.to = child.id;
  updateEdgePath(path, parent, child);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'var(--edge-color)');
  path.setAttribute('stroke-width', '1.5');
  edgeSvg.appendChild(path);
}

function getNodeCenter(node) {
  return { cx: node.x, cy: node.y };
}

function updateEdgePath(path, parent, child) {
  const p = getNodeCenter(parent);
  const c = getNodeCenter(child);
  const dx = c.cx - p.cx;
  const dy = c.cy - p.cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const mx = (p.cx + c.cx) / 2;
  const my = (p.cy + c.cy) / 2;
  const curve = dist * 0.06;
  const nx = -dy / (dist || 1) * curve;
  const ny = dx / (dist || 1) * curve;
  path.setAttribute('d',
    `M${p.cx},${p.cy} Q${mx + nx},${my + ny} ${c.cx},${c.cy}`
  );
}

function render(root) {
  nodeLayer.innerHTML = '';
  edgeSvg.innerHTML = '';
  allNodes = [];
  collectAll(root, allNodes);

  // Find max depth for z-index calculation
  const maxDepth = allNodes.reduce((m, n) => Math.max(m, n.depth), 0);

  // Create ALL nodes (parent z-index > child z-index)
  createNodeEl(root, true, maxDepth);
  for (const node of allNodes) {
    if (node === root) continue;
    createNodeEl(node, false, maxDepth);
  }

  // Draw ALL edges
  requestAnimationFrame(() => {
    for (const node of allNodes) {
      if (node.el) {
        node.el.style.transform = `translate(${node.x - node.el.offsetWidth / 2}px, ${node.y - node.el.offsetHeight / 2}px)`;
      }
    }
    for (const node of allNodes) {
      for (const ch of node.children) {
        drawEdge(node, ch);
      }
    }
    // Apply visibility after everything is rendered
    applyVisibility();
  });
}

// ─── Visibility (collapse/expand without re-layout) ───

function applyVisibility() {
  setSubtreeVisibility(treeRoot, true);
}

function setSubtreeVisibility(node, visible) {
  if (node.el) {
    node.el.style.display = visible ? '' : 'none';
  }
  for (const ch of node.children) {
    const childVisible = visible && !node.collapsed;
    // Hide/show edge from this node to child
    const path = edgeSvg.querySelector(`path[data-from="${node.id}"][data-to="${ch.id}"]`);
    if (path) path.style.display = childVisible ? '' : 'none';
    setSubtreeVisibility(ch, childVisible);
  }
}

// ─── Collapse / Expand ───

function toggleCollapse(node) {
  if (node.children.length === 0) return;
  node.collapsed = !node.collapsed;

  // Update this node's label and class
  const isRoot = node === treeRoot;
  node.el.innerHTML = formatNodeLabel(node, isRoot);
  node.el.classList.toggle('collapsed', node.collapsed);

  // Toggle visibility
  applyVisibility();

  // Re-center this node (content changed) and refresh subtree
  requestAnimationFrame(() => {
    recenterNode(node);
    updateConnectedEdges(node);
    if (!node.collapsed) {
      recenterSubtree(node);
    }
  });
}

function recenterNode(node) {
  if (!node.el || node.el.style.display === 'none') return;
  node.el.style.transform = `translate(${node.x - node.el.offsetWidth / 2}px, ${node.y - node.el.offsetHeight / 2}px)`;
}

function recenterSubtree(node) {
  for (const ch of node.children) {
    if (ch.el && ch.el.style.display !== 'none') {
      recenterNode(ch);
      updateConnectedEdges(ch);
      recenterSubtree(ch);
    }
  }
}

// ─── Node Drag ───

function collectDescendants(node, list) {
  for (const ch of node.children) {
    list.push(ch);
    collectDescendants(ch, list);
  }
}

function attachDrag(el, node) {
  let startX, startY, origX, origY, moved;
  let descendantOrigPositions;

  function onPointerDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    startX = e.clientX;
    startY = e.clientY;
    origX = node.x;
    origY = node.y;
    moved = false;

    // Snapshot all descendant positions
    descendantOrigPositions = [];
    const descendants = [];
    collectDescendants(node, descendants);
    for (const d of descendants) {
      descendantOrigPositions.push({ node: d, x: d.x, y: d.y });
    }

    el.classList.add('dragging');
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }

  function onPointerMove(e) {
    if (!moved) {
      if (Math.abs(e.clientX - startX) < CLICK_THRESHOLD && Math.abs(e.clientY - startY) < CLICK_THRESHOLD) return;
      moved = true;
      startX = e.clientX;
      startY = e.clientY;
    }
    const dx = (e.clientX - startX) / currentScale;
    const dy = (e.clientY - startY) / currentScale;

    // Move this node
    node.x = origX + dx;
    node.y = origY + dy;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    el.style.transform = `translate(${node.x - w / 2}px, ${node.y - h / 2}px)`;

    // Move all descendants by same offset
    for (const snap of descendantOrigPositions) {
      const d = snap.node;
      d.x = snap.x + dx;
      d.y = snap.y + dy;
      if (d.el) {
        const dw = d.el.offsetWidth;
        const dh = d.el.offsetHeight;
        d.el.style.transform = `translate(${d.x - dw / 2}px, ${d.y - dh / 2}px)`;
      }
      updateConnectedEdges(d);
    }

    updateConnectedEdges(node);
  }

  function onPointerUp() {
    el.classList.remove('dragging');
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    descendantOrigPositions = null;
    if (!moved && node.children.length > 0) {
      toggleCollapse(node);
    }
  }

  el.addEventListener('pointerdown', onPointerDown);
}

function updateConnectedEdges(node) {
  for (const ch of node.children) {
    const path = edgeSvg.querySelector(`path[data-from="${node.id}"][data-to="${ch.id}"]`);
    if (path) updateEdgePath(path, node, ch);
  }
  const parentPath = edgeSvg.querySelector(`path[data-to="${node.id}"]`);
  if (parentPath) {
    const parentId = parentPath.dataset.from;
    const parentNode = allNodes.find(n => n.id == parentId);
    if (parentNode) updateEdgePath(parentPath, parentNode, node);
  }
}

// ─── Canvas Pan (drag empty space) ───

let isPanning = false;
let panStartX, panStartY, panOrigOffX, panOrigOffY;

vizContainer.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.node')) return;
  if (e.button !== 0) return;
  isPanning = true;
  panStartX = e.clientX;
  panStartY = e.clientY;
  panOrigOffX = currentOffsetX;
  panOrigOffY = currentOffsetY;
  vizContainer.style.cursor = 'grabbing';
  document.addEventListener('pointermove', onPanMove);
  document.addEventListener('pointerup', onPanUp);
});

function onPanMove(e) {
  if (!isPanning) return;
  currentOffsetX = panOrigOffX + (e.clientX - panStartX);
  currentOffsetY = panOrigOffY + (e.clientY - panStartY);
  applyTransform();
}

function onPanUp() {
  isPanning = false;
  vizContainer.style.cursor = '';
  document.removeEventListener('pointermove', onPanMove);
  document.removeEventListener('pointerup', onPanUp);
}

// ─── Zoom & Transform ───

function applyTransform() {
  const t = `translate(${currentOffsetX}px, ${currentOffsetY}px) scale(${currentScale})`;
  nodeLayer.style.transformOrigin = '0 0';
  nodeLayer.style.transform = t;
  edgeSvg.style.transformOrigin = '0 0';
  edgeSvg.style.transform = t;
  zoomLevelEl.textContent = Math.round(currentScale * 100) + '%';
}

function zoomBy(delta) {
  const vizW = vizContainer.clientWidth;
  const vizH = vizContainer.clientHeight;
  const prevScale = currentScale;
  currentScale = Math.max(0.1, Math.min(3, currentScale + delta));
  const ratio = currentScale / prevScale;
  currentOffsetX = vizW / 2 - ratio * (vizW / 2 - currentOffsetX);
  currentOffsetY = vizH / 2 - ratio * (vizH / 2 - currentOffsetY);
  applyTransform();
}

function resetTransform() {
  currentScale = 1;
  currentOffsetX = 0;
  currentOffsetY = 0;
  applyTransform();
}

function fitToView() {
  if (!allNodes.length) return;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of allNodes) {
    if (n.el && n.el.style.display === 'none') continue;
    const w = n.el ? n.el.offsetWidth : 80;
    const h = n.el ? n.el.offsetHeight : NODE_H;
    minX = Math.min(minX, n.x - w / 2);
    minY = Math.min(minY, n.y - h / 2);
    maxX = Math.max(maxX, n.x + w / 2);
    maxY = Math.max(maxY, n.y + h / 2);
  }
  const pad = 40;
  const treeW = maxX - minX + pad * 2;
  const treeH = maxY - minY + pad * 2;
  const vizW = vizContainer.clientWidth;
  const vizH = vizContainer.clientHeight;
  currentScale = Math.min(1, vizW / treeW, vizH / treeH);
  currentOffsetX = (vizW - treeW * currentScale) / 2 - minX * currentScale + pad * currentScale;
  currentOffsetY = (vizH - treeH * currentScale) / 2 - minY * currentScale + pad * currentScale;
  applyTransform();
}

function centerOnRoot() {
  if (!treeRoot) return;
  const vizW = vizContainer.clientWidth;
  const vizH = vizContainer.clientHeight;
  currentScale = 1;
  currentOffsetX = vizW / 2 - treeRoot.x;
  currentOffsetY = vizH / 2 - treeRoot.y;
  applyTransform();
}

// ─── Main pipeline ───

function processJson(str) {
  if (!str.trim()) {
    errorBar.textContent = '';
    nodeLayer.innerHTML = '';
    edgeSvg.innerHTML = '';
    allNodes = [];
    treeRoot = null;
    vizEmpty.classList.remove('hidden');
    return;
  }

  const result = parseJson(str);
  if (!result.success) {
    errorBar.textContent = result.error;
    return;
  }

  errorBar.textContent = '';
  vizEmpty.classList.add('hidden');
  resetTransform();

  nodeIdCounter = 0;
  const root = makeNode('Root', result.data, 0);

  const total = countNodes(root);
  if (total > MAX_NODES) {
    errorBar.textContent = `Too many nodes (${total.toLocaleString()}). Limit is ${MAX_NODES}. Simplify the JSON to visualize.`;
    nodeLayer.innerHTML = '';
    edgeSvg.innerHTML = '';
    return;
  }

  treeRoot = root;
  layoutRadial(root);
  render(root);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => centerOnRoot());
  });
}

// ─── Events ───

jsonInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => processJson(jsonInput.value), 300);
});

document.getElementById('formatBtn').addEventListener('click', () => {
  const result = parseJson(jsonInput.value);
  if (result.success) {
    jsonInput.value = JSON.stringify(result.data, null, 2);
    processJson(jsonInput.value);
  }
});

document.getElementById('sampleBtn').addEventListener('click', () => {
  const sample = {
    name: "JSON Visualizer",
    version: "1.0.0",
    features: ["mind-map", "drag & drop", "dark mode"],
    config: {
      maxNodes: 500,
      layout: "radial",
      theme: { light: "#f5f5f7", dark: "#1c1c1e" }
    },
    metadata: {
      author: "User",
      stable: true,
      tags: null
    }
  };
  jsonInput.value = JSON.stringify(sample, null, 2);
  processJson(jsonInput.value);
});

document.getElementById('resetLayout').addEventListener('click', () => {
  if (!treeRoot) return;
  // Reset collapse states
  function resetCollapse(node) {
    node.collapsed = false;
    for (const ch of node.children) resetCollapse(ch);
  }
  resetCollapse(treeRoot);
  resetTransform();
  layoutRadial(treeRoot);
  render(treeRoot);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => fitToView());
  });
});

document.getElementById('expandAll').addEventListener('click', () => {
  if (!treeRoot) return;
  function setAll(node, val) { node.collapsed = val; for (const ch of node.children) setAll(ch, val); }
  setAll(treeRoot, false);
  render(treeRoot);
  applyTransform();
});

document.getElementById('collapseAll').addEventListener('click', () => {
  if (!treeRoot) return;
  function setAll(node, val) { if (node.children.length > 0) node.collapsed = val; for (const ch of node.children) setAll(ch, val); }
  setAll(treeRoot, true);
  render(treeRoot);
  applyTransform();
});

document.getElementById('fitView').addEventListener('click', fitToView);
document.getElementById('zoomIn').addEventListener('click', () => zoomBy(0.15));
document.getElementById('zoomOut').addEventListener('click', () => zoomBy(-0.15));

vizContainer.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoomBy(e.deltaY < 0 ? 0.1 : -0.1);
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (e.target === jsonInput) return;
  if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomBy(0.05); }
  if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(-0.05); }
  if (e.key === '0') { e.preventDefault(); currentScale = 1; applyTransform(); }
});

// ─── Divider resize ───
const divider = document.getElementById('divider');
const mainLayout = document.querySelector('.main-layout');
let isResizing = false;

divider.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  isResizing = true;
  divider.classList.add('active');
  divider.setPointerCapture(e.pointerId);
  document.addEventListener('pointermove', onResizeMove);
  document.addEventListener('pointerup', onResizeUp);
});

function onResizeMove(e) {
  if (!isResizing) return;
  const rect = mainLayout.getBoundingClientRect();
  const totalW = rect.width - 6; // subtract divider width
  const leftW = e.clientX - rect.left;
  const ratio = leftW / (totalW + 6);
  const clamped = Math.max(0.3, Math.min(0.7, ratio));
  mainLayout.style.gridTemplateColumns = `${clamped}fr 6px ${1 - clamped}fr`;
}

function onResizeUp() {
  isResizing = false;
  divider.classList.remove('active');
  document.removeEventListener('pointermove', onResizeMove);
  document.removeEventListener('pointerup', onResizeUp);
}

// ─── Init ───
processJson(jsonInput.value);
