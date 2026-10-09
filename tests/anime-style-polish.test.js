'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=require('../tools/generate_remaining_actor_art.js');
const details=require('../tools/anime-style-details.js');
const Knight=require('../app/src/main/assets/modern-knight-art.js');
const names=['Knight','Ranger','Mage','Cleric','Rogue','Mercenary'];
const actions={idle:8,walk:10,attack:12,hurt:5,death:12,special:12};
assert.equal(details.VERSION,'anime-polish-1');
assert.deepEqual(source.counts,actions);
for(const name of names){
 for(const [action,frames] of Object.entries(actions)){
  const svg=name==='Knight'?Knight.svg(action):source.svg(name,action);
  assert.ok(svg.startsWith('<svg xmlns='),name+' '+action+' valid source');
  assert.ok(svg.includes('width="'+128*frames+'" height="192"'),name+' '+action+' atlas dimensions');
  assert.equal((svg.match(/<g transform=['"]translate\(\d+ 0\)['"]/g)||[]).length,
    frames,name+' '+action+' frame count');
  if(name==='Knight'){
   assert.ok(svg.includes('Anime-fantasy polish'), 'approved Knight gets richer plates without changing poses');
  }else{
   assert.ok(svg.includes('class="'+name.toLowerCase()+'-detail"'),
     name+' still has its own distinctive anime visual layers');
   assert.ok(svg.includes('translate(64 190)'),'feet registration unchanged');
   assert.ok(svg.includes(details.COLORS[name].jewel),'class signature accent is present');
  }
 }
}
assert.throws(()=>details.detail('Ranger',source.characters.Ranger,'walk',40,10),'frame bounds validated');
assert.equal(details.detail('Unknown',{},'idle',0,8),'','unknown classes no overlays');
const root=path.join(__dirname,'../app/src/main/assets');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const renderer=fs.readFileSync(path.join(root,'modern-sprites.js'),'utf8');
const gradle=fs.readFileSync(path.join(__dirname,'../app/build.gradle'),'utf8');
assert.ok(renderer.includes('let enabled=false'),'modern renderer stays off at startup');
assert.ok(renderer.includes('approvedClasses=new Set(classes)'),'existing six-class preview remains opt-in');
assert.ok(game.includes('DFModernSprites.combatFacing'),'walk/attack direction safety preserved');
assert.ok(renderer.includes("if(['retreating','returning'].includes(a.status))return 'walk'"),
  'zero-HP wounded adventurer still retreats standing');
assert.ok(game.includes('dungeonfront_merchants_rise_save_v1'),'save key unchanged');
assert.ok(gradle.includes('versionCode 20')&&gradle.includes("'0.9.0-classes-preview.1'"),
  'styling review did not change APK');
console.log('PASS 6 distinct anime-style review classes, 36 source animations, 354 frames, no gameplay/release changes');
