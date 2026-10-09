'use strict';
/* Offline pixel atlas acceptance: real PNG files, frame grids, transparency
 * and non-identical action frames. Uses Node core only (no npm install). */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const root=path.join(__dirname,'../app/src/main/assets');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'sprites/manifest.json'),'utf8'));
let tested=0;
for(const cls of manifest.classes){
 assert.ok(manifest.actors[cls]);
 for(const action of ['idle','walk','attack']){
  const item=manifest.actors[cls][action];
  const file=path.join(root,item.src);
  assert.ok(fs.existsSync(file),'Missing actual image '+item.src);
  const buf=fs.readFileSync(file);
  assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Invalid PNG '+item.src);
  const w=buf.readUInt32BE(16),h=buf.readUInt32BE(20);
  assert.equal(w,item.frameW*item.frames,'Atlas width incorrect: '+item.src);
  assert.equal(h,item.frameH,'Atlas height incorrect: '+item.src);
  assert.equal(buf[24],4,'Expected 4-bit indexed PNG: '+item.src);
  assert.equal(buf[25],3,'Expected indexed PNG: '+item.src);
  let off=8,images=[],hasTransparent=false,hasSolid=false;
  while(off<buf.length){
   const n=buf.readUInt32BE(off),tag=buf.subarray(off+4,off+8).toString('ascii');
   const bytes=buf.subarray(off+8,off+8+n);
   if(tag==='IDAT')images.push(bytes);
   if(tag==='tRNS')hasTransparent=bytes[0]===0;
   off+=12+n;
  }
  const raw=zlib.inflateSync(Buffer.concat(images));
  assert.equal(raw.length,h*(1+w/2),'Encoded pixel rows have incorrect length: '+item.src);
  assert.ok(hasTransparent,'Sprite background must be transparent: '+item.src);
  const nibbles=[];
  for(let y=0;y<h;y++)for(let x=0;x<w/2;x++){
   const byte=raw[y*(1+w/2)+x+1];nibbles.push(byte>>>4,byte&15);
   if(byte)hasSolid=true;
  }
  assert.ok(hasSolid,'Image contains no painted pixels: '+item.src);
  const frameHashes=[];
  for(let f=0;f<item.frames;f++){
   let hash=2166136261;
   for(let y=0;y<h;y++)for(let x=0;x<item.frameW;x++)hash=Math.imul(hash^nibbles[y*w+f*item.frameW+x],16777619)>>>0;
   frameHashes.push(hash);
  }
  assert.ok(new Set(frameHashes).size>1,'Animation is identical in every frame: '+item.src);
  tested++;
 }
}
assert.equal(tested,18);
const renderer=fs.readFileSync(path.join(root,'sprite-system.js'),'utf8');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(renderer.includes("item.state='missing'"),'Error fallback for missing PNGs');
assert.ok(game.includes('window.DFSprites.draw(g,a,t)'),'Actual game draws the sprites');
assert.ok(html.indexOf('sprite-system.js')<html.indexOf('game.js'),'Sprite loader must load first');
assert.equal(renderer.includes('localStorage.setItem('),false,'Animation frame state should not write save data');
console.log('All '+tested+' sprite sheets validated (PNG, dimensions, transparency, different frames, fallback).');
