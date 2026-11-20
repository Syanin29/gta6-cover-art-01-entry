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
    
    // Clamp scale to [1, 4] range
    this.scale = Math.max(1, Math.min(4, this.scale));
    
    // Panel and image aspect ratios
    const pa = pw / ph; // panel aspect
    const ia = iw / ih; // image aspect
    
    // Compute scaled display ratios based on aspect comparison
    let dwRatio, dhRatio;
    if (ia >= pa) {
      dhRatio = this.scale;
      dwRatio = this.scale * ia / pa;
    } else {
      dwRatio = this.scale;
      dhRatio = this.scale * pa / ia;
    }
    
    // Max pan so image stays covering panel
    const maxPanX = (dwRatio - 1) / 2;
    const maxPanY = (dhRatio - 1) / 2;
    
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
    const popout = letteringOptions.popout !== false;
    const callouts = letteringOptions.callouts !== false;
    const keyline = letteringOptions.keyline !== false;
    
    const minDim = Math.min(canvasWidth, canvasHeight);
    
    // Draw order: panels, grade overlay, gutters, pop-out hero, callouts, lettering, frame
    
    // 1. Draw each panel
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
    
    // 2. Apply grade overlay (global, after all panels)
    applyGrade(ctx, canvasWidth, canvasHeight, grade, intensity, vignette, grain);
    
    // 3. Draw panel gutters (dark borders)
    this.drawGutters(ctx, canvasWidth, canvasHeight);
    
    // 4. POP-OUT HERO: expanded hero panel with shadow
    if (popout && this.panels.length >= 2 && this.panels[0].image) {
      const panel0 = this.panels[0];
      const canvasMinDim = Math.min(canvasWidth, canvasHeight);
      const expand = canvasMinDim * 0.035; // 3.5% of min(dim, dim)
      
      // Panel rect in pixels
      const px = panel0.rect.x * canvasWidth;
      const py = panel0.rect.y * canvasHeight;
      const pw = panel0.rect.w * canvasWidth;
      const ph = panel0.rect.h * canvasHeight;
      
      // Expanded rect
      const ex = Math.max(0, px - expand);
      const ey = Math.max(0, py - expand);
      const ew = Math.min(canvasWidth - ex, pw + expand * 2);
      const eh = Math.min(canvasHeight - ey, ph + expand * 2);
      
      if (ew > 0 && eh > 0) {
        ctx.save();
        // Shadow: draw black rect first so silhouette shows through
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = minDim * 0.02;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = minDim * 0.008;
        ctx.fillStyle = '#000';
        ctx.fillRect(ex, ey, ew, eh);
        // Clear shadow so it doesn't affect subsequent drawing
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        
        // Clip to expanded rect
        ctx.beginPath();
        ctx.rect(ex, ey, ew, eh);
        ctx.clip();
        
        // Cover-fit the image into the expanded rect with the panel's scale/pan
        const iw = panel0.image.naturalWidth;
        const ih = panel0.image.naturalHeight;
        const baseScale = Math.max(ew / iw, eh / ih);
        const dw = iw * baseScale * panel0.scale;
        const dh = ih * baseScale * panel0.scale;
        const dx = ex + (ew - dw) / 2 + panel0.offsetX * ew;
        const dy = ey + (eh - dh) / 2 + panel0.offsetY * eh;
        
        ctx.filter = grade.filter;
        ctx.drawImage(panel0.image, dx, dy, dw, dh);
        ctx.filter = 'none';
        
        // White border around the expanded rect
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = minDim * 0.008;
        ctx.strokeRect(ex, ey, ew, eh);
        
        ctx.restore();
      }
    }
    
    // 5. CALLOUTS: for each panel, draw a small chip sized from measured text
    if (callouts) {
      const labels = ['THE LEAD', 'THE COAST', 'LAST LIGHT', 'NIGHT SHIFT'];
      ctx.save();
      
      for (let i = 0; i < this.panels.length; i++) {
        const panel = this.panels[i];
        const { x, y, w, h } = panel.rect;
        const px = x * canvasWidth;
        const py = y * canvasHeight;
        
        // Inset about 1.5% of min dim
        const inset = minDim * 0.015;
        const chipX = px + inset;
const chipY = py + inset;
        
        // Set font first: bold, size max(12, canvasHeight * 0.024), Impact stack
        const textFontSize = Math.max(12, canvasHeight * 0.024);
        ctx.font = `bold ${textFontSize}px "Impact", 'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffd166';
        
        // Labels by panel index cycling
        const label = letteringOptions.calloutLabels && letteringOptions.calloutLabels.length > i 
          ? letteringOptions.calloutLabels[i] 
          : labels[i % labels.length];
        
        // Measure text and size chip from it
        const textWidth = ctx.measureText(label).width;
        const pad = minDim * 0.008;
        const chipW = textWidth + pad * 2;
        const chipH = textFontSize * 1.9;
        
        // Rounded rect fill rgba(8,8,16,0.85)
        const chipRadius = Math.max(4, minDim * 0.02);
        ctx.fillStyle = 'rgba(8, 8, 16, 0.85)';
        ctx.beginPath();
        ctx.moveTo(chipX + chipRadius, chipY);
        ctx.lineTo(chipX + chipW - chipRadius, chipY);
        ctx.quadraticCurveTo(chipX + chipW, chipY, chipX + chipW, chipY + chipRadius);
        ctx.lineTo(chipX + chipW, chipY + chipH - chipRadius);
        ctx.quadraticCurveTo(chipX + chipW, chipY + chipH, chipX + chipW - chipRadius, chipY + chipH);
        ctx.lineTo(chipX + chipRadius, chipY + chipH);
        ctx.quadraticCurveTo(chipX, chipY + chipH, chipX, chipY + chipH - chipRadius);
        ctx.lineTo(chipX, chipY + chipRadius);
        ctx.quadraticCurveTo(chipX, chipY, chipX + chipRadius, chipY);
        ctx.closePath();
        ctx.fill();
        
        // Center text in chip
        const textX = chipX + chipW / 2;
        const textY = chipY + chipH / 2;
        
        ctx.fillText(label, textX, textY);
      }
      
      ctx.restore();
    }
    
    // 6. Draw lettering (global)
    if (letteringOptions.caption || letteringOptions.subtitle) {
      drawLettering(ctx, canvasWidth, canvasHeight, {
        ...letteringOptions,
        grade,
        letteringGradient: grade.letteringGradient(ctx, canvasWidth, canvasHeight),
      });
    }
    
    // 7. Draw keyline frame (optional) - DOUBLE FRAME
    if (keyline) {
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
  
  /** Draw double frame: outer #ffb300, inner rgba(255,255,255,0.9) */
  drawKeyline(ctx, w, h) {
    ctx.save();
    const minDim = Math.min(w, h);
    
    // Outer stroke #ffb300, lineWidth about 0.7% of min dim, inset by half line width
    const outerWidth = minDim * 0.007;
    ctx.strokeStyle = '#ffb300';
    ctx.lineWidth = outerWidth;
    ctx.strokeRect(
      outerWidth / 2, outerWidth / 2,
      w - outerWidth, h - outerWidth
    );
    
    // Inner stroke rgba(255,255,255,0.9), lineWidth about 0.25% of min dim, inset 1.4% of min dim
    const innerWidth = minDim * 0.0025;
    const inset = minDim * 0.014;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = innerWidth;
    ctx.strokeRect(
      inset, inset,
      w - inset * 2, h - inset * 2
    );
    
    ctx.restore();
  }
}
