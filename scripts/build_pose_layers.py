from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "work" / "generated-interaction"
OUTPUT = ROOT / "public" / "pages"
STAGE_SIZE = (1920, 1080)


# Every generated pose is normalized to the same perceived height and the same
# swivel-chair axis. This is what prevents the character from changing scale
# when the source references have different canvas proportions.
POSES = {
    "neutral": {"height": 700, "axis_fraction": 0.5},
    "top-left": {"height": 700, "axis_fraction": 0.49},
    "top-right": {"height": 700, "axis_fraction": 0.447},
    "bottom-left": {"height": 700, "axis_fraction": 0.612},
    "bottom-right": {"height": 700, "axis_fraction": 0.503},
}
CHAIR_AXIS_X = 960
SUBJECT_BOTTOM_Y = 1010


BASE_SUBJECT = [
    (820, 250),
    (1095, 250),
    (1175, 315),
    (1205, 420),
    (1275, 505),
    (1260, 640),
    (1215, 725),
    (1210, 900),
    (1140, 1015),
    (1040, 1025),
    (960, 930),
    (895, 1015),
    (800, 1015),
    (740, 920),
    (700, 790),
    (695, 650),
    (725, 520),
    (760, 400),
]

V_SIGN_ARM = [
    (790, 350),
    (715, 350),
    (665, 385),
    (640, 445),
    (650, 515),
    (690, 580),
    (760, 630),
    (815, 595),
    (835, 525),
    (805, 445),
]


def clean_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    # The image model can leave nearly invisible pixels across the canvas.
    # Removing them gives the browser a compact, stable sprite boundary.
    alpha = alpha.point(lambda value: 0 if value < 8 else value)
    rgba.putalpha(alpha)
    return rgba


def build_pose(name: str, height: int, axis_fraction: float) -> None:
    pose = clean_alpha(Image.open(SOURCE / f"{name}-raw.png"))
    bbox = pose.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"No visible pixels in {name}")

    pose = pose.crop(bbox)
    scale = height / pose.height
    width = round(pose.width * scale)
    pose = pose.resize((width, height), Image.Resampling.LANCZOS)

    stage = Image.new("RGBA", STAGE_SIZE, (0, 0, 0, 0))
    left = round(CHAIR_AXIS_X - width * axis_fraction)
    top = SUBJECT_BOTTOM_Y - height
    stage.alpha_composite(pose, (left, top))
    stage.save(OUTPUT / f"hero-pose-{name}.png", optimize=True)


def build_video_masks() -> None:
    neutral = Image.open(OUTPUT / "hero-pose-neutral.png").convert("RGBA").getchannel("A")

    for name in POSES:
        if name == "neutral":
            continue
        target = Image.open(OUTPUT / f"hero-pose-{name}.png").convert("RGBA").getchannel("A")
        # The mask covers both the neutral and target silhouettes so every
        # in-between frame from the reference video remains visible. A small
        # dilation and feather protect fast-moving hair and fingertips.
        alpha = ImageChops.lighter(neutral, target)
        alpha = alpha.filter(ImageFilter.MaxFilter(31))
        alpha = alpha.filter(ImageFilter.GaussianBlur(5))
        mask = Image.new("RGBA", STAGE_SIZE, (255, 255, 255, 0))
        mask.putalpha(alpha)
        mask.save(OUTPUT / f"hero-video-mask-{name}.png", optimize=True)


def build_interaction_background() -> None:
    original = Image.open(OUTPUT / "home-2027.png").convert("RGB")
    plate = Image.open(SOURCE / "clean-plate-raw.png").convert("RGB")
    plate = plate.resize(STAGE_SIZE, Image.Resampling.LANCZOS)

    mask = Image.new("L", STAGE_SIZE, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(BASE_SUBJECT, fill=255)
    draw.polygon(V_SIGN_ARM, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(10))

    background = Image.composite(plate, original, mask)
    background.save(OUTPUT / "hero-interaction-background.jpg", quality=94, subsampling=0, optimize=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    build_interaction_background()
    for name, settings in POSES.items():
        build_pose(name, **settings)
    build_video_masks()


if __name__ == "__main__":
    main()
