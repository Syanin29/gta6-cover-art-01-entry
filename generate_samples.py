#!/usr/bin/env python3
"""Generate procedural sample images for Vice Poster Studio."""
from PIL import Image, ImageDraw, ImageFilter
import os

OUT_DIR = "/home/hatch/workspace/makefun/gta6-cover-art-01-entry/app/samples"
os.makedirs(OUT_DIR, exist_ok=True)

def make_sunset_drive():
    """Sunset gradient with palm silhouettes and road perspective."""
    w, h = 1920, 1080
    img = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)
    
    # Sunset gradient sky (top to middle)
    for y in range(h // 2):
        t = y / (h // 2)
        # Deep purple -> hot pink -> orange -> yellow
        if t < 0.25:
            r = int(60 + t * 4 * 100)
            g = int(20 + t * 4 * 40)
            b = int(120 + t * 4 * 60)
        elif t < 0.5:
            tt = (t - 0.25) * 4
            r = int(160 + tt * 80)
            g = int(60 + tt * 120)
            b = int(180 - tt * 100)
        elif t < 0.75:
            tt = (t - 0.5) * 4
            r = int(240 + tt * 15)
            g = int(180 + tt * 60)
            b = int(80 - tt * 60)
        else:
            tt = (t - 0.75) * 4
            r = 255
            g = int(240 - tt * 60)
            b = int(20 + tt * 40)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    
    # Horizon line
    horizon = h * 0.52
    
    # Ocean reflection (middle to bottom)
    for y in range(int(horizon), h):
        t = (y - horizon) / (h - horizon)
        # Darker, more saturated reflection
        r = int(80 * (1 - t * 0.5))
        g = int(40 * (1 - t * 0.3))
        b = int(60 + t * 40)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    
    # Sun glow on horizon
    sun_x, sun_y = w * 0.5, horizon
    for radius in range(200, 0, -5):
        alpha = int(30 * (1 - radius / 200))
        draw.ellipse([sun_x - radius, sun_y - radius, sun_x + radius, sun_y + radius],
                     fill=(255, 200, 100, alpha))
    
    # Palm silhouettes (left and right)
    palm_positions = [w * 0.08, w * 0.22, w * 0.78, w * 0.92]
    for px in palm_positions:
        # Trunk
        trunk_top = horizon - 180
        draw.polygon([
            (px - 8, horizon + 50),
            (px - 4, trunk_top),
            (px + 4, trunk_top),
            (px + 8, horizon + 50),
        ], fill=(10, 10, 20))
        # Fronds
        for i in range(7):
            angle = -0.8 + i * 0.25
            length = 120 - i * 10
            fx = px + length * 0.3 * (i - 3)
            fy = trunk_top - 20
            ex = fx + length * 1.5 * (angle + 0.5)
            ey = fy - length * 0.8
            draw.line([(fx, fy), (ex, ey)], fill=(15, 15, 25), width=3)
    
    # Road perspective lines
    road_top_w = w * 0.3
    road_bottom_w = w * 0.9
    road_left_top = w/2 - road_top_w/2
    road_right_top = w/2 + road_top_w/2
    road_left_bottom = w/2 - road_bottom_w/2
    road_right_bottom = w/2 + road_bottom_w/2
    
    # Road surface
    draw.polygon([
        (road_left_top, horizon),
        (road_right_top, horizon),
        (road_right_bottom, h),
        (road_left_bottom, h),
    ], fill=(25, 20, 30))
    
    # Center line dashes
    for i in range(12):
        t = i / 12
        y = horizon + t * (h - horizon)
        lw = road_left_top + t * (road_left_bottom - road_left_top)
        rw = road_right_top + t * (road_right_bottom - road_right_top)
        cx = (lw + rw) / 2
        dash_h = 20 + t * 40
        draw.rectangle([cx - 3, y, cx + 3, y + dash_h], fill=(255, 220, 100, 180))
    
    # Distant city silhouette on horizon
    for i in range(15):
        bx = i * (w / 15) + (w / 30)
        bw = w / 20
        bh = 80 + (i % 5) * 60
        draw.rectangle([bx, horizon - bh, bx + bw, horizon], fill=(20, 15, 30))
        # Windows
        for wy in range(int(horizon - bh + 10), int(horizon), 15):
            draw.rectangle([bx + 3, wy, bx + bw - 3, wy + 4], fill=(80, 60, 100, 100))
    
    # Film grain
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    noise = Image.effect_noise((w, h), 50).convert('L')
    img = Image.composite(img, Image.new('RGB', (w, h), (20, 15, 30)), noise.point(lambda x: x // 8))
    
    img.save(os.path.join(OUT_DIR, "sunset-drive.jpg"), quality=85)
    print(f"Generated sunset-drive.jpg ({w}x{h})")

def make_neon_alley():
    """Neon night alley with cyberpunk colors, wet reflections."""
    w, h = 1920, 1080
    img = Image.new('RGB', (w, h), (10, 5, 20))
    draw = ImageDraw.Draw(img)
    
    # Dark gradient sky
    for y in range(h // 3):
        t = y / (h // 3)
        r = int(10 + t * 20)
        g = int(5 + t * 10)
        b = int(20 + t * 30)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    
    # Building silhouettes (left and right walls of alley)
    wall_color = (15, 10, 25)
    # Left wall
    draw.polygon([
        (0, h//3), (w*0.25, h//3), (w*0.15, h), (0, h)
    ], fill=wall_color)
    # Right wall
    draw.polygon([
        (w*0.75, h//3), (w, h//3), (w, h), (w*0.85, h)
    ], fill=wall_color)
    
    # Neon signs on buildings
    neon_colors = [
        (255, 20, 147),  # Hot pink
        (0, 255, 255),   # Cyan
        (255, 100, 0),   # Orange
        (180, 0, 255),   # Purple
        (0, 255, 100),   # Green
        (255, 255, 0),   # Yellow
    ]
    
    # Left wall signs
    for i in range(8):
        y = h//3 + 60 + i * 100
        color = neon_colors[i % len(neon_colors)]
        sign_w = 120 + (i % 3) * 60
        sign_h = 30
        x = 20
        # Sign background glow
        for glow in range(15, 0, -1):
            alpha = int(20 * (1 - glow/15))
            draw.rectangle([x-glow, y-glow, x+sign_w+glow, y+sign_h+glow], 
                          fill=(*color, alpha))
        # Sign face
        draw.rectangle([x, y, x+sign_w, y+sign_h], fill=color)
        # Text suggestion (rectangles)
        for t in range(3):
            draw.rectangle([x+10+t*35, y+5, x+30+t*35, y+25], fill=(10,5,20))
    
    # Right wall signs
    for i in range(8):
        y = h//3 + 110 + i * 100
        color = neon_colors[(i+3) % len(neon_colors)]
        sign_w = 100 + (i % 3) * 50
        sign_h = 25
        x = w - 20 - sign_w
        for glow in range(15, 0, -1):
            alpha = int(20 * (1 - glow/15))
            draw.rectangle([x-glow, y-glow, x+sign_w+glow, y+sign_h+glow], 
                          fill=(*color, alpha))
        draw.rectangle([x, y, x+sign_w, y+sign_h], fill=color)
        for t in range(2):
            draw.rectangle([x+15+t*40, y+3, x+35+t*40, y+22], fill=(10,5,20))
    
    # Wet ground reflections (bottom portion)
    ground_y = h * 0.65
    for y in range(int(ground_y), h):
        t = (y - ground_y) / (h - ground_y)
        # Reflect neon colors on wet pavement
        base_r, base_g, base_b = 10, 5, 20
        # Add cyan/pink streaks
        streak = abs((y % 40) - 20) / 20
        r = int(base_r + streak * 80)
        g = int(base_g + streak * 40)
        b = int(base_b + streak * 100)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    
    # Neon light reflections on ground (vertical streaks)
    for i in range(12):
        x = 50 + i * 150
        color = neon_colors[i % len(neon_colors)]
        for y in range(int(ground_y), h):
            alpha = int(100 * (1 - (y - ground_y) / (h - ground_y)) * 0.3)
            # Vertical line with fade
            if (y - int(ground_y)) % 3 == 0:
                draw.line([(x-1, y), (x+1, y)], fill=(*color, alpha))
    
    # Flying particles / rain
    import random
    random.seed(42)
    for _ in range(200):
        px = random.randint(0, w)
        py = random.randint(0, h)
        pl = random.randint(5, 20)
        color = random.choice(neon_colors)
        draw.line([(px, py), (px, py + pl)], fill=(*color, 100), width=1)
    
    # Vignette
    vignette = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    for r in range(min(w, h)//2, 0, -10):
        alpha = int(80 * (1 - r / (min(w, h)//2)))
        vdraw.ellipse([w//2 - r, h//2 - r, w//2 + r, h//2 + r], fill=(0, 0, 0, alpha))
    img = Image.alpha_composite(img.convert('RGBA'), vignette).convert('RGB')
    
    img.save(os.path.join(OUT_DIR, "neon-alley.jpg"), quality=85)
    print(f"Generated neon-alley.jpg ({w}x{h})")

if __name__ == "__main__":
    make_sunset_drive()
    make_neon_alley()
    print("Done!")
