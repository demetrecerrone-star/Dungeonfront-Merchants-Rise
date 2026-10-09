'use strict';
/* Validate shipped 4-bit transparent PNG atlases and the canvas fallback contract.
   Zero external dependencies; runs on every development branch push. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const root=path.join(__dirname,'../app/src/main/assets');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'sprites/manifest.json'),'utf8'));
let tested=0;
function testSheet(item){
 assert.ok(item&&item.src,'Missing atlas metadata');
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
 assert.equal(raw.length,h*(1+Math.ceil(w/2)),'Encoded rows have incorrect length: '+item.src);
 assert.ok(hasTransparent,'PNG needs transparent background: '+item.src);
 const pixels=[];
 for(let y=0;y<h;y++)for(let x=0;x<Math.ceil(w/2);x++){
  const byte=raw[y*(1+Math.ceil(w/2))+x+1];pixels.push(byte>>>4,byte&15);
  if(byte)hasSolid=true;
 }
 assert.ok(hasSolid,'Image contains no painted pixels: '+item.src);
 const signatures=[];
 for(let f=0;f<item.frames;f++){
  let hash=2166136261;
  for(let y=0;y<h;y++)for(let x=0;x<item.frameW;x++)
   hash=Math.imul(hash^pixels[y*w+f*item.frameW+x],16777619)>>>0;
  signatures.push(hash);
 }
 assert.ok(new Set(signatures).size>1,'Animation is identical in every frame: '+item.src);
 tested++;
}
for(const cls of manifest.classes){
 assert.ok(manifest.actors[cls]);
 for(const action of ['idle','walk','attack'])testSheet(manifest.actors[cls][action]);
}
const types=['slime','goblin','skeleton','imp','spider','wraith','hound','guardian','abyssal_sovereign'];
assert.deepEqual(Object.keys(manifest.monsters),types);
for(const type of types){
 const actions=Object.keys(manifest.monsters[type]);
 assert.deepEqual(actions,['idle','walk','attack','hurt','death',...(type==='abyssal_sovereign'?['special']:[])]);
 for(const action of actions)testSheet(manifest.monsters[type][action]);
}
const effects=['slash','heavy_slash','arrow','magic_bolt','healing_pulse','hit_flash','critical','death_burst'];
assert.deepEqual(Object.keys(manifest.effects),effects);
for(const effect of effects)testSheet(manifest.effects[effect]);
assert.equal(tested,72,'18 heroes + 46 monsters + 8 effects');
const renderer=fs.readFileSync(path.join(root,'sprite-system.js'),'utf8');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(renderer.includes("item.state='missing'"),'Missing PNG fallback');
assert.ok(game.includes('window.DFSprites.draw(g,a,t)'),'Hero sprites must be drawn');
assert.ok(game.includes('window.DFSprites.drawMonster(g,m,t)'),'Monster sprites must be drawn');
assert.ok(game.includes('window.DFSprites.drawEffect(g,a.fxType'),'Combat sprite effects must be drawn');
assert.ok(game.includes('if(!rendered&&m.hp>0)drawMonster'),'Monster procedural fallback must remain');
assert.ok(html.indexOf('sprite-system.js')<html.indexOf('game.js'),'Load sprite system before the main game');
assert.equal(renderer.includes('localStorage.setItem('),false,'Visual clock state must not alter saves');
console.log('All '+tested+' PNG sprite sheets validated (grid, animation, transparency, source wiring and fallback).');
