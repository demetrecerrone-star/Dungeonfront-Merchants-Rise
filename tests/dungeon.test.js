const assert=require('node:assert/strict');
const E=require('../app/src/main/assets/economy.js');
const D=require('../app/src/main/assets/dungeon.js');
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name)}
test('old v0.4 save grows a dungeon without resetting merchant progress',()=>{
 const save=E.initialState();save.gold=874;save.stock.potion=9;save.day=12;
 assert.equal(E.valid(save),true);
 const d=D.ensure(save);
 assert.equal(save.gold,874);assert.equal(save.stock.potion,9);assert.equal(save.day,12);
 assert.ok(d.adventurers.length>=24);assert.equal(d.monsters.length,65);
 assert.equal(D.ensure(save),d);
 assert.equal(D.floorCount,8);
});
test('completed shop sale can send properly equipped adventurer into floor one',()=>{
 const s=E.initialState(),before=s.gold;
 const a=D.enter(s,{name:'Rook',cls:'Knight',level:5},'Iron Shortsword');
 assert.equal(a.floor,1);assert.equal(a.name,'Rook');assert.equal(a.cls,'Knight');
 assert.ok(a.hp>0);assert.ok(a.maxHp>0);
 assert.equal(s.gold,before);
 assert.ok(D.snapshot(s).adventurers.some(x=>x.id===a.id));
});
test('dungeon combat never subtracts treasury or grants negative resources',()=>{
 const s=E.initialState(),gold=s.gold;
 D.ensure(s);
 for(let i=0;i<1800;i++)D.advance(s,.05,()=>.2);
 assert.equal(s.gold,gold);
 assert.ok(s.mats.iron>=0&&s.mats.herb>=0);
 assert.ok(s.dungeon.adventurers.every(a=>a.hp>=0&&a.hp<=a.maxHp&&a.floor>=1&&a.floor<=8));
 assert.ok(s.dungeon.monsters.every(m=>m.hp>=0&&m.hp<=m.maxHp));
 assert.ok(Number.isFinite(s.dungeon.lootFound));
});
test('expedition roster stays bounded and survives round-trip save',()=>{
 const s=E.initialState();
 for(let i=0;i<40;i++)D.enter(s,{name:'Traveler '+i,cls:'Rogue',level:3},'Pitch Torch');
 assert.equal(s.dungeon.adventurers.length,40);
 const restored=JSON.parse(JSON.stringify(s));
 assert.equal(E.valid(restored),true);
 assert.equal(D.ensure(restored).adventurers.length,40);
 assert.ok(restored.dungeon.nextId>=49);
});

test('raid victors pass through the exit once instead of resetting to fight the boss again',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const hero=D.enter(s,{name:'Raider',cls:'Knight',level:18},'Iron Shortsword');
 hero.floor=D.bossFloor;hero.x=D.worldWidth-48;hero.clearedFloor=D.bossFloor;
 hero.bossClearedFloor=D.bossFloor;
 const boss=d.monsters.find(m=>m.boss);
 boss.hp=boss.maxHp;boss.cooldown=5;
 const priorKills=d.bossDefeats;
 const reports=D.advance(s,.1,()=>.3);
 assert.ok(reports.some(x=>x.includes('exited through the portal')));
 assert.equal(d.adventurers.some(a=>a.id===hero.id),false,'victor leaves dungeon roster');
 assert.equal(d.raidReturns.some(a=>a.name==='Raider'),true,'return is recorded');
 assert.equal(d.bossDefeats,priorKills,'exit cannot force a second kill');
 for(let i=0;i<100;i++)D.advance(s,.1,()=>.3);
 assert.equal(d.adventurers.some(a=>a.id===hero.id),false,'victor cannot re-enter by automatic recovery');
});
test('all raiders on floor eight may use the shared portal after the boss falls',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const hero=D.enter(s,{name:'Late Survivor',cls:'Ranger',level:10},'Pitch Torch');
 hero.floor=D.bossFloor;hero.x=D.worldWidth-48;hero.clearedFloor=0;hero.bossClearedFloor=0;
 const boss=d.monsters.find(m=>m.boss);
 boss.hp=0;boss.respawn=50;d.bossDefeats=1;
 D.advance(s,.1,()=>.4);
 assert.equal(d.adventurers.some(a=>a.id===hero.id),false,'shared boss victory opens portal');
 assert.equal(d.raidReturns.some(a=>a.name==='Late Survivor'),true);
});
test('raid exit remains sealed before defeating the boss',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const hero=D.enter(s,{name:'Unproven Delver',cls:'Rogue',level:10},'Pitch Torch');
 hero.floor=D.bossFloor;hero.x=D.worldWidth-48;hero.clearedFloor=0;hero.bossClearedFloor=0;
 const boss=d.monsters.find(m=>m.boss);
 boss.hp=boss.maxHp;d.bossDefeats=0;
 D.advance(s,.1,()=>.4);
 assert.equal(d.adventurers.some(a=>a.id===hero.id),true,'unproven hero cannot leave');
 assert.equal(d.raidReturns.some(a=>a.name==='Unproven Delver'),false);
});
console.log('All '+checks+' dungeon expedition tests passed.');
