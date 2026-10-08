from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "pages"
SIZE = (1920, 1080)


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

# The opening pose of 2.mp4 includes the raised V-sign. This narrow shape only
# replaces the pixels occupied by the arm/hand and avoids touching the nearby
# project cards.
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


def make_mask(name: str, extra_shapes: list[tuple[str, tuple | list]]) -> None:
    solid = Image.new("L", SIZE, 0)
    draw = ImageDraw.Draw(solid)
    draw.polygon(BASE_SUBJECT, fill=255)

    for shape, coordinates in extra_shapes:
        if shape == "ellipse":
            draw.ellipse(coordinates, fill=255)
        elif shape == "polygon":
            draw.polygon(coordinates, fill=255)
        else:
            raise ValueError(shape)

    # The edge is deliberately narrow: it hides antialiasing differences while
    # keeping every card and all typography anchored to the base artwork.
    alpha = solid.filter(ImageFilter.GaussianBlur(4))
    rgba = Image.new("RGBA", SIZE, (255, 255, 255, 0))
    rgba.putalpha(alpha)
    rgba.save(OUTPUT / f"hero-mask-{name}.png", optimize=True)


def main() -> None:
    make_mask(
        "top-left",
        [
            ("polygon", V_SIGN_ARM),
        ],
    )
    make_mask("top-right", [])
    make_mask(
        "bottom-left",
        [
            ("polygon", [(735, 530), (640, 565), (530, 625), (500, 690), (535, 755), (620, 785), (760, 750), (850, 670), (820, 585)]),
        ],
    )
    make_mask(
        "bottom-right",
        [
            ("polygon", [(1015, 520), (1160, 545), (1325, 605), (1380, 680), (1350, 760), (1240, 805), (1080, 755), (1000, 685)]),
        ],
    )


if __name__ == "__main__":
    main()
