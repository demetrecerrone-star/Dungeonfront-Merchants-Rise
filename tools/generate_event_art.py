#!/usr/bin/env python3
"""Generate original transparent Dungeonfront event atlases and 16px UI icons.

Deterministic stdlib-only assets, committed by a test-only GitHub workflow.
No image service, Android build, third-party art or external dependencies.
"""
from pathlib import Path
import json
import math
from generate_monster_art import png_indexed, colors

ROOT=Path(__file__).resolve().parents[1]/"app/src/main/assets"
SPRITES=ROOT/"sprites"
EVENTS={"chest":(32,32),"trap":(32,32),"shrine":(32,32),"hidden":(32,32),"merchant":(32,48)}
CLASSES=["knight","ranger","mage","cleric","rogue","mercenary"]
CONDITIONS=["ready","busy","injured","exhausted"]
RARITIES=["uncommon","rare","epic"]

PAL={
 "chest":["#785336","#33282d","#dca653","#ffe0a0","#a76c3d","#f4cf74"],
 "trap":["#735962","#2f3042","#bf7870","#f1cbaa","#a2a3a9","#f8d7ad"],
 "shrine":["#63857c","#264950","#a8d8be","#eff8df","#d4b878","#97e3d0"],
 "hidden":["#715f87","#30334e","#ae94cc","#e0cbfa","#9e7ac7","#e1b7ff"],
 "merchant":["#726b57","#343d40","#b08b60","#ddc7a1","#92a897","#f8da94"],
}
ICON_COLORS={
 "knight":["#657f9a","#283b59","#c1d4e0","#f7deb6","#dabf73","#efeee0"],
 "ranger":["#648a65","#354b38","#c3dc98","#e2cca8","#b69b5c","#f0e1ba"],
 "mage":["#735c9e","#382c59","#c3aff1","#e7d8ff","#aa8be7","#f0e5ff"],
 "cleric":["#a7986f","#67593c","#e6d9a5","#f9ecd6","#edc76f","#fff7de"],
 "rogue":["#566c7b","#293a47","#a2b5c5","#e4d1b3","#c76b89","#e5e6eb"],
 "mercenary":["#896c53","#4a4039","#c2ab82","#e3c7a5","#e29a62","#f6e7c2"],
 "ready":["#527d60","#224934","#95cf89","#d7f4c0","#a4d987","#e9ffd8"],
 "busy":["#5a7689","#294454","#b4d6eb","#e2f2fb","#a8bdd1","#fafaff"],
 "injured":["#99595f","#522b39","#e68f8b","#ffd9d3","#cf6b6b","#fff1e8"],
 "exhausted":["#857354","#463e30","#e4bc72","#fff0c2","#cf9f64","#fff8e7"],
 "uncommon":["#4d865e","#224835","#9bd7a3","#e9ffdb","#7ccf93","#f5ffed"],
 "rare":["#4f77a8","#293e69","#9cbeed","#e3f0ff","#7da6f0","#f9fbff"],
 "epic":["#8c638f","#482b59","#dfb0d4","#ffe4ee","#e9ae6e","#fff7e2"],
}
class Atlas:
 def __init__(self,w,h,frames,palette):
  self.w,self.h,self.n=w,h,frames
  self.p=bytearray(w*h*frames)
  self.palette=colors(*palette)
  self.frame=0
 def select(self,f):self.frame=f
 def rect(self,x,y,w,h,k):
  xa,xb=max(0,int(round(x))),min(self.w,int(round(x+w)))
  ya,yb=max(0,int(round(y))),min(self.h,int(round(y+h)))
  for Y in range(ya,yb):
   row=Y*self.w*self.n+self.frame*self.w
   for X in range(xa,xb):self.p[row+X]=k
 def line(self,x,y,X,Y,k,th=1):
  count=max(1,int(max(abs(X-x),abs(Y-y))*2))
  for i in range(count+1):
   t=i/count;self.rect(x+(X-x)*t,y+(Y-y)*t,th,th,k)
 def bordered(self,x,y,w,h,k,edge=1):
  self.rect(x-edge,y-edge,w+2*edge,h+2*edge,1)
  self.rect(x,y,w,h,k)
 def save(self,dest):
  dest.parent.mkdir(parents=True,exist_ok=True)
  dest.write_bytes(png_indexed(self.p,self.w*self.n,self.h,self.palette))

def event_sprite(kind,action):
 w,h=EVENTS[kind];n=4 if action=="idle" else 6
 a=Atlas(w,h,n,PAL[kind]);R=a.rect;L=a.line;B=a.bordered
 for f in range(n):
  a.select(f);t=f/(n-1);pulse=f%4
  anim=action=="activate"
  R(4,h-3,24,2,1)
  if kind=="chest":
   # Gold fittings, latch, and hinged lid lifting on activation.
   B(6,19,20,10,2);R(8,20,16,7,4);R(8,21,16,2,3)
   R(8,20,2,9,5);R(22,20,2,9,5)
   R(14,21,4,5,6);R(15,22,2,2,3)
   lid=16-round(t*11) if anim else 16-(1 if pulse==2 else 0)
   B(6,lid,20,4,4);R(8,lid,16,2,3);R(12,lid-1,8,2,5)
   if anim and f>=2:
    for i in range(4):R(11+i*3,13-(i%2)*3-(f%3),2,2,6)
  elif kind=="trap":
   B(5,25,22,5,2);R(8,25,16,3,4);R(13,26,7,2,5)
   extended=round(t*12) if anim else (1 if pulse==2 else 0)
   for x in (8,14,20,26):
    top=25-extended
    if extended>2:
     L(x,25,x,top+2,5,2);L(x-2,top+5,x,top,3,2);L(x+2,top+5,x,top,3,2)
    else:R(x,23,2,2,3)
  elif kind=="shrine":
   B(10,13,12,15,2);R(12,14,8,11,3);R(8,27,16,3,4)
   B(8,11,16,4,4);R(12,7,8,5,3)
   shine=(round(t*5) if anim else pulse%3)
   R(14,15-shine,4,8,6);R(12,18-shine,8,2,5)
   R(7,9-(shine%3),2,2,6);R(24,12+(shine%2),2,2,6)
   if anim and f>1:R(14,4,4,4,6)
  elif kind=="hidden":
   # The rune-stamped sealed doorway reveals a dark room.
   B(5,5,22,25,2);R(7,7,18,22,3)
   gap=round(t*8) if anim else 0
   R(16-gap,8,2,19,1);R(18-gap,8,5,18,2)
   R(8,8,8-gap,18,4);R(23-gap,8,3+gap,18,4)
   R(13-gap,12,6,2,6);R(15-gap,10,2,6,6)
   R(13-gap,18,6,2,5)
   if anim and f>2:R(17,11,5,14,1);R(20,14,2,3,6)
  elif kind=="merchant":
   # Hooded trader, backpack and glowing lantern.
   bob=round(math.sin(f*math.pi/2)) if not anim else -round(t*3)
   B(9,18+bob,17,21,2);R(11,20+bob,13,16,3)
   B(11,9+bob,14,13,2);R(13,12+bob,10,7,4)
   R(14,14+bob,3,2,1);R(21,14+bob,2,2,1)
   R(7,21+bob,4,14,5);R(6,24+bob,3,8,4)
   R(12,38,5,7,1);R(21,38,5,7,1);R(11,44,7,2,2);R(21,44,6,2,2)
   L(26,26+bob,29,22+bob,5,2)
   B(26,24+bob,5,9,4);R(27,26+bob,3,5,6)
   if anim and f>=2:R(25,19+bob,6,5,6);R(28,16+bob,3,3,5)
 return a

def icon_sprite(kind):
 a=Atlas(16,16,1,ICON_COLORS[kind]);R=a.rect;L=a.line;B=a.bordered
 if kind=="knight":
  B(4,4,8,8,3);R(5,6,6,3,2);R(7,8,3,2,4);R(3,11,10,3,2);R(1,6,3,8,5)
 elif kind=="ranger":
  R(3,3,10,4,2);R(4,7,8,5,3);R(6,9,5,2,1)
  L(12,2,12,14,5);L(12,2,14,8,4);L(14,8,12,14,4);L(5,8,15,8,6)
 elif kind=="mage":
  B(5,5,6,8,2);R(6,7,4,5,3);R(3,11,10,3,4);R(7,3,3,3,5)
  R(12,2,2,8,5);R(12,1,3,3,6)
 elif kind=="cleric":
  B(5,5,7,9,2);R(7,2,3,10,4);R(4,6,10,3,5);R(6,12,6,2,3)
 elif kind=="rogue":
  B(3,4,10,9,2);R(5,6,8,4,3);R(5,8,3,2,1);R(11,8,2,2,1)
  L(11,15,15,7,5);L(3,15,1,7,4)
 elif kind=="mercenary":
  B(4,4,9,9,2);R(6,5,5,3,3);R(5,11,8,3,4);L(13,1,13,14,5,2);R(11,1,5,5,6)
 elif kind=="ready":
  B(2,2,12,12,2);L(4,8,7,11,6,2);L(7,11,12,4,6,2)
 elif kind=="busy":
  B(3,2,10,12,2);R(5,4,6,2,4);R(5,9,6,2,4);L(5,5,10,10,5)
 elif kind=="injured":
  B(2,2,12,12,2);R(7,4,3,9,6);R(4,7,9,3,6)
 elif kind=="exhausted":
  B(3,2,10,12,2);R(5,6,3,2,4);R(10,6,2,2,4);R(5,10,7,2,1)
 elif kind in RARITIES:
  B(6,1,4,13,2);L(2,7,8,2,4,2);L(8,2,13,7,4,2)
  L(13,7,8,14,6,2);L(8,14,2,7,6,2)
  R(7,6,3,3,5)
  if kind=="epic":R(7,1,3,2,6);R(1,7,3,2,6);R(13,7,2,2,6)
 return a

def main():
 manifest_file=SPRITES/"manifest.json"
 manifest=json.loads(manifest_file.read_text())
 manifest["events"]={}
 for kind,(w,h) in EVENTS.items():
  manifest["events"][kind]={}
  for action,frames in (("idle",4),("activate",6)):
   rel=f"sprites/events/{kind}/{action}.png"
   event_sprite(kind,action).save(ROOT/rel)
   manifest["events"][kind][action]={"src":rel,"frameW":w,"frameH":h,
     "frames":frames,"fps":5 if action=="idle" else 12,"loop":action=="idle"}
 manifest["ui"]={"classes":{},"condition":{},"rarity":{}}
 for category,items in (("classes",CLASSES),("condition",CONDITIONS),("rarity",RARITIES)):
  for name in items:
   rel=f"sprites/ui/{category}/{name}.png"
   icon_sprite(name).save(ROOT/rel)
   manifest["ui"][category][name]={"src":rel,"frameW":16,"frameH":16,"frames":1,"fps":1,"loop":False}
 manifest_file.write_text(json.dumps(manifest,indent=2)+"\n")
 print("Generated 10 event animation sheets and 13 status/class/rarity icons; updated sprite manifest.")
if __name__=="__main__":main()
