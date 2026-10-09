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
 assert.equal(d.adventurers.length,8);assert.equal(d.monsters.length,16);
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
 assert.equal(s.dungeon.adventurers.length,16);
 const restored=JSON.parse(JSON.stringify(s));
 assert.equal(E.valid(restored),true);
 assert.equal(D.ensure(restored).adventurers.length,16);
 assert.ok(restored.dungeon.nextId>=49);
});
console.log('All '+checks+' dungeon expedition tests passed.');
