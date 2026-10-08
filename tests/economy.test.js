const assert = require('node:assert/strict');
const E = require('../app/src/main/assets/economy.js');
let checks = 0;
function test(name, fn){fn();checks++;console.log('PASS '+name)}
test('legacy save schema remains valid',()=>{
 const old=E.initialState();
 delete old.lastVisitorDay;delete old.pendingEncounter;delete old.visitorsResolved;
 assert.equal(E.valid(old),true);
});
test('visitor purchase spends gold and grants herbs once',()=>{
 const s=E.initialState();s.pendingEncounter='herbalist';
 const gold=s.gold,herbs=s.mats.herb;
 let t=E.resolveVisitor(s,'herbalist','purchase');
 assert.equal(t.ok,true);assert.equal(s.gold,gold-18);assert.equal(s.mats.herb,herbs+3);
 assert.equal(s.visitorsResolved,1);assert.equal(s.pendingEncounter,null);
 assert.equal(E.resolveVisitor(s,'herbalist','purchase').ok,false);
});
test('visitor choices reject insufficient stock or gold without consuming event',()=>{
 const s=E.initialState();s.gold=0;s.pendingEncounter='herbalist';
 assert.equal(E.resolveVisitor(s,'herbalist','purchase').ok,false);
 assert.equal(s.pendingEncounter,'herbalist');assert.equal(s.visitorsResolved,0);
 s.pendingEncounter='wounded';s.stock.potion=0;
 assert.equal(E.resolveVisitor(s,'wounded','heal').ok,false);
 assert.equal(s.pendingEncounter,'wounded');
});
test('one encounter each day and a new visitor the next day',()=>{
 const s=E.initialState();s.pendingEncounter='pilgrim';
 assert.equal(E.resolveVisitor(s,'pilgrim','farewell').ok,true);
 s.pendingEncounter='caravan';
 assert.equal(E.resolveVisitor(s,'caravan','pass').ok,false);
 s.day++;assert.equal(E.resolveVisitor(s,'caravan','pass').ok,true);
 assert.equal(s.visitorsResolved,2);
});
test('all scripted options maintain nonnegative gold and stock',()=>{
 for(const [id,event] of Object.entries(E.visitorEncounters)){
  for(const choice of event.choices){
   const s=E.initialState();s.gold=1000;
   for(const item of Object.keys(s.stock))s.stock[item]=10;
   s.pendingEncounter=id;
   const r=E.resolveVisitor(s,id,choice.id);
   assert.equal(r.ok,true,id+':'+choice.id);
   assert.ok(s.gold>=0);assert.ok(Object.values(s.stock).every(x=>x>=0));
   assert.ok(s.reputation>=0&&s.reputation<=100);
  }
 }
});
test('daily commissions still pay only once per day',()=>{
 const s=E.initialState();const a=E.fulfillCommission(s);
 assert.equal(a.ok,true);assert.equal(E.fulfillCommission(s).ok,false);
});
console.log('All '+checks+' game economy tests passed.');