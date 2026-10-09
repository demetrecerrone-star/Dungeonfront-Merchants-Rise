const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('../app/src/main/assets/economy.js');
const D=require('../app/src/main/assets/dungeon.js');
let count=0;
function test(label,run){run();console.log('PASS '+label);count++}
test('existing merchant and dungeon progress survives upgrade to raid schema',()=>{
 const s=E.initialState();s.gold=1087;s.mats.iron=19;s.stock.potion=5;
 s.dungeon={nextId:10,lootFound:7,adventurers:[{
  id:9,name:'Legacy Hero',cls:'Mage',level:7,floor:4,x:620,hp:22,maxHp:84,
  gear:'Health Potion',status:'exploring',cooldown:0,wins:2
 }],monsters:[]};
 const d=D.ensure(s);
 assert.equal(s.gold,1087);assert.equal(s.stock.potion,5);assert.equal(s.mats.iron,19);
 const hero=d.adventurers.find(x=>x.id===9);
 assert.equal(hero.hp,22);assert.equal(hero.x,620);assert.equal(hero.floor,4);
 assert.equal(d.schema,9);assert.equal(d.monsters.length,65);
 assert.ok(d.adventurers.some(x=>x.partyId));assert.ok(d.adventurers.some(x=>!x.partyId));
 const countBefore=d.adventurers.length;
 D.ensure(s);assert.equal(d.adventurers.length,countBefore);
 const saved=JSON.parse(JSON.stringify(s));D.ensure(saved);
 assert.equal(saved.dungeon.monsters.filter(x=>x.boss).length,1);
 assert.equal(saved.dungeon.adventurers.length,countBefore);
});
test('parties and solos both enter dungeon and live on specific floors',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const party=d.adventurers.find(x=>x.partyId==='P1');
 assert.ok(d.adventurers.filter(x=>x.partyId===party.partyId).length>=3);
 assert.ok(d.adventurers.some(x=>!x.partyId));
 const entrants=[];
 for(let i=0;i<8;i++)entrants.push(D.enter(s,{name:'Customer'+i,cls:'Knight',level:7},'Sword'));
 assert.ok(entrants.some(x=>x.partyId===null));
 assert.ok(entrants.some(x=>x.partyId!==null));
 assert.ok(entrants.every(x=>x.floor===1));
 const a=entrants[0];a.floor=4;a.x=D.worldWidth-45;a.clearedFloor=4;
 d.monsters.filter(m=>m.floor===4).forEach(m=>{m.hp=0;m.respawn=1000});
 D.advance(s,.05,()=>.2);
 assert.equal(a.floor,5,'hero transitions to only the next floor');
 assert.equal(a.x,65,'new chamber begins at entry');
});
test('floor eight contains one durable named boss plus multiple monsters',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const onEight=d.monsters.filter(m=>m.floor===D.bossFloor);
 assert.equal(D.bossFloor,8);
 assert.ok(onEight.length>=5);
 const boss=onEight.find(m=>m.boss);
 assert.ok(boss);
 assert.equal(D.monsterKinds[boss.kind].name,'The Abyssal Sovereign');
 assert.ok(boss.maxHp>=400);
 assert.equal(D.worldWidth,2100);
});
test('raid boss defeat awards persistent loot and reputation once',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const boss=d.monsters.find(m=>m.boss);
 d.monsters.filter(m=>m.floor===8&&!m.boss).forEach(m=>{m.hp=0;m.respawn=1000});
 const hero=d.adventurers.find(a=>a.name==='Aldric');
 hero.x=boss.x;hero.floor=8;hero.cooldown=0;hero.hp=hero.maxHp;
 boss.hp=1;boss.cooldown=5;
 const rep=s.reputation,loot=d.lootFound;
 D.advance(s,.05,()=>.2);
 assert.equal(boss.hp,0);assert.equal(d.bossDefeats,1);
 assert.equal(s.reputation,rep+5);assert.ok(d.lootFound>=loot+12);
 D.advance(s,.05,()=>.2);
 assert.equal(d.bossDefeats,1);
});
test('game canvas filters actors by current floor instead of stacking four rows',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/game.js'),'utf8');
 assert.doesNotThrow(()=>new vm.Script(source));
 assert.ok(source.includes("if(a.floor!==floor||a.status==='recovering'||a.status==='extracted')continue;"));
 assert.ok(source.includes("if(m.floor!==floor||(m.hp<=0&&!(m.deathFX>0)))continue;"));
 assert.ok(source.includes("Math.min(D.floorCount,floorOffset+delta)"));
 assert.ok(source.includes("tracked.floor!==floorOffset"));
 assert.ok(source.includes("const spriteScale=m.boss?2:m.kind===7?1.85:2.15;"));
});
test('all eight floors have eight regularly spaced enemies, while raid boss remains unique',()=>{
 const s=E.initialState(),d=D.ensure(s);
 for(let floor=1;floor<=8;floor++){
  const enemies=d.monsters.filter(m=>m.floor===floor&&!m.boss).sort((a,b)=>a.homeX-b.homeX);
  assert.equal(enemies.length,8,'regular monster count on floor '+floor);
  for(let i=1;i<enemies.length;i++)
   assert.ok(enemies[i].homeX-enemies[i-1].homeX>=180,'regular patrol gaps on floor '+floor);
 }
 assert.equal(d.monsters.filter(m=>m.boss).length,1);
});
test('floor gates prevent bypassing unvisited encounters',()=>{
 const s=E.initialState(),d=D.ensure(s),hero=d.adventurers.find(a=>a.name==='Ash');
 for(const a of d.adventurers)if(a!==hero){a.status='recovering';a.recover=1000;}
 for(const m of d.monsters.filter(m=>m.floor===1)){m.hp=0;m.respawn=1000;}
 hero.floor=1;hero.x=D.worldWidth-46;hero.clearedFloor=0;hero.status='exploring';
 D.advance(s,.1,()=>.5);
 assert.equal(hero.floor,1,'hero must stay on floor without a victory');
 assert.equal(hero.status,'waiting');
 const guardian=d.monsters.find(m=>m.id==='m1-7');
 assert.ok(guardian.respawn<=2,'guardian should respawn promptly at blocked exit');
});
test('normal monsters respawn promptly without losing their saved health during migration',()=>{
 const s=E.initialState();D.ensure(s);
 const m=s.dungeon.monsters.find(m=>m.id==='m3-0');
 m.hp=0;m.respawn=3.1;
 for(const a of s.dungeon.adventurers){a.status='recovering';a.recover=1000;}
 for(let i=0;i<34;i++)D.advance(s,.1,()=>.5);
 assert.equal(m.hp,m.maxHp,'monster should reappear in a few seconds');
 const legacy=E.initialState();legacy.dungeon={nextId:9,lootFound:0,adventurers:[],monsters:[
  {id:'m1-0',floor:1,x:999,homeX:999,kind:0,hp:7,maxHp:25,respawn:0,cooldown:0,boss:false}
 ],schema:6};
 const after=D.ensure(legacy).monsters.find(m=>m.id==='m1-0');
 assert.equal(after.hp,7,'migration must preserve ongoing monster damage');
 assert.notEqual(after.homeX,999,'old monster patrol position must be rebalanced');
});
test('party inspection retains all members across separate floors',()=>{
 const s=E.initialState(),d=D.ensure(s),members=D.partyMembers(s,'P1');
 assert.equal(members.length,3);
 assert.ok(members.every(m=>m.partyId==='P1'));
 members[1].floor=4;
 assert.equal(D.partyMembers(s,'P1').length,3,'moving a member does not hide them from party roster');
 const src=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/game.js'),'utf8');
 assert.ok(src.includes('D.partyMembers(ds,o.partyId)'),'party screen must enumerate every member');
 assert.ok(src.includes('data-member-id'),'party screen must offer a distinct button per member');
 assert.ok(src.includes("$('partyRoster').addEventListener('click'"),'member buttons must be selectable');
});
test('saved oversized parties split into groups of at most five without losing heroes',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const originals=d.adventurers.slice(0,8);
 for(const a of originals)a.partyId='P-LEGACY';
 originals[0].hp=11;originals[0].level=27;originals[0].floor=6;
 d.schema=7;
 const beforeIds=originals.map(a=>a.id);
 D.ensure(s);
 assert.deepEqual(originals.map(a=>a.id),beforeIds,'no saved heroes are dropped');
 assert.equal(originals[0].hp,11);assert.equal(originals[0].level,27);assert.equal(originals[0].floor,6);
 const groups=new Map();
 for(const a of d.adventurers){
  if(!a.partyId)continue;
  groups.set(a.partyId,(groups.get(a.partyId)||0)+1);
 }
 assert.ok([...groups.values()].every(n=>n<=D.maxPartySize),'all groups obey five-member limit');
 assert.equal(d.schema,9);
 const persisted=JSON.parse(JSON.stringify(s));
 D.ensure(persisted);
 assert.equal(persisted.dungeon.adventurers.length,d.adventurers.length,'save round trip keeps all adventurers');
});
test('new merchant entrants stop joining a party at five and solo runs remain possible',()=>{
 const s=E.initialState(),d=D.ensure(s),arrivals=[];
 for(let i=0;i<12;i++)arrivals.push(D.enter(s,{name:'New'+i,cls:'Knight',level:3},'Sword'));
 const counts=new Map();
 for(const a of d.adventurers)if(a.partyId)counts.set(a.partyId,(counts.get(a.partyId)||0)+1);
 assert.ok([...counts.values()].every(n=>n<=D.maxPartySize));
 assert.ok(arrivals.some(a=>!a.partyId),'solo adventurers still enter the dungeon');
 assert.ok(arrivals.some(a=>a.partyId),'new grouped adventurers enter the dungeon');
});
test('compact party screen and selectable eight-floor menu without redundant arrows',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/styles.css'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/index.html'),'utf8');
 const src=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/game.js'),'utf8');
 assert.ok(css.includes('.party-roster{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert.ok(css.includes('.party-member{')&&css.includes('min-height:39px'));
 assert.ok(css.includes('.dungeon-floor-menu{'));
 assert.ok(src.includes("'TAP A MEMBER TO FOLLOW'"));
 assert.ok(src.includes("party-health"));
 assert.ok(src.includes("D.floorNames.map"));
 assert.ok(src.includes("selectDungeonFloor(Number(button.dataset.floor))"));
 assert.ok(src.includes("cameraX=cameraClamp(drag.cam-dx)"),'horizontal finger swipe remains');
 assert.ok(html.includes('id="dungeonFloorMenuButton"'));
 assert.ok(html.includes('id="dungeonFloorMenu"'));
 for(const id of ['dungeonLeft','dungeonRight','dungeonUp','dungeonDown']){
  assert.ok(!html.includes('id="'+id+'"'),'removed redundant '+id+' button');
  assert.ok(!src.includes("$('"+id+"')"),'removed stale '+id+' listener');
 }
 assert.doesNotThrow(()=>new vm.Script(src));
});
console.log('All '+count+' raid and full-floor tests passed.');
