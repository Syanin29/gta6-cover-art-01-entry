/** Bold caption/subtitle lettering with gradient fill, outline, and shadow. */

const FONT_STACK = "Impact, 'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Draw caption and optional subtitle on the canvas. */
export function drawLettering(ctx, width, height, options) {
  const {
    caption = '',
    subtitle = '',
    grade,
    position = 'bottom', // 'bottom' or 'top'
    letteringGradient,
  } = options;
  
  if (!caption && !subtitle) return;
  
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  
  // Calculate available space
  const marginX = width * 0.06;
  const maxTextWidth = width - marginX * 2;
  const captionY = position === 'top' 
    ? height * 0.14 
    : height - height * 0.08;
  const subtitleGap = height * 0.025;
  
  // Draw caption (main text)
  if (caption) {
    drawTextLine(ctx, caption.toUpperCase(), width / 2, captionY, maxTextWidth, {
      gradient: letteringGradient,
      fontSizeRatio: 0.11,
      minFontSize: 28,
      outlineWidth: 0.08,
      outlineColor: 'rgba(0, 0, 0, 0.95)',
      shadowBlur: 0.025,
      shadowColor: 'rgba(0, 0, 0, 0.6)',
      shadowOffsetY: 0.006,
    }, height);
  }
  
  // Draw subtitle (smaller text)
  if (subtitle) {
    const subY = position === 'top' 
      ? captionY + getFontSize(height * 0.11, caption.toUpperCase(), maxTextWidth, ctx) + subtitleGap
      : captionY - subtitleGap;
    drawTextLine(ctx, subtitle.toUpperCase(), width / 2, subY, maxTextWidth * 0.85, {
      gradient: letteringGradient,
      fontSizeRatio: 0.045,
      minFontSize: 14,
      outlineWidth: 0.06,
      outlineColor: 'rgba(0, 0, 0, 0.85)',
      shadowBlur: 0.015,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowOffsetY: 0.004,
    }, height);
  }
  
  ctx.restore();
}

/** Draw a single line of text with auto-fit, gradient fill, outline, and shadow. */
function drawTextLine(ctx, text, cx, cy, maxWidth, opts, canvasHeight) {
  const {
    gradient,
    fontSizeRatio,
    minFontSize,
    outlineWidth,
    outlineColor,
    shadowBlur,
    shadowColor,
    shadowOffsetY,
  } = opts;
  
  // Auto-fit font size
  let fontSize = Math.max(minFontSize, Math.floor(canvasHeight * fontSizeRatio));
  ctx.font = `bold ${fontSize}px ${FONT_STACK}`;
  
  while (ctx.measureText(text).width > maxWidth && fontSize > minFontSize) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px ${FONT_STACK}`;
  }
  
  // Shadow
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = fontSize * shadowBlur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = fontSize * shadowOffsetY;
  
  // Outline (stroke)
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = fontSize * outlineWidth;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeText(text, cx, cy);
  
  // Fill with gradient
  ctx.fillStyle = gradient;
  ctx.fillText(text, cx, cy);
}

/** Get the computed font size for a text (used for subtitle positioning). */
function getFontSize(ratio, text, maxWidth, ctx) {
  let size = Math.max(14, Math.floor(1080 * ratio)); // baseline from 1080
  ctx.font = `bold ${size}px ${FONT_STACK}`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size -= 2;
    ctx.font = `bold ${size}px ${FONT_STACK}`;
  }
  return size;
}
