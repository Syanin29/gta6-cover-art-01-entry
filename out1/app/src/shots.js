/** Fixed scenes for screenshots: ?shot=cover and ?shot=editor. */

import { loadSample, SAMPLES, loadImage } from './samples.js';
import { getGrade } from './grades.js';
import { drawLettering } from './lettering.js';

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

export async function runShot(shot, query, loadCallback) {
  const coverCanvas = document.getElementById('cover');
  const previewCanvas = document.getElementById('preview');
  if (!coverCanvas || !previewCanvas) return;
  
  if (shot === 'cover') {
    await runCoverShot(previewCanvas, query, loadCallback);
  } else if (shot === 'editor') {
    await runEditorShot(query, loadCallback);
  }
  
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

async function runCoverShot(canvas, query, loadCallback) {
  const gradeId = query.get('grade') ?? 'sunset';
  const size = parseSize(query.get('size'));
  const caption = query.get('caption') ?? 'SUNSET HEIST';
  const subtitle = query.get('subtitle') ?? '';
  const intensity = Math.min(100, Math.max(0, Number(query.get('intensity')))) / 100 || 0.75;
  const vignette = query.get('vignette') !== 'false';
  const captionPosition = query.get('captionPos') ?? 'bottom';
  const keyline = query.get('keyline') !== 'false';
  
  const grade = getGrade(gradeId);
  
  // Load images
  const sampleImages = [];
  for (const s of SAMPLES) {
    const img = new Image();
    img.src = s.url;
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${s.url}`));
      if (img.complete && img.naturalWidth > 0) resolve(img);
    });
    try { await img.decode(); } catch {}
    sampleImages.push(img);
  }
  
  await loadCallback(SAMPLES[0].url, caption);
  
  // Set canvas to target size (internal resolution)
  canvas.width = size.width;
  canvas.height = size.height;
  
  // Manually hide controls and make canvas fill viewport
  document.querySelector('.controls').style.display = 'none';
  document.querySelector('.app').style.gridTemplateColumns = '1fr';
  document.querySelector('.preview-wrap').style.padding = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.maxWidth = 'none';
  canvas.style.maxHeight = 'none';
  canvas.style.borderRadius = '0';
  canvas.style.boxShadow = 'none';
  
  const ctx = canvas.getContext('2d');
  
  // Clear with dark bg
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, size.width, size.height);
  
  // Draw first image
  const img = sampleImages[0];
  if (img && img.complete && img.naturalWidth > 0) {
    const scale = Math.max(size.width / img.naturalWidth, size.height / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (size.width - dw) / 2;
    const dy = (size.height - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  
  // Grade overlay
  if (grade.gradient) {
    const prevOp = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = grade.blendMode;
    ctx.fillStyle = grade.gradient(ctx, size.width, size.height, intensity);
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.globalCompositeOperation = prevOp;
  }
  
  // Vignette
  if (vignette && grade.vignetteColor) {
    const v = ctx.createRadialGradient(
      size.width * 0.5, size.height * 0.5, Math.min(size.width, size.height) * 0.15,
      size.width * 0.5, size.height * 0.5, Math.max(size.width, size.height) * 0.75
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, grade.vignetteColor);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, size.width, size.height);
  }
  
  // Lettering
  if (caption || subtitle) {
    drawLettering(ctx, size.width, size.height, {
      caption,
      subtitle,
      position: captionPosition,
      grade,
      letteringGradient: grade.letteringGradient(ctx, size.width, size.height),
    });
  }
  
  // Keyline
  if (keyline) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = Math.max(1, Math.min(size.width, size.height) * 0.003);
    ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, size.width - ctx.lineWidth, size.height - ctx.lineWidth);
    ctx.restore();
  }
  
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));
}

async function runEditorShot(query, loadCallback) {
  const sampleId = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const sample = SAMPLES.find(s => s.id === sampleId) ?? SAMPLES[1];
  await loadCallback(sample.url, caption);
  await new Promise(r => setTimeout(r, 500));
}
