#!/usr/bin/env python3
"""Review-gated staging for the five missing Dungeonfront v2 actor classes.

Run tools/build_remaining_actor_atlases.py first. This script is DRY-RUN
by default; copying any PNGs into Android assets requires --approved.
It never overwrites the approved Knight or edits gameplay rendering flags.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT/"art-previews/remaining-classes-v2"
TARGET = ROOT/"app/src/main/assets/sprites/actors_v2"
NAMES = ["Ranger","Mage","Cleric","Rogue","Mercenary"]
ACTIONS = {"idle":8,"walk":10,"attack":12,"hurt":5,"death":12,"special":12}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--approved",action="store_true",
                        help="Confirmation: user has reviewed and approved each class visual")
    args=parser.parse_args()
    manifest=SOURCE/"manifest.json"
    if not manifest.exists():
        raise SystemExit("First run: python tools/build_remaining_actor_atlases.py")
    metadata=json.loads(manifest.read_text())
    assert metadata["classes"]==NAMES
    assert metadata["total_sheets"]==30 and metadata["total_frames"]==295
    staged=[]
    for name in NAMES:
        for action,frames in ACTIONS.items():
            original=SOURCE/name.lower()/f"{action}.png"
            if not original.is_file():
                raise SystemExit(f"Missing {original}")
            with Image.open(original) as im:
                if im.mode!="RGBA" or im.size!=(128*frames,192):
                    raise SystemExit(f"Bad RGBA atlas dimensions: {original}")
            dest=TARGET/name.lower()/f"{action}.png"
            staged.append((original,dest))
    if not args.approved:
        print("DRY RUN ONLY: 30 valid PNG atlases found. Nothing copied into APK assets.")
        print("Review every class before using --approved. All existing APKs unchanged.")
        return
    for original,dest in staged:
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(original,dest)
    print(f"Staged {len(staged)} PNG atlases under {TARGET}")
    print("IMPORTANT: Renderer still limits V2 to Knight. Existing APK remains unchanged.")
    print("Next: separately approve each class, update renderer allowlist and shop draw,")
    print("then run game+Android QA before building any signed preview APK.")

if __name__=="__main__":
    main()
