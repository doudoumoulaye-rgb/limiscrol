#!/usr/bin/env python3
"""Build ModérScroll logo from full neuron silhouette + app name."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "neuron-stock-source.png"
SRC_CURSOR = (
    Path.home()
    / ".cursor/projects/Users-papadoudou-Desktop-APPL-limitscrol/assets"
    / "symbole-neuronal-du-cerveau-signe-cellulaire-humain-synapses-mye_line-gaine-cellule-noyau-axon-et-dendrites-ico_ne-illustration-248982429.jpg-388b7f13-535b-418f-9126-66a9a8bfb5d8.png"
)

OUT_MASTER = ROOT / "assets" / "icon-moder-scroll-1024.png"
OUT_FG_MASTER = ROOT / "assets" / "icon-moder-scroll-foreground-1024.png"
OUT_SPLASH = ROOT / "assets" / "splash-brand.png"

# Splash : fond noir, neurone blanc, nom de l’app
SPLASH_NEURON_HEIGHT_RATIO = 0.333
SPLASH_NEURON_WIDTH_RATIO = 0.48
SPLASH_TITLE_FONT_RATIO = 0.064
SPLASH_BG_FALLBACK = (0, 0, 0)  # #000000

APP_NAME_MODER = "Modér"
APP_NAME_SCROLL = "Scroll"

PRIMARY = (0, 123, 255)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)

CANVAS = 1024
# Rotated 35° clockwise (PIL: negative angle); size ~2× previous, centered above title
NEURON_ROTATION_DEG = -35
NEURON_MAX_HEIGHT_RATIO = 0.86
NEURON_MAX_WIDTH_RATIO = 0.92
FG_NEURON_RATIO = 0.72
TEXT_BAND_RATIO = 0.17

MIPMAP = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
MIPMAP_FG = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

FONT_CANDIDATES = [
    "/System/Library/Fonts/SFNSDisplay-Bold.otf",
    "/System/Library/Fonts/SFCompactDisplay-Bold.otf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def resolve_source() -> Path:
    if SRC.exists():
        return SRC
    if SRC_CURSOR.exists():
        return SRC
    raise FileNotFoundError(f"Neuron source missing: {SRC}")


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def bg_color(y_norm: float, x_norm: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, y_norm))
    r = int(BLACK[0] * (1 - t) + PRIMARY[0] * (0.1 + t * 0.5))
    g = int(BLACK[1] * (1 - t) + PRIMARY[1] * (0.1 + t * 0.5))
    b = int(BLACK[2] * (1 - t) + PRIMARY[2] * (0.15 + t * 0.65))
    cx, cy = 0.5, 0.38
    dist = ((x_norm - cx) ** 2 + (y_norm - cy) ** 2) ** 0.5
    fade = max(0.5, 1.0 - dist * 0.45)
    return int(r * fade), int(g * fade), int(b * fade)


def make_gradient_background(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        yn = y / max(size - 1, 1)
        for x in range(size):
            xn = x / max(size - 1, 1)
            px[x, y] = bg_color(yn, xn)
    return img.convert("RGBA")


def extract_neuron_rgba(src: Image.Image, threshold: int = 115) -> Image.Image:
    """Black silhouette on white -> white neuron on transparent."""
    gray = src.convert("L")
    w, h = gray.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gpx = gray.load()
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if gpx[x, y] < threshold:
                opx[x, y] = (255, 255, 255, 255)
    return out


def trim_alpha(img: Image.Image, pad_ratio: float = 0.04) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    side = max(x1 - x0, y1 - y0)
    pad = int(side * pad_ratio)
    w, h = img.size
    cx = (x0 + x1) // 2
    cy = (y0 + y1) // 2
    half = side // 2 + pad
    left = max(0, cx - half)
    top = max(0, cy - half)
    right = min(w, cx + half)
    bottom = min(h, cy + half)
    side2 = max(right - left, bottom - top)
    left = max(0, cx - side2 // 2)
    top = max(0, cy - side2 // 2)
    return img.crop((left, top, left + side2, top + side2))


def rotate_neuron(img: Image.Image, degrees: float = NEURON_ROTATION_DEG) -> Image.Image:
    rotated = img.rotate(degrees, resample=Image.Resampling.BICUBIC, expand=True)
    return trim_alpha(rotated, pad_ratio=0.06)


def scale_neuron(neuron: Image.Image, max_w: int, max_h: int) -> Image.Image:
    nw, nh = neuron.size
    scale = min(max_w / nw, max_h / nh)
    new_w = max(1, int(nw * scale))
    new_h = max(1, int(nh * scale))
    return neuron.resize((new_w, new_h), Image.Resampling.LANCZOS)


def paste_centered(canvas: Image.Image, layer: Image.Image, area_top: int, area_h: int) -> None:
    lw, lh = layer.size
    x = (CANVAS - lw) // 2
    y = area_top + (area_h - lh) // 2
    canvas.paste(layer, (x, y), layer)


def draw_app_title(
    canvas: Image.Image,
    y_center: int,
    scroll_fill: tuple[int, int, int] | None = None,
    font_ratio: float = 0.095,
) -> None:
    draw = ImageDraw.Draw(canvas)
    size = max(28, int(CANVAS * font_ratio))
    font = load_font(size)
    moder = APP_NAME_MODER
    scroll = APP_NAME_SCROLL
    full = moder + scroll

    try:
        bbox_m = draw.textbbox((0, 0), moder, font=font)
        bbox_s = draw.textbbox((0, 0), scroll, font=font)
        bbox_f = draw.textbbox((0, 0), full, font=font)
    except AttributeError:
        w_f, h_f = draw.textsize(full, font=font)
        bbox_f = (0, 0, w_f, h_f)
        bbox_m = draw.textsize(moder, font=font)
        bbox_s = draw.textsize(scroll, font=font)
        bbox_m = (0, 0, bbox_m[0], bbox_m[1])
        bbox_s = (0, 0, bbox_s[0], bbox_s[1])

    total_w = bbox_f[2] - bbox_f[0]
    text_h = bbox_f[3] - bbox_f[1]
    x = (CANVAS - total_w) // 2
    y = y_center - text_h // 2

    draw.text((x, y), moder, fill=WHITE, font=font)
    moder_w = bbox_m[2] - bbox_m[0]
    draw.text((x + moder_w, y), scroll, fill=scroll_fill or PRIMARY, font=font)


def build_launcher_icon_neuron_only(neuron: Image.Image) -> Image.Image:
    """Icône launcher : dégradé + neurone seul (sans nom sous l’icône)."""
    canvas = make_gradient_background(CANVAS)
    fg_max = int(CANVAS * FG_NEURON_RATIO)
    neuron_r = scale_neuron(neuron, fg_max, fg_max)
    paste_centered(canvas, neuron_r, 0, CANVAS)
    return canvas.convert("RGB")


def build_flat_splash_brand(neuron: Image.Image) -> Image.Image:
    """Écran de chargement : fond noir + neurone blanc + nom ModérScroll."""
    canvas = Image.new("RGB", (CANVAS, CANVAS), BLACK)
    neuron_max_h = int(CANVAS * SPLASH_NEURON_HEIGHT_RATIO)
    neuron_max_w = int(CANVAS * SPLASH_NEURON_WIDTH_RATIO)
    neuron_r = scale_neuron(neuron, neuron_max_w, neuron_max_h)
    area_top = int(CANVAS * 0.22)
    area_h = int(CANVAS * 0.4)
    paste_centered(canvas, neuron_r, area_top, area_h)
    text_y = int(CANVAS * 0.58)
    draw_app_title(
        canvas,
        text_y,
        scroll_fill=WHITE,
        font_ratio=SPLASH_TITLE_FONT_RATIO,
    )
    return canvas.convert("RGB")


def build_logo_from_neuron(neuron: Image.Image) -> tuple[Image.Image, Image.Image]:
    canvas = make_gradient_background(CANVAS)

    text_band = int(CANVAS * TEXT_BAND_RATIO)
    neuron_max_w = int(CANVAS * NEURON_MAX_WIDTH_RATIO)
    neuron_max_h = int(CANVAS * NEURON_MAX_HEIGHT_RATIO)

    neuron_r = scale_neuron(neuron, neuron_max_w, neuron_max_h)
    # Centre géométrique du carré 1024×1024
    paste_centered(canvas, neuron_r, 0, CANVAS)

    text_y = CANVAS - text_band // 2 - int(CANVAS * 0.012)
    draw_app_title(canvas, text_y)

    fg = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    fg_max = int(CANVAS * FG_NEURON_RATIO)
    neuron_fg = scale_neuron(neuron, fg_max, fg_max)
    paste_centered(fg, neuron_fg, 0, CANVAS)

    return canvas, fg


def write_mipmaps(launcher_rgb: Image.Image, launcher_fg: Image.Image) -> None:
    res = ROOT / "android" / "app" / "src" / "main" / "res"
    for folder, size in MIPMAP.items():
        d = res / folder
        d.mkdir(parents=True, exist_ok=True)
        icon = launcher_rgb.resize((size, size), Image.Resampling.LANCZOS)
        icon.save(d / "ic_launcher.png", "PNG", optimize=True)
        icon.save(d / "ic_launcher_round.png", "PNG", optimize=True)
        make_gradient_background(size).convert("RGB").save(
            d / "ic_launcher_background.png", "PNG", optimize=True
        )
    for folder, size in MIPMAP_FG.items():
        d = res / folder
        d.mkdir(parents=True, exist_ok=True)
        launcher_fg.resize((size, size), Image.Resampling.LANCZOS).save(
            d / "ic_launcher_foreground.png", "PNG", optimize=True
        )


def write_android_splash(splash: Image.Image) -> None:
    drawable = ROOT / "android" / "app" / "src" / "main" / "res" / "drawable"
    drawable.mkdir(parents=True, exist_ok=True)
    splash.save(drawable / "splash_brand.png", "PNG", optimize=True)
    nodpi = ROOT / "android" / "app" / "src" / "main" / "res" / "drawable-nodpi"
    nodpi.mkdir(parents=True, exist_ok=True)
    splash.save(nodpi / "splash_brand.png", "PNG", optimize=True)


def write_ios_assets(launcher_rgb: Image.Image, splash: Image.Image) -> None:
    icon_path = ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
    icon_path.parent.mkdir(parents=True, exist_ok=True)
    launcher_rgb.save(icon_path, "PNG", optimize=True)

    splash_dir = ROOT / "ios/App/App/Assets.xcassets/Splash.imageset"
    splash_dir.mkdir(parents=True, exist_ok=True)
    ios_splash = splash.resize((2732, 2732), Image.Resampling.LANCZOS)
    for name in (
        "splash-2732x2732.png",
        "splash-2732x2732-1.png",
        "splash-2732x2732-2.png",
    ):
        ios_splash.save(splash_dir / name, "PNG", optimize=True)


def main() -> None:
    if not SRC.exists() and SRC_CURSOR.exists():
        SRC.parent.mkdir(parents=True, exist_ok=True)
        Image.open(SRC_CURSOR).save(SRC, "PNG")

    src = Image.open(resolve_source())
    neuron = rotate_neuron(trim_alpha(extract_neuron_rgba(src)))
    full, fg = build_logo_from_neuron(neuron)
    splash = build_flat_splash_brand(neuron)
    launcher_icon = build_launcher_icon_neuron_only(neuron)

    OUT_MASTER.parent.mkdir(parents=True, exist_ok=True)
    full.save(OUT_MASTER, "PNG", optimize=True)
    fg.save(OUT_FG_MASTER, "PNG", optimize=True)
    splash.save(OUT_SPLASH, "PNG", optimize=True)
    write_mipmaps(launcher_icon, fg)
    write_android_splash(splash)
    write_ios_assets(launcher_icon, splash)
    print(f"Logo: {OUT_MASTER}")
    print(f"Splash: {OUT_SPLASH}")
    print("Android + iOS assets updated.")


if __name__ == "__main__":
    main()
