#!/usr/bin/env python3
"""
Script to convert an icon image to the required sizes for Chrome extension.
Usage: python3 convert-icon.py <input-image.png>
"""

import sys
import os

try:
    from PIL import Image
except ImportError:
    print("Pillow is required. Install it with: pip install Pillow")
    sys.exit(1)

def convert_icon(input_path, output_dir="icons"):
    """Convert an image to the required icon sizes"""
    if not os.path.exists(input_path):
        print(f"Error: File '{input_path}' not found")
        sys.exit(1)

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Open the input image
    try:
        img = Image.open(input_path)
    except Exception as e:
        print(f"Error opening image: {e}")
        sys.exit(1)

    # Required sizes for Chrome extension
    sizes = [16, 48, 128]

    print(f"Converting '{input_path}' to required sizes...")
    for size in sizes:
        # Resize image maintaining aspect ratio, then crop to square if needed
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        output_path = os.path.join(output_dir, f"icon{size}.png")
        resized.save(output_path, "PNG")
        print(f"  Created {output_path} ({size}x{size})")

    print("\nIcons created successfully!")
    print("The extension is ready to use with your custom icon.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 convert-icon.py <input-image.png>")
        print("\nExample:")
        print("  python3 convert-icon.py my-icon.png")
        sys.exit(1)

    input_image = sys.argv[1]
    convert_icon(input_image)

