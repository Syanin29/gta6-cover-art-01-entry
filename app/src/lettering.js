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
  // Bottom: caption at 88.5% height, subtitle at 94.5%
  // Top: caption at 15.5% height (baseline), subtitle at 21.5% (baseline)
  const captionY = position === 'top' 
    ? height * 0.155  // baseline at 15.5% from top
    : height * 0.885; // baseline at 88.5% from top (11.5% from bottom)
  
  const subtitleY = position === 'top'
    ? height * 0.215
    : height * 0.945;
  
  // Chrome gradient for the caption: vertical gradient across the text's own height
  const chromeGradientStops = [
    { offset: 0, color: '#f4fbff' },
    { offset: 0.28, color: '#a8dcff' },
    { offset: 0.45, color: '#ffffff' },
    { offset: 0.58, color: '#3f7dff' },
    { offset: 0.75, color: '#ff5da2' },
    { offset: 1, color: '#ffb347' },
  ];
  
  // Draw caption (main text) first to measure its actual font size
  let captionFontSize = 0;
  if (caption) {
    captionFontSize = drawCaptionWithChrome(ctx, caption.toUpperCase(), width / 2, captionY, maxTextWidth, {
      fontSizeRatio: 0.13,
      minFontSize: 32,
      outlineWidth: 0.10,
      chromeGradientStops,
      canvasHeight: height,
      position,
    });
  }
  
  // Draw subtitle (smaller text) - clearly separated BELOW caption
  if (subtitle) {
    // Subtitle is ~40% of caption size
    const subFontSizeRatio = 0.044; // ~40% of 0.11
    const subMinFontSize = 14;
    
    // Position subtitle well below caption
    const subY = position === 'top' 
      ? height * 0.215
      : height * 0.945;
    
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

/** Draw caption with chrome gradient + stripes effect. */
function drawCaptionWithChrome(ctx, text, cx, cy, maxWidth, opts) {
  const {
    fontSizeRatio,
    minFontSize,
    outlineWidth,
    chromeGradientStops,
    canvasHeight,
  } = opts;
  
  // Auto-fit font size
  let fontSize = Math.max(minFontSize, Math.floor(canvasHeight * fontSizeRatio));
  ctx.font = `bold ${fontSize}px ${FONT_STACK}`;
  
  // Reduce font size if text exceeds max width
  while (ctx.measureText(text).width > maxWidth && fontSize > minFontSize) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px ${FONT_STACK}`;
  }
  
  // Create offscreen canvas for the glyph area
  // width = ceil(measureText(text).width) + 8, height = ceil(fontSize * 1.3)
  const glyphWidth = Math.ceil(ctx.measureText(text).width) + 8;
  const glyphHeight = Math.ceil(fontSize * 1.3);
  
  const offscreen = document.createElement('canvas');
  offscreen.width = glyphWidth;
  offscreen.height = glyphHeight;
  const offCtx = offscreen.getContext('2d');
  
  // Set up text rendering on offscreen (transparent, no fill initially)
  offCtx.font = ctx.font;
  offCtx.textAlign = 'left';
  offCtx.textBaseline = 'alphabetic';
  
  // Vertical linear gradient from y=0 to y=fontSize with chromeGradientStops
  const grad = offCtx.createLinearGradient(0, 0, 0, fontSize);
  chromeGradientStops.forEach(stop => {
    grad.addColorStop(stop.offset, stop.color);
  });
  
  // Render the text on the offscreen canvas with the chrome gradient fill
  offCtx.fillStyle = grad;
  offCtx.fillText(text, 4, fontSize);
  
  // Stripes: offCtx.globalCompositeOperation = 'source-atop';
  // fillStyle 'rgba(10,10,30,0.18)'; for (let y = 0; y < offscreen.height; y += 7) fillRect(0, y, offscreen.width, 3);
  offCtx.globalCompositeOperation = 'source-atop';
  offCtx.fillStyle = 'rgba(10, 10, 30, 0.18)';
  
  for (let y = 0; y < offscreen.height; y += 7) {
    offCtx.fillRect(0, y, offscreen.width, 3);
  }
  
  // Reset composite operation
  offCtx.globalCompositeOperation = 'source-over';
  
  // Main canvas: shadow rgba(0,0,0,0.6), shadowBlur fontSize*0.02, shadowOffsetY fontSize*0.006;
  // strokeText(text, cx, cy) with strokeStyle rgba(0,0,0,0.95), lineWidth fontSize * outlineWidth, lineJoin 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = fontSize * 0.02;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = fontSize * 0.006;
  
  // Outline (stroke)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.lineWidth = fontSize * outlineWidth;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeText(text, cx, cy);
  
  // Draw the offscreen canvas onto the main canvas at the caption position
  // at natural size (no scaling): drawImage(offscreen, cx - offscreen.width / 2, cy - fontSize)
  ctx.drawImage(offscreen, cx - offscreen.width / 2, cy - fontSize);
  
  return fontSize;
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
