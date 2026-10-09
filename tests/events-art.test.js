'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../app/src/main/assets/economy.js');
const D=require('../app/src/main/assets/dungeon.js');
const S=require('../app/src/main/assets/sprite-system.js');
const root=path.join(__dirname,'../app/src/main/assets');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'sprites/manifest.json'),'utf8'));
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name)}
test('all five encounters include transparent idle and activation animation sheets',()=>{
 assert.deepEqual(S.eventKinds,['chest','trap','shrine','hidden','merchant']);
 assert.deepEqual(Object.keys(manifest.events),S.eventKinds);
 for(const kind of S.eventKinds){
  const spec=manifest.events[kind];
  for(const action of ['idle','activate']){
   assert.ok(spec[action],kind+' '+action+' missing');
   assert.equal(spec[action].frames,action==='idle'?4:6);
   assert.equal(spec[action].frameW,32);
   assert.equal(spec[action].frameH,kind==='merchant'?48:32);
   assert.ok(fs.existsSync(path.join(root,spec[action].src)),spec[action].src);
  }
 }
});
test('all 13 UI indicator PNGs are bundled under exact class, condition and rarity names',()=>{
 assert.deepEqual(Object.keys(manifest.ui.classes).sort(),S.classes.map(x=>x.toLowerCase()).sort());
 assert.deepEqual(Object.keys(manifest.ui.condition),['ready','busy','injured','exhausted']);
 assert.deepEqual(Object.keys(manifest.ui.rarity),['uncommon','rare','epic']);
 for(const category of Object.keys(manifest.ui))
  for(const item of Object.values(manifest.ui[category])){
   assert.ok(fs.existsSync(path.join(root,item.src)),item.src);
   assert.equal(item.frameW,16);
   assert.equal(item.frameH,16);
   assert.equal(item.frames,1);
  }
});
test('discovery animation begins only on a legitimate one-time event',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const actor=D.enter(s,{name:'Event Witness',cls:'Ranger',level:10},'Bow');
 const chest=d.events.find(x=>x.floor===1&&x.type==='chest');
 for(const other of d.adventurers)if(other!==actor){other.status='recovering';other.recover=999;}
 for(const enemy of d.monsters){enemy.hp=0;enemy.respawn=999;}
 actor.x=chest.x;actor.cooldown=90;
 assert.equal(S.eventAnimation(chest,false),'idle');
 D.advance(s,.05,()=>.8);
 assert.equal(S.eventAnimation(chest,false),'activate');
 assert.ok(chest.visualPulse>0);
 assert.equal(S.eventFrame(chest,'activate',0,false),0);
 const first=chest.visualPulse,loot=s.loot.relic;
 D.advance(s,.05,()=>.8);
 assert.ok(chest.visualPulse<first,'animation clock decreases');
 assert.equal(s.loot.relic,loot,'discovery does not duplicate loot');
 for(let i=0;i<15;i++)D.advance(s,.05,()=>.8);
 assert.equal(chest.visualPulse,0,'animation ends');
 assert.equal(S.eventAnimation(chest,false),'idle');
 assert.equal(S.eventAnimation(chest,true),'activate');
 assert.equal(S.eventFrame(chest,'activate',0,true),5,'fully discovered location stays visibly used');
});
test('contract instance event art state stays isolated from public dungeon',()=>{
 const publicState=E.initialState(),privateState={mats:{iron:0,herb:0},loot:{},contractExpedition:true};
 const d=D.ensure(publicState),privateD=D.ensure(privateState);
 const local=d.events.find(x=>x.floor===1&&x.type==='chest');
 const hidden=privateD.events.find(x=>x.floor===1&&x.type==='chest');
 local.visualPulse=.6;
 assert.equal(hidden.visualPulse||0,0);
 assert.notEqual(local,hidden);
});
test('management screens expose class, state and rarity icons, and extraction progress',()=>{
 const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
 const styles=fs.readFileSync(path.join(root,'styles.css'),'utf8');
 for(const id of ['function classEmblem(cls)','function conditionBadge(a,occupied)','function rankBadge(rank)','function runBadge(status)','function returnProgress(run)']){
  assert.ok(game.includes(id),'missing UI helper '+id);
 }
 assert.ok(game.includes("window.DFSprites.drawEvent(g,event,t,allDiscovered)"),'dungeon must display event artwork');
 assert.ok(game.includes('returnProgress(run)'),'contract return bar absent');
 assert.ok(game.includes("run.status==='completed'||run.status==='failed'"),'claim button gate changed');
 assert.ok(game.includes("if(view!=='contract'||!run||(run.status!=='completed'&&run.status!=='failed'))"),'popup must remain gated');
 assert.ok(styles.includes('.contract-return-track'));
 assert.ok(styles.includes('.roster-mini-fatigue'));
 assert.ok(styles.includes('.guild-status'));
 assert.ok(styles.includes('.rarity-icon'));
});
test('event rendering fails safely on runtimes with no Image interface',()=>{
 const ctx={};
 const event={type:'chest',visualPulse:.2};
 assert.equal(S.drawEvent(ctx,event,0,false),false);
 assert.equal(S.drawEvent(ctx,{type:'unknown'},0,false),false);
});
console.log('All '+checks+' dungeon discovery art and UI polish tests passed.');
