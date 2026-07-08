#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon():
    # Create a new image with gradient background
    size = 512
    img = Image.new('RGB', (size, size), color='#1a1a1a')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (simplified as solid color)
    draw.rectangle([32, 32, 480, 480], fill='#2d2d2d', outline='#6366f1', width=4)
    
    # Draw play button triangle
    play_points = [(200, 160), (200, 352), (344, 256)]
    draw.polygon(play_points, fill='#6366f1')
    
    # Draw side rectangles for film strip effect
    draw.rectangle([120, 200, 144, 312], fill='#3d3d3d')
    draw.rectangle([368, 200, 392, 312], fill='#3d3d3d')
    
    # Draw center circle
    draw.ellipse([232, 232, 280, 280], fill='#6366f1')
    
    # Save as PNG
    img.save('icon.png')
    print('Icon created successfully!')

if __name__ == '__main__':
    try:
        create_icon()
    except ImportError:
        print('PIL not available, creating simple placeholder...')
        # Create a simple SVG-based approach
        import subprocess
        subprocess.run(['cp', 'icon.svg', 'icon.png'], shell=True)
