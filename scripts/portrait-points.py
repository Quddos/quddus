"""Build the hero particle cloud from a portrait.

Separates the subject from a plain studio background by flood-filling from the
image border, then samples coloured points from the subject.
Output: public/media/portrait-points.bin -> N x (x, y, r, g, b) as float32,
x/y normalised to roughly [-1, 1] (y up).
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

src = sys.argv[1] if len(sys.argv) > 1 else "public/media/raheem.webp"
out = sys.argv[2] if len(sys.argv) > 2 else "public/media/portrait-points.bin"
count = int(sys.argv[3]) if len(sys.argv) > 3 else 42000

im = Image.open(src).convert("RGB")
W = 360
H = int(im.height * W / im.width)
small = np.asarray(im.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32)

r, g, b = small[..., 0], small[..., 1], small[..., 2]
mx, mn = small.max(-1), small.min(-1)
sat = (mx - mn) / (mx + 1e-5)
lum = 0.299 * r + 0.587 * g + 0.114 * b
# Studio background: grey, low saturation, mid-high luminance.
bg_like = (sat < 0.07) & (lum > 150)

mask_bg = np.zeros((H, W), bool)
q = deque()
for x in range(W):
    for y in (0, H - 1):
        if bg_like[y, x]:
            q.append((y, x))
for y in range(H):
    for x in (0, W - 1):
        if bg_like[y, x]:
            q.append((y, x))
while q:
    y, x = q.popleft()
    if mask_bg[y, x]:
        continue
    mask_bg[y, x] = True
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and not mask_bg[ny, nx] and bg_like[ny, nx]:
            q.append((ny, nx))

subject = ~mask_bg
ys, xs = np.nonzero(subject)
print("subject pixels", len(xs), "of", W * H)

rng = np.random.default_rng(7)
# Weight sampling toward the face/upper body and toward edges for definition.
lum_n = lum[ys, xs] / 255.0
weight = 0.6 + 0.8 * (1 - ys / H)
weight *= 0.7 + 0.6 * np.abs(lum_n - 0.5)
weight /= weight.sum()
idx = rng.choice(len(xs), size=count, replace=True, p=weight)
jx = xs[idx] + rng.random(count)
jy = ys[idx] + rng.random(count)

scale = 2.0 / H
px = (jx - W / 2) * scale
py = -(jy - H / 2) * scale
cols = small[ys[idx], xs[idx]] / 255.0
data = np.column_stack([px, py, cols]).astype(np.float32)
data.tofile(out)
print("wrote", out, data.shape)

# Debug preview
prev = np.full((H, W, 3), 20, np.uint8)
prev[ys[idx], xs[idx]] = (cols * 255).astype(np.uint8)
Image.fromarray(prev).save("/tmp/claude-0/-home-user/8b3df8c0-c29a-5ddf-81a4-d3425e986a18/scratchpad/portrait-preview.png")
