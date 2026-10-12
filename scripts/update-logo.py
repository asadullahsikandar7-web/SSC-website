"""Rebuild the site logo and icons from the emblem artwork in src/assets.

Run with `npm run logo` after replacing the emblem file. Needs Pillow (`pip install pillow`).
The emblem may be a transparent PNG, or artwork on a plain dark or light backdrop, which is cut away.
"""
import glob
import os
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
candidates = sorted(glob.glob(os.path.join(root, 'src', 'assets', '*[Ee]mblem*.png')), key=os.path.getmtime)
if not candidates:
    sys.exit('No emblem PNG found in src/assets (expected a file with "emblem" in its name).')
source = candidates[-1]
image = Image.open(source).convert('RGBA')
alpha = image.split()[3]

if alpha.getextrema()[0] > 250:
    # Opaque artwork: remove the backdrop by flooding in from the edges.
    r, g, b, _ = image.split()
    brightest = ImageChops.lighter(ImageChops.lighter(r, g), b)
    darkest = ImageChops.darker(ImageChops.darker(r, g), b)
    w, h = image.size
    corners = [brightest.getpixel(point) for point in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))]
    if sum(corners) / 4 < 110:
        # Dark backdrop: dark pixels that are not red (the artwork's maroon is also dark).
        redness = ImageChops.subtract(r, g)
        backdrop = ImageChops.multiply(brightest.point(lambda v: 255 if v < 88 else 0), redness.point(lambda v: 255 if v < 26 else 0))
    else:
        # Light backdrop, including its soft shadow: bright pixels with almost no colour.
        colour = ImageChops.subtract(brightest, darkest)
        floor = min(corners) - 110
        backdrop = ImageChops.multiply(colour.point(lambda v: 255 if v < 30 else 0), darkest.point(lambda v: 255 if v > floor else 0))
    walls = backdrop.point(lambda v: 0 if v else 255)  # 0 = may be backdrop, 255 = artwork
    step = max(w // 60, 1)
    seeds = [(x, y) for x in range(0, w, step) for y in (0, h - 1)] + [(x, y) for y in range(0, h, step) for x in (0, w - 1)]
    for seed in seeds:
        if walls.getpixel(seed) == 0:
            ImageDraw.floodfill(walls, seed, 128)
    alpha = walls.point(lambda v: 0 if v == 128 else 255)
    alpha = alpha.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(9))  # close pinholes, pull the edge in off the backdrop
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.2))
    image.putalpha(alpha)

box = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
image = image.crop(box)
side = max(image.size)
square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
square.paste(image, ((side - image.width) // 2, (side - image.height) // 2), image)

def save(path, size, pad=0.0, background=None):
    inner = int(size * (1 - 2 * pad))
    emblem = square.resize((inner, inner), Image.LANCZOS)
    canvas = Image.new('RGBA', (size, size), background or (0, 0, 0, 0))
    canvas.paste(emblem, ((size - inner) // 2, (size - inner) // 2), emblem)
    target = os.path.join(root, path)
    if path.endswith('.webp'):
        canvas.save(target, 'WEBP', quality=88, method=6)
    else:
        (canvas.convert('RGB') if background else canvas).save(target, 'PNG', optimize=True)
    print(f'{path}: {os.path.getsize(target) // 1024} KB')

ivory = (247, 242, 232, 255)
print(f'Source: {os.path.basename(source)}')
save('src/assets/logo.webp', 480)
save('src/assets/logo-large.webp', min(side, 1100))
save('public/favicon.png', 96)
save('public/icon-192.png', 192, 0.08, ivory)
save('public/icon-512.png', 512, 0.08, ivory)
save('public/apple-touch-icon.png', 180, 0.06, ivory)
