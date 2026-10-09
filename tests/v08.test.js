'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../app/src/main/assets/economy.js');
const D=require('../app/src/main/assets/dungeon.js');
const C=require('../app/src/main/assets/contracts.js');
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
function silence(s,except=[]){
 const d=D.ensure(s);
 for(const a of d.adventurers)if(!except.includes(a)){a.status='recovering';a.recover=999;}
 for(const m of d.monsters){m.hp=0;m.respawn=999;}
}
test('old saves gain all new store categories without losing original goods',()=>{
 const old=E.initialState();delete old.stock.armor;delete old.price.staff;
 old.gold=900;old.stock.potion=7;
 E.ensureInventory(old);
 assert.equal(old.gold,900);assert.equal(old.stock.potion,7);
 for(const id of ['armor','shield','bow','staff','elixir']){
  assert.ok(E.items[id]);assert.ok(Number.isFinite(old.stock[id]));
  assert.equal(old.price[id],E.items[id].base);
 }
});
test('customers seek useful class-specific gear',()=>{
 const classes=['Knight','Ranger','Mage','Cleric','Rogue','Mercenary'];
 for(const cls of classes){
  const requested=E.needsForClass(cls,()=>.1);
  assert.ok(E.classNeeds[cls].includes(requested));
  assert.ok(E.items[requested]);
 }
});
test('new store goods can be restocked and sold for merchant profit',()=>{
 const s=E.initialState();E.ensureInventory(s);s.gold=900;
 const tx=E.restock(s,'shield',3);assert.ok(tx.ok);
 assert.equal(s.stock.shield,3);
 const sell=E.attemptSale(s,'shield',500,0,'Knight');
 assert.equal(sell.ok,true);assert.equal(s.stock.shield,2);
 assert.ok(s.gold>0);
});
test('hired recruits receive distinct equipment slots without overwriting swords',()=>{
 const s=E.initialState();E.ensureInventory(s);s.gold=1200;
 s.stock.armor=2;s.stock.shield=2;s.stock.bow=2;
 const c=C.ensure(s);C.hire(s,c.applicants[0].id);
 const id=c.staff[0].id;
 assert.ok(C.equip(s,id,'blade').ok);
 assert.ok(C.equip(s,id,'armor').ok);
 assert.ok(C.equip(s,id,'shield').ok);
 const hero=c.staff[0];
 assert.equal(hero.equipment.weapon,'blade');
 assert.equal(hero.equipment.armor,'armor');
 assert.equal(hero.equipment.offhand,'shield');
 assert.equal(hero.gear,'Iron Shortsword');
});
test('wounded and exhausted adventurers cannot accept contracts until treated',()=>{
 const s=E.initialState();E.ensureInventory(s);s.gold=800;
 const c=C.ensure(s);C.hire(s,c.applicants[0].id);
 const hero=c.staff[0];hero.injury=2;hero.fatigue=82;
 assert.equal(C.start(s,c.offers[0].id,[hero.id]).ok,false);
 assert.ok(C.treat(s,hero.id,'bandage').ok);
 assert.equal(hero.injury,0);
 s.stock.elixir=1;
 assert.ok(C.treat(s,hero.id,'elixir').ok);
 assert.equal(hero.fatigue,22);
 assert.equal(C.start(s,c.offers[0].id,[hero.id]).ok,true);
});
test('rest heals only unassigned hires once per game day',()=>{
 const s=E.initialState(),c=C.ensure(s);s.gold=800;
 C.hire(s,c.applicants[0].id);
 const a=c.staff[0];a.fatigue=70;a.injury=2;
 s.day++;C.ensure(s);assert.equal(a.fatigue,46);assert.equal(a.injury,1);
 C.ensure(s);assert.equal(a.fatigue,46);assert.equal(a.injury,1);
});
test('clerics heal damaged party members with limited charges',()=>{
 const s=E.initialState();const knight=D.enter(s,{name:'Guardian',cls:'Knight',level:5},'Starter');
 const cleric=D.enter(s,{name:'Healer',cls:'Cleric',level:5},'Bandages');
 silence(s,[knight,cleric]);knight.partyId='TEST';cleric.partyId='TEST';
 knight.x=600;cleric.x=600;knight.hp=10;cleric.healCharges=1;
 D.advance(s,.05,()=>.6);
 assert.ok(knight.hp>10,'cleric healed the knight');
 assert.equal(cleric.healCharges,0);
});
test('mages attack from outside melee range using spell attacks',()=>{
 const s=E.initialState();const mage=D.enter(s,{name:'Caster',cls:'Mage',level:9},'Arcane Staff');
 silence(s,[mage]);const d=D.ensure(s);
 const mob=d.monsters.find(m=>m.floor===1&&!m.boss);mob.hp=150;mob.maxHp=150;mob.cooldown=10;
 mage.x=mob.x-105;mage.cooldown=0;mage.equipment={weapon:'staff'};
 D.advance(s,.05,()=>.5);
 assert.ok(mob.hp<150,'ranged magical damage was dealt');
 assert.equal(mage.special,'spell');
});
test('knights intercept nearby damage that would hit a mage',()=>{
 const s=E.initialState();const mage=D.enter(s,{name:'Protected Mage',cls:'Mage',level:5},'Staff');
 const knight=D.enter(s,{name:'Frontline',cls:'Knight',level:5},'Shield');
 silence(s,[mage,knight]);const d=D.ensure(s);
 const mob=d.monsters.find(m=>m.floor===1&&!m.boss);
 mob.hp=200;mob.maxHp=200;mob.cooldown=0;
 mage.partyId='SHIELD';knight.partyId='SHIELD';
 mage.x=mob.x-105;knight.x=mob.x+30;
 const mageHp=mage.hp,knightHp=knight.hp;
 D.advance(s,.05,()=>.5);
 assert.equal(mage.hp,mageHp,'backline hero remains protected');
 assert.ok(knight.hp<knightHp,'knight intercepted the damage');
});
test('every dungeon floor has treasure, traps, healing, secrets and a trader',()=>{
 const s=E.initialState(),d=D.ensure(s);
 for(let floor=1;floor<=D.floorCount;floor++)
  assert.deepEqual(d.events.filter(e=>e.floor===floor).map(e=>e.type),['chest','trap','shrine','hidden','merchant']);
});
test('chest gives loot once for a given adventurer; hazard causes damage',()=>{
 const s=E.initialState();const a=D.enter(s,{name:'Treasure Hunter',cls:'Ranger',level:4},'Hunter Bow');
 silence(s,[a]);const d=D.ensure(s),chest=d.events.find(e=>e.floor===1&&e.type==='chest');
 a.x=chest.x;
 const old=s.loot.relic||0;
 D.advance(s,.05,()=>.9);
 assert.equal(s.loot.relic,old+1);assert.ok(a.seenEvents.includes(chest.id));
 D.advance(s,.05,()=>.9);
 assert.equal(s.loot.relic,old+1,'same chest is not farmable every frame');
 const trap=d.events.find(e=>e.floor===1&&e.type==='trap'),hp=a.hp;
 a.x=trap.x;D.advance(s,.05,()=>.9);assert.ok(a.hp<hp,'hazard damaged explorer');
});
test('contract veterans acquire fatigue and injuries only after successful extraction',()=>{
 const s=E.initialState(),c=C.ensure(s);s.gold=1100;
 C.hire(s,c.applicants[0].id);const member=c.staff[0];
 const run=C.start(s,c.offers[0].id,[member.id]).run;
 const a=run.instance.dungeon.adventurers[0];
 a.wins=run.offer.target;a.hp=Math.floor(a.maxHp*.3);a.x=700;
 C.advance(s,.05);
 assert.equal(run.status,'returning');assert.equal(member.fatigue,0,'no early exhaustion payout');
 assert.equal(C.claim(s,run.id).ok,false,'payment locked');
 a.x=65.01;C.advance(s,.05);
 assert.equal(run.status,'completed');
 assert.ok(member.fatigue>0);assert.ok(member.injury>0);
 assert.equal(C.start(s,c.offers.find(x=>x.kind==='gather').id,[member.id]).ok,false);
});
test('roster screen and dungeon discoveries are wired into gameplay UI',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/index.html'),'utf8');
 const game=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/game.js'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/styles.css'),'utf8');
 for(const id of ['rosterButton','boardRoster','rosterScreen','rosterBody','rosterContracts','rosterClose'])
  assert.ok(html.includes('id="'+id+'"'),'missing '+id);
 assert.ok(game.includes('function renderRoster()'));
 assert.ok(game.includes("if(closest.type==='event')"));
 assert.ok(game.includes("C.treat(s,id,itemId)"));
 assert.ok(game.includes("E.needsForClass(classes[i])"));
 assert.ok(css.includes('.roster-screen{'));
 assert.ok(game.includes("if(view!=='contract'||!run||(run.status!=='completed'&&run.status!=='failed'))"),'claim popup still gated to extraction');
});
console.log('All '+checks+' v0.8 feature tests passed.');
