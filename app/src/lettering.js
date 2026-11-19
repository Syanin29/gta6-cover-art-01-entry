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
  
  // Caption baseline positions
  // Bottom: caption at 90% height, subtitle centered BELOW at 96%
  // Top: caption at 10% height (baseline), subtitle centered BELOW at 16%
  const captionY = position === 'top' 
    ? height * 0.10  // baseline at 10% from top
    : height * 0.90; // baseline at 90% from top (10% from bottom)
  
  // Draw caption (main text) first to measure its actual font size
  let captionFontSize = 0;
  if (caption) {
    captionFontSize = drawTextLine(ctx, caption.toUpperCase(), width / 2, captionY, maxTextWidth, {
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
  
  // Draw subtitle (smaller text) - clearly separated BELOW caption
  if (subtitle) {
    // Subtitle is ~40% of caption size, letter-spaced
    const subFontSizeRatio = 0.044; // ~40% of 0.11
    const subMinFontSize = 14;
    
    // Position subtitle well below caption
    // For bottom: subtitle baseline at 96% (6% gap from caption baseline at 90%)
    // For top: subtitle baseline at 16% (6% gap from caption baseline at 10%)
    const subY = position === 'top' 
      ? height * 0.16
      : height * 0.96;
    
    drawTextLine(ctx, subtitle.toUpperCase(), width / 2, subY, maxTextWidth * 0.85, {
      gradient: letteringGradient,
      fontSizeRatio: subFontSizeRatio,
      minFontSize: subMinFontSize,
      outlineWidth: 0.06,
      outlineColor: 'rgba(0, 0, 0, 0.85)',
      shadowBlur: 0.015,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowOffsetY: 0.004,
      letterSpacing: '0.15em', // Add letter spacing for subtitle
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
    letterSpacing = '0',
  } = opts;
  
  // Auto-fit font size
  let fontSize = Math.max(minFontSize, Math.floor(canvasHeight * fontSizeRatio));
  ctx.font = `bold ${fontSize}px ${FONT_STACK}`;
  
  while (ctx.measureText(text).width > maxWidth && fontSize > minFontSize) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px ${FONT_STACK}`;
  }
  
  // Apply letter spacing if specified (via text rendering workaround)
  // Canvas doesn't support letter-spacing directly, so we render character by character
  if (letterSpacing !== '0' && letterSpacing !== 0) {
    return drawLetterSpacedText(ctx, text, cx, cy, fontSize, letterSpacing, opts);
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
  
  return fontSize;
}

/** Draw text with manual letter spacing. */
function drawLetterSpacedText(ctx, text, cx, cy, fontSize, letterSpacing, opts) {
  const {
    gradient,
    outlineWidth,
    outlineColor,
    shadowBlur,
    shadowColor,
    shadowOffsetY,
  } = opts;
  
  // Parse letter spacing (em value)
  const emValue = parseFloat(letterSpacing) * fontSize;
  
  // Measure total width with spacing
  const chars = text.split('');
  let totalWidth = 0;
  const charWidths = [];
  
  for (const ch of chars) {
    const metrics = ctx.measureText(ch);
    charWidths.push(metrics.width);
    totalWidth += metrics.width;
  }
  
  // Add letter spacing between characters (not after last)
  totalWidth += emValue * (chars.length - 1);
  
  // Start position (centered)
  let x = cx - totalWidth / 2;
  
  // Shadow
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = fontSize * shadowBlur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = fontSize * shadowOffsetY;
  
  // Outline (stroke) - draw each char
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = fontSize * outlineWidth;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  
  for (let i = 0; i < chars.length; i++) {
    ctx.strokeText(chars[i], x, cy);
    x += charWidths[i] + emValue;
  }
  
  // Fill with gradient - draw each char
  ctx.fillStyle = gradient;
  x = cx - totalWidth / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, cy);
    x += charWidths[i] + emValue;
  }
  
  return fontSize;
}
