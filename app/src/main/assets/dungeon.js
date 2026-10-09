/* Dungeonfront v0.5: bounded offline multi-floor expedition simulation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.DFDungeon=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const floorCount=8,worldWidth=1500,maxAdventurers=16;
const floorNames=['The Gate Crypt','Mossbound Passage','Ember Chambers','The Forsaken Keep','Sunken Archives','Ashen Hollows','The Deep Warrens','Abyssal Threshold'];
const monsterKinds=[
 {name:'Cave Slime',color:'#668f79',hp:25,damage:3},
 {name:'Goblin Scout',color:'#8e9a58',hp:34,damage:5},
 {name:'Bone Sentinel',color:'#b7ac92',hp:42,damage:6},
 {name:'Ember Imp',color:'#c67e50',hp:48,damage:7},
 {name:'Crypt Spider',color:'#816d91',hp:56,damage:8},
 {name:'Drowned Wraith',color:'#7b9aa9',hp:65,damage:9},
 {name:'Abyss Hound',color:'#9d6365',hp:73,damage:10},
 {name:'Hollow Guardian',color:'#a183aa',hp:90,damage:12}
];
const seeds=[
 ['Mira','Ranger',3,1,180],['Bram','Knight',4,2,470],
 ['Seren','Mage',5,3,270],['Elara','Cleric',6,4,690],
 ['Nyx','Rogue',8,5,210],['Torr','Mercenary',9,6,550],
 ['Veda','Mage',11,7,380],['Aldric','Knight',13,8,710]
];
function actor(name,cls,level,floor,x,id){
 const maxHp=54+Math.max(1,level)*5+(cls==='Knight'?16:0);
 return{id,name,cls,level,floor,x,hp:maxHp,maxHp,status:'exploring',gear:'Starter Kit',cooldown:0,recover:0,wins:0};
}
function ensure(s){
 if(!s.dungeon||!Array.isArray(s.dungeon.adventurers)||!Array.isArray(s.dungeon.monsters)){
  s.dungeon={nextId:9,lootFound:0,adventurers:seeds.map((v,i)=>actor(...v,i+1)),monsters:[]};
  for(let f=1;f<=floorCount;f++){
   const base=monsterKinds[f-1];
   for(let k=0;k<2;k++)s.dungeon.monsters.push({
    id:'m'+f+'-'+k,floor:f,x:370+k*620+(f%3)*24,
    kind:f-1,hp:base.hp,maxHp:base.hp,respawn:0,cooldown:0
   });
  }
 }
 if(!Number.isFinite(s.dungeon.nextId))s.dungeon.nextId=9;
 if(!Number.isFinite(s.dungeon.lootFound))s.dungeon.lootFound=0;
 return s.dungeon;
}
function enter(s,customer,gear){
 const d=ensure(s);
 if(d.adventurers.length>=maxAdventurers)d.adventurers.shift();
 const a=actor(String(customer.name||'Traveler').slice(0,22),String(customer.cls||'Mercenary'),Math.min(40,Math.max(1,Math.floor(customer.level||1))),1,72,d.nextId++);
 a.gear=String(gear||'Supplies').slice(0,30);
 const equipment=a.gear.toLowerCase();
 if(equipment.includes('blade')||equipment.includes('sword')){a.maxHp+=12;a.hp+=12}
 if(equipment.includes('potion')||equipment.includes('bandage')){a.maxHp+=7;a.hp+=7}
 d.adventurers.push(a);
 return a;
}
function advance(s,seconds,rng){
 const d=ensure(s),dt=Math.min(.1,Math.max(0,Number(seconds)||0)),random=typeof rng==='function'?rng:Math.random,reports=[];
 if(!dt)return reports;
 for(const m of d.monsters){
  if(m.hp<=0){m.respawn-=dt;if(m.respawn<=0){m.hp=m.maxHp;m.respawn=0;m.cooldown=0}continue}
  m.cooldown=Math.max(0,(m.cooldown||0)-dt);
 }
 for(const a of d.adventurers){
  a.cooldown=Math.max(0,(a.cooldown||0)-dt);
  if(a.status==='recovering'){
   a.recover-=dt;
   if(a.recover<=0){a.recover=0;a.status='exploring';a.hp=a.maxHp;a.floor=1;a.x=62}
   continue;
  }
  if(a.status==='retreating'){
   a.x=Math.max(50,a.x-dt*115);
   if(a.x<=50){a.status='recovering';a.recover=8;a.hp=Math.max(1,Math.floor(a.maxHp*.3))}
   continue;
  }
  const target=d.monsters.find(m=>m.floor===a.floor&&m.hp>0&&Math.abs(m.x-a.x)<34);
  if(target){
   a.status='fighting';
   if(a.cooldown<=0){
    const attack=7+Math.floor(a.level/3)+(a.cls==='Mage'?4:0)+(a.gear.includes('blade')||a.gear.includes('sword')?3:0);
    target.hp=Math.max(0,target.hp-attack);
    a.cooldown=.65;
    if(target.hp===0){
     target.respawn=12+Math.max(0,Math.min(6,Number(random())*6));
     a.wins=(a.wins||0)+1;
     a.status='exploring';
     const mat=Number(random())<.5?'iron':'herb';
     if(s.mats&&Number.isFinite(s.mats[mat])){s.mats[mat]+=1;d.lootFound++;reports.push(a.name+' defeated a '+monsterKinds[target.kind].name+' on floor '+a.floor+' and recovered 1 '+mat+'.')}
    }
   }
   if(target.hp>0&&target.cooldown<=0){
    a.hp=Math.max(0,a.hp-monsterKinds[target.kind].damage);
    target.cooldown=1.2;
    if(a.hp===0){a.status='retreating';reports.push(a.name+' was wounded on floor '+a.floor+' and is retreating.')}
   }
  }else{
   a.status='exploring';
   a.x=Math.min(worldWidth-45,a.x+dt*(20+Math.min(20,a.level*1.2)));
   if(a.x>=worldWidth-45){
    a.floor=a.floor<floorCount?a.floor+1:1;
    a.x=65;
    a.hp=Math.min(a.maxHp,a.hp+Math.floor(a.maxHp*.22));
    reports.push(a.name+' reached floor '+a.floor+' of the Hollow Descent.');
   }
  }
 }
 return reports.slice(0,4);
}
function snapshot(s){return ensure(s)}
return{floorCount,worldWidth,floorNames,monsterKinds,ensure,enter,advance,snapshot};
});
