#!/usr/bin/env python3
"""Convert PNG screenshots to required JPEG format."""
from PIL import Image
import os

SHOTS = [
    {
        'src': '/tmp/1-cover.png',
        'dst': '/home/hatch/workspace/makefun/gta6-cover-art-01-entry/screenshots/1-cover.jpg',
        'size': (1280, 720),
        'desc': 'Cover landscape 1280x720'
    },
    {
        'src': '/tmp/2-editor.png',
        'dst': '/home/hatch/workspace/makefun/gta6-cover-art-01-entry/screenshots/2-editor.jpg',
        'size': (1280, 720),
        'desc': 'Editor UI 1280x720'
    },
    {
        'src': '/tmp/3-cover-square.png',
        'dst': '/home/hatch/workspace/makefun/gta6-cover-art-01-entry/screenshots/3-cover-square.jpg',
        'size': (1080, 1080),
        'desc': 'Cover square 1080x1080'
    },
    {
        'src': '/tmp/4-cover-portrait.png',
        'dst': '/home/hatch/workspace/makefun/gta6-cover-art-01-entry/screenshots/4-cover-portrait.jpg',
        'size': (1024, 1280),
        'desc': 'Cover portrait 1024x1280'
    },
]

os.makedirs('/home/hatch/workspace/makefun/gta6-cover-art-01-entry/screenshots', exist_ok=True)

for shot in SHOTS:
    img = Image.open(shot['src'])
    print(f"Original: {img.size}, mode: {img.mode}")
    
    # Resize to target size
    img = img.resize(shot['size'], Image.Resampling.LANCZOS)
    
    # Convert to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Save as JPEG with quality ~82, adjust to meet 256 KiB limit
    quality = 82
    while quality > 10:
        img.save(shot['dst'], 'JPEG', quality=quality, optimize=True)
        size = os.path.getsize(shot['dst'])
        if size <= 262144:  # 256 KiB
            break
        quality -= 3
    
    final_size = os.path.getsize(shot['dst'])
    print(f"{shot['desc']}: {shot['size'][0]}x{shot['size'][1]}, {final_size} bytes ({final_size/1024:.1f} KiB), quality={quality}")
    
    # Verify not blank
    if img.mode == 'RGB':
        extrema = img.getextrema()
        print(f"  Pixel range: R{extrema[0]} G{extrema[1]} B{extrema[2]}")

print("\nAll screenshots converted!")
