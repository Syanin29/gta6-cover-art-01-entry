/** Main entry point: wires the editor UI, handles interactions, and coordinates all modules. */

import { PanelManager } from './panels.js';
import { renderCover, createPreloadedManager } from './cover.js';
import { loadSample, SAMPLES, loadImage } from './samples.js';
import { GRADES, getGrade } from './grades.js';
import { LAYOUTS, getLayoutPanels } from './layouts.js';
import { runShot } from './shots.js';

// ============ DOM Elements ============
const canvas = document.getElementById('cover');
const previewCanvas = document.getElementById('preview');
const statusEl = document.getElementById('status');

// Controls
const photoInput = document.getElementById('photo-input');
const dropZone = document.getElementById('drop-zone');
const layoutSelect = document.getElementById('layout-select');
const gradeSelect = document.getElementById('grade-select');
const intensitySlider = document.getElementById('intensity-slider');
const intensityValue = document.getElementById('intensity-value');
const vignetteCheck = document.getElementById('vignette-check');
const grainCheck = document.getElementById('grain-check');
const captionInput = document.getElementById('caption-input');
const subtitleInput = document.getElementById('subtitle-input');
const captionPosSelect = document.getElementById('caption-pos-select');
const keylineCheck = document.getElementById('keyline-check');
const popoutCheck = document.getElementById('popout-check');
const calloutsCheck = document.getElementById('callouts-check');
const zoomSlider = document.getElementById('zoom-slider');
const zoomValue = document.getElementById('zoom-value');
const fitBtn = document.getElementById('fit-btn');
const fillBtn = document.getElementById('fill-btn');
const exportBtn = document.getElementById('export-btn');
const sizeSelect = document.getElementById('size-select');
const applyAllBtn = document.getElementById('apply-all-btn');

// Sample buttons container
const sampleButtons = document.getElementById('sample-buttons');

// ============ State ============
let panelManager = null;
let currentGrade = getGrade('sunset');
let currentIntensity = 0.75;
let currentSize = { width: 1080, height: 1080 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let dragPanelIndex = -1;
let dragStartPan = { x: 0, y: 0 };
let loadedSampleImages = [];

// ============ Initialization ============
async function init() {
  // Parse URL for shot mode
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  
  // Build UI options FIRST (for every mode)
  buildLayoutOptions();
  buildGradeOptions();
  buildSampleButtons();
  buildSizeOptions();
  
  // Create panel manager with default layout
  panelManager = await createPreloadedManager('trio', 1080, 1080);
  
  // Preload all sample images for quick switching
  loadedSampleImages = await Promise.all(SAMPLES.map(s => loadSample(s.id)));
  
  // Event listeners
  setupEventListeners();
  
  // Initial render
  redraw();
  updateStatus('Ready — drag photos, pick a layout, set a caption, export.');
  
  // NOW handle shot mode (after UI is built and panelManager exists)
  if (shot) {
    await runShot(shot, params, panelManager);
    return;
  }
}

function buildLayoutOptions() {
  layoutSelect.innerHTML = LAYOUTS.map(l => 
    `<option value="${l.id}">${l.name}</option>`
  ).join('');
}

function buildGradeOptions() {
  gradeSelect.innerHTML = GRADES.map(g => 
    `<option value="${g.id}">${g.name}</option>`
  ).join('');
}

function buildSampleButtons() {
  sampleButtons.innerHTML = SAMPLES.map((s, i) => 
    `<button type="button" class="sample-btn" data-sample="${s.id}" title="${s.name}">
      ${s.name}
    </button>`
  ).join('');
}

function buildSizeOptions() {
  sizeSelect.innerHTML = `
    <option value="1080x1080">Square 1080×1080</option>
    <option value="1080x1350">Portrait 1080×1350</option>
    <option value="1920x1080" selected>Landscape 1920×1080</option>
  `;
}

function setupEventListeners() {
  // Photo input
  photoInput.addEventListener('change', handleFiles);
  
  // Drag and drop
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', e => { dropZone.classList.remove('drag-over'); });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFiles({ target: { files: e.dataTransfer.files } });
  });
  
  // Layout change
  layoutSelect.addEventListener('change', e => {
    panelManager.updateLayout(e.target.value, currentSize.width, currentSize.height);
    redraw();
  });
  
  // Grade change
  gradeSelect.addEventListener('change', e => {
    currentGrade = getGrade(e.target.value);
    redraw();
  });
  
  // Intensity
  intensitySlider.addEventListener('input', e => {
    currentIntensity = e.target.value / 100;
    intensityValue.textContent = `${e.target.value}%`;
    redraw();
  });
  
  // Vignette / Grain
  vignetteCheck.addEventListener('change', redraw);
  grainCheck.addEventListener('change', redraw);
  
  // Caption / Subtitle / Position
  captionInput.addEventListener('input', redraw);
  subtitleInput.addEventListener('input', redraw);
  captionPosSelect.addEventListener('change', redraw);
  
  // Pop-out Hero / Callouts checkboxes
  popoutCheck.addEventListener('change', redraw);
  calloutsCheck.addEventListener('change', redraw);
  
  // Keyline
  keylineCheck.addEventListener('change', redraw);
  
  // Zoom
  zoomSlider.addEventListener('input', e => {
    if (panelManager?.selected) {
      const zoom = parseFloat(e.target.value);
      panelManager.selected.setZoom(zoom);
      zoomSlider.value = zoom;
      zoomValue.textContent = `${Math.round(zoom * 100)}%`;
      redraw();
    }
  });
  
  // Fit / Fill buttons
  fitBtn.addEventListener('click', () => {
    if (panelManager?.selected) {
      panelManager.selected.setZoom(1);
      panelManager.selected.offsetX = 0;
      panelManager.selected.offsetY = 0;
      updateZoomSlider();
      redraw();
    }
  });
  
  fillBtn.addEventListener('click', () => {
    if (panelManager?.selected) {
      panelManager.selected.setZoom(panelManager.selected.scale * 2);
      updateZoomSlider();
      redraw();
    }
  });
  
  // Mouse selection on canvas
  const canvasEl = document.getElementById('cover');
  canvasEl.addEventListener('pointerdown', e => {
    const rect = canvasEl.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    
    const panelIdx = panelManager.getPanelAt(nx, ny);
    if (panelIdx >= 0) {
      panelManager.select(panelIdx);
      isDragging = true;
      dragStart = { x: nx, y: ny };
      const panel = panelManager.panels[panelIdx];
      dragStartPan = { x: panel.offsetX, y: panel.offsetY };
      canvasEl.setPointerCapture(e.pointerId);
      updateZoomSlider();
      redraw();
    }
  });
  
  canvasEl.addEventListener('pointermove', e => {
    if (!isDragging || dragPanelIndex < 0) return;
    const rect = canvasEl.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    
    const dx = (nx - dragStart.x) * 2;
    const dy = (ny - dragStart.y) * 2;
    
    const panel = panelManager.panels[dragPanelIndex];
    panel.setPan(dragStartPan.x + dx, dragStartPan.y + dy);
    redraw();
  });
  
  canvasEl.addEventListener('pointerup', e => {
    if (isDragging) {
      isDragging = false;
      dragPanelIndex = -1;
      canvasEl.releasePointerCapture(e.pointerId);
    }
  });
  
  canvasEl.addEventListener('pointerleave', () => {
    if (isDragging) {
      isDragging = false;
      dragPanelIndex = -1;
    }
  });
  
  // Mouse wheel zoom on selected panel
  canvasEl.addEventListener('wheel', e => {
    if (!panelManager?.selected) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    panelManager.selected.zoom(delta);
    updateZoomSlider();
    redraw();
  }, { passive: false });
}

function updateZoomSlider() {
  if (panelManager?.selected) {
    const zoom = panelManager.selected.scale;
    zoomSlider.value = zoom;
    zoomValue.textContent = `${Math.round(zoom * 100)}%`;
  }
}

async function handleFiles(event) {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('image/'));
  if (!files.length) return;
  
  const firstFile = files[0];
  await panelManager.setSelectedImage(firstFile);
  
  redraw();
  updateStatus(`Loaded ${files.length} photo${files.length > 1 ? 's' : ''}.`);
  photoInput.value = '';
}

function redraw() {
  if (!panelManager) return;
  
  const options = {
    width: currentSize.width,
    height: currentSize.height,
    grade: currentGrade,
    intensity: currentIntensity,
    vignette: vignetteCheck.checked,
    grain: grainCheck.checked,
    caption: captionInput.value,
    subtitle: subtitleInput.value,
    captionPosition: captionPosSelect.value,
    keyline: keylineCheck.checked,
    popout: popoutCheck.checked,
    callouts: calloutsCheck.checked,
  };
  
  // Render to preview canvas (scaled down for UI)
  const previewW = Math.min(720, currentSize.width);
  const previewH = Math.round(previewW * currentSize.height / currentSize.width);
  previewCanvas.width = previewW;
  previewCanvas.height = previewH;
  previewCanvas.style.width = `${previewW}px`;
  previewCanvas.style.height = `${previewH}px`;
  
  renderCover(previewCanvas, panelManager, {
    ...options,
    width: previewW,
    height: previewH,
  });
}

async function exportCover() {
  if (!panelManager) return;
  
  exportBtn.disabled = true;
  exportBtn.textContent = 'Exporting…';
  updateStatus('Rendering cover…');
  
  try {
    const options = {
      width: currentSize.width,
      height: currentSize.height,
      grade: currentGrade,
      intensity: currentIntensity,
      vignette: vignetteCheck.checked,
      grain: grainCheck.checked,
      caption: captionInput.value,
      subtitle: subtitleInput.value,
      captionPosition: captionPosSelect.value,
      keyline: keylineCheck.checked,
      popout: popoutCheck.checked,
      callouts: calloutsCheck.checked,
    };
    
    const blob = await exportCoverBlob(panelManager, options);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-${currentSize.width}x${currentSize.height}.png`;
    a.click();
    URL.revokeObjectURL(url);
    
    updateStatus(`Exported cover-${currentSize.width}x${currentSize.height}.png`);
  } catch (err) {
    console.error(err);
    updateStatus('Export failed: ' + err.message);
  } finally {
    exportBtn.disabled = false;
    exportBtn.textContent = 'Export PNG';
  }
}

/** Export cover to blob (offscreen render at full resolution). */
async function exportCoverBlob(panelManager, options) {
  const { width, height, ...rest } = options;
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  await renderCover(offscreen, panelManager, { width, height, ...rest });
  return new Promise(resolve => offscreen.toBlob(resolve, 'image/png'));
}

function zoomIn() {
  if (panelManager?.selected) {
    panelManager.selected.zoom(1.15);
    updateZoomSlider();
    redraw();
  }
}

function zoomOut() {
  if (panelManager?.selected) {
    panelManager.selected.zoom(1/1.15);
    updateZoomSlider();
    redraw();
  }
}

function updateStatus(msg) {
  statusEl.textContent = msg;
}

// Start
init();
