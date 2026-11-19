from PIL import Image, ImageDraw, ImageFilter
import math

def create_sunset_drive(width=1920, height=1080):
    """Vivid sunset gradient sky (orange→pink→purple) filling top ~70%, 
    sun disc, palm/city silhouettes only in bottom ~25%, road with light streaks."""
    img = Image.new('RGB', (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Sky gradient - top 70%
    sky_height = int(height * 0.7)
    
    # Create gradient: orange -> pink -> purple
    for y in range(sky_height):
        t = y / sky_height
        if t < 0.33:
            # Orange to pink
            t2 = t / 0.33
            r = int(255 * (1 - t2) + 255 * t2)
            g = int(120 * (1 - t2) + 60 * t2)
            b = int(30 * (1 - t2) + 100 * t2)
        elif t < 0.66:
            # Pink to purple
            t2 = (t - 0.33) / 0.33
            r = int(255 * (1 - t2) + 180 * t2)
            g = int(60 * (1 - t2) + 30 * t2)
            b = int(100 * (1 - t2) + 180 * t2)
        else:
            # Purple to deep purple
            t2 = (t - 0.66) / 0.34
            r = int(180 * (1 - t2) + 80 * t2)
            g = int(30 * (1 - t2) + 10 * t2)
            b = int(180 * (1 - t2) + 120 * t2)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Sun disc - centered horizontally, in upper portion
    sun_x = width // 2
    sun_y = int(sky_height * 0.35)
    sun_radius = int(min(width, height) * 0.08)
    
    # Sun glow layers
    for r in range(sun_radius + 60, sun_radius - 1, -5):
        alpha = int(255 * (1 - (r - sun_radius) / 60) * 0.4)
        if r <= sun_radius:
            color = (255, 240, 200)
        else:
            color = (255, 180, 60)
        # Draw glow as ellipse
        draw.ellipse([sun_x - r, sun_y - r, sun_x + r, sun_y + r], 
                     fill=None, outline=color, width=3)
    
    # Sun core
    draw.ellipse([sun_x - sun_radius, sun_y - sun_radius, 
                  sun_x + sun_radius, sun_y + sun_radius], 
                 fill=(255, 250, 220))
    
    # Horizon line
    horizon_y = sky_height
    draw.line([(0, horizon_y), (width, horizon_y)], fill=(80, 40, 60), width=2)
    
    # Bottom 25% - silhouettes (palms, city buildings)
    silhouette_top = int(height * 0.75)
    
    # City skyline
    building_color = (15, 10, 25)
    num_buildings = 12
    building_width = width // num_buildings
    for i in range(num_buildings):
        bx = i * building_width + building_width // 4
        bw = building_width // 2
        bh = int(height * (0.15 + 0.1 * (i % 3)))
        by = height - bh
        # Building rect
        draw.rectangle([bx, by, bx + bw, height], fill=building_color)
        # Windows - small lit rectangles
        for wy in range(by + 20, height - 20, 30):
            for wx in range(bx + 5, bx + bw - 5, 15):
                if (wx + wy) % 3 == 0:
                    draw.rectangle([wx, wy, wx + 6, wy + 10], fill=(255, 220, 100))
    
    # Palm trees on left and right
    palm_color = (10, 8, 15)
    # Left palm
    px = int(width * 0.08)
    draw.rectangle([px - 4, silhouette_top, px + 4, height], fill=palm_color)
    # Fronds
    for angle in [-0.8, -0.4, 0, 0.4, 0.8]:
        fx = px + int(math.sin(angle) * 120)
        fy = silhouette_top + int(math.cos(angle) * 80)
        draw.line([(px, silhouette_top), (fx, fy)], fill=palm_color, width=3)
    
    # Right palm
    px = int(width * 0.92)
    draw.rectangle([px - 4, silhouette_top, px + 4, height], fill=palm_color)
    for angle in [-0.8, -0.4, 0, 0.4, 0.8]:
        fx = px + int(math.sin(angle) * 120)
        fy = silhouette_top + int(math.cos(angle) * 80)
        draw.line([(px, silhouette_top), (fx, fy)], fill=palm_color, width=3)
    
    # Road with light streaks - bottom portion
    road_top = int(height * 0.85)
    road_height = height - road_top
    # Road surface
    draw.rectangle([0, road_top, width, height], fill=(25, 20, 30))
    # Center line
    draw.line([(width//2, road_top), (width//2, height)], fill=(80, 60, 40), width=2)
    # Light streaks (car lights)
    for i in range(8):
        lx = int(width * (0.1 + i * 0.11))
        ly = road_top + int(road_height * 0.3 + (i % 3) * 15)
        # Red tail lights
        draw.ellipse([lx - 8, ly - 4, lx + 8, ly + 4], fill=(200, 30, 30))
        # Streak
        draw.line([(lx, ly), (lx - 60, ly + 20)], fill=(200, 30, 30, 180), width=3)
        # White headlights
        lx2 = int(width * (0.15 + i * 0.11))
        ly2 = road_top + int(road_height * 0.6)
        draw.ellipse([lx2 - 6, ly2 - 3, lx2 + 6, ly2 + 3], fill=(255, 240, 200))
        draw.line([(lx2, ly2), (lx2 + 80, ly2 - 15)], fill=(255, 240, 200, 180), width=2)
    
    # Add some atmospheric haze/glow near horizon
    for y in range(horizon_y, horizon_y + 40):
        alpha = int(255 * (1 - (y - horizon_y) / 40) * 0.15)
        draw.line([(0, y), (width, y)], fill=(255, 180, 80))
    
    return img

def create_neon_alley(width=1920, height=1080):
    """Teal/magenta gradient with glowing sign rectangles and light reflections, no near-black areas."""
    img = Image.new('RGB', (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background gradient: teal -> magenta -> deep blue
    for y in range(height):
        t = y / height
        if t < 0.4:
            # Teal to cyan
            t2 = t / 0.4
            r = int(10 * (1 - t2) + 0 * t2)
            g = int(180 * (1 - t2) + 220 * t2)
            b = int(200 * (1 - t2) + 255 * t2)
        elif t < 0.7:
            # Cyan to magenta
            t2 = (t - 0.4) / 0.3
            r = int(0 * (1 - t2) + 220 * t2)
            g = int(220 * (1 - t2) + 40 * t2)
            b = int(255 * (1 - t2) + 180 * t2)
        else:
            # Magenta to deep purple
            t2 = (t - 0.7) / 0.3
            r = int(220 * (1 - t2) + 60 * t2)
            g = int(40 * (1 - t2) + 10 * t2)
            b = int(180 * (1 - t2) + 100 * t2)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Glowing neon sign rectangles
    sign_colors = [
        (0, 255, 255),    # Cyan
        (255, 0, 255),    # Magenta
        (255, 255, 0),    # Yellow
        (0, 255, 128),    # Spring green
        (255, 128, 0),    # Orange
        (128, 0, 255),    # Purple
        (255, 64, 192),   # Hot pink
        (64, 255, 192),   # Turquoise
    ]
    
    # Vertical neon signs on building facades
    num_signs = 16
    for i in range(num_signs):
        x = int(width * (0.05 + i * 0.058))
        sign_w = int(width * 0.035)
        sign_h = int(height * (0.3 + (i % 4) * 0.12))
        y = int(height * (0.15 + (i % 3) * 0.1))
        
        color = sign_colors[i % len(sign_colors)]
        
        # Glow layers
        for glow in range(20, 0, -2):
            alpha_factor = (20 - glow) / 20 * 0.6
            glow_color = tuple(int(c * alpha_factor) for c in color)
            draw.rectangle([x - glow, y - glow, x + sign_w + glow, y + sign_h + glow], 
                          fill=None, outline=glow_color, width=1)
        
        # Core sign
        draw.rectangle([x, y, x + sign_w, y + sign_h], fill=color)
        
        # Inner detail - vertical lines
        for ix in range(2, sign_w - 2, 4):
            draw.line([(x + ix, y + 5), (x + ix, y + sign_h - 5)], 
                     fill=tuple(min(255, c + 50) for c in color), width=1)
    
    # Horizontal neon tubes across top
    for i in range(5):
        y = int(height * (0.05 + i * 0.08))
        tube_h = 8
        color = sign_colors[(i * 3) % len(sign_colors)]
        draw.rectangle([int(width * 0.1), y, int(width * 0.9), y + tube_h], fill=color)
        # Glow
        for glow in range(15, 0, -2):
            alpha_factor = (15 - glow) / 15 * 0.4
            glow_color = tuple(int(c * alpha_factor) for c in color)
            draw.rectangle([int(width * 0.1) - glow, y - glow, 
                           int(width * 0.9) + glow, y + tube_h + glow], 
                          fill=None, outline=glow_color, width=1)
    
    # Wet ground reflections (bottom 30%)
    reflection_top = int(height * 0.7)
    for y in range(reflection_top, height):
        t = (y - reflection_top) / (height - reflection_top)
        # Fade reflection
        alpha = 1 - t * 0.8
        for x in range(0, width, 4):
            # Sample from above and blur
            src_y = int(reflection_top - (y - reflection_top) * 0.5)
            if src_y >= 0:
                try:
                    pixel = img.getpixel((x, src_y))
                    reflected = tuple(int(c * alpha * 0.6) for c in pixel)
                    draw.point((x, y), fill=reflected)
                except:
                    pass
    
    # Add volumetric light beams from signs
    for i in range(6):
        x = int(width * (0.1 + i * 0.15))
        color = sign_colors[(i * 2) % len(sign_colors)]
        # Light beam going up
        for y in range(int(height * 0.15), int(height * 0.5)):
            t = (y - height * 0.15) / (height * 0.35)
            beam_w = int(40 * (1 - t))
            alpha = int(100 * (1 - t))
            beam_color = tuple(int(c * alpha / 255) for c in color)
            draw.rectangle([x - beam_w//2, y, x + beam_w//2, y + 2], fill=beam_color)
    
    # Foreground elements - subtle silhouettes with rim lighting
    # Railing at bottom
    railing_y = int(height * 0.92)
    draw.line([(0, railing_y), (width, railing_y)], fill=(40, 60, 80), width=6)
    # Posts
    for i in range(10):
        px = int(width * (0.05 + i * 0.1))
        draw.line([(px, railing_y), (px, height)], fill=(30, 50, 70), width=4)
        # Neon accent on post
        draw.line([(px, railing_y), (px, height)], fill=sign_colors[i % len(sign_colors)], width=1)
    
    return img

# Generate and save
sunset = create_sunset_drive()
sunset.save('/home/hatch/workspace/makefun/gta6-cover-art-01-entry/app/samples/sunset-drive.jpg', quality=90)
print("sunset-drive.jpg saved")

neon = create_neon_alley()
neon.save('/home/hatch/workspace/makefun/gta6-cover-art-01-entry/app/samples/neon-alley.jpg', quality=90)
print("neon-alley.jpg saved")

# Verify brightness
for fname in ['sunset-drive.jpg', 'neon-alley.jpg']:
    path = f'/home/hatch/workspace/makefun/gta6-cover-art-01-entry/app/samples/{fname}'
    img = Image.open(path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
    pixels = list(img.getdata())
    mean_brightness = sum(sum(p) / 3 for p in pixels) / len(pixels)
    max_brightness = max(max(p) for p in pixels)
    print(f"{fname}: {img.size}, Mean brightness: {mean_brightness:.1f}, Max: {max_brightness}")
    assert mean_brightness > 90, f"{fname} mean brightness {mean_brightness} <= 90"
print("All samples verified: mean brightness > 90")
