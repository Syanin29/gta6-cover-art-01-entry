/** Per-panel photo state: image, transform (pan/zoom), and interaction. */

import { getLayoutPanels } from './layouts.js';
import { applyGrade } from './grades.js';
import { drawLettering } from './lettering.js';

/** Load an image from URL, return promise<HTMLImageElement>. */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export class Panel {
  constructor(index, rect) {
    this.index = index;
    this.rect = rect; // {x, y, w, h} in normalized 0-1 coordinates
    this.image = null; // HTMLImageElement
    this.objectUrl = null; // for cleanup
    // Transform: cover-fit base + user pan/zoom
    this.scale = 1; // additional zoom multiplier (1 = cover-fit)
    this.offsetX = 0; // normalized -1 to 1 pan
    this.offsetY = 0;
    this.selected = false;
  }
  
  /** Set the panel's image from a File or URL. */
  async setImage(source) {
    this.clearImage();
    if (source instanceof File) {
      this.objectUrl = URL.createObjectURL(source);
      this.image = await loadImage(this.objectUrl);
    } else if (typeof source === 'string') {
      this.image = await loadImage(source);
    }
    // Reset transform on new image
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  
  /** Set image from an already-loaded HTMLImageElement. */
  setImageElement(img) {
    this.clearImage();
    this.image = img;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  
  clearImage() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.image = null;
  }
  
  /** Apply zoom delta (multiplicative). */
  zoom(delta, clamp = true) {
    this.scale *= delta;
    if (clamp) this.clampTransform();
  }
  
  /** Set absolute zoom level. */
  setZoom(level) {
    this.scale = level;
    this.clampTransform();
  }
  
  /** Pan by normalized deltas. */
  pan(dx, dy) {
    this.offsetX += dx;
    this.offsetY += dy;
    this.clampTransform();
  }
  
  /** Set absolute pan. */
  setPan(x, y) {
    this.offsetX = x;
    this.offsetY = y;
    this.clampTransform();
  }
  
  /** Clamp transform so image always covers the panel (no empty space). */
  clampTransform() {
    if (!this.image) return;
    const { naturalWidth: iw, naturalHeight: ih } = this.image;
    const { w: pw, h: ph } = this.rect; // normalized panel size
    
    // Cover-fit base scale
    const baseScale = Math.max(pw / iw, ph / ih);
    const minScale = baseScale;
    
    // Max scale: allow up to 4x cover-fit
    const maxScale = baseScale * 4;
    
    this.scale = Math.max(minScale, Math.min(maxScale, this.scale));
    
    // Current displayed image size in normalized coords
    const dw = (iw * this.scale) / pw;
    const dh = (ih * this.scale) / ph;
    
    // Max pan so image stays covering panel
    const maxPanX = (dw - 1) / 2;
    const maxPanY = (dh - 1) / 2;
    
    this.offsetX = Math.max(-maxPanX, Math.min(maxPanX, this.offsetX));
    this.offsetY = Math.max(-maxPanY, Math.min(maxPanY, this.offsetY));
  }
  
  /** Get the draw rect in canvas pixels for a given canvas size. */
  getDrawRect(canvasWidth, canvasHeight) {
    if (!this.image) return null;
    const { naturalWidth: iw, naturalHeight: ih } = this.image;
    const { x, y, w, h } = this.rect;
    
    const px = x * canvasWidth;
    const py = y * canvasHeight;
    const pw = w * canvasWidth;
    const ph = h * canvasHeight;
    
    // Cover-fit base
    const baseScale = Math.max(pw / iw, ph / ih);
    const scaledW = iw * baseScale * this.scale;
    const scaledH = ih * baseScale * this.scale;
    
    // Center + pan offset
    const offsetXPx = this.offsetX * pw;
    const offsetYPx = this.offsetY * ph;
    
    return {
      sx: 0, sy: 0, sw: iw, sh: ih,
      dx: px + (pw - scaledW) / 2 + offsetXPx,
      dy: py + (ph - scaledH) / 2 + offsetYPx,
      dw: scaledW,
      dh: scaledH,
    };
  }
  
  /** Check if a point (in normalized canvas coords 0-1) hits this panel. */
  hitTest(nx, ny) {
    const { x, y, w, h } = this.rect;
    return nx >= x && nx <= x + w && ny >= y && ny <= y + h;
  }
  
  /** Create a copy of this panel's transform (for syncing). */
  copyTransform() {
    return { scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY };
  }
  
  /** Apply a copied transform. */
  applyTransform(t) {
    this.scale = t.scale;
    this.offsetX = t.offsetX;
    this.offsetY = t.offsetY;
    this.clampTransform();
  }
}

/** Panel manager: handles multiple panels, selection, and batch operations. */
export class PanelManager {
  constructor(layoutId, canvasWidth, canvasHeight) {
    this.panels = [];
    this.selectedIndex = 0;
    this.layoutId = layoutId;
    this.updateLayout(layoutId, canvasWidth, canvasHeight);
  }
  
  updateLayout(layoutId, canvasWidth, canvasHeight) {
    this.layoutId = layoutId;
    // Recreate panels with new layout rects, preserving images/transforms where possible
    const newRects = getLayoutPanels(layoutId, canvasWidth, canvasHeight);
    const oldPanels = this.panels;
    this.panels = newRects.map((rect, i) => {
      const p = new Panel(i, rect);
      if (oldPanels[i]) {
        p.image = oldPanels[i].image;
        p.objectUrl = oldPanels[i].objectUrl;
        p.scale = oldPanels[i].scale;
        p.offsetX = oldPanels[i].offsetX;
        p.offsetY = oldPanels[i].offsetY;
        p.clampTransform();
      }
      return p;
    });
    // Clamp selection index
    this.selectedIndex = Math.min(this.selectedIndex, this.panels.length - 1);
    this.panels.forEach((p, i) => p.selected = i === this.selectedIndex);
  }
  
  get selected() {
    return this.panels[this.selectedIndex];
  }
  
  select(index) {
    if (index < 0 || index >= this.panels.length) return;
    this.panels[this.selectedIndex].selected = false;
    this.selectedIndex = index;
    this.panels[this.selectedIndex].selected = true;
  }
  
  selectNext() {
    this.select((this.selectedIndex + 1) % this.panels.length);
  }
  
  /** Assign an image to the selected panel. */
  async setSelectedImage(source) {
    await this.selected.setImage(source);
  }
  
  /** Assign an image to all panels. */
  async setAllImages(source) {
    for (const p of this.panels) {
      if (source instanceof File) {
        // Each panel needs its own object URL if from File
        const url = URL.createObjectURL(source);
        p.image = await loadImage(url);
        p.objectUrl = url;
      } else if (typeof source === 'string') {
        p.image = await loadImage(source);
      } else if (source instanceof HTMLImageElement) {
        p.setImageElement(source);
      }
      p.clampTransform();
    }
  }
  
  /** Cycle through loaded images for a panel (for sample buttons). */
  setSelectedImageElement(img) {
    this.selected.setImageElement(img);
  }
  
  setAllImagesElement(img) {
    for (const p of this.panels) p.setImageElement(img);
  }
  
  /** Get panel at normalized coordinate (for click selection). */
  getPanelAt(nx, ny) {
    return this.panels.findIndex(p => p.hitTest(nx, ny));
  }
  
  /** Draw all panels onto a canvas context. */
  draw(ctx, canvasWidth, canvasHeight, grade, intensity, vignette, grain, letteringOptions) {
    // Draw each panel
    for (const panel of this.panels) {
      const rect = panel.getDrawRect(canvasWidth, canvasHeight);
      if (!rect) continue;
      
      ctx.save();
      // Clip to panel bounds
      const { x, y, w, h } = panel.rect;
      const px = x * canvasWidth;
      const py = y * canvasHeight;
      const pw = w * canvasWidth;
      const ph = h * canvasHeight;
      
      ctx.beginPath();
      ctx.rect(px, py, pw, ph);
      ctx.clip();
      
      // Draw image with grade filter
      if (panel.image) {
        ctx.filter = grade.filter;
        ctx.drawImage(panel.image, rect.dx, rect.dy, rect.dw, rect.dh);
        ctx.filter = 'none';
      } else {
        // Placeholder
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(px, py, pw, ph);
      }
      
      ctx.restore();
    }
    
    // Apply grade overlay (global, after all panels)
    applyGrade(ctx, canvasWidth, canvasHeight, grade, intensity, vignette, grain);
    
    // Draw panel gutters (dark borders)
    this.drawGutters(ctx, canvasWidth, canvasHeight);
    
    // Draw lettering (global)
    if (letteringOptions.caption || letteringOptions.subtitle) {
      drawLettering(ctx, canvasWidth, canvasHeight, {
        ...letteringOptions,
        grade,
        letteringGradient: grade.letteringGradient(ctx, canvasWidth, canvasHeight),
      });
    }
    
    // Draw keyline frame (optional)
    if (letteringOptions.keyline) {
      this.drawKeyline(ctx, canvasWidth, canvasHeight);
    }
  }
  
  /** Draw dark gutters between panels. */
  drawGutters(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.006);
    ctx.lineCap = 'butt';
    
    for (const panel of this.panels) {
      const { x, y, w: pw, h: ph } = panel.rect;
      const px = x * w;
      const py = y * h;
      const pww = pw * w;
      const phh = ph * h;
      
      ctx.strokeRect(px, py, pww, phh);
    }
    ctx.restore();
  }
  
  /** Draw thin keyline frame around entire cover. */
  drawKeyline(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.003);
    ctx.strokeRect(
      ctx.lineWidth / 2, ctx.lineWidth / 2,
      w - ctx.lineWidth, h - ctx.lineWidth
    );
    ctx.restore();
  }
}
