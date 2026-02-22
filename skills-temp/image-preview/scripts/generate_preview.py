#!/usr/bin/env python3
import argparse
import math
import os
import random
import subprocess
import sys
import tempfile


def clamp(v):
    if v < 0:
        return 0
    if v > 255:
        return 255
    return int(v)


class Canvas:
    def __init__(self, width, height):
        self.w = width
        self.h = height
        self.px = bytearray(width * height * 3)

    def set(self, x, y, r, g, b):
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 3
            self.px[i] = clamp(r)
            self.px[i + 1] = clamp(g)
            self.px[i + 2] = clamp(b)

    def blend(self, x, y, r, g, b, a):
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 3
            ar = max(0.0, min(1.0, a / 255.0))
            self.px[i] = clamp(self.px[i] * (1.0 - ar) + r * ar)
            self.px[i + 1] = clamp(self.px[i + 1] * (1.0 - ar) + g * ar)
            self.px[i + 2] = clamp(self.px[i + 2] * (1.0 - ar) + b * ar)

    def write_ppm(self, path):
        with open(path, "wb") as f:
            f.write(f"P6\n{self.w} {self.h}\n255\n".encode("ascii"))
            f.write(self.px)


def in_ellipse(x, y, cx, cy, rx, ry):
    dx = (x - cx) / rx
    dy = (y - cy) / ry
    return dx * dx + dy * dy <= 1.0


def in_round_rect(x, y, x1, y1, x2, y2, r):
    if x1 + r <= x <= x2 - r and y1 <= y <= y2:
        return True
    if x1 <= x <= x2 and y1 + r <= y <= y2 - r:
        return True
    for qx, qy in ((x1 + r, y1 + r), (x2 - r, y1 + r), (x1 + r, y2 - r), (x2 - r, y2 - r)):
        if (x - qx) * (x - qx) + (y - qy) * (y - qy) <= r * r:
            return True
    return False


def render(canvas, style, seed, accent):
    rnd = random.Random(seed)
    w, h = canvas.w, canvas.h
    cx, cy = w // 2, int(h * 0.52)

    if style == "minimal":
        bg0 = (14, 20, 44)
        bg1 = (28, 60, 124)
    elif style == "comic":
        bg0 = (12, 24, 60)
        bg1 = (24, 78, 140)
    else:
        bg0 = (8, 16, 42)
        bg1 = (26, 54, 116)

    for y in range(h):
        t = y / (h - 1)
        r = bg0[0] + (bg1[0] - bg0[0]) * t
        g = bg0[1] + (bg1[1] - bg0[1]) * t
        b = bg0[2] + (bg1[2] - bg0[2]) * t
        for x in range(w):
            canvas.set(x, y, r, g, b)

    glow_radius = int(min(w, h) * 0.45)
    for y in range(h):
        for x in range(w):
            d = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            if d < glow_radius:
                a = (1.0 - d / glow_radius) ** 1.8 * 130
                canvas.blend(x, y, 42, 120, 208, a)

    # Subject geometry with slight random variance.
    body_x1 = int(w * 0.26)
    body_x2 = int(w * 0.74)
    body_y1 = int(h * 0.20)
    body_y2 = int(h * 0.90)
    body_r = int(min(w, h) * 0.13)

    shoulder_w = int(min(w, h) * 0.11)
    shoulder_h = int(min(w, h) * 0.09)

    red = (208 + rnd.randint(-8, 10), 24 + rnd.randint(-2, 2), 40 + rnd.randint(-2, 3))
    blue = (38 + rnd.randint(-3, 3), 96 + rnd.randint(-4, 6), 192 + rnd.randint(-6, 6))
    gold = (242 + rnd.randint(-6, 4), 194 + rnd.randint(-8, 5), 74 + rnd.randint(-5, 5))

    # Main body.
    for y in range(int(h * 0.16), int(h * 0.93)):
        for x in range(int(w * 0.18), int(w * 0.82)):
            inside = in_round_rect(x, y, body_x1, body_y1, body_x2, body_y2, body_r)
            inside = inside or in_ellipse(x, y, body_x1, int(h * 0.30), shoulder_w, shoulder_h)
            inside = inside or in_ellipse(x, y, body_x2, int(h * 0.30), shoulder_w, shoulder_h)
            if not inside:
                continue
            nx = (x - cx) / ((body_x2 - body_x1) / 2)
            ny = (y - (body_y1 + body_y2) / 2) / ((body_y2 - body_y1) / 2)
            side = 1.0 - min(1.0, abs(nx))
            light = math.exp(-((x - (cx - 40)) ** 2 + (y - int(h * 0.28)) ** 2) / (2 * (0.09 * w) ** 2))
            v = 0.86 + 0.16 * (1.0 - abs(ny))
            tex = 4.5 * math.sin(x * 0.05) + 3.0 * math.sin(y * 0.062 + x * 0.01)
            rr = (red[0] + 42 * side + 18 * light + tex) * v
            gg = (red[1] + 8 * side + 5 * light + tex * 0.14) * v
            bb = (red[2] + 8 * side + 5 * light + tex * 0.14) * v
            canvas.set(x, y, rr, gg, bb)

    # Three channels.
    channels = (int(w * 0.39), int(w * 0.50), int(w * 0.61))
    chan_half = int(min(w, h) * 0.034)
    for c in channels:
        for y in range(int(h * 0.37), int(h * 0.84)):
            for x in range(c - chan_half, c + chan_half + 1):
                if in_round_rect(x, y, c - chan_half, int(h * 0.37), c + chan_half, int(h * 0.84), int(chan_half * 0.85)):
                    i = (y * w + x) * 3
                    canvas.px[i] = clamp(canvas.px[i] * 0.86)
                    canvas.px[i + 1] = clamp(canvas.px[i + 1] * 0.88)
                    canvas.px[i + 2] = clamp(canvas.px[i + 2] * 0.88)

    # Blue belt.
    belt_y1 = int(h * 0.54)
    belt_y2 = int(h * 0.70)
    belt_x1 = int(w * 0.22)
    belt_x2 = int(w * 0.78)
    belt_r = int(min(w, h) * 0.055)

    for y in range(int(h * 0.50), int(h * 0.74)):
        for x in range(int(w * 0.18), int(w * 0.82)):
            if not in_round_rect(x, y, belt_x1, belt_y1, belt_x2, belt_y2, belt_r):
                continue
            gy = 1.0 - min(1.0, abs((y - (belt_y1 + belt_y2) / 2) / ((belt_y2 - belt_y1) / 2)))
            rr = blue[0] + 14 * gy
            gg = blue[1] + 28 * gy
            bb = blue[2] + 36 * gy
            if (x - belt_x1) % 30 < 4:
                rr += 14
                gg += 16
                bb += 20
            canvas.set(x, y, rr, gg, bb)

    # Gold emblem.
    emx, emy = cx, int(h * 0.62)
    emr = int(min(w, h) * 0.105)
    for y in range(emy - emr - 2, emy + emr + 3):
        for x in range(emx - emr - 2, emx + emr + 3):
            d = math.sqrt((x - emx) ** 2 + (y - emy) ** 2)
            if d <= emr:
                t = d / emr
                hl = math.exp(-((x - (emx - 28)) ** 2 + (y - (emy - 32)) ** 2) / (2 * 20 * 20)) * 46
                canvas.set(x, y, gold[0] - 24 * t + hl, gold[1] - 38 * t + hl * 0.72, gold[2] - 18 * t + hl * 0.42)
            elif d <= emr + 6:
                canvas.blend(x, y, 255, 230, 142, 170)

    # Keyhole.
    key = (56, 40, 18)
    for y in range(emy - 32, emy + 8):
        for x in range(emx - 16, emx + 17):
            if (x - emx) ** 2 + (y - (emy - 14)) ** 2 <= 16 * 16:
                canvas.set(x, y, key[0], key[1], key[2])
    for y in range(emy + 2, emy + 44):
        for x in range(emx - 8, emx + 9):
            canvas.set(x, y, key[0], key[1], key[2])

    # Accent stars.
    stars = [
        (int(w * 0.16), int(h * 0.21)),
        (int(w * 0.85), int(h * 0.27)),
        (int(w * 0.79), int(h * 0.70)),
        (int(w * 0.23), int(h * 0.82)),
    ]
    for sx, sy in stars:
        for k in range(-10, 11):
            a = max(0, 220 - 18 * abs(k))
            canvas.blend(sx + k, sy, accent[0], accent[1], accent[2], a)
            canvas.blend(sx, sy + k, accent[0], accent[1], accent[2], a)

    # Grain + vignette.
    for y in range(h):
        for x in range(w):
            i = (y * w + x) * 3
            n = rnd.randint(-5, 5)
            canvas.px[i] = clamp(canvas.px[i] + n)
            canvas.px[i + 1] = clamp(canvas.px[i + 1] + n)
            canvas.px[i + 2] = clamp(canvas.px[i + 2] + n)
            dx = (x - w / 2) / (w / 2)
            dy = (y - h / 2) / (h / 2)
            dv = math.sqrt(dx * dx + dy * dy)
            if dv > 0.68:
                f = max(0.56, 1.0 - (dv - 0.68) * 0.9)
                canvas.px[i] = clamp(canvas.px[i] * f)
                canvas.px[i + 1] = clamp(canvas.px[i + 1] * f)
                canvas.px[i + 2] = clamp(canvas.px[i + 2] * f)


def save_png(canvas, out_path):
    out_dir = os.path.dirname(out_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    with tempfile.NamedTemporaryFile(prefix="image-preview-", suffix=".ppm", delete=False) as tmp:
        ppm_path = tmp.name

    try:
        canvas.write_ppm(ppm_path)
        cmd = [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            ppm_path,
            "-frames:v",
            "1",
            out_path,
        ]
        subprocess.run(cmd, check=True)
    finally:
        if os.path.exists(ppm_path):
            os.remove(ppm_path)


def main():
    parser = argparse.ArgumentParser(description="Generate fast hero-style preview PNGs using only stdlib + ffmpeg.")
    parser.add_argument("--output", required=True, help="Output PNG path.")
    parser.add_argument("--width", type=int, default=768)
    parser.add_argument("--height", type=int, default=768)
    parser.add_argument("--style", choices=("poster", "comic", "minimal"), default="poster")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--count", type=int, default=1, help="Number of images to generate. If >1, suffix _001 style is used.")

    args = parser.parse_args()

    if args.width < 256 or args.height < 256:
        print("width and height must be >= 256", file=sys.stderr)
        return 2
    if args.count < 1 or args.count > 200:
        print("count must be between 1 and 200", file=sys.stderr)
        return 2

    accent = (214, 246, 255)

    if args.count == 1:
        canvas = Canvas(args.width, args.height)
        render(canvas, args.style, args.seed, accent)
        save_png(canvas, args.output)
        print(args.output)
        return 0

    root, ext = os.path.splitext(args.output)
    ext = ext or ".png"
    for i in range(args.count):
        out = f"{root}_{i + 1:03d}{ext}"
        canvas = Canvas(args.width, args.height)
        render(canvas, args.style, args.seed + i * 17, accent)
        save_png(canvas, out)
        print(out)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
