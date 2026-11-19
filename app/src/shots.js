/** Fixed scenes for screenshots: ?shot=cover and ?shot=editor. */

import { loadSample, SAMPLES, loadImage } from './samples.js';
import { getGrade } from './grades.js';
import { renderCover, createPreloadedManager } from './cover.js';
import { getLayoutPanels } from './layouts.js';

const SIZE_PRESETS = {
  '1080x1080': { width: 1080, height: 1080 },
  '1080x1350': { width: 1080, height: 1350 },
  '1920x1080': { width: 1920, height: 1080 },
};

function parseSize(str) {
  if (!str) return SIZE_PRESETS['1920x1080'];
  const [w, h] = str.split('x').map(Number);
  if (Number.isInteger(w) && Number.isInteger(h)) return { width: w, height: h };
  return SIZE_PRESETS[str] ?? SIZE_PRESETS['1920x1080'];
}

export async function runShot(shot, query, panelManager) {
  const previewCanvas = document.getElementById('preview');
  if (!previewCanvas) return;
  
  if (shot === 'cover') {
    await runCoverShot(previewCanvas, query);
  } else if (shot === 'editor') {
    await runEditorShot(query, panelManager, previewCanvas);
  }
  
  // Two rAF after images loaded + render done
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));
  window.__shotReady = true;
}

async function runCoverShot(previewCanvas, query) {
  const layoutId = query.get('layout') ?? 'trio';
  const gradeId = query.get('grade') ?? 'sunset';
  const size = parseSize(query.get('size'));
  const caption = query.get('caption') ?? 'SUNSET HEIST';
  const subtitle = query.get('subtitle') ?? '';
  const intensity = Math.min(100, Math.max(0, Number(query.get('intensity')))) / 100 || 0.75;
  const vignette = query.get('vignette') !== 'false';
  const grain = query.get('grain') === 'true';
  const captionPosition = query.get('captionPos') ?? 'bottom';
  const keyline = query.get('keyline') !== 'false';
  
  const grade = getGrade(gradeId);
  
  // Add shot-cover class to body for CSS styling
  document.body.classList.add('shot-cover');
  
  // Hide controls and make preview canvas fill viewport
  document.querySelector('.controls').style.display = 'none';
  document.querySelector('.app').style.gridTemplateColumns = '1fr';
  document.querySelector('.preview-wrap').style.padding = '0';
  previewCanvas.style.width = '100vw';
  previewCanvas.style.height = '100vh';
  previewCanvas.style.maxWidth = 'none';
  previewCanvas.style.maxHeight = 'none';
  previewCanvas.style.borderRadius = '0';
  previewCanvas.style.boxShadow = 'none';
  
  // Create panel manager with the specified layout and full target size
  const panelManager = await createPreloadedManager(layoutId, size.width, size.height);
  
  // Set canvas to target size (internal resolution)
  previewCanvas.width = size.width;
  previewCanvas.height = size.height;
  
  // Render using the real multi-panel renderCover
  await renderCover(previewCanvas, panelManager, {
    width: size.width,
    height: size.height,
    grade,
    intensity,
    vignette,
    grain,
    caption,
    subtitle,
    captionPosition,
    keyline,
  });
}

async function runEditorShot(query, panelManager, previewCanvas) {
  const sampleId = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'VICE CITY NIGHTS';
  const layoutId = query.get('layout') ?? 'trio';
  const gradeId = query.get('grade') ?? 'sunset';
  const sizeStr = query.get('size') ?? '1920x1080';
  const intensity = Math.min(100, Math.max(0, Number(query.get('intensity')))) / 100 || 0.75;
  const vignette = query.get('vignette') !== 'false';
  const grain = query.get('grain') === 'true';
  const captionPosition = query.get('captionPos') ?? 'bottom';
  const keyline = query.get('keyline') !== 'false';
  
  // Apply query params to UI controls
  document.getElementById('layout-select').value = layoutId;
  document.getElementById('grade-select').value = gradeId;
  document.getElementById('intensity-slider').value = Math.round(intensity * 100);
  document.getElementById('intensity-value').textContent = `${Math.round(intensity * 100)}%`;
  document.getElementById('vignette-check').checked = vignette;
  document.getElementById('grain-check').checked = grain;
  document.getElementById('caption-input').value = caption;
  document.getElementById('subtitle-input').value = subtitle;
  document.getElementById('caption-pos-select').value = captionPosition;
  document.getElementById('keyline-check').checked = keyline;
  document.getElementById('size-select').value = sizeStr;
  
  // Dispatch change events in the correct order so main.js handlers update state properly:
  // 1. Size first (updates currentSize and panelManager layout)
  // 2. Layout (updates panelManager layout with currentSize)
  // 3. Grade (updates currentGrade)
  document.getElementById('size-select').dispatchEvent(new Event('change'));
  document.getElementById('layout-select').dispatchEvent(new Event('change'));
  document.getElementById('grade-select').dispatchEvent(new Event('change'));
  
  // Load the sample image for the editor shot
  const sampleImg = await loadSample(sampleId);
  if (panelManager) {
    panelManager.setSelectedImageElement(sampleImg);
  }
  
  // Get current grade from main.js state (via the grade select)
  const currentGrade = getGrade(gradeId);
  
  // Render to preview canvas at UI preview size (same as main.js redraw())
  const previewW = Math.min(720, 1920); // currentSize.width from sizeStr default
  const previewH = Math.round(previewW * 1080 / 1920); // currentSize.height
  previewCanvas.width = previewW;
  previewCanvas.height = previewH;
  previewCanvas.style.width = `${previewW}px`;
  previewCanvas.style.height = `${previewH}px`;
  
  await renderCover(previewCanvas, panelManager, {
    width: previewW,
    height: previewH,
    grade: currentGrade,
    intensity,
    vignette,
    grain,
    caption,
    subtitle,
    captionPosition,
    keyline,
  });
  
  // Give time for images to load and render
  await new Promise(r => setTimeout(r, 500));
}
