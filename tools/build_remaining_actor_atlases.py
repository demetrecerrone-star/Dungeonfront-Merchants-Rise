#!/usr/bin/env python3
"""Rasterize five directional actor prototypes into transparent PNG action sheets.

Review artifacts only: NEVER silently enable these classes in the stable APK.
Requires Node.js and CairoSVG in the build environment. No runtime SVG decoding.
"""
from __future__ import annotations

import json
import pathlib
import struct
import subprocess
import zipfile

import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "art-previews/remaining-classes-v2"
CLASSES = ("Ranger", "Mage", "Cleric", "Rogue", "Mercenary")
ACTIONS = {"idle": 8, "walk": 10, "attack": 12, "hurt": 5, "death": 12, "special": 12}
COLORS = {"Ranger": "#85b991", "Mage": "#aa91ef", "Cleric": "#edd7a4",
          "Rogue": "#ee8595", "Mercenary": "#d0a079"}

def generate_svg(character: str, action: str) -> bytes:
    code = ("const a=require('./tools/generate_remaining_actor_art.js');"
            "process.stdout.write(a.svg(process.argv[1],process.argv[2]));")
    run = subprocess.run(
        ["node", "-e", code, character, action],
        cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        check=True
    )
    return run.stdout

def bake() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    records = {}
    for name in CLASSES:
        folder = OUT / name.lower()
        folder.mkdir(parents=True, exist_ok=True)
        for action, count in ACTIONS.items():
            svg = generate_svg(name, action)
            if not svg.startswith(b"<svg"):
                raise ValueError(f"{name}/{action} did not produce SVG")
            dest = folder / f"{action}.png"
            cairosvg.svg2png(bytestring=svg, write_to=str(dest),
                             output_width=128 * count, output_height=192)
            data = dest.read_bytes()
            if data[:8] != b"\x89PNG\r\n\x1a\n" or struct.unpack(">II", data[16:24]) != (128*count,192):
                raise ValueError(f"Invalid PNG sheet: {dest}")
            with Image.open(dest) as im:
                if im.mode != "RGBA":
                    raise ValueError(f"Not RGBA: {dest} ({im.mode})")
                if im.getpixel((0, 0))[3] != 0:
                    raise ValueError(f"Opaque background: {dest}")
                if im.getbbox() is None:
                    raise ValueError(f"Empty animation: {dest}")
            records[f"{name}/{action}"] = {"frames": count, "size": [128*count, 192], "bytes": len(data)}
            print(f"{name:10} {action:8} {count:2} frames {len(data):8,} bytes")
    manifest = {
        "status": "production-prototype-review; requires user approval before APK",
        "frame_cell": [128,192], "pivot": [64,191],
        "classes": list(CLASSES), "actions": ACTIONS,
        "files": records, "total_sheets": len(records),
        "total_frames": len(CLASSES)*sum(ACTIONS.values())
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    make_contact_sheet()
    zpath = OUT.parent / "Dungeonfront-Remaining-Five-Class-Animation-Previews.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED, compresslevel=7) as z:
        for path in sorted(OUT.rglob("*")):
            if path.is_file():
                z.write(path, pathlib.Path("Dungeonfront-Remaining-Five-Class-Previews") / path.relative_to(OUT))
    print(f"Completed {len(records)} atlases / {manifest['total_frames']} frames; review ZIP {zpath}")

def make_contact_sheet() -> None:
    width, height = 1260, 780
    img = Image.new("RGB", (width, height), (17,26,36))
    d = ImageDraw.Draw(img)
    d.text((26, 16), "DUNGEONFRONT — FIVE CLASS V2 ANIMATION PREVIEWS", fill=(238,220,173))
    d.text((26, 40), "Actual baked RGBA frames • right-facing source • NOT enabled in the APK", fill=(181,186,189))
    labels = ("idle","walk","attack","hurt","death","special")
    for row, name in enumerate(CLASSES):
        top = 69 + row*140
        d.rectangle((16, top, width-16, top+132), fill=(29,40,49), outline=(69,75,76))
        d.text((26, top+10), name.upper(), fill=COLORS[name])
        for k, action in enumerate(labels):
            x=180 + k*175
            d.text((x, top+9), action.upper(), fill=(223,211,190))
            with Image.open(OUT/name.lower()/f"{action}.png") as sheet:
                index=0 if action=="idle" else (ACTIONS[action]//2)
                frame=sheet.crop((index*128,0,(index+1)*128,192))
                frame.thumbnail((95,110),Image.Resampling.LANCZOS)
                img.paste(frame,(x+24,top+23),frame)
    img.save(OUT/"class-animation-preview.png")

if __name__ == "__main__":
    bake()
