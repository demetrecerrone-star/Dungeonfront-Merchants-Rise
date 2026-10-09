#!/usr/bin/env python3
"""Bake the approved Knight v2 vector frames into small offline RGBA PNG atlases.

This runs on developer/build machines and GitHub Actions BEFORE Gradle bundles
assets. Android WebView then decodes static PNGs, never huge dynamic SVG data URIs.
The original artistic generator remains editable, and the v1 sprite fallback
remains untouched. Requires cairosvg (build tool only; not an Android dependency).
"""
from __future__ import annotations

import pathlib
import struct
import subprocess

import cairosvg

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "app/src/main/assets/sprites/actors_v2/knight"
FRAME_COUNTS = {"idle": 8, "walk": 10, "attack": 12, "hurt": 5, "death": 12, "special": 12}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for action, count in FRAME_COUNTS.items():
        source = subprocess.run(
            ["node", "-e",
             "process.stdout.write(require('./app/src/main/assets/modern-knight-art.js').svg(process.argv[1]))",
             action],
            cwd=ROOT,
            capture_output=True,
            check=True,
        ).stdout
        if not source.startswith(b"<svg"):
            raise RuntimeError(f"Source art did not produce SVG: {action}")
        target = OUT / f"{action}.png"
        cairosvg.svg2png(bytestring=source, write_to=str(target),
                         output_width=128*count, output_height=192)
        data = target.read_bytes()
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            raise RuntimeError(f"Not a PNG: {target}")
        width, height = struct.unpack(">II", data[16:24])
        if (width, height) != (128*count, 192):
            raise RuntimeError(f"Wrong atlas size {action}: {width}x{height}")
        print(f"Baked {action}: {count} frames, {len(data):,} bytes — {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
