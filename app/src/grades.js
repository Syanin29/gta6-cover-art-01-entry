/** Colour grade presets for the GTA Vice City aesthetic. */

/** Grade definition: applies a look via canvas filters, gradient overlays, and blend modes. */
export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset Vice',
    desc: 'Orange-pink sky, warm shadows',
    // CSS filter string for the base image
    filter: 'saturate(1.25) contrast(1.15) hue-rotate(-5deg) brightness(1.05)',
    // Gradient overlay (top to bottom)
    gradient: (ctx, w, h, intensity) => {
      const g = ctx.createLinearGradient(0, h * 0.2, 0, h);
      const a = intensity * 0.55;
      g.addColorStop(0, `rgba(255, 140, 60, ${a * 0.15})`);
      g.addColorStop(0.35, `rgba(255, 100, 80, ${a * 0.25})`);
      g.addColorStop(0.6, `rgba(220, 50, 120, ${a * 0.35})`);
      g.addColorStop(1, `rgba(120, 20, 80, ${a * 0.5})`);
      return g;
    },
    // Blend mode for gradient
    blendMode: 'soft-light',
    // Lettering gradient (white to gold)
    letteringGradient: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#fff8e7');
      g.addColorStop(0.5, '#ffd700');
      g.addColorStop(1, '#ff8c00');
      return g;
    },
    // Vignette color
    vignetteColor: 'rgba(60, 20, 40, 0.45)',
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    desc: 'Cyan-magenta, lifted blacks, glow',
    filter: 'saturate(1.4) contrast(1.2) hue-rotate(10deg) brightness(1.1)',
    gradient: (ctx, w, h, intensity) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      const a = intensity * 0.5;
      g.addColorStop(0, `rgba(0, 255, 255, ${a * 0.2})`);
      g.addColorStop(0.3, `rgba(180, 0, 255, ${a * 0.3})`);
      g.addColorStop(0.6, `rgba(255, 20, 147, ${a * 0.35})`);
      g.addColorStop(1, `rgba(60, 0, 100, ${a * 0.45})`);
      return g;
    },
    blendMode: 'screen',
    letteringGradient: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#00ffff');
      g.addColorStop(0.5, '#ff1493');
      g.addColorStop(1, '#ff69b4');
      return g;
    },
    vignetteColor: 'rgba(30, 0, 60, 0.5)',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    desc: 'Warm gold, soft contrast',
    filter: 'saturate(1.15) contrast(1.05) hue-rotate(-8deg) brightness(1.08)',
    gradient: (ctx, w, h, intensity) => {
      const g = ctx.createLinearGradient(0, h * 0.15, 0, h);
      const a = intensity * 0.45;
      g.addColorStop(0, `rgba(255, 220, 120, ${a * 0.1})`);
      g.addColorStop(0.4, `rgba(255, 180, 60, ${a * 0.25})`);
      g.addColorStop(0.7, `rgba(230, 140, 40, ${a * 0.35})`);
      g.addColorStop(1, `rgba(180, 80, 20, ${a * 0.45})`);
      return g;
    },
    blendMode: 'overlay',
    letteringGradient: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#fffbe6');
      g.addColorStop(0.4, '#ffeb3b');
      g.addColorStop(1, '#ffb300');
      return g;
    },
    vignetteColor: 'rgba(80, 50, 10, 0.4)',
  },
  {
    id: 'noir',
    name: 'Noir Mono',
    desc: 'Desaturated teal-black, high contrast',
    filter: 'saturate(0.25) contrast(1.35) brightness(0.95)',
    gradient: (ctx, w, h, intensity) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      const a = intensity * 0.4;
      g.addColorStop(0, `rgba(40, 80, 90, ${a * 0.15})`);
      g.addColorStop(0.5, `rgba(20, 50, 60, ${a * 0.3})`);
      g.addColorStop(1, `rgba(5, 15, 20, ${a * 0.55})`);
      return g;
    },
    blendMode: 'multiply',
    letteringGradient: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#e0f0f8');
      g.addColorStop(0.5, '#80d0e0');
      g.addColorStop(1, '#40a0b0');
      return g;
    },
    vignetteColor: 'rgba(0, 20, 30, 0.6)',
  },
];

/** Get grade by id. */
export function getGrade(id) {
  return GRADES.find(g => g.id === id) ?? GRADES[0];
}

/** Apply grade to a canvas context (draws gradient overlay + vignette). */
export function applyGrade(ctx, width, height, grade, intensity, vignette = true, grain = false) {
  const { gradient, blendMode, vignetteColor } = grade;
  
  // Gradient overlay
  if (gradient) {
    const prevGlobalComposite = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = blendMode;
    ctx.fillStyle = gradient(ctx, width, height, intensity);
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = prevGlobalComposite;
  }
  
  // Vignette
  if (vignette && vignetteColor) {
    const v = ctx.createRadialGradient(
      width * 0.5, height * 0.5, Math.min(width, height) * 0.15,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.75
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, vignetteColor);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Film grain (simple noise overlay)
  if (grain) {
    drawFilmGrain(ctx, width, height, intensity * 0.15);
  }
}

/** Draw subtle film grain noise. */
function drawFilmGrain(ctx, w, h, opacity) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 60 * opacity;
    data[i] = clamp(data[i] + noise);
    data[i+1] = clamp(data[i+1] + noise);
    data[i+2] = clamp(data[i+2] + noise);
  }
  ctx.putImageData(imgData, 0, 0);
}

function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
