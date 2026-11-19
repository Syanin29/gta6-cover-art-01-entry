/** Panel layout presets. Each layout defines a set of normalized rectangles (0-1). */

/** Compute panel rects for a given layout at a specific canvas size. */
export function getLayoutPanels(layoutId, width, height, gutter = 0.015) {
  const layouts = {
    trio: trioLayout,
    hero: heroLayout,
    quad: quadLayout,
    single: singleLayout,
  };
  const fn = layouts[layoutId] ?? layouts.trio;
  return fn(width, height, gutter);
}

/** 3 vertical panels (Trio Columns). */
function trioLayout(w, h, g) {
  const pw = (1 - g * 2) / 3;
  return [
    { x: g, y: g, w: pw, h: 1 - g * 2 },
    { x: g + pw + g, y: g, w: pw, h: 1 - g * 2 },
    { x: g + (pw + g) * 2, y: g, w: pw, h: 1 - g * 2 },
  ];
}

/** Hero + Stack: big left panel, two stacked right panels. */
function heroLayout(w, h, g) {
  const leftW = 0.58;
  const rightW = 1 - leftW - g * 2;
  const rightH = (1 - g * 3) / 2;
  return [
    { x: g, y: g, w: leftW, h: 1 - g * 2 },
    { x: g + leftW + g, y: g, w: rightW, h: rightH },
    { x: g + leftW + g, y: g + rightH + g, w: rightW, h: rightH },
  ];
}

/** 2x2 grid (Quad Grid). */
function quadLayout(w, h, g) {
  const pw = (1 - g * 3) / 2;
  const ph = (1 - g * 3) / 2;
  return [
    { x: g, y: g, w: pw, h: ph },
    { x: g + pw + g, y: g, w: pw, h: ph },
    { x: g, y: g + ph + g, w: pw, h: ph },
    { x: g + pw + g, y: g + ph + g, w: pw, h: ph },
  ];
}

/** Single full-bleed panel. */
function singleLayout(w, h, g) {
  return [{ x: 0, y: 0, w: 1, h: 1 }];
}

/** Layout metadata for UI. */
export const LAYOUTS = [
  { id: 'trio', name: 'Trio Columns', desc: '3 vertical panels' },
  { id: 'hero', name: 'Hero + Stack', desc: 'Large left, 2 stacked right' },
  { id: 'quad', name: 'Quad Grid', desc: '2×2 grid' },
  { id: 'single', name: 'Single', desc: 'Full bleed' },
];
