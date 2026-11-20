/** High-level cover rendering: orchestrates panels, grades, lettering into a final canvas. */

import { PanelManager } from './panels.js';

/** Render a complete cover to a canvas at the given size. */
export async function renderCover(canvas, panelManager, options) {
  const {
    width,
    height,
    grade,
    intensity = 1,
    vignette = true,
    grain = false,
    caption = '',
    subtitle = '',
    captionPosition = 'bottom',
    keyline = true,
    popout = true,
    callouts = true,
  } = options;
  
  // Set canvas size
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  
  // Clear
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, width, height);
  
  // Draw panels + grade + lettering
  panelManager.draw(ctx, width, height, grade, intensity, vignette, grain, {
    caption,
    subtitle,
    position: captionPosition,
    keyline,
    popout,
    callouts,
  });
}

/** Render cover to an offscreen canvas and return a blob. */
export async function exportCover(panelManager, options) {
  const { width, height, ...rest } = options;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  await renderCover(canvas, panelManager, { width, height, ...rest });
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

/** Create a PanelManager preloaded with sample images for instant preview. */
export async function createPreloadedManager(layoutId, width, height) {
  const { loadSample, SAMPLES } = await import('./samples.js');
  const manager = new PanelManager(layoutId, width, height);
  
  // Preload all samples
  const sampleImages = await Promise.all(SAMPLES.map(s => loadSample(s.id)));
  
  // Distribute samples across panels ONLY from the two photographic samples (boulevard, pier),
  // alternating, with crop variation so repeats look different
  for (let i = 0; i < manager.panels.length; i++) {
    const img = sampleImages[i % 2]; // only boulevard and pier, alternating
    manager.panels[i].setImageElement(img);
    // Set panel scale and offset variation
    manager.panels[i].scale = (i >= 2 ? 1.3 : 1.0);
    manager.panels[i].offsetX = [0, 0, -0.18, 0.18][i % 4];
    manager.panels[i].offsetY = [0, 0, 0.12, -0.12][i % 4];
  }
  
  return manager;
}
