'use strict';
const assert=require('node:assert/strict');
const E=require('../app/src/main/assets/economy.js');
const D=require('../app/src/main/assets/dungeon.js');
const C=require('../app/src/main/assets/contracts.js');
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS '+name);};
test('legacy merchant save adds a contract board without resetting gold',()=>{
 const s=E.initialState();const oldGold=s.gold;
 const c=C.ensure(s);
 assert.equal(s.gold,oldGold);assert.equal(c.offers.length,3);assert.equal(c.applicants.length,5);
 assert.equal(E.valid(JSON.parse(JSON.stringify(s))),true);
});
test('hiring charges once and prevents duplicate applications',()=>{
 const s=E.initialState(),a=C.ensure(s).applicants[0],before=s.gold;
 assert.equal(C.hire(s,a.id).ok,true);assert.equal(s.gold,before-a.fee);
 assert.equal(C.hire(s,a.id).ok,false);assert.equal(s.contracts.staff.length,1);
});
test('contract dungeon contains only the selected hired members',()=>{
 const s=E.initialState(),c=C.ensure(s);
 for(const a of c.applicants.slice(0,3))assert.equal(C.hire(s,a.id).ok,true);
 const selected=c.staff.slice(0,2).map(a=>a.id);
 const t=C.start(s,c.offers[0].id,selected);
 assert.equal(t.ok,true);
 assert.equal(t.run.instance.dungeon.adventurers.length,2);
 assert.ok(t.run.instance.dungeon.adventurers.every(a=>a.partyId==='JOB-'+t.run.id));
 assert.equal(s.dungeon,undefined,'main world is untouched');
 assert.equal(D.ensure(s).adventurers.length>2,true,'normal dungeon remains separate');
 assert.equal(C.start(s,c.offers[1].id,selected).ok,false,'active heroes cannot be double-booked');
});
test('advancing and claiming a completed contract transfers rewards exactly once',()=>{
 const s=E.initialState(),c=C.ensure(s);s.gold=500;
 C.hire(s,c.applicants[0].id);
 const started=C.start(s,c.offers[0].id,[c.staff[0].id]);
 assert.equal(started.ok,true);
 const run=started.run,hero=run.instance.dungeon.adventurers[0];
 hero.wins=run.offer.target;run.instance.mats.iron=4;run.instance.mats.herb=2;
 const initialGold=s.gold,initialIron=s.mats.iron;
 C.advance(s,.05);
 assert.equal(run.status,'completed');
 assert.equal(C.claim(s,run.id).ok,true);
 assert.equal(s.gold,initialGold+run.offer.reward);
 assert.equal(s.mats.iron,initialIron+4);
 assert.equal(C.claim(s,run.id).ok,false);
});
test('failed expedition pays no reward and releases adventurers',()=>{
 const s=E.initialState(),c=C.ensure(s);
 C.hire(s,c.applicants[0].id);
 const t=C.start(s,c.offers[1].id,[c.staff[0].id]),run=t.run;
 run.elapsed=361;
 C.advance(s,.05);assert.equal(run.status,'failed');
 const gold=s.gold;
 assert.equal(C.claim(s,run.id).ok,true);assert.equal(s.gold,gold);
 assert.equal(C.busyIds(c).size,0);
});
test('new day refreshes contracts without deleting current expeditions',()=>{
 const s=E.initialState(),c=C.ensure(s);C.hire(s,c.applicants[0].id);
 C.start(s,c.offers[0].id,[c.staff[0].id]);
 s.day++;const next=C.ensure(s);
 assert.equal(next.runs.length,1);
 assert.equal(next.offers.length,3);
 assert.equal(next.boardDay,s.day);
});
console.log('All '+count+' contract tests passed.');
