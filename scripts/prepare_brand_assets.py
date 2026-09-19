from pathlib import Path
from PIL import Image, ImageChops

source = Path('/home/ubuntu/upload/LogoSemFundo.png')
out_dir = Path('/home/ubuntu/webdev-static-assets')
out_dir.mkdir(parents=True, exist_ok=True)
logo_out = out_dir / 'tolazzai-blue-hammer.png'
favicon_out = out_dir / 'prompt-auction-favicon.png'

img = Image.open(source).convert('RGBA')
# Preserve the supplied artwork while removing only near-white background pixels.
r, g, b, a = img.split()
near_white = Image.eval(Image.merge('RGB', (r, g, b)), lambda value: 255 - value)
# Use a luminance mask for background removal; the artwork's blue pixels remain opaque.
mask = Image.new('L', img.size, 0)
pixels = mask.load()
source_pixels = img.load()
for y in range(img.height):
    for x in range(img.width):
        rr, gg, bb, aa = source_pixels[x, y]
        pixels[x, y] = 0 if aa == 0 or (rr > 245 and gg > 245 and bb > 245) else aa
img.putalpha(mask)
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)
img.save(logo_out, optimize=True)

# A readable favicon: blue rounded square, white breathing room, centered supplied mark.
side = 256
favicon = Image.new('RGBA', (side, side), (8, 39, 78, 255))
inner = img.copy()
inner.thumbnail((210, 210), Image.Resampling.LANCZOS)
x = (side - inner.width) // 2
y = (side - inner.height) // 2
favicon.alpha_composite(inner, (x, y))
# Rounded corners via an alpha mask.
corner = Image.new('L', (side, side), 0)
from PIL import ImageDraw
draw = ImageDraw.Draw(corner)
draw.rounded_rectangle((5, 5, side - 5, side - 5), radius=42, fill=255)
favicon.putalpha(corner)
favicon.save(favicon_out, optimize=True)
print(logo_out)
print(favicon_out)
