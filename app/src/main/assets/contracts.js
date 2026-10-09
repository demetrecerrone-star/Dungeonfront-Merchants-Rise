/* Independently simulated, save-safe contracts and extraction lifecycle. */
(function(root,factory){
 const D=typeof module==='object'&&module.exports?require('./dungeon.js'):root.DFDungeon;
 const api=factory(D);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.DFContracts=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(D){
'use strict';
const maxParty=5,maxActive=3,maxHired=12;
const candidates=[
 ['Tamsa','Ranger',4],['Garron','Knight',5],['Liora','Cleric',4],['Soren','Mage',5],
 ['Ilya','Rogue',6],['Darius','Mercenary',6],['Vesper','Mage',7],['Reeve','Knight',7],
 ['Fenna','Ranger',5],['Bryn','Cleric',6],['Cas','Rogue',5],['Asha','Knight',8]
];
const traits=['Stalwart','Swift','Keen','Lucky','Steadfast','Fierce'];
function listings(day,depth){
 const rank=Math.max(0,Math.min(2,Math.floor((Number(depth)||1)/4)));
 const defs=[
  {code:'salvage',title:'Clear the Gate Crypt',rank:'E',kind:'defeat',target:2,reward:95,rep:1,minParty:1,limit:360,desc:'Defeat 2 monsters and return through the entrance portal.'},
  {code:'patrol',title:'Hollow Descent Patrol',rank:'D',kind:'defeat',target:4,reward:155,rep:2,minParty:1,limit:480,desc:'Exterminate 4 dungeon monsters, then extract.'},
  {code:'gather',title:'Gather Crypt Salvage',rank:'D',kind:'gather',target:3,reward:125,rep:1,minParty:1,limit:480,desc:'Collect 3 salvage materials and return safely.'},
  {code:'escort',title:'Escort the Guild Courier',rank:'C',kind:'escort',target:2,reward:245,rep:3,minParty:2,limit:750,desc:'Protect a guild courier until Floor 2, then bring them home.'},
  {code:'treasure',title:'Recover Ancient Relics',rank:'C',kind:'treasure',target:1,reward:195,rep:2,minParty:2,limit:750,desc:'Discover a rare relic and escort it back to the portal.'}
 ];
 if(rank>=1)defs.push({code:'deep',title:'Deep Warrens Bounty',rank:'B',kind:'defeat',target:7,reward:350,rep:4,minParty:3,limit:1250,desc:'Defeat 7 monsters and extract alive.'});
 if(rank>=2)defs.push({code:'raid',title:'Abyssal Sovereign Raid',rank:'S',kind:'boss',target:1,reward:1100,rep:10,minParty:4,limit:3000,desc:'Defeat the Floor 8 boss and escape via the entrance portal.'});
 return defs.map(job=>Object.assign({id:job.code+'-'+day},job));
}
function applicants(day){
 return Array.from({length:5},(_,i)=>{
  const n=(day*3+i*5)%candidates.length;
  const [name,cls,level]=candidates[n];
  return {id:'a'+day+'-'+i,name,cls,level:level+Math.floor(Math.max(0,day-1)/4),
   fee:20+level*5,xp:0,gear:'Contract Kit',trait:traits[n%traits.length]};
 });
}
function ensure(s){
 if(!s.contracts||typeof s.contracts!=='object'||!Array.isArray(s.contracts.runs)){
  s.contracts={schema:3,boardDay:0,offers:[],applicants:[],staff:[],runs:[],nextRun:1,nextRecruit:1};
 }
 const c=s.contracts;
 if(!Array.isArray(c.staff))c.staff=[];
 if(!Array.isArray(c.offers))c.offers=[];
 if(!Array.isArray(c.applicants))c.applicants=[];
 if(!Number.isInteger(c.nextRun)||c.nextRun<1)c.nextRun=1;
 if(!Number.isInteger(c.nextRecruit)||c.nextRecruit<1)c.nextRecruit=1;
 for(const [i,a] of c.staff.entries()){
  if(!Number.isFinite(a.xp))a.xp=0;
  if(!a.gear)a.gear='Contract Kit';
  if(!a.trait)a.trait=traits[i%traits.length];
 }
 for(const run of c.runs){
  if(!Array.isArray(run.fallen))run.fallen=[];
  if(!Number.isFinite(run.fallenWins))run.fallenWins=0;
  if(!Number.isFinite(run.elapsed))run.elapsed=0;
  if(!run.instance||typeof run.instance!=='object')continue;
  run.instance.contractExpedition=true;
  if(!run.instance.loot)run.instance.loot={};
  const actors=run.instance.dungeon?.adventurers||[];
  for(let i=0;i<actors.length;i++)if(!actors[i].hireId&&!actors[i].escort)
   actors[i].hireId=run.memberIds[i]||null;
  if((c.schema||1)<3&&!run.claimed&&(run.status==='completed'||run.status==='failed')&&actors.some(a=>a.hp>0&&a.status!=='extracted')){
   run.outcome=run.status;
   run.status='returning';
   for(const a of actors)if(a.hp>0)a.status='returning';
  }
 }
 c.schema=3;
 if(c.boardDay!==s.day){
  c.boardDay=s.day;
  c.offers=listings(s.day,s.depth);
  const rookies=c.applicants.filter(a=>String(a.id).startsWith('rookie-'));
  c.applicants=applicants(s.day).filter(a=>!c.staff.some(x=>x.id===a.id)).concat(rookies);
 }
 return c;
}
function busyIds(c){
 const ids=new Set();
 for(const run of c.runs)if(run.status==='active'||run.status==='returning')
  for(const id of run.memberIds)ids.add(id);
 return ids;
}
function hire(s,id){
 const c=ensure(s),a=c.applicants.find(x=>x.id===id);
 if(!a)return{ok:false,reason:'This applicant is no longer available.'};
 if(c.staff.length>=maxHired)return{ok:false,reason:'Your roster is full (12 adventurers).'};
 if(s.gold<a.fee)return{ok:false,reason:'Not enough gold for the hiring fee.'};
 s.gold-=a.fee;s.spent+=a.fee;
 c.staff.push(Object.assign({gear:'Contract Kit',xp:0,trait:traits[0]},a));
 c.applicants=c.applicants.filter(x=>x.id!==id);
 return{ok:true,adventurer:a};
}
function equip(s,id,itemId){
 const c=ensure(s),member=c.staff.find(a=>a.id===id);
 if(!member)return{ok:false,reason:'Adventurer not found.'};
 if(busyIds(c).has(id))return{ok:false,reason:'Cannot change equipment during an expedition.'};
 const names={blade:'Iron Shortsword',forged:'Reforged Longblade',potion:'Healing Potion',bandage:'Field Bandages'};
 if(!names[itemId])return{ok:false,reason:'Invalid equipment.'};
 if((s.stock[itemId]||0)<1)return{ok:false,reason:'That item is out of stock.'};
 s.stock[itemId]--;member.gear=names[itemId];
 return{ok:true,adventurer:member,item:itemId};
}
function start(s,offerId,memberIds){
 const c=ensure(s),offer=c.offers.find(x=>x.id===offerId);
 if(!offer)return{ok:false,reason:'That contract is no longer posted.'};
 const minParty=offer.minParty||1;
 if(!Array.isArray(memberIds)||memberIds.length<minParty||memberIds.length>maxParty||new Set(memberIds).size!==memberIds.length)
  return{ok:false,reason:'This '+offer.rank+'-rank contract needs '+minParty+'–5 unique hired adventurers.'};
 if(c.runs.filter(x=>x.status==='active'||x.status==='returning').length>=maxActive)
  return{ok:false,reason:'Finish an active expedition first (maximum three).'};
 const busy=busyIds(c),members=memberIds.map(id=>c.staff.find(a=>a.id===id));
 if(members.some((a,i)=>!a||busy.has(memberIds[i])))return{ok:false,reason:'Select only available hired adventurers.'};
 const id='run'+c.nextRun++;
 const instance={mats:{iron:0,herb:0},loot:{},reputation:0,contractExpedition:true};
 const dungeon=D.ensure(instance);
 dungeon.adventurers=[];dungeon.nextId=1;dungeon.enters=0;dungeon.nextParty=1;
 for(const member of members){
  const a=D.enter(instance,member,member.gear||'Contract Kit');
  a.partyId=members.length>1?'JOB-'+id:null;
  a.visitor=false;
  a.hireId=member.id;
  a.trait=member.trait||'Steadfast';
  a.xp=Math.max(0,Number(member.xp)||0);
  if(a.trait==='Stalwart'){a.maxHp+=20;a.hp+=20;}
  a.x=72+(dungeon.adventurers.length-1)*20;
 }
 let escortId=null;
 if(offer.kind==='escort'){
  const courier=D.enter(instance,{name:'Guild Courier',cls:'Cleric',level:2},'Field Bandages');
  courier.escort=true;courier.visitor=false;courier.partyId='JOB-'+id;
  courier.maxHp+=30;courier.hp=courier.maxHp;courier.x=76;
  escortId=courier.id;
 }
 const run={id,offer:Object.assign({},offer),memberIds:memberIds.slice(),status:'active',
  instance,elapsed:0,report:'',claimed:false,fallen:[],fallenWins:0,escortId,outcome:null};
 c.runs.unshift(run);c.offers=c.offers.filter(x=>x.id!==offerId);
 return{ok:true,run};
}
function progress(run){
 const d=run.instance?.dungeon||{},actors=d.adventurers||[],offer=run.offer;
 if(offer.kind==='reach')return{value:Math.max(1,...actors.filter(a=>!a.escort).map(a=>a.floor||1)),target:offer.target};
 if(offer.kind==='escort'){
  const e=actors.find(a=>a.id===run.escortId);
  return{value:e?.floor||1,target:offer.target};
 }
 if(offer.kind==='boss')return{value:d.bossDefeats||0,target:1};
 if(offer.kind==='gather')return{value:d.lootFound||0,target:offer.target};
 if(offer.kind==='treasure')return{value:d.relicsFound||0,target:offer.target};
 return{value:(run.fallenWins||0)+actors.filter(a=>!a.escort).reduce((n,a)=>n+(a.wins||0),0),target:offer.target};
}
function unclaimedCount(s){return ensure(s).runs.filter(run=>run.status==='completed'||run.status==='failed').length;}
function replaceFallen(c){
 const n=c.nextRecruit++;
 const names=['Pip','Wren','Iona','Tarin','Quill','Nell','Bex','Orrin'];
 const classes=['Ranger','Knight','Cleric','Mage','Rogue','Mercenary'];
 c.applicants.push({id:'rookie-'+n,name:names[(n-1)%names.length]+' '+n,
  cls:classes[(n-1)%classes.length],level:1,xp:0,fee:25,gear:'Contract Kit',trait:traits[(n-1)%traits.length]});
}
function beginReturn(run,outcome){
 if(run.status==='returning')return;
 run.status='returning';run.outcome=outcome;
 for(const a of run.instance.dungeon.adventurers)if(a.hp>0&&a.status!=='extracted')a.status='returning';
 run.report=outcome==='completed'?'Objective met. Party returning to entrance portal. Payment locked until extraction.':
  'The mission failed. Surviving adventurers returning to the entrance portal.';
}
function advance(s,dt){
 const c=ensure(s),reports=[];
 for(const run of c.runs){
  if(run.status!=='active'&&run.status!=='returning')continue;
  const events=D.advance(run.instance,dt);
  run.elapsed+=Math.max(0,Math.min(.1,Number(dt)||0));
  const survivors=[];
  let courierLost=false;
  for(const a of run.instance.dungeon.adventurers){
   if(a.escort){
    if(a.hp<=0){courierLost=true;reports.push('ESCORT LOST: Guild Courier.');}
    else survivors.push(a);
    continue;
   }
   const member=c.staff.find(x=>x.id===a.hireId);
   if(a.hp<=0){
    run.fallen.push({id:a.hireId,name:a.name,level:a.level});
    run.fallenWins+=(a.wins||0);
    c.staff=c.staff.filter(x=>x.id!==a.hireId);
    run.memberIds=run.memberIds.filter(id=>id!==a.hireId);
    replaceFallen(c);
    reports.push('FALLEN IN ACTION: '+a.name+'. A level-one recruit is available for hire.');
   }else{
    if(member){member.level=a.level;member.xp=a.xp;member.wins=a.wins||0;}
    survivors.push(a);
   }
  }
  run.instance.dungeon.adventurers=survivors;
  const crew=survivors.filter(a=>!a.escort);
  if(!crew.length){
   run.status='failed';run.outcome='failed';
   run.report='Entire hired party lost. No payment. Replacement recruits are available.';
   reports.push('CONTRACT FAILED: '+run.offer.title+'. All hired adventurers were lost.');
   continue;
  }
  if(courierLost&&run.offer.kind==='escort'&&run.status==='active')beginReturn(run,'failed');
  if(run.status==='active'){
   const p=progress(run);
   if(p.value>=p.target){
    beginReturn(run,'completed');
    reports.push('OBJECTIVE MET: '+run.offer.title+'. Return to the entrance portal to unlock payment.');
   }else if(run.elapsed>(run.offer.limit||360)){
    beginReturn(run,'failed');
    reports.push('CONTRACT TIMED OUT: Survivors heading for the entrance portal.');
   }else if(events.some(x=>/reached floor|advanced to level|RAID VICTORY/.test(x))){
    reports.push('CONTRACT: '+events.find(x=>/reached floor|advanced to level|RAID VICTORY/.test(x)));
   }
  }
  // Completion, notifications and claims are not available at the moment
  // the objective is met. Every survivor (including the escort) must arrive.
  if(run.status==='returning'&&survivors.every(a=>a.status==='extracted')){
   run.status=run.outcome||'failed';
   const casualties=run.fallen.length?' ('+run.fallen.length+' lost)':'';
   run.report=run.status==='completed'?'Party extracted safely'+casualties+'. Payment and salvage can now be claimed.':
    'Survivors extracted; the mission failed'+casualties+'. No contract payment.';
   reports.push(run.status==='completed'?'CONTRACT COMPLETE: '+run.offer.title+'. Payment unlocked after extraction.':
    'CONTRACT FAILED: '+run.offer.title+'. Survivors returned through the portal.');
  }
 }
 return reports.slice(0,4);
}
function claim(s,id){
 const c=ensure(s),run=c.runs.find(x=>x.id===id);
 if(!run||!['completed','failed'].includes(run.status))return{ok:false,reason:'Payment is locked until the party has exited the dungeon.'};
 if(run.instance?.dungeon?.adventurers?.some(a=>a.hp>0&&a.status!=='extracted'))
  return{ok:false,reason:'Wait for the surviving party to leave through the entrance portal.'};
 const success=run.status==='completed',reward=success?run.offer.reward:0;
 const mats=success?run.instance.mats:{iron:0,herb:0};
 const loot=success?run.instance.loot||{}:{};
 if(success){
  s.gold+=reward;s.earned+=reward;s.reputation=Math.min(100,Math.max(0,s.reputation+run.offer.rep));
  for(const key of ['iron','herb'])s.mats[key]=(s.mats[key]||0)+(mats[key]||0);
  if(!s.loot)s.loot={};
  for(const [id,qty] of Object.entries(loot))s.loot[id]=(s.loot[id]||0)+qty;
 }
 run.status='claimed';run.claimed=true;
 return{ok:true,success,reward,mats:Object.assign({},mats),loot:Object.assign({},loot),rep:success?run.offer.rep:0};
}
return{maxParty,maxActive,maxHired,ensure,hire,equip,start,advance,progress,claim,busyIds,unclaimedCount,beginReturn};
});