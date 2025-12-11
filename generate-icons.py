#!/usr/bin/env python3
"""
Simple script to generate placeholder icons for the Chrome extension.
Requires PIL (Pillow): pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow is required. Install it with: pip install Pillow")
    exit(1)

def create_icon(size):
    """Create a simple icon with a red circle and white slash"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw red circle
    margin = size * 0.05
    draw.ellipse([margin, margin, size - margin, size - margin], 
                 fill=(255, 0, 0, 255), outline=(200, 0, 0, 255), width=2)
    
    # Draw white diagonal slash
    line_width = max(2, int(size * 0.1))
    slash_margin = size * 0.25
    draw.line([slash_margin, slash_margin, size - slash_margin, size - slash_margin],
              fill=(255, 255, 255, 255), width=line_width)
    
    return img

# Generate icons
sizes = [16, 48, 128]
for size in sizes:
    icon = create_icon(size)
    icon_path = f'icons/icon{size}.png'
    icon.save(icon_path)
    print(f'Created {icon_path}')

print('\nIcons generated successfully!')

