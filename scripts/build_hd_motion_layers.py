from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "work" / "generated-hd-motion"
OUTPUT = ROOT / "public" / "pages"
STAGE_SIZE = (1920, 1080)
SUBJECT_HEIGHT = 700
SUBJECT_BOTTOM = 1010
CHAIR_AXIS_X = 960


LAYERS = {
    "base": 0.56,
    "top-right-mid": 0.50,
    "top-right-target": 0.57,
    "top-left-mid": 0.60,
    "top-left-target": 0.58,
    "bottom-left-mid": 0.63,
    "bottom-left-target": 0.66,
    "bottom-right-mid": 0.42,
    "bottom-right-target": 0.44,
}


BASE_SUBJECT = [
    (820, 250), (1095, 250), (1175, 315), (1205, 420),
    (1275, 505), (1260, 640), (1215, 725), (1210, 900),
    (1140, 1015), (1040, 1025), (960, 930), (895, 1015),
    (800, 1015), (740, 920), (700, 790), (695, 650),
    (725, 520), (760, 400),
]

V_SIGN_ARM = [
    (790, 350), (715, 350), (665, 385), (640, 445),
    (650, 515), (690, 580), (760, 630), (815, 595),
    (835, 525), (805, 445),
]


def clean_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    alpha = alpha.point(lambda value: 0 if value < 8 else value)
    rgba.putalpha(alpha)
    return rgba


def normalize_layer(name: str, axis_fraction: float) -> None:
    image = clean_alpha(Image.open(SOURCE / f"{name}-raw.png"))
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"No visible subject in {name}")
    image = image.crop(bbox)

    scale = SUBJECT_HEIGHT / image.height
    width = round(image.width * scale)
    image = image.resize((width, SUBJECT_HEIGHT), Image.Resampling.LANCZOS)

    stage = Image.new("RGBA", STAGE_SIZE, (0, 0, 0, 0))
    left = round(CHAIR_AXIS_X - width * axis_fraction)
    top = SUBJECT_BOTTOM - SUBJECT_HEIGHT
    stage.alpha_composite(image, (left, top))
    stage.save(OUTPUT / f"hero-hd-{name}.png", optimize=True)


def build_crisp_background() -> None:
    original = Image.open(OUTPUT / "home-2027.png").convert("RGBA")
    plate = Image.open(ROOT / "work" / "generated-interaction" / "clean-plate-raw.png").convert("RGBA")
    plate = plate.resize(STAGE_SIZE, Image.Resampling.LANCZOS)

    mask = Image.new("L", STAGE_SIZE, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(BASE_SUBJECT, fill=255)
    draw.polygon(V_SIGN_ARM, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(10))

    background = Image.composite(plate, original, mask)
    background.save(OUTPUT / "hero-hd-background.png", optimize=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    build_crisp_background()
    for name, axis_fraction in LAYERS.items():
        normalize_layer(name, axis_fraction)


if __name__ == "__main__":
    main()
