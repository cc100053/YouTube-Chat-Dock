#!/usr/bin/env python3
"""Generate every Chrome Web Store image asset for YouTube Chat Dock.

Run:  python3 store/make_assets.py

Everything is drawn, not photographed. That is deliberate: the store listing
must not carry YouTube's logo, wordmark, or red-and-white scheme (see
CLAUDE.md), and a real screenshot of a watch page carries all three. The
mockups show the *layout* the extension produces — which is the whole product —
using this project's own palette from dock.css.

Sizes are the Chrome Web Store's published requirements:
  store icon      128x128
  screenshot      1280x800  (1-5 of them)
  small tile      440x280
  marquee tile    1440x560
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")

# Palette. BLUE is the divider colour from dock.css; the rest is YouTube-dark
# neutral greyscale, which is not trademarked the way red-on-white is.
BG        = (15, 15, 15)
SURFACE   = (24, 24, 24)
SURFACE_2 = (33, 33, 33)
LINE      = (48, 48, 48)
BLUE      = (62, 166, 255)
BLUE_DIM  = (37, 99, 153)
TEXT      = (241, 241, 241)
MUTED     = (154, 154, 154)
FAINT     = (95, 95, 95)
GREEN     = (109, 212, 145)

FONT_PATH = "/System/Library/Fonts/HelveticaNeue.ttc"
# HelveticaNeue.ttc face indices: 0 regular, 1 bold-ish, 2 light... resolved by
# trial; index is passed explicitly so the build is reproducible.
_cache = {}


def font(size, bold=False):
    key = (size, bold)
    if key not in _cache:
        _cache[key] = ImageFont.truetype(FONT_PATH, size, index=1 if bold else 0)
    return _cache[key]


def text_w(d, s, f):
    return d.textbbox((0, 0), s, font=f)[2]


def rrect(d, box, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


# ---------------------------------------------------------------- primitives

def arrow(d, cx, cy, length, colour, head=6, width=2, double=True):
    """Arrows are drawn, not typed. Helvetica Neue has no ⇄ or →, and a missing
    glyph renders as a tofu box — which is what shipped on the first pass."""
    half = length / 2
    d.line((cx - half, cy, cx + half, cy), fill=colour, width=width)
    sides = (-1, 1) if double else (1,)
    for s in sides:
        tip = cx + s * half
        d.polygon([(tip, cy), (tip - s * head, cy - head * 0.7),
                   (tip - s * head, cy + head * 0.7)], fill=colour)


def chat_panel(d, x, y, w, h, rows=9, title="Live chat"):
    """The docked chat column: header, message rows, input box."""
    rrect(d, (x, y, x + w, y + h), 12, fill=SURFACE)
    d.line((x, y + 34, x + w, y + 34), fill=LINE, width=1)
    d.text((x + 12, y + 11), title, font=font(13, True), fill=TEXT)

    cy = y + 48
    row = 0
    # -46 is the input box plus its gutter; rows must stop above it or the last
    # message is drawn under the box and reads as a rendering bug.
    while cy + 22 < y + h - 46 and row < rows:
        # avatar
        d.ellipse((x + 12, cy, x + 12 + 16, cy + 16), fill=SURFACE_2)
        # author + message, widths varied so it reads as real traffic
        name_w = [34, 46, 28, 52, 40, 30, 48, 36, 44][row % 9]
        d.rounded_rectangle((x + 36, cy + 2, x + 36 + name_w, cy + 9), radius=3,
                            fill=BLUE_DIM if row % 4 == 0 else FAINT)
        msg_w = [90, 130, 64, 150, 108, 78, 138, 96, 120][row % 9]
        msg_w = min(msg_w, w - 52)
        d.rounded_rectangle((x + 36, cy + 13, x + 36 + msg_w, cy + 20), radius=3,
                            fill=(68, 68, 68))
        cy += 30
        row += 1

    ib = y + h - 38
    rrect(d, (x + 10, ib, x + w - 10, ib + 26), 13, outline=LINE, width=1)
    d.text((x + 22, ib + 6), "Say something…", font=font(11), fill=FAINT)


def player(d, x, y, w, h, label=True):
    """A generic video player. No brand marks, no red.

    The frame carries a soft abstract 'stage' behind the play glyph — an empty
    black rectangle reads as a broken player rather than as video."""
    rrect(d, (x, y, x + w, y + h), 12, fill=(8, 8, 8))

    # Concentric rounded bands, lightest at the centre: enough luminance
    # variation to read as a picture without depicting anything.
    cx, cy = x + w / 2, y + h / 2 - 4
    steps = 16
    for i in range(steps, 0, -1):
        f = i / float(steps)
        bw, bh = w * 0.88 * f, h * 0.76 * f
        v = int(10 + (1 - f) * 24)
        d.rounded_rectangle((cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2),
                            radius=max(6, bh * 0.10), fill=(v, v, v + 2))

    r = min(30, h * 0.09)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(118, 118, 118), width=2)
    d.polygon([(cx - r * 0.30, cy - r * 0.44), (cx - r * 0.30, cy + r * 0.44),
               (cx + r * 0.48, cy)], fill=(190, 190, 190))

    by = y + h - 20
    d.line((x + 14, by, x + w - 14, by), fill=(58, 58, 58), width=3)
    d.line((x + 14, by, x + 14 + (w - 28) * 0.38, by), fill=(150, 150, 150), width=3)
    d.ellipse((x + 14 + (w - 28) * 0.38 - 4, by - 4,
               x + 14 + (w - 28) * 0.38 + 4, by + 4), fill=TEXT)
    if label:
        d.text((x + 14, y + 12), "Video", font=font(11), fill=(120, 120, 120))


def divider(d, x, y, h, active=False, arrows=False):
    """The draggable divider, drawn as dock.css renders it."""
    col = BLUE if active else (58, 58, 58)
    d.rounded_rectangle((x - 1, y, x + 2, y + h), radius=2, fill=col)
    if active:
        # grip dots
        for i in range(3):
            gy = y + h / 2 - 8 + i * 8
            d.ellipse((x - 2, gy, x + 3, gy + 5), fill=BLUE)
    if arrows:
        cy = y + h / 2
        rrect(d, (x - 14, cy - 14, x + 15, cy + 15), 14, fill=SURFACE_2, outline=BLUE)
        arrow(d, x + 0.5, cy, 17, BLUE, head=5, width=2)


def masthead(d, x, y, w):
    """Generic page chrome — search pill and avatar, no logo."""
    rrect(d, (x + w / 2 - 130, y, x + w / 2 + 130, y + 22), 11,
          fill=SURFACE, outline=LINE)
    d.ellipse((x + w - 22, y, x + w, y + 22), fill=SURFACE_2)
    for i in range(3):
        d.line((x + 2, y + 6 + i * 5, x + 16, y + 6 + i * 5), fill=FAINT, width=2)


def window(img, d, x, y, w, h, title="youtube.com/watch"):
    """A browser window frame to hold a mockup."""
    rrect(d, (x, y, x + w, y + h), 14, fill=BG, outline=(52, 52, 52), width=1)
    d.rounded_rectangle((x, y, x + w, y + 34), radius=14, fill=(30, 30, 30))
    d.rectangle((x, y + 24, x + w, y + 34), fill=(30, 30, 30))
    d.line((x, y + 34, x + w, y + 34), fill=(52, 52, 52), width=1)
    for i, c in enumerate([(255, 95, 87), (255, 189, 46), (39, 201, 63)]):
        d.ellipse((x + 14 + i * 18, y + 12, x + 24 + i * 18, y + 22), fill=c)
    rrect(d, (x + 86, y + 9, x + w - 16, y + 27), 9, fill=(20, 20, 20))
    d.text((x + 98, y + 13), title, font=font(11), fill=FAINT)


def canvas(w, h):
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    return img, d


def headline(d, x, y, title, sub, tw=1100, size=44, subsize=21):
    d.text((x, y), title, font=font(size, True), fill=TEXT)
    if sub:
        d.text((x, y + size + 14), sub, font=font(subsize), fill=MUTED)


def save(img, name):
    p = os.path.join(OUT, name)
    img.save(p, "PNG", optimize=True)
    print(f"{name:34} {img.size[0]}x{img.size[1]}  {os.path.getsize(p)/1024:6.1f} KB")


# --------------------------------------------------------------- screenshots

def shot1():
    """Page mode: chat is a real column, video sits beside it."""
    img, d = canvas(1280, 800)
    headline(d, 80, 74,
             "Chat sits beside the video",
             "A real side panel — not a floating overlay covering what you came to watch.")

    wx, wy, ww, wh = 80, 218, 1120, 508
    window(d, d, wx, wy, ww, wh) if False else window(img, d, wx, wy, ww, wh)
    inner_y = wy + 34
    masthead(d, wx + 20, inner_y + 14, ww - 40)

    py, ph = inner_y + 52, wh - 34 - 72
    px, pw = wx + 20, 690
    player(d, px, py, pw, ph)
    dx = px + pw + 14
    divider(d, dx, py, ph)
    chat_panel(d, dx + 14, py, ww - (dx + 14 - wx) - 20, ph, rows=11)
    save(img, "screenshot-1-side-panel.png")


def shot2():
    """Drag mode: divider active, width readout, both sides resizing."""
    img, d = canvas(1280, 800)
    headline(d, 80, 74,
             "Drag the divider to resize",
             "The player resizes with it — the video is never cropped. Double-click to reset.")

    wx, wy, ww, wh = 80, 218, 1120, 508
    window(img, d, wx, wy, ww, wh)
    inner_y = wy + 34
    masthead(d, wx + 20, inner_y + 14, ww - 40)

    py, ph = inner_y + 52, wh - 34 - 72
    px, pw = wx + 20, 560
    player(d, px, py, pw, ph)
    dx = px + pw + 14
    divider(d, dx, py, ph, active=True)
    chat_panel(d, dx + 14, py, ww - (dx + 14 - wx) - 20, ph, rows=11)

    # width pill + resize cursor, the two things that say "this is draggable"
    # The readout sits inside the frame: above it, it collided with the
    # masthead search pill and read as page chrome rather than as a tooltip.
    pill = "520 px"
    f = font(13, True)
    tw = text_w(d, pill, f)
    rrect(d, (dx - tw / 2 - 12, py + 12, dx + tw / 2 + 12, py + 38), 13, fill=BLUE)
    d.text((dx, py + 25), pill, font=f, fill=(10, 20, 30), anchor="mm")
    arrow(d, dx, py + ph / 2 + 60, 60, TEXT, head=9, width=2)
    save(img, "screenshot-2-drag-to-resize.png")


def shot3():
    """True fullscreen — the case most docking extensions drop."""
    img, d = canvas(1280, 800)
    headline(d, 80, 74,
             "Keeps working in true fullscreen",
             "Page view, theater mode and fullscreen each remember their own width.")

    wx, wy, ww, wh = 80, 218, 1120, 508
    rrect(d, (wx, wy, wx + ww, wy + wh), 14, fill=(0, 0, 0), outline=(52, 52, 52))
    px, py = wx + 12, wy + 12
    ph = wh - 24
    pw = 760
    player(d, px, py, pw, ph, label=False)
    dx = px + pw + 12
    divider(d, dx, py, ph, active=True)
    chat_panel(d, dx + 12, py, ww - (dx + 12 - wx) - 12, ph, rows=12)

    f = font(12, True)
    tag = "FULLSCREEN"
    tw = text_w(d, tag, f)
    rrect(d, (wx + 24, wy + 24, wx + 24 + tw + 24, wy + 50), 13, fill=(0, 0, 0), outline=FAINT)
    d.text((wx + 36, wy + 30), tag, font=f, fill=MUTED)
    save(img, "screenshot-3-fullscreen.png")


def shot4():
    """The side flip, shown as the before/after it actually is."""
    img, d = canvas(1280, 800)
    headline(d, 80, 74,
             "Put chat on whichever side you like",
             "Hover the divider and click the toggle. The choice sticks, and it mirrors in RTL.")

    def mini(x, y, w, h, chat_left, caption, arrows=False):
        rrect(d, (x, y, x + w, y + h), 12, fill=(9, 9, 9), outline=(52, 52, 52))
        pad = 14
        cw = 168
        ih = h - 2 * pad
        if chat_left:
            chat_panel(d, x + pad, y + pad, cw, ih, rows=9)
            dx = x + pad + cw + 12
            player(d, dx + 12, y + pad, w - (dx + 12 - x) - pad, ih, label=False)
        else:
            pw = w - 2 * pad - cw - 24
            player(d, x + pad, y + pad, pw, ih, label=False)
            dx = x + pad + pw + 12
            chat_panel(d, dx + 12, y + pad, cw, ih, rows=9)
        divider(d, dx, y + pad, ih, active=True, arrows=arrows)
        d.text((x + w / 2, y + h + 26), caption, font=font(17), fill=MUTED, anchor="ma")

    mini(80, 232, 512, 430, False, "Right — the default", arrows=True)
    mini(688, 232, 512, 430, True, "Left — one click away")

    arrow(d, 640, 447, 40, BLUE, head=10, width=3, double=False)
    save(img, "screenshot-4-either-side.png")


def toggle(d, x, y, on):
    """The popup's switch, at the popup's own proportions (38x22)."""
    rrect(d, (x, y, x + 38, y + 22), 11, fill=BLUE if on else (58, 58, 58))
    kx = x + 19 if on else x + 3
    d.ellipse((kx, y + 3, kx + 16, y + 19), fill=TEXT)


def slider(d, x, y, w, frac):
    d.rounded_rectangle((x, y, x + w, y + 4), radius=2, fill=(58, 58, 58))
    d.rounded_rectangle((x, y, x + w * frac, y + 4), radius=2, fill=BLUE)
    d.ellipse((x + w * frac - 7, y - 5, x + w * frac + 7, y + 9), fill=BLUE)


def popup_mock(d, x, y, w=460):
    """The settings popup, redrawn at the proportions it actually renders at.
    Verified against the real popup in Chrome (en, ja and ar) before this was
    drawn — the switch positions and the two slider values are what it shows."""
    rows = [
        ("Enable on YouTube", "Turn the panel off without uninstalling.", True),
        ("Chat on the other side", "Mirrors correctly in right-to-left layouts.", False),
        ("Show the drag divider", "Hide it to keep the layout but stop resizing.", True),
    ]
    ranges = [("Width in page view", "440 px", 0.33), ("Width in fullscreen", "560 px", 0.45)]

    # Tuned so the whole card clears 800px tall with the headline above it —
    # the first pass overflowed and cut the Reset button in half.
    HEAD, ROW, RANGE, FOOT = 92, 70, 84, 100
    h = HEAD + len(rows) * ROW + len(ranges) * RANGE + FOOT
    rrect(d, (x, y, x + w, y + h), 16, fill=BG, outline=(52, 52, 52))

    icon_mark(d, x + 24, y + 20, 36)
    d.text((x + 74, y + 29), "YouTube Chat Dock", font=font(18, True), fill=TEXT)
    d.line((x, y + 76, x + w, y + 76), fill=LINE, width=1)

    cy = y + HEAD
    for title, hint, on in rows:
        d.text((x + 24, cy + 2), title, font=font(16), fill=TEXT)
        d.text((x + 24, cy + 26), hint, font=font(13), fill=MUTED)
        toggle(d, x + w - 24 - 38, cy + 8, on)
        cy += ROW
        d.line((x + 24, cy - 12, x + w - 24, cy - 12), fill=LINE, width=1)

    for title, val, frac in ranges:
        d.text((x + 24, cy + 2), title, font=font(16), fill=TEXT)
        d.text((x + w - 24, cy + 2), val, font=font(16, True), fill=BLUE, anchor="ra")
        slider(d, x + 24, cy + 42, w - 48, frac)
        cy += RANGE
        d.line((x + 24, cy - 12, x + w - 24, cy - 12), fill=LINE, width=1)

    d.text((x + 24, cy), "Below a 1000 px window YouTube stacks chat",
           font=font(13), fill=MUTED)
    d.text((x + 24, cy + 18), "under the video, and the panel does not apply.",
           font=font(13), fill=MUTED)
    rrect(d, (x + 24, cy + 48, x + 168, cy + 82), 17, fill=SURFACE, outline=LINE)
    d.text((x + 96, cy + 65), "Reset to defaults", font=font(13), fill=TEXT, anchor="mm")
    d.text((x + w - 24, cy + 65), "Source code", font=font(13), fill=MUTED, anchor="rm")
    return h


def shot5():
    """The popup, plus the privacy story it did not cost."""
    img, d = canvas(1280, 800)
    headline(d, 80, 74,
             "Settings in one click",
             "An off switch, both widths and the side toggle — from the toolbar, in 12 languages.")

    popup_mock(d, 80, 200)

    bx = 640
    claims = [
        ("No data collected", "Nothing is recorded, transmitted, or sold."),
        ("No network requests", "No analytics, no telemetry, no remote config."),
        ("One permission: storage", "So the popup can reach the page. Chrome shows\nno install warning for it."),
        ("Settings stay local", "In your own browser, never uploaded."),
    ]
    y = 224
    for title, body in claims:
        d.ellipse((bx, y + 5, bx + 9, y + 14), fill=GREEN)
        d.text((bx + 24, y), title, font=font(19, True), fill=TEXT)
        for i, line in enumerate(body.split("\n")):
            d.text((bx + 24, y + 28 + i * 22), line, font=font(15), fill=MUTED)
        y += 28 + 24 * len(body.split("\n")) + 34

    d.line((bx, y + 6, 1200, y + 6), fill=LINE, width=1)
    d.text((bx, y + 26), "Translated into", font=font(15, True), fill=TEXT)
    # Latin script only: the drawing font has no CJK, Arabic or Devanagari
    # coverage, and a missing glyph renders as a tofu box.
    langs = ["English", "Chinese", "Japanese", "Korean", "Spanish", "Portuguese",
             "French", "German", "Russian", "Arabic", "Hindi"]
    line, ly = "", y + 54
    for w_ in langs:
        trial = (line + " · " + w_) if line else w_
        if text_w(d, trial, font(15)) > 540:
            d.text((bx, ly), line, font=font(15), fill=MUTED)
            ly += 24
            line = w_
        else:
            line = trial
    d.text((bx, ly), line, font=font(15), fill=MUTED)
    save(img, "screenshot-5-settings.png")


# ------------------------------------------------------------------- tiles

def icon_mark(d, x, y, size, r=None):
    """The product mark: a dark rounded square split by the blue divider.
    Same idea as icons/icon128.png, redrawn at arbitrary size."""
    r = r or int(size * 0.22)
    rrect(d, (x, y, x + size, y + size), r, fill=(26, 26, 26))
    pad = size * 0.14
    # left = video, right = chat, blue line between them
    dx = x + size * 0.58
    w = max(2, int(size * 0.055))
    d.rounded_rectangle((dx - w / 2, y + pad, dx + w / 2, y + size - pad),
                        radius=w / 2, fill=BLUE)
    # chat rows on the right of the divider, so the mark reads as "chat"
    rw = size - (dx - x) - pad - size * 0.10
    if rw > 6:
        rows = 4
        gap = (size - 2 * pad) / rows
        for i in range(rows):
            ry = y + pad + i * gap + gap * 0.22
            lw = rw * [0.9, 0.62, 1.0, 0.74][i]
            d.rounded_rectangle((dx + size * 0.10, ry, dx + size * 0.10 + lw, ry + gap * 0.30),
                                radius=gap * 0.15, fill=(78, 78, 78))


def store_icon():
    """RGBA with transparent corners, not a filled square. The 16px copy is the
    toolbar icon and sits on the browser's own background — an opaque dark tile
    reads as a black box on a light toolbar."""
    s = 512  # drawn 4x then downsampled, so corners and rows stay clean at 128
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    icon_mark(d, s * 0.02, s * 0.02, s * 0.96)
    for n in (128, 48):
        save(img.resize((n, n), Image.LANCZOS), f"icon{n}.png")

    # At 16px the chat rows collapse into grey mush, so the small size drops
    # them and keeps only the split — the one thing still legible at that size.
    small = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ds = ImageDraw.Draw(small)
    rrect(ds, (s * 0.02, s * 0.02, s * 0.98, s * 0.98), int(s * 0.22), fill=(26, 26, 26))
    dx, w = s * 0.60, s * 0.075
    ds.rounded_rectangle((dx - w / 2, s * 0.16, dx + w / 2, s * 0.84),
                         radius=w / 2, fill=BLUE)
    save(small.resize((16, 16), Image.LANCZOS), "icon16.png")

    # The store listing icon is a separate asset from the packed icons: the
    # store wants the artwork to fill the frame, so this one has no transparent
    # margin and sits on the listing's own dark background.
    store = Image.new("RGB", (s, s), BG)
    icon_mark(ImageDraw.Draw(store), s * 0.10, s * 0.10, s * 0.80)
    save(store.resize((128, 128), Image.LANCZOS), "store-icon-128.png")


def small_tile():
    """440x280 renders small in the store grid, so this is type-led. A cropped
    mockup was tried here first and just read as a clipping bug."""
    img, d = canvas(440, 280)
    icon_mark(d, 32, 34, 68)
    d.text((116, 44), "YouTube", font=font(26, True), fill=TEXT)
    d.text((116, 74), "Chat Dock", font=font(26, True), fill=TEXT)

    d.line((32, 140, 408, 140), fill=LINE, width=1)
    d.text((32, 160), "Live chat as a resizable", font=font(17), fill=MUTED)
    d.text((32, 184), "side panel — not an overlay.", font=font(17), fill=MUTED)
    d.text((32, 232), "No tracking  ·  Open source", font=font(14, True), fill=BLUE)
    save(img, "promo-small-440x280.png")


def marquee():
    img, d = canvas(1440, 560)
    icon_mark(d, 96, 96, 96)
    d.text((96, 226), "YouTube Chat Dock", font=font(56, True), fill=TEXT)
    d.text((96, 300), "Live chat as a resizable side panel.", font=font(26), fill=MUTED)
    d.text((96, 336), "Page view, theater, and true fullscreen.", font=font(26), fill=MUTED)
    d.text((96, 402), "No tracking  ·  Open source  ·  12 languages",
           font=font(19, True), fill=BLUE)

    x, y, w, h = 760, 80, 600, 400
    rrect(d, (x, y, x + w, y + h), 16, fill=(9, 9, 9), outline=(52, 52, 52))
    pw = 360
    player(d, x + 16, y + 16, pw, h - 32, label=False)
    dx = x + 16 + pw + 14
    divider(d, dx, y + 16, h - 32, active=True)
    chat_panel(d, dx + 14, y + 16, w - (dx + 14 - x) - 16, h - 32, rows=10)
    save(img, "promo-marquee-1440x560.png")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    store_icon()
    shot1(); shot2(); shot3(); shot4(); shot5()
    small_tile()
    marquee()
