'use strict';
const assert=require('node:assert/strict');
const E=require('../app/src/main/assets/economy.js');
const D=require('../app/src/main/assets/dungeon.js');
const S=require('../app/src/main/assets/sprite-system.js');
let count=0;
function check(title,fn){fn();count++;console.log('PASS '+title)}
function isolate(s,hero,floor=1){
 const d=D.ensure(s);
 for(const a of d.adventurers){
  if(a===hero)continue;
  a.status='recovering';a.recover=999;
 }
 for(const m of d.monsters){m.hp=0;m.respawn=999;m.flash=0;m.attackFX=0;}
 const target=d.monsters.find(m=>m.floor===floor&&(!m.boss||floor===D.bossFloor));
 target.hp=target.maxHp;target.respawn=0;target.cooldown=8;
 hero.floor=floor;hero.x=target.x;hero.cooldown=0;
 return {d,target};
}
check('every existing monster kind is mapped to a unique image design',()=>{
 assert.equal(S.monsterIds.length,D.monsterKinds.length);
 assert.equal(S.monsterIds.at(-1),'abyssal_sovereign');
 assert.equal(new Set(S.monsterIds).size,9);
});
check('lethal hit triggers monster death animation and survivor attack pulse',()=>{
 const s=E.initialState(),hero=D.enter(s,{name:'Slayer',cls:'Knight',level:20},'Iron Shortsword');
 const {target}=isolate(s,hero);
 target.hp=1;
 D.advance(s,.05,()=>.8);
 assert.equal(target.hp,0);
 assert.ok(target.deathFX>0);
 assert.equal(S.chooseMonsterAction(target),'death');
 assert.ok(hero.fxTime>0&&hero.fxType==='slash');
 assert.ok(hero.swing>0);
 const before=target.deathFX;
 D.advance(s,.05,()=>.8);
 assert.ok(target.deathFX<before,'death animation time advances');
});
check('boss attack has a dedicated special animation with bounded cooldown',()=>{
 const s=E.initialState(),hero=D.enter(s,{name:'Test Tank',cls:'Knight',level:35},'Iron Shortsword');
 const {target}=isolate(s,hero,D.bossFloor);
 target.cooldown=0;hero.cooldown=100;
 D.advance(s,.05,()=>.8);
 assert.ok(target.attackFX>0);
 assert.equal(S.chooseMonsterAction(target),'special');
 const prev=target.attackFX;
 D.advance(s,.05,()=>.8);
 assert.ok(target.attackFX<prev);
});
check('cleric healing produces its own pulse, without changing contracts',()=>{
 const s=E.initialState(),hero=D.enter(s,{name:'Wounded',cls:'Ranger',level:8},'Starter');
 const cleric=D.enter(s,{name:'Light',cls:'Cleric',level:8},'Field Bandages');
 const {d}=isolate(s,cleric);const target=d.monsters.find(m=>m.floor===1&&m.hp>0);
 target.hp=0;target.respawn=999;
 hero.status='exploring';hero.x=cleric.x;hero.partyId='HEAL';
 cleric.partyId='HEAL';hero.hp=5;cleric.healCharges=1;
 D.advance(s,.05,()=>.9);
 assert.ok(hero.hp>5);
 assert.equal(cleric.fxType,'healing_pulse');
 assert.ok(cleric.fxTime>0);
});
check('monster image fallback allows offline client to proceed without a DOM Image',()=>{
 const m={kind:8,hp:0,deathFX:.4,deathDuration:.8};
 assert.equal(S.chooseMonsterAction(m),'death');
 assert.equal(S.monsterFrame(m,'death',0),3);
 assert.equal(S.drawMonster({},m,0),false);
 assert.equal(S.drawEffect({},'critical',.5),false);
});
check('monster death timers have no effect on raid extraction and contract payout',()=>{
 const s=E.initialState(),hero=D.enter(s,{name:'Returning',cls:'Knight',level:15},'Sword');
 const {d,target}=isolate(s,hero,D.bossFloor);
 target.hp=0;target.deathFX=.6;target.deathDuration=.6;target.respawn=90;
 d.bossDefeats=1;hero.bossClearedFloor=D.bossFloor;hero.status='returning';hero.x=65.01;
 D.advance(s,.05,()=>.5);
 assert.ok(d.raidReturns.some(a=>a.name==='Returning'),'return still uses entrance portal');
 assert.equal(d.adventurers.some(a=>a.id===hero.id),false);
});
console.log('All '+count+' visual combat and raid safety tests passed.');
