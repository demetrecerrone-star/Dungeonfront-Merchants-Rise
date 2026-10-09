#!/usr/bin/env python3
"""Generate Dungeonfront's original 4-bit indexed monster and effect PNG atlases.
Pure Python standard library; repeatable, offline and safe to regenerate.
Each horizontal PNG contains uniquely posed transparent pixel-art animation frames.
"""
import json
import math
import struct
import zlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]/"app/src/main/assets"
OUT=ROOT/"sprites"
MONSTERS={
    "slime":(32,["#476f6b","#23464a","#91d9b4","#c6fbe0","#87a6aa","#dcefdb"]),
    "goblin":(32,["#678448","#304d38","#9bbf6f","#e0d8a3","#a16c47","#ebe1b9"]),
    "skeleton":(32,["#b2ab95","#59574c","#f1e5c5","#d5c7a0","#81634d","#f4d9a2"]),
    "imp":(32,["#bf6448","#663848","#eb9b60","#ffd4a1","#f4bd55","#ffedc0"]),
    "spider":(32,["#6d577f","#2b293f","#baa0bc","#d8c1e0","#d85c80","#faafd0"]),
    "wraith":(32,["#6a889c","#293e60","#b0cbdc","#e5f3f5","#8e6be5","#c9b1fc"]),
    "hound":(32,["#85575f","#432e40","#bc8383","#e3b4a4","#de6970","#f4bfb7"]),
    "guardian":(48,["#7d7699","#343547","#b1a8be","#e0d2d8","#b46c9a","#f4d0f0"]),
    "abyssal_sovereign":(80,["#653d5e","#171c35","#b06a9c","#efb5cb","#d45776","#f6d8e7"]),
}
MON_ACTIONS={"idle":4,"walk":6,"attack":6,"hurt":2,"death":6,"special":6}
FX={
    "slash":(32,32,4),"heavy_slash":(48,48,5),"arrow":(32,16,4),
    "magic_bolt":(32,32,6),"healing_pulse":(48,48,6),
    "hit_flash":(32,32,3),"critical":(48,48,5),"death_burst":(48,48,6)
}

def colors(*special):
    x=["#000000","#15141f",*special,"#322b37","#ffffff","#394552",
       "#dac9b5","#7b4a57","#d7dfda","#ad81cf","#f6d28f","#56485d"]
    return [v.lstrip("#") for v in (x[:16]+["#b9b4ae"]*16)[:16]]
def chunk(kind,data):
    kind=kind.encode("ascii")
    return struct.pack(">I",len(data))+kind+data+struct.pack(">I",zlib.crc32(kind+data)&0xffffffff)
def png_indexed(buf,width,height,palette):
    raw=bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(0,width,2):
            a=buf[y*width+x]
            b=buf[y*width+x+1] if x+1<width else 0
            raw.append((a<<4)|b)
    plte=bytes.fromhex("".join(palette))
    return (b"\x89PNG\r\n\x1a\n"
       +chunk("IHDR",struct.pack(">IIBBBBB",width,height,4,3,0,0,0))
       +chunk("PLTE",plte)
       +chunk("tRNS",bytes([0]+[255]*15))
       +chunk("IDAT",zlib.compress(raw,9))
       +chunk("IEND",b""))

class Sheet:
    def __init__(self,size,height,frames,palette):
        self.size=size;self.height=height;self.frames=frames;self.f=0
        self.pixels=bytearray(size*height*frames);self.palette=palette
        self.unit=size/40
    def frame(self,n):self.f=n
    def rect(self,x,y,w,h,c):
        unit=self.unit
        xa=max(0,round(x*unit));xb=min(self.size,round((x+w)*unit))
        ya=max(0,round(y*unit));yb=min(self.height,round((y+h)*unit))
        for yy in range(ya,yb):
            off=yy*self.size*self.frames+self.f*self.size
            for xx in range(xa,xb):
                self.pixels[off+xx]=c
    def line(self,x,y,X,Y,c,width=1):
        steps=max(1,round(max(abs(X-x),abs(Y-y))*2))
        for i in range(steps+1):
            t=i/steps
            self.rect(round(x+(X-x)*t),round(y+(Y-y)*t),width,width,c)
    def block(self,x,y,w,h,c,edge=1):
        self.rect(x-edge,y-edge,w+edge*2,h+edge*2,1)
        self.rect(x,y,w,h,c)
    def export(self):
        return png_indexed(self.pixels,self.size*self.frames,self.height,self.palette)

def monster_sheet(kind,size,palette,action,n):
    p=Sheet(size,size,n,palette);R=p.rect;L=p.line;B=p.block
    for f in range(n):
        p.frame(f);t=f/(n-1) if n>1 else 0
        walk=action=="walk";fight=action in ("attack","special");hurt=action=="hurt";dead=action=="death"
        bob=([-1,0,1,0,-1,0][f%6] if walk else (-1 if f%2 else 0))
        lunge=round(math.sin(math.pi*t)*4) if fight else 0
        factor=max(.16,1-.87*t) if dead else 1
        def X(v):return v+lunge
        def Y(v):return 38-(38-v)*factor+(0 if dead else bob)
        R(8,38,24,2,8) # consistent ground contact shadow
        if dead and f==n-1:
            R(9,37,23,2,3);R(13,35,14,2,4)
            continue
        if kind=="slime":
            squash=3*t if fight else 0
            B(X(8),Y(23+squash),24,13-squash,2,2)
            R(X(11),Y(21+squash),18,5,4);R(X(13),Y(20+squash),12,3,2)
            R(X(15),Y(25),7,5,3);R(X(14),Y(29),3,3,5);R(X(24),Y(29),3,3,5)
            R(X(10),Y(34),6,2,6);R(X(26),Y(34),5,2,6)
            if fight:R(X(6),Y(29),4,5,4);R(X(31),Y(30),5,4,4)
        elif kind=="goblin":
            B(X(13),Y(19),15,16,2);R(X(15),Y(20),10,12,3);R(X(17),Y(24),9,6,4)
            B(X(12),Y(9),16,13,3);R(X(11),Y(14),4,5,2);R(X(26),Y(14),6,4,2)
            R(X(16),Y(15),4,3,10);R(X(23),Y(15),3,3,10)
            R(X(14),Y(34),5,5,2);R(X(23),Y(34),5,5,2);R(X(13),Y(34),7,2,7)
            L(X(31),Y(8),X(31)+round(t*5 if fight else 0),Y(36),5,2);R(X(29),Y(7),5,5,6)
            R(X(8),Y(23),5,8,3)
        elif kind=="skeleton":
            B(X(13),Y(8),15,11,4);R(X(16),Y(11),4,4,1);R(X(24),Y(11),3,4,1)
            R(X(19),Y(17),5,3,2);R(X(19),Y(20),4,14,3);R(X(13),Y(23),15,3,4)
            R(X(15),Y(27),11,2,3);R(X(15),Y(31),10,2,4)
            L(X(15),Y(22),X(10),Y(32),4,2);L(X(28),Y(22),X(33),Y(30),4,2)
            L(X(17),Y(34),X(14),Y(38),3,2);L(X(25),Y(34),X(27),Y(38),3,2)
            L(X(34),Y(15)-(round(t*6) if fight else 0),X(34),Y(34),5,2);R(X(30),Y(29),9,2,4)
        elif kind=="imp":
            B(X(13),Y(16),15,19,2);R(X(17),Y(18),9,12,3);B(X(14),Y(9),13,13,2)
            R(X(18),Y(15),4,3,6);R(X(23),Y(15),4,3,6)
            L(X(14),Y(11),X(10),Y(3),3,3);L(X(26),Y(11),X(30),Y(3),3,3)
            L(X(16),Y(21),X(4),Y(15),2,3);L(X(26),Y(21),X(36),Y(14),2,3)
            R(X(6),Y(12),5,4,4);R(X(31),Y(12),4,4,4)
            R(X(15),Y(34),5,4,2);R(X(24),Y(34),5,4,2)
            if fight:R(X(2),Y(12),5,6,6);R(X(34),Y(12),4,5,6)
        elif kind=="spider":
            for i in range(4):
                dy=17+i*5
                L(X(17),Y(24),X(6-i),Y(dy),2,2);L(X(6-i),Y(dy),X(2),Y(dy+8),3,2)
                L(X(24),Y(24),X(34+i),Y(dy),2,2);L(X(34+i),Y(dy),X(38),Y(dy+8),3,2)
            B(X(10),Y(20),21,14,2);R(X(12),Y(22),17,10,3);R(X(14),Y(24),6,3,4)
            R(X(16),Y(23),2,3,6);B(X(8),Y(17),9,8,4);R(X(10),Y(19),3,3,6);R(X(15),Y(19),3,3,6)
            if fight:R(X(7),Y(27),3,7,5);R(X(16),Y(28),3,6,5)
        elif kind=="wraith":
            B(X(11),Y(15),19,21,2);R(X(14),Y(18),12,13,3);R(X(12),Y(31),6,6,4);R(X(24),Y(32),6,5,4)
            B(X(13),Y(5),16,16,2);R(X(16),Y(10),12,8,3);R(X(19),Y(12),3,5,1);R(X(25),Y(12),3,5,1)
            L(X(12),Y(21),X(4),Y(30),4,4);L(X(29),Y(20),X(35),Y(30),4,4)
            R(X(18),Y(35),4,3,6);R(X(27),Y(35),3,2,6)
            if fight:R(X(2),Y(20),5,5,6);R(X(35),Y(19),4,8,6)
        elif kind=="hound":
            B(X(9),Y(22),22,13,2);R(X(11),Y(23),17,8,3)
            R(X(14),Y(33),5,6,2);R(X(26),Y(33),5,6,2)
            B(X(25),Y(16),13,13,2);R(X(32),Y(21),8,5,4);R(X(27),Y(21),3,3,6);R(X(35),Y(24),4,3,8)
            L(X(27),Y(17),X(25),Y(8),4,3);L(X(34),Y(17),X(37),Y(9),4,3)
            L(X(11),Y(23),X(4),Y(17),2,3);L(X(4),Y(17),X(2),Y(10),4,2)
            R(X(10),Y(32),4,6,1);R(X(28),Y(32),4,6,1)
            if fight:R(X(37),Y(23),4,2,6);R(X(35),Y(26),4,2,6)
        elif kind=="guardian":
            B(X(10),Y(16),21,19,2,2);R(X(11),Y(19),19,12,3);R(X(12),Y(20),7,3,4)
            R(X(24),Y(20),5,3,4);B(X(13),Y(5),16,13,4);R(X(16),Y(8),10,5,2)
            R(X(18),Y(13),6,3,1);R(X(18),Y(15),4,2,6)
            R(X(8),Y(19),6,9,3);R(X(30),Y(19),7,11,3)
            R(X(13),Y(33),7,7,2);R(X(25),Y(33),7,7,2);R(X(13),Y(31),17,3,5)
            R(X(2),Y(22),10,13,4);R(X(4),Y(23),6,9,3);R(X(2),Y(30),9,3,6)
            L(X(35),Y(4)-(round(t*4) if fight else 0),X(35),Y(38),7,3)
            R(X(33),Y(4)-(round(t*4) if fight else 0),5,11,4)
        elif kind=="abyssal_sovereign":
            B(X(9),Y(15),23,21,2,2);R(X(12),Y(17),17,16,3);R(X(15),Y(22),12,9,5)
            B(X(12),Y(6),18,13,2);R(X(14),Y(9),14,8,3)
            R(X(17),Y(13),3,3,6);R(X(25),Y(13),3,3,6)
            L(X(13),Y(7),X(7),Y(0),6,3);L(X(28),Y(7),X(34),Y(0),6,3)
            R(X(15),Y(4),5,4,4);R(X(23),Y(4),5,4,4);R(X(19),Y(1),4,7,6)
            L(X(11),Y(19),X(1),Y(10),2,4);L(X(31),Y(19),X(39),Y(10),2,4)
            B(X(5),Y(18),9,12,3);B(X(30),Y(18),9,12,3)
            R(X(10),Y(34),10,6,2);R(X(23),Y(34),10,6,2);R(X(17),Y(33),10,2,5)
            off=round(t*7) if fight else 0
            L(X(36),Y(3)-off,X(36),Y(38),8,3);R(X(32),Y(3)-off,8,15,4);R(X(34),Y(5)-off,5,8,6)
            if fight:
                for i in range(7):
                    ang=(i/7+t)*math.tau;rad=15+8*t
                    R(20+round(math.cos(ang)*rad),20+round(math.sin(ang)*rad),3,3,6 if i%2 else 4)
                if f>2:L(1,20,39,20,6,2);L(4,14,35,28,4,2)
        if hurt and f%2==0:
            R(12,Y(19),4,2,6);R(26,Y(25),4,2,6)
    return p.export()

def fx_sheet(kind,width,height,n):
    # Effects use real atlas pixels in world-space, not CSS rotations.
    p=Sheet(width,height,n,colors("#e5bd6c","#5f4979","#f1cf8f","#ffffff","#ffad6b","#f7e1ac"))
    # Use direct pixel locations, to accommodate the 32x16 arrow sprite.
    def dot(f,x,y,w,h,c):
        for yy in range(max(0,round(y)),min(height,round(y+h))):
            for xx in range(max(0,round(x)),min(width,round(x+w))):
                p.pixels[yy*width*n+f*width+xx]=c
    def line(f,x,y,X,Y,c,thick=1):
        steps=max(1,round(max(abs(X-x),abs(Y-y))*2))
        for i in range(steps+1):
            t=i/steps
            dot(f,x+(X-x)*t,y+(Y-y)*t,thick,thick,c)
    for f in range(n):
        t=f/(n-1) if n>1 else 0;cx=width/2;cy=height/2;radius=width*.4
        if kind in ("slash","heavy_slash"):
            r=radius*(.6+.4*t)
            for i in range(13):
                a=-.95+t*1.4+i*.16
                dot(f,cx+math.cos(a)*r,cy+math.sin(a)*r,4 if kind=="heavy_slash" else 2,2,4 if i%2 else 6)
            for i in range(4):
                a=-.7+t*1.4+i*.27
                dot(f,cx+math.cos(a)*(r-4),cy+math.sin(a)*(r-4),2,2,8)
        elif kind=="arrow":
            pos=round((t-.5)*width*.6)
            line(f,cx-12+pos,cy,cx+11+pos,cy,4,2)
            line(f,cx+9+pos,cy-3,cx+12+pos,cy,6)
            line(f,cx+9+pos,cy+3,cx+12+pos,cy,6)
        elif kind=="magic_bolt":
            r=3+round(7*math.sin(math.pi*t))
            dot(f,cx-r,cy-r,2*r,2*r,4);dot(f,cx-3,cy-3,6,6,6)
            for i in range(5):
                a=i*1.25+t*3
                dot(f,cx+math.cos(a)*(r+3),cy+math.sin(a)*(r+3),2,2,5)
        elif kind=="healing_pulse":
            r=round(radius*t)
            for i in range(16):
                a=i*math.pi/8
                dot(f,cx+math.cos(a)*r,cy+math.sin(a)*r,2,2,4 if i%3 else 6)
            line(f,cx,cy-8,cx,cy+8,6,2);line(f,cx-8,cy,cx+8,cy,6,2)
        elif kind=="hit_flash":
            dot(f,cx-7-t*4,cy-2,14+t*8,4,4);dot(f,cx-2,cy-7-t*4,4,14+t*8,6)
        elif kind=="critical":
            for i in range(8):
                a=i*math.pi/4
                line(f,cx+math.cos(a)*3,cy+math.sin(a)*3,
                     cx+math.cos(a)*radius*(.5+t*.5),cy+math.sin(a)*radius*(.5+t*.5),4 if i%2 else 6,2)
        elif kind=="death_burst":
            for i in range(20):
                a=i*2.4;dist=radius*t*((i%4)+2)/5
                dot(f,cx+math.cos(a)*dist,cy+math.sin(a)*dist,2+(i%2),2+(i%2),4 if i%3 else 6)
    return p.export()

def main():
    manifest_path=OUT/"manifest.json"
    manifest=json.loads(manifest_path.read_text())
    manifest["monsters"]={};manifest["effects"]={}
    count=0
    for name,(size,primary) in MONSTERS.items():
        manifest["monsters"][name]={}
        for action,n in MON_ACTIONS.items():
            if action=="special" and name!="abyssal_sovereign":continue
            rel=f"sprites/monsters/{name}/{action}.png"
            target=ROOT/rel;target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(monster_sheet(name,size,colors(*primary),action,n))
            manifest["monsters"][name][action]={"src":rel,"frameW":size,"frameH":size,"frames":n,
                "fps":5 if action=="idle" else 9 if action=="walk" else 10 if action=="death" else 12,
                "loop":action in ("idle","walk")}
            count+=1
    for name,(w,h,n) in FX.items():
        rel=f"sprites/effects/{name}.png";target=ROOT/rel
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(fx_sheet(name,w,h,n))
        manifest["effects"][name]={"src":rel,"frameW":w,"frameH":h,"frames":n,"fps":12,"loop":False}
        count+=1
    manifest_path.write_text(json.dumps(manifest,indent=2)+"\n")
    print(f"Generated {count} PNG sheets: 46 monster/boss and 8 combat effects, including manifest.")
if __name__=="__main__":main()
