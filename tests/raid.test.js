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
 assert.equal(d.schema,6);assert.equal(d.monsters.length,33);
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
 const a=entrants[0];a.floor=4;a.x=D.worldWidth-45;
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
 assert.ok(source.includes("if(a.floor!==floor||a.status==='recovering')continue;"));
 assert.ok(source.includes("if(m.floor!==floor||m.hp<=0)continue;"));
 assert.ok(source.includes("Math.min(D.floorCount,floorOffset+delta)"));
 assert.ok(source.includes("tracked.floor!==floorOffset"));
 assert.ok(source.includes("m.boss?3:2.2"));
});
console.log('All '+count+' raid and full-floor tests passed.');
