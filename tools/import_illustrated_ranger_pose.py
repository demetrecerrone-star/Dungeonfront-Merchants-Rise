#!/usr/bin/env python3
"""Import ONE illustrated Ranger source portrait to a transparent review pose.

Expected input is one original full-body Ranger on a flat magenta (#FF00FF)
background with generous margins, facing RIGHT. Never crop a montage.

This tool creates a 512x768 RGBA review frame; never writes directly into the
live APK. It is intentionally a single-frame proof, NOT an invented walk cycle.
Run a separate source-approval and strict animator validation before packing.
"""
from __future__ import annotations
import argparse
import json
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/"art-source/anime-v1/ranger/pose-studies"
TARGET=(512,768)


def extract_rgba(image:Image.Image, background=(255,0,255)):
    rgb=np.asarray(image.convert("RGB"),dtype=np.float32)
    h,w,_=rgb.shape
    if w<400 or h<500:
        raise ValueError("Reference must be at least 400x500 to preserve anime detail")
    color=np.asarray(background,dtype=np.float32)
    # Reference corner samples must actually be uniform chroma-key magenta.
    corners=[rgb[y,x] for y in (0,h-1) for x in (0,w-1)]
    if any(np.linalg.norm(v-color)>45 for v in corners):
        raise ValueError("Source is not flat chromakey at all four corners; reject posters/gradients")
    dist=np.linalg.norm(rgb-color,axis=2)
    magenta=(dist<115)
    # Remove only connected background pixels. Disconnected magenta ornaments
    # inside the costume are not removed.
    import cv2
    labels,n=cv2.connectedComponents((magenta.astype(np.uint8)),connectivity=4)
    border=set(np.unique(np.concatenate([labels[0,:],labels[-1,:],labels[:,0],labels[:,-1]])))
    bg=np.isin(labels,list(border-{0}))
    # Edge antialias softened around the keyed background.
    alpha=np.ones((h,w),dtype=np.float32)
    alpha[bg]=0
    near=dist<165
    # Gradual transition inside the connected component's two-pixel boundary.
    expanded=cv2.dilate(bg.astype(np.uint8),np.ones((3,3),np.uint8),iterations=2).astype(bool)
    soft=expanded&(~bg)&near
    alpha[soft]=np.clip((dist[soft]-35)/130,0,1)
    mask=(alpha>0.25).astype(np.uint8)
    count,labels2,stats,_=cv2.connectedComponentsWithStats(mask,connectivity=8)
    if count<2:
        raise ValueError("No isolated illustrated character found")
    largest=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))
    area=int(stats[largest,cv2.CC_STAT_AREA])
    if area/(w*h)<.03:
        raise ValueError("Detected subject occupies less than 3% of frame")
    subject=(labels2==largest).astype(np.uint8)
    # Include near-body bow details joined by a small bridge; but never
    # preserve unrelated text/panels from the image borders.
    subject=cv2.morphologyEx(subject,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    subject=cv2.dilate(subject,np.ones((7,7),np.uint8),iterations=1).astype(bool)
    alpha=np.where(subject,alpha,0)
    ys,xs=np.nonzero(alpha>.25)
    if len(xs)==0:raise ValueError("No surviving subject")
    x0,x1=int(xs.min()),int(xs.max()+1)
    y0,y1=int(ys.min()),int(ys.max()+1)
    if x0<3 or x1>w-3 or y0<3 or y1>h-3:
        raise ValueError("Source clothing, bow or body touches canvas edge")
    im=np.dstack((rgb.clip(0,255).astype(np.uint8),(alpha*255).astype(np.uint8)))
    return Image.fromarray(im,"RGBA").crop((x0,y0,x1,y1)),{"detected_bbox":[x0,y0,x1,y1],"main_blob_px":area}


def place(frame:Image.Image):
    # Keep the same bottom-center foot baseline and generous sprite margins.
    out=Image.new("RGBA",TARGET,(0,0,0,0))
    target_w,target_h=440,694
    scale=min(target_w/frame.width,target_h/frame.height)
    shape=(max(1,round(frame.width*scale)),max(1,round(frame.height*scale)))
    small=frame.resize(shape,Image.Resampling.LANCZOS)
    left=(TARGET[0]-shape[0])//2
    top=740-shape[1]
    if top<8 or left<8:raise ValueError("Character too large for 512x768 pose source")
    out.alpha_composite(small,(left,top))
    return out,{"pose_size":list(shape),"placement":[left,top],"pivot":[256,740]}


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input",type=Path,required=True)
    ap.add_argument("--pose",choices=("idle","walk","attack"),required=True)
    ap.add_argument("--index",type=int,default=0)
    ap.add_argument("--output-dir",type=Path,default=OUT)
    args=ap.parse_args()
    if not args.input.is_file():
        ap.error("Input PNG doesn't exist")
    with Image.open(args.input) as original:
        if original.format!="PNG":raise ValueError("Source must be PNG")
        source,meta=extract_rgba(original)
    result,placed=place(source)
    args.output_dir.mkdir(parents=True,exist_ok=True)
    output=args.output_dir/f"{args.pose}-{args.index:03}.png"
    result.save(output,optimize=True)
    with Image.open(output) as chk:
        assert chk.mode=="RGBA" and chk.size==TARGET
        assert chk.getpixel((0,0))[3]==0
    sidecar=output.with_suffix(".json")
    sidecar.write_text(json.dumps({"status":"POSE_STUDY_NOT_GAME_ATLAS",
      "action":args.pose,"index":args.index,"source":str(args.input),
      "frame_size":list(TARGET),**meta,**placed},indent=2)+"\n")
    print(f"Saved {output}; single clean source pose only. APK unchanged.")

if __name__=="__main__":
    main()
