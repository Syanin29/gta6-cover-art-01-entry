#!/usr/bin/env python3
"""Regenerate procedural sample images for Vice Poster Studio (v2)."""
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import os

OUT_DIR = "/home/hatch/workspace/makefun/gta6-cover-art-01-entry/app/samples"
os.makedirs(OUT_DIR, exist_ok=True)

def mean_brightness(img):
    """Calculate mean luminance (0-255) of an RGB image."""
    gray = img.convert('L')
    return sum(gray.getdata()) / len(gray.getdata())

def make_sunset_drive():
    """Sunset gradient with palm silhouettes and road perspective - intentional poster art."""
    w, h = 1920, 1080
    img = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)
    
    # Sunset gradient sky (top 75%) - orange -> pink -> purple
    for y in range(int(h * 0.75)):
        t = y / (int(h * 0.75))
        r = int(255 * (1 - t) + 180 * t)
        g = int(100 * (1 - t) + 40 * t)
        b = int(50 * (1 - t) + 120 * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    
    for y in range(int(h * 0.75), int(h * 0.85)):
        t = (y - int(h * 0.75)) / (int(h * 0.85) - int(h * 0.75))
        r = int(180 + t * 50)
        g = int(40 + t * 30)
        b = int(120 + t * 30)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    
    # Sun disc with horizontal band cuts (synthwave sun)
    sun_x, sun_y = w * 0.55, h * 0.35
    sun_radius = int(min(w, h) * 0.12)
    draw.ellipse([sun_x - sun_radius, sun_y - sun_radius, sun_x + sun_radius, sun_y + sun_radius],
                 fill=(255, 230, 150))
    for i in range(5):
        band_y = sun_y - sun_radius + int((i + 0.5) * sun_radius / 3)
        band_color = (255, 240, 180) if i % 2 == 0 else (255, 210, 100)
        draw.rectangle([sun_x - int(sun_radius * 0.8), band_y - 2, sun_x + int(sun_radius * 0.8), band_y + 2], fill=band_color)
    
    # Dark palm + skyline silhouettes only in the bottom ~25%
    horizon = int(h * 0.78)
    
    for px in [int(w * 0.10), int(w * 0.20)]:
        draw.polygon([
            (px - 6, horizon + 40),
            (px - 2, horizon - 100),
            (px + 2, horizon - 100),
            (px + 6, horizon + 40),
        ], fill=(15, 12, 10))
        for i in range(5):
            angle = -0.5 + i * 0.3
            length = 80 + i * 15
            fx = px + int(length * 0.2 * (i - 2))
            fy = horizon - 120
            ex = fx + int(length * 1.3 * (angle + 0.3))
            ey = fy - int(length * 0.6)
            draw.line([(fx, fy), (ex, ey)], fill=(20, 18, 15), width=2)
    
    for px in [int(w * 0.80), int(w * 0.90)]:
        draw.polygon([
            (px - 6, horizon + 40),
            (px - 2, horizon - 100),
            (px + 2, horizon - 100),
            (px + 6, horizon + 40),
        ], fill=(15, 12, 10))
        for i in range(5):
            angle = -0.5 + i * 0.3
            length = 80 + i * 15
            fx = px + int(length * 0.2 * (i - 2))
            fy = horizon - 120
            ex = fx + int(length * 1.3 * (angle + 0.3))
            ey = fy - int(length * 0.6)
            draw.line([(fx, fy), (ex, ey)], fill=(20, 18, 15), width=2)
    
    for i in range(8):
        bx = i * (w // 8) + w * 0.05
        bw = w // 8 - 10
        draw.rectangle([bx, horizon - 15, bx + bw, horizon], fill=(20, 15, 15))
    
    # Road strip at the very bottom
    road_y = h - 80
    road_left = int(w * 0.15)
    road_right = int(w * 0.85)
    
    draw.polygon([
        (road_left, road_y),
        (road_right, road_y),
        (road_right, h),
        (road_left, h),
    ], fill=(30, 25, 20))
    
    draw.line([(w * 0.5, road_y), (w * 0.5, h)], fill=(255, 240, 150), width=3)
    
    draw.line([(int(w * 0.3), road_y + 10), (int(w * 0.5), road_y + 30)], fill=(255, 215, 100), width=3)
    draw.line([(int(w * 0.7), road_y + 10), (int(w * 0.5), road_y + 30)], fill=(255, 215, 100), width=3)
    
    brightness = mean_brightness(img)
    if brightness < 95:
        img = ImageOps.autocontrast(img, cutoff=2)
    
    img.save(os.path.join(OUT_DIR, "sunset-drive.jpg"), quality=85)
    print(f"Generated sunset-drive.jpg ({w}x{h}), mean brightness: {mean_brightness(img):.1f}")

def make_neon_alley():
    """Neon night alley with cyberpunk colors, wet reflections - intentional poster art."""
    w, h = 1920, 1080
    img = Image.new('RGB', (w, h), (10, 5, 20))
    draw = ImageDraw.Draw(img)
    
    # Teal -> magenta night gradient (top 60%)
    for y in range(int(h * 0.6)):
        t = y / (int(h * 0.6))
        r = int(10 + t * 150)
        g = int(5 + t * 180)
        b = int(20 + t * 100)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    
    for y in range(int(h * 0.6), h):
        t = (y - int(h * 0.6)) / (h - int(h * 0.6))
        r = int(160 + t * 40)
        g = int(185 - t * 100)
        b = int(120 + t * 40)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    
    # Dark building silhouettes left/right
    wall_color = (15, 10, 25)
    
    draw.polygon([
        (0, int(h * 0.3)), 
        (int(w * 0.22), int(h * 0.3)), 
        (int(w * 0.18), h), 
        (0, h)
    ], fill=wall_color)
    
    draw.polygon([
        (int(w * 0.78), int(h * 0.3)), 
        (w, int(h * 0.3)), 
        (w, h), 
        (int(w * 0.82), h)
    ], fill=wall_color)
    
    # Glowing neon sign rectangles
    neon_colors = [
        (0, 255, 255),   # Cyan
        (255, 20, 147),  # Hot pink
        (255, 255, 0),   # Yellow
    ]
    
    left_signs = [
        {'x': 30, 'y': int(h * 0.4), 'w': 80, 'h': 30},
        {'x': 30, 'y': int(h * 0.55), 'w': 100, 'h': 25},
        {'x': 30, 'y': int(h * 0.72), 'w': 70, 'h': 30},
    ]
    
    for sign in left_signs:
        # Cyan glow
        glow_x = sign['x'] - 15
        glow_y = sign['y'] - 10
        glow_w = sign['w'] + 30
        glow_h = sign['h'] + 20
        glow_img = Image.new('RGBA', (glow_w, glow_h), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow_img)
        gdraw.rectangle([15, 10, glow_w - 15, glow_h - 10], fill=(0, 255, 255, 40))
        glow_img = glow_img.filter(ImageFilter.GaussianBlur(3))
        img.paste(glow_img, (glow_x, glow_y), glow_img)
        
        draw.rectangle([sign['x'], sign['y'], sign['x'] + sign['w'], sign['y'] + sign['h']], fill=(0, 255, 255))
        draw.rectangle([sign['x'] + 8, sign['y'] + 5, sign['x'] + 58, sign['y'] + 25], fill=(10, 5, 20))
    
    right_signs = [
        {'x': w - 110, 'y': int(h * 0.4), 'w': 70, 'h': 25},
        {'x': w - 130, 'y': int(h * 0.55), 'w': 90, 'h': 30},
        {'x': w - 100, 'y': int(h * 0.72), 'w': 60, 'h': 25},
    ]
    
    for sign in right_signs:
        # Hot pink glow
        glow_x = sign['x'] - 15
        glow_y = sign['y'] - 10
        glow_w = sign['w'] + 30
        glow_h = sign['h'] + 20
        glow_img = Image.new('RGBA', (glow_w, glow_h), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow_img)
        gdraw.rectangle([15, 10, glow_w - 15, glow_h - 10], fill=(255, 20, 147, 40))
        glow_img = glow_img.filter(ImageFilter.GaussianBlur(3))
        img.paste(glow_img, (glow_x, glow_y), glow_img)
        
        draw.rectangle([sign['x'], sign['y'], sign['x'] + sign['w'], sign['y'] + sign['h']], fill=(255, 20, 147))
        draw.rectangle([sign['x'] + 8, sign['y'] + 5, sign['x'] + 48, sign['y'] + 25], fill=(10, 5, 20))
    
    # Wet street reflection streaks at the bottom
    ground_y = int(h * 0.75)
    for y in range(ground_y, h):
        if int(y) % 5 < 3:
            r, g, b = 230, 80, 155  # pinkish streak
            draw.line([(0, y), (w, y)], fill=(r, g, b), width=1)
    
    # Neon light reflections on ground - vertical streaks
    for sx in [30 + 40, w - 100]:
        for i in range(8):
            y = ground_y + i * 30 + 15
            alpha = int(80 * (1 - i / 8))
            if sx < w / 2:
                draw.line([(sx - 2, y), (sx + 2, y)], fill=(0, 255, 255, alpha), width=2)
            else:
                draw.line([(sx - 2, y), (sx + 2, y)], fill=(255, 20, 147, alpha), width=2)
    
    brightness = mean_brightness(img)
    if brightness < 85:
        img = ImageOps.autocontrast(img, cutoff=5)
    
    img.save(os.path.join(OUT_DIR, "neon-alley.jpg"), quality=85)
    print(f"Generated neon-alley.jpg ({w}x{h}), mean brightness: {mean_brightness(img):.1f}")

if __name__ == "__main__":
    make_sunset_drive()
    make_neon_alley()
    print("Done!")
