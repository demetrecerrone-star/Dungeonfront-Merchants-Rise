#!/usr/bin/env python3
"""Build user-review artwork for Dungeonfront's six-class anime styling pass.

Review only; does NOT place art in app/src/main/assets/sprites and does not
modify or build any Android APK. Matches the existing game animation contract.
"""
from __future__ import annotations

import io
import json
import pathlib
import struct
import subprocess
import zipfile

import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEST = ROOT / "art-previews/anime-style-pass"
CLASSES = ["Knight", "Ranger", "Mage", "Cleric", "Rogue", "Mercenary"]
ACTIONS = {"idle": 8, "walk": 10, "attack": 12, "hurt": 5, "death": 12, "special": 12}
ACCENTS = {"Knight": "#a6c5eb", "Ranger": "#a2ca90", "Mage": "#ae9cfa",
           "Cleric": "#f2dc9d", "Rogue": "#f29aaf", "Mercenary": "#cba077"}
GAME_SIZE = (72, 108)
SOURCE_SIZE = (128, 192)


def svg_for(name: str, action: str) -> bytes:
    if name == "Knight":
        js = ("process.stdout.write(require('./app/src/main/assets/"
              "modern-knight-art.js').svg(process.argv[1]))")
        args = [action]
    else:
        js = ("process.stdout.write(require('./tools/generate_remaining_actor_art.js')"
              ".svg(process.argv[1],process.argv[2]))")
        args = [name, action]
    return subprocess.run(
        ["node", "-e", js, *args], cwd=ROOT,
        check=True, capture_output=True
    ).stdout


def load_font(size: int, bold: bool = False):
    base = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    for family in ["/usr/share/fonts/truetype/dejavu/" + base, base]:
        try:
            return ImageFont.truetype(family, size)
        except OSError:
            pass
    return ImageFont.load_default()


def hex_rgb(h):
    return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))


def render():
    DEST.mkdir(parents=True, exist_ok=True)
    atlas_dir = DEST/"atlases"
    atlas_dir.mkdir(exist_ok=True)
    manifest = {"status": "REVIEW_ONLY_NOT_INSTALLED", "source_frame_size": [128, 192],
                "game_draw_size": [72, 108], "foot_anchor": [64, 191],
                "styles": "anime-inspired detailing layered over existing animation rigs",
                "classes": CLASSES, "actions": ACTIONS, "sheets": {}}
    for name in CLASSES:
        folder = atlas_dir/name.lower()
        folder.mkdir(exist_ok=True)
        for action, count in ACTIONS.items():
            svg = svg_for(name, action)
            expected = (128*count, 192)
            data = cairosvg.svg2png(bytestring=svg, output_width=expected[0],
                                   output_height=expected[1])
            if data[:8] != b"\x89PNG\r\n\x1a\n" or struct.unpack(">II", data[16:24]) != expected:
                raise ValueError(f"{name} / {action}: wrong PNG")
            with Image.open(io.BytesIO(data)) as art:
                if art.mode != "RGBA" or art.getpixel((0, 0))[3] != 0:
                    raise ValueError(f"{name} / {action}: expected transparent RGBA")
                # Keep all artwork inside its own cell after atlas creation.
                if not any(art.crop((i*128,0,(i+1)*128,192)).getbbox() for i in range(count)):
                    raise ValueError(f"{name} / {action}: empty frames")
            output = folder/(action+".png")
            output.write_bytes(data)
            manifest["sheets"][f"{name}/{action}"] = {"frames": count,
                "pixels": list(expected), "bytes": len(data)}
            print(f"{name:<11s} {action:<8s}: {count:>2} frames, {len(data):>8,} bytes")
    manifest["sheet_count"] = len(manifest["sheets"])
    manifest["frame_count"] = len(CLASSES) * sum(ACTIONS.values())
    (DEST/"manifest.json").write_text(json.dumps(manifest, indent=2)+"\n")
    contact_sheet()
    bundle = ROOT/"art-previews/Dungeonfront-Anime-Style-Six-Class-Review.zip"
    with zipfile.ZipFile(bundle, "w", zipfile.ZIP_DEFLATED, compresslevel=7) as z:
        for f in sorted(DEST.rglob("*")):
            if f.is_file():
                z.write(f, "Dungeonfront-Anime-Style-Six-Class-Review/"+str(f.relative_to(DEST)))
    print(f"REVIEW ONLY: {manifest['sheet_count']} transparent atlases, "
          f"{manifest['frame_count']} frames; no APK changes. Zip: {bundle}")


def pick(name, action, idx):
    with Image.open(DEST/"atlases"/name.lower()/(action+".png")) as im:
        im.load()
        return im.crop((idx*128,0,(idx+1)*128,192)).copy()


def contact_sheet():
    w, h = 1830, 1250
    art = Image.new("RGB", (w,h), "#101823")
    d = ImageDraw.Draw(art)
    big, med, sm = load_font(37, True), load_font(19, True), load_font(15)
    d.text((36, 23), "DUNGEONFRONT  /  SIX HEROES", fill="#f3dcaa", font=big)
    d.text((38, 73), "Anime-inspired detail pass   •   actual PNG frames   •   preview only",
           fill="#bdc8d0", font=med)
    d.text((38, 109), "LEFT: enlarged frame  |  MIDDLE: actual 72 x 108 canvas size  |  RIGHT: attack motion",
           fill="#8c9faa", font=sm)
    for i,name in enumerate(CLASSES):
        col=i%3
        row=i//3
        x=32+col*599
        y=148+row*540
        accent=hex_rgb(ACCENTS[name])
        d.rounded_rectangle((x,y,x+575,y+517), radius=13,
                            fill="#202c39", outline=accent, width=2)
        d.rectangle((x+2,y+1,x+573,y+58), fill="#2a3947")
        d.text((x+17,y+11),name.upper(),font=med,fill=accent)
        d.text((x+20,y+70),"ENLARGED SPRITE",font=sm,fill="#b2c6d0")
        d.text((x+291,y+70),"IN-GAME SCALE",font=sm,fill="#b2c6d0")
        main = pick(name, "idle", 0)
        main = main.resize((192,288),Image.Resampling.LANCZOS)
        art.paste(main,(x+18,y+112),main)
        draw_ground(d,x+18,y+407,211)
        miniature=pick(name,"idle",0).resize(GAME_SIZE,Image.Resampling.LANCZOS)
        art.paste(miniature,(x+332,y+198),miniature)
        draw_ground(d,x+294,y+311,142)
        d.text((x+303,y+345),"72 x 108 pixels",font=sm,fill="#f1dfb6")
        d.text((x+18,y+427),"ATTACK IN PROGRESS",font=sm,fill=accent)
        for k,phase in enumerate((0,5,9)):
            attack=pick(name,"attack",phase).resize((72,108),Image.Resampling.LANCZOS)
            art.paste(attack,(x+190+k*112,y+402),attack)
        draw_ground(d,x+181,y+511,359)
    d.text((40,h-39),"VISUAL REVIEW: design not yet approved for the live APK • ",
           font=sm,fill="#f6daaa")
    d.text((583,h-39),"Animation timing, saves and the six-class preview build remain unchanged.",
           font=sm,fill="#b7c8d0")
    out = DEST/"six-class-styling-game-scale.png"
    art.save(out)
    print(f"Screenshot-style actual-size review: {out}")


def draw_ground(d,x,y,width):
    d.line((x,y,x+width,y), fill="#4a6b70", width=2)
    d.line((x+7,y+3,x+width-13,y+3), fill="#203b46", width=2)


if __name__ == "__main__":
    render()
