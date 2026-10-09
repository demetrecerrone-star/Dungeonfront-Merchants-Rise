/* Dungeonfront v0.6.2: compact party limits, solo delvers and eight-floor raids. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.DFDungeon=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const floorCount=8,worldWidth=2100,maxAdventurers=40,bossFloor=8,maxPartySize=5;
const patrolPositions=[160,405,650,895,1140,1385,1630,1930];
const gateX=worldWidth-185;
const floorNames=['The Gate Crypt','Mossbound Passage','Ember Chambers','The Forsaken Keep','Sunken Archives','Ashen Hollows','The Deep Warrens','Abyssal Threshold'];
const monsterKinds=[
 {name:'Cave Slime',color:'#668f79',hp:25,damage:3},
 {name:'Goblin Scout',color:'#8e9a58',hp:34,damage:5},
 {name:'Bone Sentinel',color:'#b7ac92',hp:42,damage:6},
 {name:'Ember Imp',color:'#c67e50',hp:48,damage:7},
 {name:'Crypt Spider',color:'#816d91',hp:56,damage:8},
 {name:'Drowned Wraith',color:'#7b9aa9',hp:65,damage:9},
 {name:'Abyss Hound',color:'#9d6365',hp:73,damage:10},
 {name:'Hollow Guardian',color:'#a183aa',hp:90,damage:12},
 {name:'The Abyssal Sovereign',color:'#b96783',hp:480,damage:19,boss:true}
];
const seeds=[
 ['Mira','Ranger',3,1,180],['Bram','Knight',4,2,470],
 ['Seren','Mage',5,3,270],['Elara','Cleric',6,4,690],
 ['Nyx','Rogue',8,5,210],['Torr','Mercenary',9,6,550],
 ['Veda','Mage',11,7,380],['Aldric','Knight',13,8,710]
];
const formations=[
 ['P1','Mira',1,[['Tamsin','Knight'],['Oren','Cleric']]],
 ['P2','Bram',2,[['Garrick','Ranger'],['Lilith','Mage']]],
 ['P3','Seren',3,[['Kara','Rogue'],['Daro','Knight']]],
 ['P4','Elara',4,[['Kael','Knight'],['Brin','Ranger']]],
 ['P5',null,5,[['Rowan','Knight'],['Sia','Mage'],['Lenn','Cleric']]],
 ['P6','Torr',6,[['Vale','Rogue'],['Bri','Mage']]],
 ['P7',null,7,[['Osha','Knight'],['Fern','Cleric'],['Remy','Ranger']]],
 ['P8','Aldric',8,[['Korren','Knight'],['Sylva','Cleric'],['Iven','Mage']]]
];
const loneDelvers=[['Ash','Rogue',2,1,140],['Luca','Mage',5,2,290],['Niko','Ranger',7,4,330],['Faye','Rogue',12,7,190]];
function actor(name,cls,level,floor,x,id){
 const maxHp=54+Math.max(1,level)*5+(cls==='Knight'?16:0);
 return{id,name,cls,level,floor,x,hp:maxHp,maxHp,status:'exploring',gear:'Starter Kit',cooldown:0,recover:0,wins:0,xp:0,partyId:null};
}
function monster(f,k,x,kind,isBoss){
 const spec=monsterKinds[kind];
 return{id:isBoss?'m8-boss':'m'+f+'-'+k,floor:f,x,homeX:x,
  kind,hp:spec.hp,maxHp:spec.hp,respawn:0,cooldown:0,boss:!!isBoss,phase:k*2};
}
function partyMembers(s,partyId){
 if(!partyId)return [];
 return ensure(s).adventurers.filter(a=>a.partyId===partyId).sort((a,b)=>a.id-b.id);
}
function ensure(s){
 if(!s.dungeon||!Array.isArray(s.dungeon.adventurers)||!Array.isArray(s.dungeon.monsters)){
  s.dungeon={nextId:9,lootFound:0,adventurers:seeds.map((v,i)=>actor(...v,i+1)),monsters:[]};
  for(let f=1;f<=floorCount;f++)
   for(let k=0;k<2;k++)s.dungeon.monsters.push(monster(f,k,370+k*620+(f%3)*24,f-1,false));
 }
 const d=s.dungeon;
 if(!Number.isFinite(d.nextId))d.nextId=9;
 if(!Number.isFinite(d.lootFound))d.lootFound=0;
 if(!Number.isFinite(d.bossDefeats))d.bossDefeats=0;
 if(!Number.isFinite(d.relicsFound))d.relicsFound=0;
 if(!s.loot||typeof s.loot!=='object')s.loot={};
 if(!Array.isArray(d.raidReturns))d.raidReturns=[];
 if(!Array.isArray(d.events)){
  const eventTypes=['chest','trap','shrine','hidden','merchant'];
  const locations=[275,785,1190,1535,1815];
  d.events=[];
  for(let floor=1;floor<=floorCount;floor++)for(let i=0;i<eventTypes.length;i++)
   d.events.push({id:'e'+floor+'-'+i,floor,x:locations[i],type:eventTypes[i]});
 }
 if(!Number.isFinite(d.enters))d.enters=0;
 if(!Number.isFinite(d.nextParty))d.nextParty=1;
 d.nextId=Math.max(d.nextId,1+Math.max(0,...d.adventurers.map(a=>Number(a.id)||0)));
 if(!Number.isFinite(d.schema)||d.schema<6){
  // Migration is deliberately additive: retain every saved actor, HP, level and all merchant resources.
  for(const [id,leaderName,floor,companions] of formations){
   const leader=d.adventurers.find(a=>a.name===leaderName&&!a.partyId);
   if(leader)leader.partyId=id;
   const homeFloor=leader?leader.floor:floor;
   const homeX=leader?leader.x:150+floor*12;
   for(let n=0;n<companions.length;n++){
    const [name,cls]=companions[n];
    if(d.adventurers.some(a=>a.name===name))continue;
    const a=actor(name,cls,Math.max(2,homeFloor+2),homeFloor,
     Math.max(65,homeX+(n+1)*37),d.nextId++);
    a.partyId=id;
    d.adventurers.push(a);
   }
  }
  for(const [name,cls,level,floor,x] of loneDelvers)
   if(!d.adventurers.some(a=>a.name===name))d.adventurers.push(actor(name,cls,level,floor,x,d.nextId++));
  for(let f=1;f<=floorCount;f++){
   for(let k=0;k<4;k++){
    const id='m'+f+'-'+k;
    if(!d.monsters.some(m=>m.id===id)){
     const x=[310,730,1180,1700][k]+(f%3)*24;
     d.monsters.push(monster(f,k,x,f-1,false));
    }
   }
  }
  if(!d.monsters.some(m=>m.id==='m8-boss'))d.monsters.push(monster(8,4,1920,8,true));
  d.schema=6;
 }
 // Grow existing saves to eight regular encounters per floor without resetting HP or progress.
 if(d.schema<7){
  for(let f=1;f<=floorCount;f++){
   for(let k=0;k<patrolPositions.length;k++){
    const id='m'+f+'-'+k;
    if(!d.monsters.some(m=>m.id===id))
     d.monsters.push(monster(f,k,patrolPositions[k]+(f%3)*12,f-1,false));
   }
  }
  // Rebalance old patrol markers into evenly spaced encounters on each floor.
  // Keep monster identity, current HP, and respawn state from the player's save.
  for(const m of d.monsters){
   if(m.boss)continue;
   const k=Number(String(m.id).split('-')[1]);
   if(Number.isInteger(k)&&k>=0&&k<patrolPositions.length){
    const x=patrolPositions[k]+(m.floor%3)*12;
    m.homeX=x;m.x=x;
   }
  }
  d.schema=7;
 }
 // v0.6.2: split oversized saved groups; preserve every hero and their individual progress.
 if(d.schema<8){
  const groups=new Map();
  for(const a of d.adventurers){
   if(!a.partyId)continue;
   if(!groups.has(a.partyId))groups.set(a.partyId,[]);
   groups.get(a.partyId).push(a);
  }
  const used=new Set(groups.keys());
  for(const members of groups.values()){
   for(let i=maxPartySize;i<members.length;i+=maxPartySize){
    let newId;
    do{newId='G'+d.nextParty++}while(used.has(newId));
    used.add(newId);
    for(const a of members.slice(i,i+maxPartySize))a.partyId=newId;
   }
  }
  d.schema=8;
 }
 for(const a of d.adventurers){
  if(!Number.isFinite(a.x))a.x=65;
  if(!Number.isFinite(a.floor)||a.floor<1||a.floor>floorCount)a.floor=1;
  if(!Number.isFinite(a.xp))a.xp=0;
  if(!('partyId' in a))a.partyId=null;
  if(!Number.isFinite(a.clearedFloor))a.clearedFloor=0;
  if(!Number.isFinite(a.bossClearedFloor))a.bossClearedFloor=0;
  if(!Array.isArray(a.seenEvents))a.seenEvents=[];
  if(!Number.isFinite(a.healCharges))a.healCharges=2;
  if(!Number.isFinite(a.injury))a.injury=0;
 }
 for(const m of d.monsters){
  if(!Number.isFinite(m.homeX))m.homeX=m.x;
  if(!Number.isFinite(m.phase))m.phase=0;
  if(m.id==='m8-boss')m.boss=true;
 }
 return d;
}
function enter(s,customer,gear){
 const d=ensure(s);
 if(d.adventurers.length>=maxAdventurers){
  // Drop the oldest transient customer before dismissing the established dungeon population.
  const idx=d.adventurers.findIndex(a=>a.visitor===true);
  d.adventurers.splice(idx>=0?idx:0,1);
 }
 const a=actor(String(customer.name||'Traveler').slice(0,22),String(customer.cls||'Mercenary'),
  Math.min(40,Math.max(1,Math.floor(customer.level||1))),1,72,d.nextId++);
 a.gear=String(gear||'Supplies').slice(0,30);
 if(customer.equipment)a.equipment=Object.assign({},customer.equipment);
 a.visitor=true;
 const equipment=a.gear.toLowerCase();
 if(equipment.includes('blade')||equipment.includes('sword')){a.maxHp+=12;a.hp+=12}
 if(equipment.includes('potion')||equipment.includes('bandage')){a.maxHp+=7;a.hp+=7}
 // Some customers adventure alone; others assemble small parties by the gate.
 d.enters++;
 if(d.enters%4!==0){
  const open=d.adventurers.filter(x=>x.partyId&&String(x.partyId).startsWith('G')&&
   x.floor===1&&x.x<390&&x.status==='exploring');
  const recent=open.length?open[open.length-1]:null;
  const party=recent&&d.adventurers.filter(x=>x.partyId===recent.partyId).length<maxPartySize?recent.partyId:'G'+d.nextParty++;
  a.partyId=party;
 }
 d.adventurers.push(a);
 return a;
}
function markClear(d,a,isBoss){
 const team=a.partyId?d.adventurers.filter(x=>x.partyId===a.partyId&&x.floor===a.floor):[a];
 for(const member of team){
  member.clearedFloor=a.floor;
  if(isBoss)member.bossClearedFloor=a.floor;
 }
}
function award(s,d,a,m,random,reports){
 markClear(d,a,m.boss);
 a.wins=(a.wins||0)+1;a.xp=(a.xp||0)+1;
 if(a.xp>=Math.max(3,Math.ceil(a.level/2)+2)){
  a.xp=0;a.level++;a.maxHp+=5;a.hp=Math.min(a.maxHp,a.hp+15);
  reports.push(a.name+' advanced to level '+a.level+'.');
 }
 const mat=Number(random())<.5?'iron':'herb';
 const qty=m.boss?6:1;
 // Ancient relics are a secondary, rarer source of merchant profit.
 if(m.boss||Number(random())<.26+(a.trait==='Lucky'?.15:0)){
  const found=m.boss?1:1;
  const rarity=m.boss?'gem':Number(random())<.17?'essence':'relic';
  d.relicsFound+=found;
  s.loot[rarity]=(s.loot[rarity]||0)+found;
  reports.push(a.name+' recovered '+found+' '+rarity+' ('+(m.boss?'epic':rarity==='essence'?'rare':'uncommon')+').');
 }
 if(s.mats&&Number.isFinite(s.mats[mat])){
  s.mats[mat]+=qty;d.lootFound+=qty;
  reports.push(a.name+' defeated '+monsterKinds[m.kind].name+' on floor '+a.floor+' (+'+qty+' '+mat+').');
 }
 if(m.boss){
  d.bossDefeats++;
  if(s.mats){s.mats.iron+=3;s.mats.herb+=3;d.lootFound+=6}
  if(Number.isFinite(s.reputation))s.reputation+=5;
  reports.push('RAID VICTORY: The Abyssal Sovereign falls! +5 reputation and rare salvage.');
 }
}
function discover(s,d,a,event,random,reports){
 if(!a.seenEvents)a.seenEvents=[];
 if(a.seenEvents.includes(event.id))return;
 a.seenEvents.push(event.id);
 const n=event.floor;
 switch(event.type){
 case 'chest':{
  const rare=Number(random())<(n>=6?.35:.11);
  const kind=rare?'essence':'relic';
  s.loot[kind]=(s.loot[kind]||0)+1;d.relicsFound++;
  reports.push(a.name+' found a '+(rare?'rare':'hidden')+' '+kind+' in a treasure chest.');break;
 }
 case 'trap':{
  const damage=3+n*2;
  a.hp=Math.max(0,a.hp-damage);
  if(a.hp>0&&a.hp<a.maxHp*.4)a.injury=Math.max(a.injury||0,1);
  if(a.hp<=0)a.status='retreating';
  reports.push(a.name+' triggered a crypt trap (-'+damage+' HP).');break;
 }
 case 'shrine':{
  const heal=Math.ceil(a.maxHp*.27);
  a.hp=Math.min(a.maxHp,a.hp+heal);
  reports.push(a.name+' rested at an ancient healing shrine.');break;
 }
 case 'hidden':{
  const rare=Number(random())<(n>=5?.28:.1);
  const kind=rare?'gem':'relic';
  s.loot[kind]=(s.loot[kind]||0)+1;d.relicsFound++;
  reports.push(a.name+' uncovered a secret chamber with '+kind+' treasure.');break;
 }
 case 'merchant':{
  a.hp=Math.min(a.maxHp,a.hp+Math.ceil(a.maxHp*.13));
  a.healCharges=Math.min(3,(a.healCharges||0)+1);
  reports.push(a.name+' traded supplies with a wandering dungeon merchant.');break;
 }
 }
}
function advance(s,seconds,rng){
 const d=ensure(s),dt=Math.min(.1,Math.max(0,Number(seconds)||0)),random=typeof rng==='function'?rng:Math.random,reports=[];
 if(!dt)return reports;
 for(const m of d.monsters){
  // Effect clocks drive sprites without changing the combat RNG or damage.
  m.flash=Math.max(0,(m.flash||0)-dt);
  m.attackFX=Math.max(0,(m.attackFX||0)-dt);
  m.deathFX=Math.max(0,(m.deathFX||0)-dt);
  if(m.hp<=0){m.respawn-=dt;if(m.respawn<=0){m.hp=m.maxHp;m.respawn=0;m.cooldown=0;m.x=m.homeX;m.deathFX=0}continue}
  m.cooldown=Math.max(0,(m.cooldown||0)-dt);
  m.phase=(m.phase||0)+dt;
  if(!m.boss){m.x=Math.max(m.homeX-32,Math.min(m.homeX+32,m.homeX+Math.sin(m.phase*.9)*32))}
 }
 for(const a of d.adventurers){
  a.cooldown=Math.max(0,(a.cooldown||0)-dt);
  a.fxTime=Math.max(0,(a.fxTime||0)-dt);
  // All floors have an exit portal at their START (x=65).
  // Returning parties move toward it without starting new fights.
  if(a.status==='extracted')continue;
  if(a.floor===bossFloor&&a.status!=='recovering'&&a.status!=='retreating'){
   const boss=d.monsters.find(m=>m.boss&&m.floor===bossFloor);
   if(a.bossClearedFloor!==bossFloor&&d.bossDefeats>0&&boss&&boss.hp<=0){
    a.clearedFloor=bossFloor;a.bossClearedFloor=bossFloor;
   }
   if(a.bossClearedFloor===bossFloor)a.status='returning';
  }
  if(a.status==='returning'){
   a.x=Math.max(65,a.x-dt*(170+Math.min(60,Number(a.level||1)*2)));
   if(a.x<=65){
    a.status='extracted';
    d.raidReturns.unshift({name:a.name,cls:a.cls,level:a.level,floor:a.floor});
    d.raidReturns=d.raidReturns.slice(0,30);
    reports.push(a.name+' returned through the floor '+a.floor+' entrance portal.');
   }
   continue;
  }
  if(a.status==='recovering'){
   a.recover-=dt;
   if(a.recover<=0){a.recover=0;a.status='exploring';a.hp=a.maxHp;a.floor=1;a.x=62;a.clearedFloor=0;a.bossClearedFloor=0}
   continue;
  }
  if(a.status==='retreating'){
   a.x=Math.max(65,a.x-dt*125);
   if(a.x<=65){a.status='recovering';a.recover=8;a.hp=Math.max(1,Math.floor(a.maxHp*.3))}
   continue;
  }
  // Party coordination: protect the courier, heal wounded allies, and stay together.
  const party=a.partyId?d.adventurers.filter(x=>x.partyId===a.partyId&&x.floor===a.floor&&x.hp>0&&x.status!=='returning'&&x.status!=='extracted'):[a];
  if(a.cls==='Cleric'&&a.healCharges>0&&a.cooldown<=0){
   const wounded=party.filter(x=>x.hp<x.maxHp*.7).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];
   if(wounded){
    const heal=11+Math.ceil(a.level/2);
    wounded.hp=Math.min(wounded.maxHp,wounded.hp+heal);
    a.healCharges--;a.cooldown=1.4;a.status='healing';a.special='heal';a.fxType='healing_pulse';a.fxTime=.5;
    reports.push(a.name+' healed '+wounded.name+' for '+heal+' HP.');
    continue;
   }
  }
  if(!a.escort){
   for(const event of d.events){
    if(event.floor===a.floor&&Math.abs(event.x-a.x)<=18&&!a.seenEvents.includes(event.id)){
     discover(s,d,a,event,random,reports);
     if(a.hp<=0)break;
    }
   }
   if(a.hp<=0)continue;
  }
  // Couriers remain behind their guards instead of attacking creatures.
  if(a.escort&&party.some(x=>!x.escort)){
   const guard=party.filter(x=>!x.escort).sort((x,y)=>x.x-y.x)[0];
   if(guard&&a.x>guard.x-15){a.x=Math.max(65,guard.x-15);a.status='escorting';continue;}
  }
  const range=a.escort?0:a.cls==='Mage'?145:a.cls==='Ranger'?115:43;
  const target=d.monsters.find(m=>m.floor===a.floor&&m.hp>0&&Math.abs(m.x-a.x)<range);
  if(target){
   a.status='fighting';
   if(a.cooldown<=0){
    const gear=String(a.gear||'').toLowerCase();
    const weapon=String(a.equipment?.weapon||'').toLowerCase();
    const crit=(a.cls==='Rogue'&&Number(random())<.26)||(a.cls==='Ranger'&&Number(random())<.16);
    const base=7+Math.floor(a.level/3)+(a.cls==='Mage'?5:0)+(gear.includes('blade')||gear.includes('sword')?3:0)+(a.trait==='Fierce'?3:0)+(a.trait==='Keen'?2:0);
    const boost=(weapon==='staff'&&a.cls==='Mage'?6:0)+(weapon==='bow'&&a.cls==='Ranger'?5:0)+(weapon==='forged'?7:0)+(weapon==='blade'?3:0);
    const attack=(base+boost)*(crit?2:1);
    if(crit)a.special='critical';else if(a.cls==='Mage')a.special='spell';else if(a.cls==='Ranger')a.special='arrow';else a.special='slash';
    a.fxType=crit?'critical':a.cls==='Mage'?'magic_bolt':a.cls==='Ranger'?'arrow':a.cls==='Mercenary'?'heavy_slash':'slash';
    a.fxTime=.34;
    target.hp=Math.max(0,target.hp-attack);
    a.cooldown=a.cls==='Rogue'?.4:a.cls==='Mage'?.9:a.cls==='Ranger'?.72:.65;a.swing=.23;target.flash=.18;
    if(target.hp===0){
     target.deathFX=target.boss?.85:.65;target.deathDuration=target.deathFX;
     target.respawn=target.boss?90:3+Math.max(0,Math.min(2,Number(random())*2));
     award(s,d,a,target,random,reports);a.status='exploring';
    }
   }
   if(target.hp>0&&target.cooldown<=0){
    const tank=party.find(x=>x.cls==='Knight'&&x.hp>0&&Math.abs(x.x-target.x)<98);
    const defender=tank||a;
    const armour=defender.equipment?.armor==='armor'?3:0;
    const shield=defender.equipment?.offhand==='shield'?2:0;
    const hit=Math.max(1,monsterKinds[target.kind].damage-(defender.trait==='Steadfast'?2:0)-armour-shield);
    defender.hp=Math.max(0,defender.hp-hit);
    if(defender!==a){defender.special='block';defender.fxType='hit_flash';defender.fxTime=.22;}
    target.attackFX=.5;
    target.cooldown=target.boss?.8:1.2;
    if(defender.hp===0){defender.status='retreating';reports.push(defender.name+' was wounded defending the party on floor '+defender.floor+'.')}
   }
  }else{
   a.status=a.escort?'escorting':'exploring';
   // Contract heroes avoid racing so far ahead that healers and couriers disappear.
   const lagging=s.contractExpedition&&party.some(x=>x!==a&&x.floor===a.floor&&x.hp>0&&x.x<a.x-145&&x.status!=='returning');
   if(!lagging)a.x=Math.min(worldWidth-45,a.x+dt*(25+Math.min(22,a.level*1.2)+(a.trait==='Swift'?10:0)));
   if(a.x>=worldWidth-45){
    const cleared=a.clearedFloor===a.floor&&(a.floor!==bossFloor||a.bossClearedFloor===bossFloor);
    if(!cleared){
     // Dungeon floors need an actual fight before their exit opens.
     // The gate guardian returns quickly instead of leaving a cleared floor empty.
     a.x=gateX;a.status='waiting';
     const sentinel=d.monsters.find(m=>m.id==='m'+a.floor+'-7');
     if(sentinel){
      if(sentinel.hp<=0)sentinel.respawn=Math.min(sentinel.respawn||2,2);
      sentinel.x=gateX+12;sentinel.homeX=gateX+12;
     }
    }else if(a.floor<floorCount){
     a.floor++;a.x=65;a.clearedFloor=0;a.bossClearedFloor=0;
     a.hp=Math.min(a.maxHp,a.hp+Math.floor(a.maxHp*.22));
     reports.push(a.name+' reached floor '+a.floor+' of the Hollow Descent.');
    }else if(a.floor===bossFloor){
     // The raid floor has NO forward stairwell until more floors are added.
     // Its victorious raiders exit via the portal at the entrance.
     a.status='returning';
    }else{a.status='recovering';a.recover=12;reports.push(a.name+' completed a deep dungeon expedition and is returning.')}
   }
  }
  a.swing=Math.max(0,(a.swing||0)-dt);
 }
 // Normal dungeon heroes leave after extraction; private contract heroes
 // stay available to the contract settlement and casualty systems.
 if(!s.contractExpedition)d.adventurers=d.adventurers.filter(a=>a.status!=='extracted');
 return reports.slice(0,4);
}
function snapshot(s){return ensure(s)}
return{floorCount,worldWidth,bossFloor,maxPartySize,floorNames,monsterKinds,ensure,enter,advance,snapshot,partyMembers};
});
