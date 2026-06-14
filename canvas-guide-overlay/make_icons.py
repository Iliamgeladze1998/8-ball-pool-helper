"""Generate extension icons (16/48/128 px) for 8 Ball Pool Helper.
Pool-table theme: green felt, white cue ball, cyan aim line + crosshair.
Run: python make_icons.py
"""
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT, exist_ok=True)

FELT = (12, 110, 70)
FELT_EDGE = (8, 80, 50)
RAIL = (90, 50, 30)
BALL = (245, 245, 245)
AIM = (0, 240, 255)


def make(size):
    # supersample for smooth edges
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    r = int(s * 0.16)  # corner radius
    # outer rounded rail
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=r, fill=RAIL)
    # inner felt
    m = int(s * 0.12)
    d.rounded_rectangle([m, m, s - 1 - m, s - 1 - m],
                        radius=int(r * 0.7), fill=FELT, outline=FELT_EDGE,
                        width=max(1, int(s * 0.01)))

    # aim line (cyan), from lower-left toward upper-right
    lw = max(2, int(s * 0.05))
    x0, y0 = int(s * 0.30), int(s * 0.70)
    x1, y1 = int(s * 0.74), int(s * 0.30)
    d.line([x0, y0, x1, y1], fill=AIM, width=lw)

    # cue ball at the origin of the aim line
    br = int(s * 0.13)
    d.ellipse([x0 - br, y0 - br, x0 + br, y0 + br], fill=BALL,
              outline=(180, 180, 180), width=max(1, int(s * 0.008)))

    # crosshair on the target end
    ch = int(s * 0.10)
    d.line([x1 - ch, y1, x1 + ch, y1], fill=AIM, width=max(1, int(s * 0.02)))
    d.line([x1, y1 - ch, x1, y1 + ch], fill=AIM, width=max(1, int(s * 0.02)))
    d.ellipse([x1 - int(ch * 0.6), y1 - int(ch * 0.6),
               x1 + int(ch * 0.6), y1 + int(ch * 0.6)],
              outline=AIM, width=max(1, int(s * 0.015)))

    img = img.resize((size, size), Image.LANCZOS)
    path = os.path.join(OUT, f"icon{size}.png")
    img.save(path)
    print("wrote", path)


for sz in (16, 48, 128):
    make(sz)
print("done")
