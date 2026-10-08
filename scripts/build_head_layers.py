from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "pages" / "hero-motion-poster.png"
GENERATED_CLEAN = ROOT / "work" / "qa" / "hero-clean-generated.png"
PUBLIC_DIR = ROOT / "public" / "pages"
QA_DIR = ROOT / "work" / "qa"
QA_DIR.mkdir(parents=True, exist_ok=True)

# This follows the visible outer silhouette in the 400 x 390 source crop. Keeping
# the cutout deterministic preserves the exact person from the supplied artwork.
HEAD_OUTLINE = [
    (208, 79), (225, 85), (239, 83), (249, 91), (263, 91), (270, 99),
    (286, 101), (290, 111), (302, 117), (294, 128), (306, 137),
    (296, 146), (304, 156), (292, 166), (298, 176), (286, 181),
    (284, 194), (288, 203), (282, 213), (276, 226), (267, 235),
    (256, 244), (244, 249), (236, 257), (232, 270), (221, 276),
    (206, 279), (190, 277), (176, 272), (170, 260), (160, 253),
    (148, 248), (137, 240), (128, 231), (118, 224), (112, 213),
    (109, 201), (111, 188), (106, 179), (110, 169), (102, 160),
    (108, 150), (99, 140), (107, 130), (104, 119), (116, 113),
    (123, 104), (137, 102), (148, 94), (163, 94), (177, 87),
    (192, 88),
]


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    crop_box = (760, 170, 1160, 560)
    crop = image.crop(crop_box).convert("RGB")
    crop.save(QA_DIR / "hero-head-source.png")

    solid_mask = Image.new("L", crop.size, 0)
    ImageDraw.Draw(solid_mask).polygon(HEAD_OUTLINE, fill=255)
    mask = solid_mask.filter(ImageFilter.GaussianBlur(1.15))

    head = crop.convert("RGBA")
    head.putalpha(mask)
    head.save(QA_DIR / "hero-head-cutout-test.png")
    head.save(PUBLIC_DIR / "hero-head-original.png")

    checker = Image.new("RGB", crop.size, "#d9d9d9")
    checker_draw = ImageDraw.Draw(checker)
    tile = 20
    for y in range(0, crop.height, tile):
        for x in range(0, crop.width, tile):
            if (x // tile + y // tile) % 2:
                checker_draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill="#8d5cff")
    checker.paste(head, (0, 0), head)
    checker.save(QA_DIR / "hero-head-cutout-checker.png")

    if not GENERATED_CLEAN.exists():
        raise FileNotFoundError(f"Missing generated cleanup plate: {GENERATED_CLEAN}")

    generated = Image.open(GENERATED_CLEAN).convert("RGB")
    scale_x = 0.309
    scale_y = 0.337
    translate_x = 0.5
    translate_y = -45.0
    aligned_clean = generated.transform(
        crop.size,
        Image.Transform.AFFINE,
        (
            1.0 / scale_x,
            0.0,
            -translate_x / scale_x,
            0.0,
            1.0 / scale_y,
            -translate_y / scale_y,
        ),
        resample=Image.Resampling.BICUBIC,
    )
    aligned_clean.save(QA_DIR / "hero-clean-aligned.png")

    plate_alpha = solid_mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    clean_plate = aligned_clean.convert("RGBA")
    clean_plate.putalpha(plate_alpha)
    clean_plate.save(PUBLIC_DIR / "hero-head-clean-plate.png")

    # Static QA composites: at rest the isolated original head should reproduce
    # the supplied artwork; the second image exposes the reconstructed chair.
    neutral = image.copy()
    neutral.alpha_composite(clean_plate, crop_box[:2])
    neutral.alpha_composite(head, crop_box[:2])
    neutral.crop(crop_box).save(QA_DIR / "hero-layered-neutral-crop.png")
    neutral.convert("RGB").resize((960, 540), Image.Resampling.LANCZOS).save(
        QA_DIR / "hero-layered-neutral.jpg", quality=92
    )

    shifted = image.copy()
    shifted.alpha_composite(clean_plate, crop_box[:2])
    rotated = head.rotate(-3.0, resample=Image.Resampling.BICUBIC, center=(205, 272))
    shifted.alpha_composite(rotated, (crop_box[0] + 9, crop_box[1] - 4))
    shifted.crop(crop_box).save(QA_DIR / "hero-layered-shifted-crop.png")
    shifted.convert("RGB").resize((960, 540), Image.Resampling.LANCZOS).save(
        QA_DIR / "hero-layered-shifted.jpg", quality=92
    )


if __name__ == "__main__":
    main()
