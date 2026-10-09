/* Dungeonfront v0.7: independent, save-safe contract expeditions. */
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
function listings(day,depth){
 const rank=Math.max(0,Math.min(2,Math.floor((Number(depth)||1)/4)));
 const defs=[
  {code:'salvage',title:'Clear the Gate Crypt',rank:'E',kind:'defeat',target:2,reward:95,rep:1,desc:'Defeat 2 monsters on Floor 1.'},
  {code:'patrol',title:'Hollow Descent Patrol',rank:'D',kind:'defeat',target:4,reward:155,rep:2,desc:'Defeat 4 dungeon monsters.'},
  {code:'scout',title:'Scout Mossbound Passage',rank:'C',kind:'reach',target:2,reward:215,rep:3,desc:'Reach Floor 2 and report back.'}
 ];
 if(rank>=1)defs[1]={code:'deep',title:'Deep Warrens Bounty',rank:'B',kind:'defeat',target:7,reward:300,rep:4,desc:'Defeat 7 dungeon monsters.'};
 if(rank>=2)defs[2]={code:'raid',title:'Abyssal Sovereign Raid',rank:'S',kind:'boss',target:1,reward:950,rep:10,desc:'Defeat the raid boss on Floor 8.'};
 return defs.map(job=>Object.assign({id:job.code+'-'+day},job));
}
function applicants(day){
 return Array.from({length:5},(_,i)=>{
  const n=(day*3+i*5)%candidates.length;
  const [name,cls,level]=candidates[n];
  return {id:'a'+day+'-'+i,name,cls,level:level+Math.floor(Math.max(0,day-1)/4),
   fee:24+level*6};
 });
}
function ensure(s){
 if(!s.contracts||typeof s.contracts!=='object'||!Array.isArray(s.contracts.runs)){
  s.contracts={schema:1,boardDay:0,offers:[],applicants:[],staff:[],runs:[],nextRun:1};
 }
 const c=s.contracts;
 if(!Array.isArray(c.staff))c.staff=[];
 if(!Array.isArray(c.offers))c.offers=[];
 if(!Array.isArray(c.applicants))c.applicants=[];
 if(!Number.isInteger(c.nextRun)||c.nextRun<1)c.nextRun=1;
 if(c.boardDay!==s.day){
  c.boardDay=s.day;
  c.offers=listings(s.day,s.depth);
  c.applicants=applicants(s.day).filter(a=>!c.staff.some(x=>x.id===a.id));
 }
 return c;
}
function busyIds(c){
 const ids=new Set();
 for(const run of c.runs)if(run.status==='active')for(const id of run.memberIds)ids.add(id);
 return ids;
}
function hire(s,id){
 const c=ensure(s),a=c.applicants.find(x=>x.id===id);
 if(!a)return{ok:false,reason:'This applicant is no longer available.'};
 if(c.staff.length>=maxHired)return{ok:false,reason:'Your roster is full (12 adventurers).'};
 if(s.gold<a.fee)return{ok:false,reason:'Not enough gold for the hiring fee.'};
 s.gold-=a.fee;s.spent+=a.fee;c.staff.push(Object.assign({},a));
 c.applicants=c.applicants.filter(x=>x.id!==id);
 return{ok:true,adventurer:a};
}
function start(s,offerId,memberIds){
 const c=ensure(s),offer=c.offers.find(x=>x.id===offerId);
 if(!offer)return{ok:false,reason:'That contract is no longer posted.'};
 if(!Array.isArray(memberIds)||memberIds.length<1||memberIds.length>maxParty||new Set(memberIds).size!==memberIds.length)
  return{ok:false,reason:'Select between one and five unique adventurers.'};
 if(c.runs.filter(x=>x.status==='active').length>=maxActive)
  return{ok:false,reason:'Finish an active expedition first (maximum three).'};
 const busy=busyIds(c),members=memberIds.map(id=>c.staff.find(a=>a.id===id));
 if(members.some((a,i)=>!a||busy.has(memberIds[i])))return{ok:false,reason:'Select only available hired adventurers.'};
 const id='run'+c.nextRun++;
 // A private instance owns its heroes, monsters and salvage. Ordinary dungeon
 // residents never enter this simulation, and rewards transfer only on claim.
 const instance={mats:{iron:0,herb:0},reputation:0};
 const dungeon=D.ensure(instance);
 dungeon.adventurers=[];dungeon.nextId=1;dungeon.enters=0;dungeon.nextParty=1;
 for(const member of members){
  const a=D.enter(instance,member,'Contract Kit');
  a.partyId=members.length>1?'JOB-'+id:null;
  a.visitor=false;
  a.x=72+(dungeon.adventurers.length-1)*20;
 }
 const run={id,offer:Object.assign({},offer),memberIds:memberIds.slice(),status:'active',
  instance,elapsed:0,report:'',claimed:false};
 c.runs.unshift(run);
 c.offers=c.offers.filter(x=>x.id!==offerId);
 return{ok:true,run};
}
function progress(run){
 const actors=run.instance?.dungeon?.adventurers||[];
 if(run.offer.kind==='reach')return{value:Math.max(1,...actors.map(a=>a.floor||1)),target:run.offer.target};
 if(run.offer.kind==='boss')return{value:run.instance?.dungeon?.bossDefeats||0,target:1};
 return{value:actors.reduce((n,a)=>n+(a.wins||0),0),target:run.offer.target};
}
function advance(s,dt){
 const c=ensure(s),reports=[];
 for(const run of c.runs){
  if(run.status!=='active')continue;
  const events=D.advance(run.instance,dt);
  run.elapsed+=Math.max(0,Math.min(.1,Number(dt)||0));
  const p=progress(run);
  if(p.value>=p.target){
   run.status='completed';run.report='Contract completed. Return to the board to claim your payment and recovered materials.';
   reports.push('CONTRACT COMPLETE: '+run.offer.title+'. '+run.offer.reward+'G ready to claim.');
  }else if(run.elapsed>360||run.instance.dungeon.adventurers.every(a=>a.status==='recovering')){
   run.status='failed';run.report='The expedition could not complete its objective. Your adventurers are available for new contracts.';
   reports.push('CONTRACT FAILED: '+run.offer.title+'.');
  }else if(events.some(x=>/reached floor|advanced to level|RAID VICTORY/.test(x))){
   reports.push('CONTRACT: '+events.find(x=>/reached floor|advanced to level|RAID VICTORY/.test(x)));
  }
 }
 return reports.slice(0,3);
}
function claim(s,id){
 const c=ensure(s),run=c.runs.find(x=>x.id===id);
 if(!run||!['completed','failed'].includes(run.status))return{ok:false,reason:'No finished expedition to settle.'};
 const success=run.status==='completed';
 const reward=success?run.offer.reward:0;
 const mats=success?run.instance.mats:{iron:0,herb:0};
 if(success){
  s.gold+=reward;s.earned+=reward;
  s.reputation=Math.min(100,Math.max(0,s.reputation+run.offer.rep));
  for(const key of ['iron','herb'])s.mats[key]=(s.mats[key]||0)+(mats[key]||0);
 }
 run.status='claimed';run.claimed=true;
 return{ok:true,success,reward,mats:Object.assign({},mats),rep:success?run.offer.rep:0};
}
return{maxParty,maxActive,maxHired,ensure,hire,start,advance,progress,claim,busyIds};
});