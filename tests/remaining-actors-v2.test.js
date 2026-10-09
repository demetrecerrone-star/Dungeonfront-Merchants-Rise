'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=require('../tools/generate_remaining_actor_art.js');
const names=['Ranger','Mage','Cleric','Rogue','Mercenary'];
const actions={idle:8,walk:10,attack:12,hurt:5,death:12,special:12};
assert.deepEqual(source.classNames,names);
assert.deepEqual(source.counts,actions);
const seen=new Set();
for(const name of names){
 const weapon=source.characters[name].type;
 assert.ok(weapon&&!seen.has(weapon),'each class has its own weapon silhouette');
 seen.add(weapon);
 for(const [action,count] of Object.entries(actions)){
  const svg=source.svg(name,action);
  assert.ok(svg.startsWith('<svg xmlns='));
  assert.ok(svg.includes("width=\""+(128*count)+"\" height=\"192\""));
  const frameStart=(svg.match(/<g transform='translate\(\d+ 0\)'/g)||[]).length;
  assert.equal(frameStart,count,name+' '+action+' frame count');
  assert.ok(svg.includes("url(#cape)")&&svg.includes("url(#metal)"),'detailed material shading');
  assert.ok(svg.includes("translate(64 190)"),'same feet-anchor origin');
  assert.ok(svg.includes(source.characters[name].glow),'class unique signature FX color');
  assert.notEqual(source.characterFrame(name,action,0),source.characterFrame(name,action,count-1),
    'action frame animation must not be a repeated static frame');
  if(action==='walk'||action==='attack'){
   assert.ok(svg.includes('L31 -137')||svg.includes('L34 -132')||svg.includes('L30 -129'), 'head points right');
  }
 }
}
assert.throws(()=>source.svg('Summoner','idle'));
assert.throws(()=>source.svg('Ranger','defend'));
const renderer=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/modern-sprites.js'),'utf8');
const game=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/game.js'),'utf8');
assert.ok(renderer.includes("approvedClasses=new Set(['Knight'])"),'no Ranger or other prototype is enabled');
assert.ok(renderer.includes('let enabled=false'),'modern art still defaults disabled');
assert.ok(game.includes("dungeonfront_merchants_rise_save_v1"),'save key unchanged');
assert.ok(game.includes("c.cls==='Knight'"),'shop remains Knight-only for new render');
assert.ok(game.includes('DFModernSprites.combatFacing'),'existing directional Knight behavior intact');
console.log('PASS '+names.length+' distinct directional v2 character designs, 30 sheets, 295 frames, preview-only safety');
