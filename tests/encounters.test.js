'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../app/src/main/assets/economy.js');
const D=require('../app/src/main/assets/dungeon.js');
let passed=0;
function test(title,fn){fn();console.log('PASS '+title);passed++;}
test('eight regular monsters are placed across each of the eight floors',()=>{
 const s=E.initialState(),d=D.ensure(s);
 for(let floor=1;floor<=8;floor++){
  const mobs=d.monsters.filter(m=>m.floor===floor&&!m.boss);
  assert.equal(mobs.length,8,'floor '+floor);
  assert.ok(mobs.some(m=>m.x<300),'early encounters on floor '+floor);
  assert.ok(mobs.some(m=>m.x>1850),'exit encounters on floor '+floor);
 }
 assert.equal(d.monsters.length,65);
 assert.equal(d.monsters.filter(m=>m.boss).length,1);
});
test('normal monsters return quickly after defeat',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const hero=d.adventurers.find(a=>a.name==='Mira');
 const target=d.monsters.find(m=>m.floor===1&&!m.boss);
 hero.x=target.x;hero.cooldown=0;target.hp=1;target.cooldown=100;
 D.advance(s,.05,()=>.5);
 assert.equal(target.hp,0);
 assert.ok(target.respawn>=3&&target.respawn<=5);
 for(let i=0;i<125;i++)D.advance(s,.05,()=>.5);
 assert.ok(target.hp>0,'monster respawns in under seven seconds');
});
test('an uncleared floor cannot be skipped while all enemies are down',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const hero=D.enter(s,{name:'Fast Runner',cls:'Rogue',level:12},'Torch');
 for(const a of d.adventurers)if(a!==hero){a.status='recovering';a.recover=2000}
 hero.floor=3;hero.x=D.worldWidth-45;hero.clearedFloor=0;
 for(const m of d.monsters.filter(m=>m.floor===3)){m.hp=0;m.respawn=100;}
 D.advance(s,.05,()=>.5);
 assert.equal(hero.floor,3);
 assert.equal(hero.status,'waiting');
 const guardian=d.monsters.find(m=>m.id==='m3-7');
 assert.ok(guardian.respawn<=2);
 // With a real combat victory, the floor opens normally.
 hero.clearedFloor=3;hero.x=D.worldWidth-45;
 D.advance(s,.05,()=>.5);
 assert.equal(hero.floor,4);
 assert.equal(hero.clearedFloor,0);
});
test('party victories unlock the floor for teammates but not solo fighters',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const leader=d.adventurers.find(a=>a.name==='Mira');
 const team=D.partyMembers(s,leader.partyId);
 assert.ok(team.length>=3);
 const solo=d.adventurers.find(a=>a.name==='Ash');
 for(const a of d.adventurers)if(a!==leader){a.status='recovering';a.recover=2000}
 const mob=d.monsters.find(m=>m.floor===leader.floor&&!m.boss);
 leader.x=mob.x;leader.cooldown=0;mob.hp=1;mob.cooldown=50;
 D.advance(s,.05,()=>.5);
 assert.equal(mob.hp,0);
 assert.ok(team.every(a=>a.clearedFloor===leader.floor));
 assert.notEqual(solo.clearedFloor,leader.floor);
});
test('raid boss must be defeated before completing floor eight',()=>{
 const s=E.initialState(),d=D.ensure(s);
 const hero=D.enter(s,{name:'Raid Scout',cls:'Knight',level:10},'Sword');
 for(const a of d.adventurers)if(a!==hero){a.status='recovering';a.recover=2000}
 hero.floor=8;hero.x=D.worldWidth-45;hero.clearedFloor=8;hero.bossClearedFloor=0;
 D.advance(s,.05,()=>.5);
 assert.equal(hero.status,'waiting');
 assert.equal(hero.floor,8);
 hero.x=D.worldWidth-45;hero.bossClearedFloor=8;
 D.advance(s,.05,()=>.5);
 assert.equal(hero.status,'recovering');
});
test('party member panel supports viewing all members including other floors',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/game.js'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/index.html'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/styles.css'),'utf8');
 assert.ok(html.includes('id="partyRoster"'));
 assert.ok(source.includes('D.partyMembers(s,o.partyId)'));
 assert.ok(source.includes('button[data-member-id]'));
 assert.ok(source.includes('member.floor'));
 assert.ok(source.includes('if(a)showAdventurer(a)'));
 assert.ok(css.includes('.party-member.selected'));
});
console.log('All '+passed+' encounters and party inspection tests passed.');
