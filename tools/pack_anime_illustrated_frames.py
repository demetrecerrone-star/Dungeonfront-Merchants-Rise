#!/usr/bin/env python3
"""Dungeonfront production-grade painted actor frame packing and validation.

Hand-illustrated / generated PNG *frames* go in
  art-source/anime-v1/<class>/<action>/<NNN>.png

Each completed class contains 59 consistent, right-facing RGBA images at
128x192, 256x384, or 512x768. The program validates every source frame,
packs six horizontal 128x192 action atlases into build-only review output,
and NEVER overwrites live game sprites by default. The existing APK is safe.

Artwork posters and contact sheets are NOT compatible animation strips.
This tool intentionally rejects opaque backgrounds and inconsistent sizes.
"""
from __future__ import annotations
import argparse
import hashlib
import io
import json
from pathlib import Path
import sys

from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
CLASSES=("Knight","Ranger","Mage","Cleric","Rogue","Mercenary")
ACTIONS={"idle":8,"walk":10,"attack":12,"hurt":5,"death":12,"special":12}
SUPPORTED_SOURCE_SIZES={(128,192),(256,384),(512,768)}
SOURCE=ROOT/"art-source/anime-v1"
OUT=ROOT/"art-previews/anime-painted-source"

def require_frame(file:Path,sz:tuple[int,int]|None=None)->Image.Image:
    if not file.is_file():
        raise ValueError(f"Missing original frame: {file}")
    with Image.open(file) as opened:
        if opened.format!="PNG" or opened.mode!="RGBA":
            raise ValueError(f"Expected transparent RGBA PNG: {file}")
        if opened.size not in SUPPORTED_SOURCE_SIZES:
            raise ValueError(f"Unexpected frame size {opened.size}: {file}")
        if sz is not None and opened.size!=sz:
            raise ValueError(f"Frame dimensions changed mid-animation: {file}")
        im=opened.copy()
    if im.getbbox() is None:
        raise ValueError(f"Blank character frame: {file}")
    # Prevent the recurring cropped-weapons and accidental opaque-ground bugs.
    alpha=im.getchannel("A")
    w,h=im.size
    if im.getpixel((0,0))[3]!=0 or im.getpixel((w-1,0))[3]!=0:
        raise ValueError(f"Artwork has opaque top corners/background: {file}")
    bbox=alpha.getbbox()
    if bbox is None:
        raise ValueError(f"Empty alpha channel: {file}")
    if bbox[0]<=0 or bbox[2]>=w:
        raise ValueError(f"Character/weapon hits horizontal source-frame edge: {file}")
    if bbox[1]<=0:
        raise ValueError(f"Character/FX hits top frame edge: {file}")
    # Feet can touch final row; the pivot is intentionally the bottom center.
    return im

def pack(name:str,source:Path,output:Path,verbose=True)->dict:
    if name not in CLASSES:
        raise ValueError(f"Not an existing Dungeonfront class: {name}")
    target=output/name.lower()
    target.mkdir(parents=True,exist_ok=True)
    summary={}
    for action,n in ACTIONS.items():
        p=source/name.lower()/action
        if not p.is_dir():
            raise ValueError(f"Missing action directory: {p}")
        expected=[p/f"{k:03}.png" for k in range(n)]
        extra=sorted(x for x in p.glob("*.png") if x not in expected)
        if extra:
            raise ValueError(f"Extra/unindexed frames: {extra[0]}")
        cells=[]
        source_size=None
        for file in expected:
            frame=require_frame(file,source_size)
            source_size=frame.size
            if frame.size!=(128,192):
                frame=frame.resize((128,192),Image.Resampling.LANCZOS)
            cells.append(frame)
        sheet=Image.new("RGBA",(128*n,192),(0,0,0,0))
        for i,frame in enumerate(cells):
            sheet.alpha_composite(frame,(128*i,0))
        target_file=target/f"{action}.png"
        sheet.save(target_file,optimize=True)
        with Image.open(target_file) as check:
            assert check.mode=="RGBA" and check.size==(128*n,192)
        digest=hashlib.sha256(target_file.read_bytes()).hexdigest()
        summary[action]={"frames":n,"source_size":list(source_size),
                         "output_size":[128*n,192],"sha256":digest}
        if verbose:print(f"{name:10s} {action:7s} {n} production image frames, RGBA, PASS")
    return summary

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--class",dest="class_name",choices=CLASSES,
                    help="Validate/package one complete class first")
    ap.add_argument("--source",type=Path,default=SOURCE)
    ap.add_argument("--output",type=Path,default=OUT)
    args=ap.parse_args()
    selected=[args.class_name] if args.class_name else list(CLASSES)
    output=args.output
    output.mkdir(parents=True,exist_ok=True)
    manifest={"purpose":"PREVIEW_ONLY_DO_NOT_SHIP","asset_revision":"anime-painted-v1",
              "classes":selected,"source_cell_allowlist":sorted(map(list,SUPPORTED_SOURCE_SIZES)),
              "output_cell":[128,192],"feet_anchor":[64,191],
              "actions":ACTIONS,"atlases":{}}
    for name in selected:
        manifest["atlases"][name]=pack(name,args.source,output)
    manifest["source_frames"]=len(selected)*sum(ACTIONS.values())
    (output/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    print(f"SUCCESS: {manifest['source_frames']} illustrated frames. No APK edited.")

if __name__=="__main__":
    try:main()
    except (ValueError,AssertionError) as exc:
        print("ANIME SOURCE VALIDATION FAILED: "+str(exc),file=sys.stderr)
        sys.exit(1)
