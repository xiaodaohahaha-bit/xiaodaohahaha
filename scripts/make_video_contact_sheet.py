from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


def contact_sheet(images: list[Image.Image], columns: int, size: tuple[int, int], labels: list[str]) -> Image.Image:
    rows = (len(images) + columns - 1) // columns
    cell_width, cell_height = size
    sheet = Image.new("RGB", (columns * cell_width, rows * (cell_height + 26)), "#111111")
    draw = ImageDraw.Draw(sheet)
    for index, image in enumerate(images):
        x = (index % columns) * cell_width
        y = (index // columns) * (cell_height + 26)
        sheet.paste(image.resize(size, Image.Resampling.LANCZOS), (x, y))
        draw.text((x + 6, y + cell_height + 5), labels[index], fill="white")
    return sheet


def main() -> None:
    directory = Path(sys.argv[1]).resolve()
    files = sorted(directory.glob("frame-*.png"))
    if not files:
        raise FileNotFoundError(f"No frames in {directory}")

    frames = [Image.open(file).convert("RGB") for file in files]
    labels = [file.stem.removeprefix("frame-") for file in files]
    contact_sheet(frames, 4, (480, 270), labels).save(directory / "contact-sheet.jpg", quality=90)

    # The source is 3840 x 2160. This crop isolates hair, face, neck and the
    # immediately adjacent chair so we can distinguish actual head motion from
    # background deformation.
    head_box = (1500, 430, 2340, 1160)
    head_frames = [frame.crop(head_box) for frame in frames]
    contact_sheet(head_frames, 5, (336, 292), labels).save(directory / "head-contact-sheet.jpg", quality=92)

    first = np.asarray(frames[0], dtype=np.int16)
    previous = first
    metrics = []
    for file, frame in zip(files, frames):
        array = np.asarray(frame, dtype=np.int16)
        absolute = np.abs(array - first)
        sequential = np.abs(array - previous)
        changed = np.max(absolute, axis=2) > 12
        if changed.any():
            ys, xs = np.where(changed)
            box = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
        else:
            box = None
        metrics.append(
            {
                "file": file.name,
                "mean_abs_from_first": float(absolute.mean()),
                "mean_abs_from_previous": float(sequential.mean()),
                "changed_box_gt12": box,
            }
        )
        previous = array

    (directory / "diff-metrics.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metrics, ensure_ascii=False))


if __name__ == "__main__":
    main()
