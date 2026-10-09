(function(){
'use strict';
const E=window.DFEconomy,D=window.DFDungeon,C=window.DFContracts,$=id=>document.getElementById(id),key='dungeonfront_merchants_rise_save_v1';
let s=E.initialState();try{const old=JSON.parse(localStorage.getItem(key));if(E.valid(old))s=Object.assign(E.initialState(),old)}catch(e){}
const canvas=$('scene'),g=canvas.getContext('2d',{alpha:false});
let active=false,paused=false,tab='stock',guests=[],next=2,clock=0,uiClock=0,last=performance.now(),selected=null,renderDue=0,guestId=0;
let panelDirty=true,lastPanelHTML=null,lastPanelTab=null;
let visitorCountdown=22,visitorOpen=false,toastTimer=0,shownGold=null,shownRep=null;
let view='shop',cameraX=0,floorOffset=1,drag=null,dungeonHit=[],followId=null,focusId=null;
let contractRunId=null,contractBoardOpen=false,chosenHires=new Set();
let rosterOpen=false,rosterFocusId=null;
const names=['Elara','Bram','Seren','Torr','Nyx','Aldric','Veda','Kestrel','Rowan','Mira','Dain','Iris','Sable','Thorne'],classes=['Knight','Rogue','Mage','Ranger','Cleric','Mercenary'],colors=['#b9a4a0','#8795a8','#b093bd','#9ab49d','#d1af73','#a48d87'],needs=['potion','potion','torch','bandage','blade','torch','bandage','forged'];
const r=(a,b)=>a+Math.random()*(b-a),esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function persist(){try{localStorage.setItem(key,JSON.stringify(s))}catch(e){}}
function say(msg){s.events.unshift(msg);s.events=s.events.slice(0,45);$('tickerText').textContent=msg;panelDirty=true}
function feedback(msg){
 // Shop transactions continue while watching the dungeon, but only the shop
 // may interrupt play with commerce notifications.
 if(view!=='shop')return;
 const el=$('feedbackToast');
 el.textContent=msg;el.classList.remove('hidden');clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>el.classList.add('hidden'),3300);
}
function flashStat(id,rising){
 const el=$(id);
 if(!el)return;
 el.classList.remove('rise','fall');
 void el.offsetWidth;
 el.classList.add(rising?'rise':'fall');
 setTimeout(()=>el.classList.remove('rise','fall'),650);
}
function save(){persist();$('tickerText').textContent='◇ Progress saved to this device.';feedback('◇ Progress saved safely.')}
function visitorChoicesMarkup(enc){
 return enc.choices.map(choice=>{
  const noGold=(choice.gold||0)<0&&s.gold<-(choice.gold||0);
  const noItems=choice.item&&(s.stock[choice.item]||0)<choice.qty;
  const noRoom=choice.stockItem&&(s.stock[choice.stockItem]||0)+choice.stockQty>(s.upgrades.shelf?30:14);
  return '<button type="button" class="visitor-choice" data-visitor-choice="'+esc(choice.id)+'" '+(noGold||noItems||noRoom?'disabled':'')+'><strong>'+esc(choice.label)+'</strong><small>'+esc(choice.desc)+'</small></button>';
 }).join('');
}
function presentVisitor(){
 const id=s.pendingEncounter,enc=E.visitorEncounters[id];
 // Defer shop-only encounters until the player returns from the dungeon.
 if(!enc||!active||view!=='shop')return;
 visitorOpen=true;$('npcCard').classList.add('hidden');
 $('visitorIcon').textContent=enc.icon;$('visitorTitle').textContent=enc.title;
 $('visitorWho').textContent=enc.who;$('visitorStory').textContent=enc.story;
 $('visitorChoices').innerHTML=visitorChoicesMarkup(enc);
 $('visitorHint').textContent='';$('visitorOverlay').classList.remove('hidden');
 persist();
}
function chooseVisitor(choiceId){
 const id=s.pendingEncounter;
 const tx=E.resolveVisitor(s,id,choiceId);
 if(!tx.ok){$('visitorHint').textContent=tx.reason;return;}
 visitorOpen=false;$('visitorOverlay').classList.add('hidden');
 const enc=E.visitorEncounters[id];
 say(enc.title+': '+tx.message);
 feedback('✦ '+tx.message);persist();paintPanel();
}
$('visitorChoices').addEventListener('click',e=>{
 const b=e.target.closest('button[data-visitor-choice]');
 if(b&&!b.disabled)chooseVisitor(b.dataset.visitorChoice);
});

function currentContractRun(){
 return C.ensure(s).runs.find(run=>run.id===contractRunId)||null;
}
function refreshContractBadge(){
 const count=C.unclaimedCount(s);
 $('contractAlert').classList.toggle('hidden',count===0);
 $('contractsButton').setAttribute('aria-label',count?'Open the Contract Board, '+count+' contract'+(count===1?'':'s')+' ready to settle':'Open the Contract Board');
}
function contractStatusLine(run){
 if(run.status==='returning'){
  const heroes=run.instance.dungeon.adventurers;
  return 'RETURNING TO PORTAL '+heroes.filter(a=>a.status==='extracted').length+'/'+heroes.length;
 }
 const p=C.progress(run);
 const label={reach:'FLOOR',escort:'ESCORT FLOOR',boss:'RAID BOSS',defeat:'MONSTERS',gather:'SALVAGE',treasure:'RELICS'}[run.offer.kind]||'PROGRESS';
 return label+' '+p.value+' / '+p.target;
}
function classEmblem(cls){
 const id=classes.includes(cls)?cls.toLowerCase():null;
 return id?'<img class="class-icon" src="sprites/ui/classes/'+id+'.png" alt="" aria-hidden="true" loading="lazy">':'';
}
function conditionBadge(a,occupied){
 const state=occupied?'busy':a.injury>0?'injured':a.fatigue>=70?'exhausted':'ready';
 const label=occupied?'ON CONTRACT':state==='injured'?'INJURED':state==='exhausted'?'EXHAUSTED':'READY';
 return '<span class="guild-status guild-'+state+'"><img src="sprites/ui/condition/'+state+'.png" alt="" aria-hidden="true">'+label+'</span>';
}
function rankBadge(rank){
 const tier=/^[EDS CBR]$/.test(rank)?rank:'E';
 return '<span class="contract-rank rank-'+esc(tier)+'">RANK '+esc(tier)+'</span>';
}
function runBadge(status){
 const kind=['completed','failed','claimed','returning','active'].includes(status)?status:'active';
 const label={completed:'PAYMENT READY',failed:'SETTLE FAILURE',claimed:'SETTLED',returning:'EXTRACTING · LOCKED',active:'IN PROGRESS'}[kind];
 return '<span class="guild-status run-'+kind+'">'+label+'</span>';
}
function returnProgress(run){
 if(run.status!=='returning')return '';
 const party=run.instance?.dungeon?.adventurers||[];
 const finished=party.filter(a=>a.status==='extracted').length;
 const pct=party.length?Math.round(finished/party.length*100):0;
 return '<div class="contract-return-track" role="progressbar" aria-label="Adventurers extracted" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><span style="width:'+pct+'%"></span></div><small>Payment unlocks only after all surviving adventurers use the entrance portal.</small>';
}
function renderContractBoard(){
 const c=C.ensure(s),busy=C.busyIds(c);
 for(const id of Array.from(chosenHires))if(!c.staff.some(a=>a.id===id)||busy.has(id))chosenHires.delete(id);
 const roster=c.staff.map(a=>{
  const occupied=busy.has(a.id),selected=chosenHires.has(a.id);
  const ready=!occupied&&a.injury<=0&&a.fatigue<70;
  return '<article class="contract-entry contract-hire-card"><div class="guild-identity">'+classEmblem(a.cls)+'<strong>'+esc(a.name)+'</strong>'+conditionBadge(a,occupied)+'</div><p>'+esc(a.cls)+' · LV '+a.level+' · XP '+(a.xp||0)+' · '+esc(a.trait||'Steadfast')+'</p><small>'+esc(a.gear||'Contract Kit')+' · FATIGUE '+Math.round(a.fatigue||0)+'% · INJURY '+(a.injury||0)+'</small><div class="contract-entry-actions"><button data-contract-action="select" data-id="'+esc(a.id)+'" '+(!ready?'disabled':'')+' class="'+(selected?'selected':'')+'">'+(occupied?'BUSY':!ready?'RECOVER FIRST':selected?'✓ SELECTED':'SELECT')+'</button>'+(!occupied?'<button data-contract-action="equip" data-id="'+esc(a.id)+'" data-item="blade" '+(!s.stock.blade?'disabled':'')+'>⚔ GEAR</button><button data-contract-action="equip" data-id="'+esc(a.id)+'" data-item="potion" '+(!s.stock.potion?'disabled':'')+'>✚ POTION</button>':'')+'</div></article>';
 }).join('');
 const offers=c.offers.map(o=>'<article class="contract-entry contract-offer"><div class="guild-identity">'+rankBadge(o.rank)+'<span class="contract-type">'+esc(({defeat:'⚔ EXTERMINATION',gather:'▣ SALVAGE',escort:'♧ ESCORT',treasure:'✦ TREASURE',boss:'☠ RAID',reach:'⇧ EXPLORATION'}[o.kind]||'◈ EXPEDITION'))+'</span></div><strong>'+esc(o.title)+'</strong><p>'+esc(o.desc)+'</p><small>REWARD '+o.reward+'G · +'+o.rep+' REP · '+(o.minParty||1)+'–'+(o.maxParty||5)+' HEROES</small><div class="contract-entry-actions"><button data-contract-action="start" data-id="'+esc(o.id)+'" '+(chosenHires.size<(o.minParty||1)||chosenHires.size>(o.maxParty||5)?'disabled':'')+'>SEND SELECTED PARTY</button></div></article>').join('');
 const applicants=c.applicants.map(a=>'<article class="contract-entry"><div class="guild-identity">'+classEmblem(a.cls)+'<strong>'+esc(a.name)+' · '+esc(a.cls)+'</strong></div><p>LEVEL '+a.level+' · '+esc(a.trait||'')+'</p><small>HIRING FEE '+a.fee+'G</small><div class="contract-entry-actions"><button data-contract-action="hire" data-id="'+esc(a.id)+'" '+(s.gold<a.fee||c.staff.length>=C.maxHired?'disabled':'')+'>HIRE '+a.fee+'G</button></div></article>').join('');
 const runs=c.runs.slice(0,12).map(run=>{
  const done=run.status==='completed'||run.status==='failed',claimed=run.status==='claimed';
  return '<article class="contract-entry contract-run run-'+esc(run.status)+'"><div class="guild-identity">'+rankBadge(run.offer.rank)+runBadge(run.status)+'</div><strong>'+esc(run.offer.title)+'</strong><p>'+run.memberIds.length+' remaining · '+esc(contractStatusLine(run))+'</p>'+returnProgress(run)+(run.fallen?.length?'<p class="contract-death">☠ '+run.fallen.length+' fallen permanently</p>':'')+'<div class="contract-entry-actions">'+(!claimed?'<button data-contract-action="watch" data-id="'+esc(run.id)+'">WATCH RUN</button>':'')+(done?'<button data-contract-action="claim" data-id="'+esc(run.id)+'">'+(run.status==='failed'?'SETTLE FAILED RUN':'CLAIM '+run.offer.reward+'G')+'</button>':'')+'</div></article>';
 }).join('');
 $('contractBody').innerHTML='<section class="contract-column"><h3>✉ AVAILABLE CONTRACTS</h3><p class="contract-sub">PARTY '+chosenHires.size+'/5 · Select healthy hires from the roster, then dispatch.</p>'+(offers||'<p>No new postings today. Check tomorrow.</p>')+'</section>'+
 '<section class="contract-column"><h3>⚔ ADVENTURERS FOR HIRE</h3>'+(applicants||'<p>New applicants arrive tomorrow.</p>')+'<div class="contract-separator"></div><h3>YOUR ROSTER · '+c.staff.length+'/'+C.maxHired+'</h3>'+(roster||'<p>Hire an adventurer to start taking contracts.</p>')+'</section>'+
 '<section class="contract-column"><h3>◈ ACTIVE & FINISHED RUNS</h3>'+(runs||'<p>No expeditions yet.</p>')+'</section>';
}
function renderRoster(){
 E.ensureInventory(s);
 const c=C.ensure(s),busy=C.busyIds(c);
 if(!rosterFocusId||!c.staff.some(a=>a.id===rosterFocusId))rosterFocusId=c.staff[0]?.id||null;
 const list=c.staff.map(a=>{
  const working=busy.has(a.id),selected=chosenHires.has(a.id);
  const condition=working?'ON CONTRACT':a.injury>0?'INJURED':a.fatigue>=70?'EXHAUSTED':'READY';
  const flag=working?' working':a.injury>0?' injured':a.fatigue>=70?' tired':'';
  return '<button type="button" class="roster-entry'+(a.id===rosterFocusId?' focused':'')+'" data-roster-action="focus" data-id="'+esc(a.id)+'"><span class="roster-identity">'+classEmblem(a.cls)+'<span><strong>'+esc(a.name)+'</strong><small>'+esc(a.cls)+' · Lv '+a.level+' · '+esc(a.trait||'Steadfast')+'</small><span class="roster-mini-fatigue"><span style="width:'+Math.max(0,Math.min(100,Math.round(a.fatigue||0)))+'%"></span></span></span></span>'+conditionBadge(a,working)+(selected?'<span class="roster-selected">✓</span>':'')+'</button>';
 }).join('');
 const a=c.staff.find(hero=>hero.id===rosterFocusId);
 let detail='<div class="panel-tip">Hire a recruit from the Contract Board to manage them here.</div>';
 if(a){
  const working=busy.has(a.id),selected=chosenHires.has(a.id),ready=!working&&a.injury<=0&&a.fatigue<70;
  const equipped=a.equipment||{},items=Object.entries(E.items);
  const optionItems=items.filter(([id])=>(s.stock[id]||0)>0);
  const equipment=Object.entries(equipped).map(([slot,id])=>esc(slot.toUpperCase())+': '+esc(E.items[id]?.name||id)).join(' · ')||'No issued equipment';
  const gearChoices=optionItems.map(([id,it])=>'<option value="'+esc(id)+'">'+esc(it.name)+' ('+s.stock[id]+' available)</option>').join('');
  const healChoices=['bandage','potion','elixir'].filter(id=>(s.stock[id]||0)>0).map(id=>'<option value="'+id+'">'+esc(E.items[id].name)+' ('+s.stock[id]+' left)</option>').join('');
  detail='<div class="roster-detail-header"><div><small>GUILD ADVENTURER</small><div class="guild-identity">'+classEmblem(a.cls)+'<h3>'+esc(a.name)+'</h3></div><p>'+esc(a.cls)+' · Lv '+a.level+' · '+esc(a.trait||'Steadfast')+'</p>'+conditionBadge(a,working)+'</div><span class="contract-rank">XP '+(a.xp||0)+'</span></div>'+
  '<div class="roster-meters"><div><small>FATIGUE '+Math.round(a.fatigue||0)+'%</small><div class="roster-bar'+(a.fatigue>=70?' roster-danger':'')+'"><span style="width:'+Math.max(0,Math.min(100,Math.round(a.fatigue||0)))+'%"></span></div></div><div><small>INJURY '+(a.injury||0)+' · '+(a.injury>0?'NEEDS TREATMENT':a.fatigue>=70?'NEEDS REST':'READY')+'</small></div></div>'+
  '<p class="roster-kit">'+equipment+'</p><p class="roster-kit">A tired or injured adventurer cannot start another contract. Unassigned adventurers recover each new in-game day.</p>'+
  '<div class="roster-actions">'+
  '<button data-roster-action="assign" data-id="'+esc(a.id)+'" '+(!ready?'disabled':'')+' class="'+(selected?'selected':'')+'">'+(selected?'✓ IN PARTY':'ADD TO PARTY')+'</button>'+
  '<div class="roster-input-row"><select id="rosterGearSelect" '+(working||!gearChoices?'disabled':'')+'>'+gearChoices+'</select><button data-roster-action="equip" data-id="'+esc(a.id)+'" '+(working||!gearChoices?'disabled':'')+'>ISSUE GEAR</button></div>'+
  '<div class="roster-input-row"><select id="rosterHealSelect" '+(working||!healChoices?'disabled':'')+'>'+healChoices+'</select><button data-roster-action="treat" data-id="'+esc(a.id)+'" '+(working||!healChoices||(!a.injury&&!a.fatigue)?'disabled':'')+'>TREAT</button></div></div>';
 }
 $('rosterBody').innerHTML='<section class="roster-list"><h3>HIRED HEROES · '+c.staff.length+'/'+C.maxHired+'</h3>'+list+'</section><section class="roster-detail"><h3>ADVENTURER DETAILS · PARTY '+chosenHires.size+'/'+C.maxParty+'</h3>'+detail+'</section>';
}
function openRoster(){
 if(!active)return;
 contractBoardOpen=false;$('contractBoard').classList.add('hidden');
 rosterOpen=true;$('rosterScreen').classList.remove('hidden');
 $('rosterNotice').textContent='';
 renderRoster();
}
function closeRoster(shop=false){
 rosterOpen=false;$('rosterScreen').classList.add('hidden');
 if(shop&&view!=='shop')closeDungeon(true);
}
$('rosterButton').addEventListener('click',openRoster);
$('boardRoster').addEventListener('click',openRoster);
$('rosterClose').addEventListener('click',()=>closeRoster(true));
$('rosterContracts').addEventListener('click',()=>{closeRoster();openContractBoard()});
$('rosterBody').addEventListener('click',e=>{
 const b=e.target.closest('button[data-roster-action]');
 if(!b||b.disabled)return;
 const id=b.dataset.id,action=b.dataset.rosterAction;
 if(action==='focus'){rosterFocusId=id;renderRoster();return;}
 if(action==='assign'){
  if(chosenHires.has(id))chosenHires.delete(id);
  else{
   if(chosenHires.size>=C.maxParty){$('rosterNotice').textContent='Party limit: five adventurers.';return;}
   const ready=C.readiness(s,id);
   if(!ready.ok){$('rosterNotice').textContent=ready.reason;return;}
   chosenHires.add(id);
  }
  $('rosterNotice').textContent='Party updated. Open Contracts to send them out.';
  renderRoster();return;
 }
 const itemId=action==='equip'?$('rosterGearSelect')?.value:$('rosterHealSelect')?.value;
 if(!itemId)return;
 const result=action==='equip'?C.equip(s,id,itemId):C.treat(s,id,itemId);
 $('rosterNotice').textContent=result.ok?(action==='equip'?'Equipment issued.':'Recovery treatment applied.'):result.reason;
 if(result.ok){persist();paintPanel();renderRoster();}
});
function openContractBoard(){
 if(!active)return;
 rosterOpen=false;$('rosterScreen').classList.add('hidden');
 contractBoardOpen=true;
 $('npcCard').classList.add('hidden');
 $('contractBoard').classList.remove('hidden');
 $('contractNotice').textContent='';
 renderContractBoard();refreshContractBadge();
}
function closeContractBoard(shop=false){
 contractBoardOpen=false;$('contractBoard').classList.add('hidden');
 if(shop&&view!=='shop')closeDungeon(true);
}
function watchContract(id){
 const run=C.ensure(s).runs.find(x=>x.id===id);
 if(!run||run.status==='claimed')return;
 contractRunId=id;view='contract';cameraX=0;floorOffset=1;followId=run.instance.dungeon.adventurers[0]?.id||null;
 $('contractBoard').classList.add('hidden');contractBoardOpen=false;
 $('dungeonControls').classList.remove('hidden');
 $('dungeonBack').textContent='‹ CONTRACTS';
 $('dungeonFollow').classList.add('hidden');$('dungeonFloorMenuButton').classList.add('hidden');
 $('scene').closest('.scene-wrap').classList.add('dungeon-mode');
 $('sceneHeading').innerHTML='<i class="pulse"></i> GUILD CONTRACT • '+esc(run.offer.title.toUpperCase());
 $('sceneHint').textContent='◈ AUTO-FOLLOW ON · ONLY YOUR CONTRACT PARTY IS VISIBLE';
 $('npcCard').classList.add('hidden');closeFloorMenu();
 $('feedbackToast').classList.add('hidden');
 persist();
}
function contractNotice(message){$('contractNotice').textContent=message;}
$('contractsButton').addEventListener('click',openContractBoard);
$('contractClose').addEventListener('click',()=>closeContractBoard(true));
$('contractShop').addEventListener('click',()=>closeContractBoard(true));
$('contractBody').addEventListener('click',e=>{
 const b=e.target.closest('button[data-contract-action]');if(!b||b.disabled)return;
 const id=b.dataset.id,action=b.dataset.contractAction;
 if(action==='select'){
  if(chosenHires.has(id))chosenHires.delete(id);
  else if(chosenHires.size<C.maxParty)chosenHires.add(id);
  else {contractNotice('A party may have at most five adventurers.');return;}
  renderContractBoard();return;
 }
 if(action==='watch'){watchContract(id);return;}
 let result;
 if(action==='hire'){
  result=C.hire(s,id);
  if(result.ok)chosenHires.add(id);
 }else if(action==='start'){
  result=C.start(s,id,Array.from(chosenHires));
  if(result.ok)chosenHires.clear();
 }else if(action==='equip')result=C.equip(s,id,b.dataset.item);
 else if(action==='claim')result=C.claim(s,id);
 if(result){
  const message=result.ok?action==='hire'?'Adventurer hired and ready.':action==='equip'?'Equipment issued to '+result.adventurer.name+'.':action==='start'?'Expedition launched! Tap WATCH RUN to follow.':result.success?'Contract settled: +'+result.reward+'G, salvage and loot.':'Expedition settled without payment.':result.reason;
  contractNotice(message);
  if(result.ok){say(message);persist();hud();paintPanel();}
  renderContractBoard();refreshContractBadge();
 }
});
$('contractClaim').addEventListener('click',()=>{
 const run=currentContractRun();if(!run)return;
 const tx=C.claim(s,run.id);
 if(tx.ok){say(tx.success?'Contract paid: +'+tx.reward+'G, salvage recovered.':'Failed contract settled.');persist();}
 openContractBoard();renderContractBoard();refreshContractBadge();
});
function paintContractReport(){
 const run=currentContractRun(),panel=$('contractReport');
 if(view!=='contract'||!run||(run.status!=='completed'&&run.status!=='failed')){panel.classList.add('hidden');return;}
 panel.classList.remove('hidden');
 $('contractReportText').textContent=run.offer.title+' — '+(run.status==='completed'?'COMPLETE! '+run.offer.reward+'G reward, +'+run.offer.rep+' reputation and salvage.':'FAILED. No reward.')+(run.fallen?.length?' ☠ '+run.fallen.length+' adventurer(s) lost permanently.':'');
 $('contractClaim').textContent=run.status==='completed'?'CLAIM PAYMENT':'CLOSE REPORT';
}
function hud(){
 if(shownGold!==null&&s.gold!==shownGold)flashStat('goldStat',s.gold>shownGold);
 if(shownRep!==null&&s.reputation!==shownRep)flashStat('repStat',s.reputation>shownRep);
 shownGold=s.gold;shownRep=s.reputation;
 $('goldValue').textContent=Math.floor(s.gold).toLocaleString();
 $('repValue').textContent=s.reputation;
 $('dayValue').textContent=s.day;
 $('depthValue').textContent='FLOOR '+((view==='dungeon'||view==='contract')?floorOffset:s.depth);
 $('visitorsValue').textContent=s.visitors;
 $('liveStatus').textContent=paused?'SHOP CLOSED':visitorOpen?'VISITOR AT DOOR':s.clock<24?'DAWN TRADE':s.clock<69?'MARKET OPEN':'DUSK WATCH';
 $('safetyNote').textContent=s.upgrades.guard?'⚔ THREAT: GUARDED':'⚔ THREAT: UNEASY';
 const ids=Object.keys(E.items).filter(id=>id!=='forged'||s.upgrades.forge);
 const empty=ids.filter(id=>(s.stock[id]||0)===0).length;
 const low=ids.filter(id=>(s.stock[id]||0)<=2).length;
 const chip=$('stockSignal');chip.classList.toggle('danger',empty>0);
 chip.classList.toggle('warn',empty===0&&low>0);
 chip.textContent=empty?empty+' OUT OF STOCK':low?low+' LOW SUPPLIES':'SUPPLIES READY';
 $('dayProgressFill').style.width=Math.max(0,Math.min(100,s.clock/95*100))+'%';
}
function paintPanel(){if(!active)return;E.ensureInventory(s);hud();const labels={stock:'MERCHANT INVENTORY',craft:'WORKBENCH & MATERIALS',upgrade:'EXPAND YOUR SHOP',ledger:'THE BLACK LEDGER'};$('panelTitle').innerHTML=labels[tab]+' <small>◈ '+(tab==='stock'?'LIVE':'MANAGE')+'</small>';
let html='';
if(tab==='stock'){const order=E.commission(s);html+='<article class="commission"><div class="commission-top"><span>✉ GUILD SUPPLY ORDER</span><b>DAY '+s.day+'</b></div><div class="commission-name">'+order.qty+' × '+esc(E.items[order.id].name)+'</div><div class="commission-bottom"><span>REWARD '+order.reward+'G · +3 REP</span><button class="action-btn" data-action="commission" '+(order.claimed||(s.stock[order.id]||0)<order.qty?'disabled':'')+'>'+(order.claimed?'DELIVERED ✓':'DELIVER')+'</button></div></article>';for(const [id,it] of Object.entries(E.items)){const qty=s.stock[id]||0,limit=s.upgrades.shelf?30:14,disabled=s.gold<it.cost*3||qty+3>limit;html+='<article class="item '+(qty===0?'out-stock':qty<=2?'low-stock':'')+'"><div class="item-top"><span class="item-name"><span class="item-icon">'+it.icon+'</span>'+esc(it.name)+'</span><span class="item-qty">'+qty+'/'+limit+'</span></div><div class="item-meta">'+esc(it.desc)+'</div><div class="item-bot"><div class="price-controls"><button data-action="price" data-id="'+id+'" data-dir="-1">−</button><b>'+s.price[id]+'G</b><button data-action="price" data-id="'+id+'" data-dir="1">+</button></div>'+(id==='forged'?'<small>CRAFT ONLY</small>':'<button data-action="restock" data-id="'+id+'" '+(disabled?'disabled':'')+'>+3 · '+it.cost*3+'G</button>')+'</div></article>'}html+='<div class="panel-tip">Set fair prices, watch stock levels, and supply dungeon-bound adventurers.</div>'}
if(tab==='craft'){html='<div class="ledger-grid"><div class="ledger-box"><small>SCRAP IRON</small><strong>⚒ '+s.mats.iron+'</strong></div><div class="ledger-box"><small>WILD HERBS</small><strong>❀ '+s.mats.herb+'</strong></div></div><article class="upgrade-card"><strong>✚ Brew Healing Potions</strong><p>Two potions, using wild herbs.</p><div class="recipe-footer"><span>2 herbs + 8G</span><button class="action-btn" data-action="craft" data-id="potion" '+(s.mats.herb<2||s.gold<8?'disabled':'')+'>BREW ×2</button></div></article><article class="upgrade-card"><strong>⚔ Reforge Dungeon Iron</strong><p>One longblade. Requires the Ember Forge.</p><div class="recipe-footer"><span>3 iron + 14G</span><button class="action-btn" data-action="craft" data-id="forged" '+(!s.upgrades.forge||s.mats.iron<3||s.gold<14?'disabled':'')+'>FORGE ×1</button></div></article><div class="panel-tip">Returning adventurers sometimes sell the shop salvage.</div>'}
if(tab==='craft'){
 E.ensureLoot(s);
 html+='<div class="panel-title">RARE FINDS · RESALE MARKET</div>';
 for(const [id,loot] of Object.entries(E.lootKinds)){
  const qty=s.loot[id]||0;
  html+='<article class="item"><div class="item-top"><strong><img class="rarity-icon" src="sprites/ui/rarity/'+esc(loot.rarity.toLowerCase())+'.png" alt="" aria-hidden="true">'+esc(loot.name)+'</strong><span class="item-qty">'+qty+' · '+loot.sell+'G</span></div><div class="item-meta">'+esc(loot.rarity)+' · Market price increases with reputation</div><div class="item-bot"><span class="hint">DUNGEON FIND / SHOP TRADE</span><button class="action-btn" data-action="sell-find" data-id="'+id+'" '+(!qty?'disabled':'')+'>SELL 1 · '+loot.sell+'G+</button></div></article>';
 }
}
if(tab==='upgrade'){for(const [id,u] of Object.entries(E.upgrades))html+='<article class="upgrade-card"><strong>⚒ '+esc(u.name)+'</strong><p>'+esc(u.desc)+'</p><div class="upgrade-bottom"><span>'+(s.upgrades[id]?'BUILT ✓':u.cost+' GOLD')+'</span><button class="action-btn" data-action="upgrade" data-id="'+id+'" '+(s.upgrades[id]||s.gold<u.cost?'disabled':'')+'>'+(s.upgrades[id]?'COMPLETE':'BUILD')+'</button></div></article>'}
if(tab==='ledger'){html='<div class="ledger-grid"><div class="ledger-box"><small>GROSS SALES</small><strong>'+s.earned+'G</strong></div><div class="ledger-box"><small>EXPENSES</small><strong>'+s.spent+'G</strong></div><div class="ledger-box"><small>ITEMS SOLD</small><strong>'+s.sales+'</strong></div><div class="ledger-box"><small>BANDIT RAIDS</small><strong>'+s.raidCount+'</strong></div><div class="ledger-box"><small>GUILD ORDERS</small><strong>'+(s.commissionsCompleted||0)+'</strong></div></div>'+s.events.map(e=>'<div class="log-entry">'+esc(e)+'</div>').join('')}
const panel=$('panelContent');
// Keep the same DOM nodes alive while the simulation updates in the background.
// Replacing them every frame/event can interrupt a tap mid-switch on Android.
if(tab!==lastPanelTab||html!==lastPanelHTML){
 const scroll=panel.scrollTop;
 panel.innerHTML=html;
 panel.scrollTop=tab===lastPanelTab?scroll:0;
 lastPanelHTML=html;lastPanelTab=tab;
}
panelDirty=false}
function spawn(){if(guests.length>=(s.upgrades.shelf?5:4))return;const i=Math.floor(r(0,classes.length));guests.push({id:++guestId,name:names[Math.floor(r(0,names.length))],cls:classes[i],color:colors[i],level:1+Math.floor(r(0,7+s.depth*3)),need:E.needsForClass(classes[i]),budget:Math.floor(r(30,160)+s.depth*16),returning:Math.random()<.62,x:-25,y:346+Math.floor(r(-3,17)),stage:0,hold:0,line:''})}
function transact(c){if(c.returning){const mat=Math.random()<.5?'iron':'herb',count=1+Math.floor(r(0,3)),cost=count*(mat==='iron'?8:5);const tx=E.buyLoot(s,mat,count,cost);c.line=tx.ok?'Loot sold':'No deal';if(tx.ok)feedback('⚒ Salvage acquired: '+count+' '+mat);say(tx.ok?c.name+' returned from the dungeon. Bought '+count+' '+mat+' for '+cost+'G.':c.name+' offered salvage, but the treasury was empty.')}else{let tx=E.attemptSale(s,c.need,c.budget,Math.random(),c.cls);c.line=tx.ok?'Thank you!':tx.reason==='out-of-stock'?'Out of stock!':'No sale';if(tx.ok){D.enter(s,c,E.items[c.need].name);feedback('◆ +'+tx.earned+'G • '+c.name+' made a purchase');}say(tx.ok?c.name+' the '+c.cls+' bought '+E.items[c.need].name+' for '+tx.earned+'G.':c.name+' the '+c.cls+' left without a purchase.')}persist()}
function tick(dt){
 if(!active||paused||visitorOpen)return;
 const dungeonReports=D.advance(s,dt);for(const report of dungeonReports)say('DUNGEON REPORT: '+report);
 const contractReports=C.advance(s,dt);for(const report of contractReports)say(report);
 if(contractReports.length){
  refreshContractBadge();persist();
  if(contractBoardOpen)renderContractBoard();
  if(rosterOpen&&contractReports.some(x=>/FALLEN IN ACTION|COMPLETE|FAILED/.test(x)))renderRoster();
  if(view==='contract'&&contractReports.some(r=>r.includes('FALLEN IN ACTION'))){
   $('npcCard').classList.add('hidden');$('partyRoster').classList.add('hidden');
   focusId=null;followId=currentContractRun()?.instance?.dungeon?.adventurers?.[0]?.id||null;
  }
 }
 s.clock+=dt;visitorCountdown-=dt;
 $('dayProgressFill').style.width=Math.max(0,Math.min(100,s.clock/95*100))+'%';
 // Queue one visitor in the background; never pause or cover the dungeon.
 if(!s.pendingEncounter&&visitorCountdown<=0&&s.lastVisitorDay!==s.day){
  const ids=Object.keys(E.visitorEncounters);
  s.pendingEncounter=ids[Math.floor(Math.random()*ids.length)];
  persist();
 }
 if(s.pendingEncounter&&view==='shop'){presentVisitor();return}
 next-=dt;if(next<=0){spawn();next=r(s.upgrades.lantern?2.7:3.8,s.upgrades.lantern?5.2:7.1)}for(const c of guests){if(c.stage===0){c.x+=dt*70;if(c.x>=520){c.x=520;c.stage=1;c.hold=1.2;transact(c)}}else if(c.stage===1){c.hold-=dt;if(c.hold<=0)c.stage=2}else c.x-=dt*94}guests=guests.filter(c=>c.x>-70||c.stage===0);
if(s.clock>=95){s.clock-=95;s.day++;visitorCountdown=r(14,29);const raid=E.raid(s,Math.random());say(raid.happened?'NIGHT RAID: Bandits stole '+raid.loss+'G.':'Dawn breaks over the dungeon. Day '+s.day+' begins.');persist()}
// Batch costly side-panel DOM work, while keeping tab taps immediate.
uiClock+=dt;if(uiClock>=.6){uiClock=0;hud();refreshContractBadge();if(panelDirty)paintPanel()}
clock+=dt;if(clock>=3){clock=0;persist()}}
function box(x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h))}
function stroke(x,y,w,h,color){g.strokeStyle=color;g.strokeRect(x,y,w,h)}
function drawActor(x,y,color,t,role,cls,stage){
 const walking=role==='customer'&&stage!==1;
 const pace=Math.sin(t*10+x/12),stride=walking?Math.round(pace*4):0;
 const bob=walking?Math.round(Math.abs(pace)*2):Math.round(Math.sin(t*2+x/34));
 const px=Math.round(x),py=Math.round(y+bob);
 g.fillStyle='#080d1099';g.beginPath();g.ellipse(px,py+9,13,4,0,0,Math.PI*2);g.fill();
 box(px-6+stride,py-7,5,16,'#292827');box(px+1-stride,py-7,5,16,'#242629');
 box(px-8,py-26,16,20,color);box(px-8,py-26,16,3,'#d7bf9966');
 box(px-5,py-37,10,11,'#c8a58b');box(px-6,py-41,12,6,'#3c3130');
 box(px-11,py-24,4,13+stride,'#ad9280');box(px+7,py-24,4,13-stride,'#ad9280');
 box(px-3,py-32,2,2,'#272629');box(px+3,py-32,2,2,'#272629');
 if(cls==='Knight'||cls==='Mercenary'){box(px-8,py-40,16,7,'#839398');box(px-10,py-26,5,6,'#9ca7a4');box(px+9,py-21,3,23,'#a9b3b4');}
 if(cls==='Rogue'){box(px-8,py-42,16,9,'#323a3c');box(px-11,py-27,4,22,'#3a3938');}
 if(cls==='Mage'){box(px-10,py-44,20,5,'#4e5572');box(px-5,py-48,10,6,'#5f6686');box(px+11,py-28,3,29,'#806541');box(px+10,py-30,5,5,'#b5a5dc');}
 if(cls==='Ranger'){box(px+9,py-31,3,31,'#9c7b4b');box(px+7,py-31,6,3,'#b79e60');box(px-6,py-29,12,5,'#46553d');}
 if(cls==='Cleric'){box(px-5,py-22,10,12,'#d4c7a7');box(px-1,py-21,2,9,'#8d704f');box(px-4,py-18,8,2,'#8d704f');}
 if(role==='merchant'){box(px-8,py-26,16,22,'#654737');box(px-2,py-24,4,11,'#d3b995');box(px-8,py-42,16,4,'#72583d');}
 if(role==='guard'){box(px-9,py-43,18,8,'#9ba6a9');box(px+11,py-36,3,45,'#c0b8a4');}
}
function stonework(x,y,w,h){box(x,y,w,h,'#343b3b');for(let yy=y;yy<y+h;yy+=26){for(let xx=x+((yy/26|0)%2)*18;xx<x+w;xx+=49){box(xx,yy,45,21,'#3f4240');box(xx,yy,45,3,'#56534b');box(xx+42,yy+3,3,18,'#222829')}}}
function torch(x,y,t){box(x-2,y,4,27,'#7b5434');let flicker=Math.sin(t*9+x)*3;box(x-5,y-13+flicker,10,16,'#a34b25');box(x-3,y-9+flicker,6,13,'#e7a45a');box(x-1,y-7+flicker,3,9,'#ffe4a0')}
function draw(t){if(view==='dungeon'||view==='contract'){drawDungeon(t);return}g.imageSmoothingEnabled=false;box(0,0,800,440,'#0c171e');
 for(let i=0;i<34;i++){let xx=(i*113+31)%800,yy=(i*47+11)%185;box(xx,yy,(i%3===0?2:1),2,'#8ca3a766')}
 for(let i=0;i<14;i++){let ridge=130+(i*19)%80;box(i*63,ridge,70,235,'#172226');box(i*63,ridge,65,4,'#283033')}
 for(let i=0;i<5;i++){let xx=((i*190+t*5)%1150)-200;box(xx,116+i*17,125,9,'#778e8e13')}

box(0,365,800,75,'#242c2b');
 for(let y=378;y<445;y+=16){box(0,y,800,2,'#343a37');for(let x=((y/16|0)%2)*22;x<800;x+=51){box(x+3,y+3,43,10,'#2e3431');box(x+3,y+3,38,2,'#3c4039')}}

// Dungeon, glowing portal and ancient gate.
stonework(15,150,260,215);box(56,206,180,160,'#0a151b');g.fillStyle='#071019';g.beginPath();g.arc(146,220,89,Math.PI,0);g.fill();const alpha=.3+.1*Math.sin(t*2);g.fillStyle='rgba(81,178,166,'+alpha+')';g.beginPath();g.ellipse(145,271,62,92,0,0,Math.PI*2);g.fill();for(let i=0;i<12;i++){const xx=145+Math.sin(t+i*2)*50,yy=185+((i*29+t*16)%170);box(xx,yy,3,3,'#83aaa0')}for(let i=0;i<12;i++){let a=Math.PI+i*Math.PI/11;box(146+99*Math.cos(a)-13,219-103*Math.sin(a)-9,28,19,'#61605a')}box(21,139,250,16,'#6e6659');box(49,140,20,223,'#4f4f49');box(231,140,20,223,'#4f4f49');g.fillStyle='#e4c48c';g.textAlign='center';g.font='bold 17px Georgia';g.fillText('THE HOLLOW',145,94);g.font='11px Georgia';g.fillText('D E S C E N T',145,110);torch(49,205,t);torch(241,205,t);g.font='bold 11px Arial';g.textAlign='center';g.fillStyle='#c6e8d8';g.fillText('TAP TO ENTER',145,337);
// Shop and sign.
stonework(297,82,470,269);box(288,72,488,19,'#241e1a');box(293,86,474,8,'#856447');
 for(let i=0;i<24;i++){box(293+i*20,70+(i%3),17,6,'#594334');box(300+i*20,78,14,5,'#8e6342')}
 box(690,114,47,55,'#58412d');box(696,122,35,43,'#765436');box(706,129,16,21,'#be9a64');box(712,133,5,13,'#3a3529');
box(300,339,469,64,'#3d3125');for(let yy=354;yy<408;yy+=12)box(303,yy,465,2,'#67513a');box(432,99,201,36,'#2a241e');stroke(432,99,201,36,'#a27a4a');g.fillStyle='#edd1a5';g.font='bold 13px Georgia';g.fillText('LAST LIGHT',532,114);g.font='9px Georgia';g.fillText('P R O V I S I O N S',532,125);
// Shelves and counter.
for(let j=0;j<2;j++){let x=330+j*115;box(x,163,92,12,'#62492f');box(x,233,92,12,'#62492f');box(x,164,6,95,'#4d3c2b');box(x+85,164,6,95,'#4d3c2b')}
for(let i=0;i<Math.min(7,s.stock.potion);i++){let x=345+i*10;box(x,143,11,18,'#6e3b3f');box(x+2,145,7,12,'#a9554f');box(x+3,138,4,5,'#c9b495')}
for(let i=0;i<Math.min(7,s.stock.torch);i++){box(335+i*11,212,4,22,'#926744')}
for(let i=0;i<Math.min(7,s.stock.bandage);i++)box(455+i*12,149,9,10,'#c2b7a0');
for(let i=0;i<Math.min(4,s.stock.blade);i++){box(479+i*17,210,3,27,'#b2b5b4');box(474+i*17,232,13,3,'#9d7550')}
box(432,285,203,70,'#58402b');box(425,278,218,15,'#97704a');box(439,350,188,6,'#241c18');drawActor(590,288,'#75604b',t,'merchant');
if(s.upgrades.forge){box(687,269,65,55,'#544039');box(705,279,35,10,'#e39c56');torch(722,269,t)}
if(s.upgrades.shelf){box(319,260,82,10,'#86633b');for(let i=0;i<5;i++)box(326+i*14,245,8,16,'#675c4f')}
if(s.upgrades.guard)drawActor(310,349,'#7e999b',t,'guard');
if(s.upgrades.lantern)torch(660,162,t);
torch(317,142,t);torch(648,142,t);
for(const c of guests){drawActor(c.x,c.y,c.color,t,'customer',c.cls,c.stage);g.textAlign='center';box(c.x-31,c.y-59,62,14,'#1e2424');g.font='bold 10px Arial';g.fillStyle='#ebd4aa';g.fillText(c.name,c.x,c.y-49);if(c.stage===1&&c.line){box(c.x-50,c.y-89,100,19,'#e4d3b3');g.fillStyle='#332822';g.fillText(c.line,c.x,c.y-75)}}
for(let i=0;i<20;i++){let x=(i*67+t*(i%2?17:-13)+8000)%800,y=(i*37+t*16)%440;box(x,y,2,8,'#8fa8ae30')}
// Dusk gently changes the color of the marketplace over the day.
const dusk=Math.max(0,Math.min(1,(s.clock-50)/45));
if(dusk){g.fillStyle='rgba(6,13,29,'+(dusk*.23)+')';g.fillRect(0,0,800,440)}
const shade=g.createLinearGradient(0,0,0,440);shade.addColorStop(0,'#00000088');shade.addColorStop(.4,'#00000000');shade.addColorStop(1,'#05070999');g.fillStyle=shade;g.fillRect(0,0,800,440);g.strokeStyle='#090c0d';g.lineWidth=9;g.strokeRect(0,0,800,440);
}

/* The dungeon is a second camera onto the same persistent merchant world. */
function cameraClamp(v){return Math.max(0,Math.min(D.worldWidth-800,v))}
function openDungeon(){
 D.ensure(s);contractRunId=null;view='dungeon';
 $('contractReport').classList.add('hidden');$('dungeonFollow').classList.remove('hidden');$('dungeonFloorMenuButton').classList.remove('hidden');$('dungeonBack').textContent='‹ SHOP';cameraX=0;floorOffset=1;drag=null;followId=null;focusId=null;updateFollowButton();
 $('npcCard').classList.add('hidden');$('partyRoster').classList.add('hidden');$('dungeonControls').classList.remove('hidden');
 closeFloorMenu();updateFloorPicker();
 $('sceneHeading').innerHTML='<i class="pulse"></i> THE HOLLOW DESCENT • EXPEDITION WATCH';
 $('sceneHint').textContent='◈ ONE FLOOR PER VIEW · TAP A HERO TO FOLLOW';
 $('scene').closest('.scene-wrap').classList.add('dungeon-mode');
 // Clear any toast started in the shop before entering the dungeon.
 clearTimeout(toastTimer);$('feedbackToast').classList.add('hidden');
 persist();
}
function closeDungeon(showDeferred=false){
 view='shop';contractRunId=null;drag=null;followId=null;focusId=null;
 $('contractReport').classList.add('hidden');$('dungeonFollow').classList.remove('hidden');$('dungeonFloorMenuButton').classList.remove('hidden');$('dungeonBack').textContent='‹ SHOP';
 $('dungeonControls').classList.add('hidden');closeFloorMenu();
 $('sceneHeading').innerHTML='<i class="pulse"></i> THE HOLLOW DESCENT • GATE MARKET';
 $('sceneHint').textContent='◈ TAP AN ADVENTURER TO INSPECT · TAP PORTAL TO ENTER';
 $('scene').closest('.scene-wrap').classList.remove('dungeon-mode');
 $('npcCard').classList.add('hidden');
 // The waiting customer is seen at the shop only after choosing to return.
 if(showDeferred&&active&&!paused&&s.pendingEncounter)presentVisitor();
}
function updateFollowButton(){
 const chosen=s.dungeon?.adventurers.find(a=>a.id===followId);
 $('dungeonFollow').textContent=chosen?'◉ '+chosen.name.toUpperCase():'◎ FOLLOW';
 $('dungeonFollow').classList.toggle('tracking',!!chosen);
}
function closeFloorMenu(){
 $('dungeonFloorMenu').classList.add('hidden');
 $('dungeonFloorMenuButton').setAttribute('aria-expanded','false');
}
function updateFloorPicker(){
 $('dungeonFloorMenuButton').textContent='▴ FLOORS · '+floorOffset;
 const menu=$('dungeonFloorMenu');
 if(!menu.childElementCount){
  menu.innerHTML=D.floorNames.map((name,i)=>'<button type="button" data-floor="'+(i+1)+'" aria-label="Floor '+(i+1)+': '+esc(name)+'"><strong>F'+(i+1)+'</strong><span>'+esc(name)+'</span></button>').join('');
 }
 menu.querySelectorAll('[data-floor]').forEach(button=>{
  const current=Number(button.dataset.floor)===floorOffset;
  button.classList.toggle('active',current);
  if(current)button.setAttribute('aria-current','true');
  else button.removeAttribute('aria-current');
 });
}
function selectDungeonFloor(floor){
 if(view==='contract')return;
 if(!Number.isInteger(floor)||floor<1||floor>D.floorCount)return;
 floorOffset=floor;followId=null;cameraX=0;
 updateFollowButton();updateFloorPicker();closeFloorMenu();
 $('npcCard').classList.add('hidden');
}
function dungeonFloor(delta){
 selectDungeonFloor(Math.max(1,Math.min(D.floorCount,floorOffset+delta)));
}
function dungeonBox(x,y,w,h,fill){box(x,y,w,h,fill)}
function drawMonster(x,y,kind,t,hp,maxHp){
 const m=D.monsterKinds[kind],wig=Math.round(Math.sin(t*4+x*.03)*2),px=Math.round(x),py=Math.round(y+wig);
 g.fillStyle='#0009';g.beginPath();g.ellipse(px,py+5,16,4,0,0,Math.PI*2);g.fill();
 dungeonBox(px-13,py-20,26,21,m.color);
 dungeonBox(px-9,py-25,18,8,m.color);
 dungeonBox(px-15,py-12,5,12,m.color);dungeonBox(px+11,py-12,5,12,m.color);
 dungeonBox(px-9,py-28,6,5,'#303636');dungeonBox(px+4,py-28,6,5,'#303636');
 dungeonBox(px-8,py-18,4,4,'#f5c186');dungeonBox(px+5,py-18,4,4,'#f5c186');
 if(kind===2||kind===7){dungeonBox(px-16,py-31,5,12,'#c6ba96');dungeonBox(px+12,py-31,5,12,'#c6ba96')}
 if(kind===4){dungeonBox(px-19,py-16,7,3,'#b3a1b6');dungeonBox(px+13,py-16,7,3,'#b3a1b6')}
 dungeonBox(px-15,py-36,30,3,'#392f2c');dungeonBox(px-15,py-36,Math.max(0,30*hp/maxHp),3,'#d58a70');
}
function drawDungeon(t){
 g.imageSmoothingEnabled=false;dungeonHit=[];
 const run=view==='contract'?currentContractRun():null;
 const ds=run?run.instance:s;
 const tracked=run?(ds.dungeon.adventurers.find(a=>a.id===followId&&a.status!=='recovering'&&a.status!=='extracted')||ds.dungeon.adventurers.find(a=>a.status!=='recovering'&&a.status!=='extracted')||null):followId&&s.dungeon.adventurers.find(a=>a.id===followId);
 if(tracked){
  if(tracked.floor!==floorOffset){floorOffset=tracked.floor;updateFloorPicker();$('npcCard').classList.add('hidden')}
  cameraX=cameraClamp(cameraX+(cameraClamp(tracked.x-370)-cameraX)*.16);
 }
 const floor=floorOffset,raid=floor===D.bossFloor;
 const palette=[
  ['#0c1e23','#20363a','#3b5254'],['#131f1a','#28372e','#4b5b44'],
  ['#251c1b','#4c312a','#855d3d'],['#191f27','#303a43','#59616b'],
  ['#102128','#2b4452','#426673'],['#251d2b','#413447','#665072'],
  ['#1e1c28','#3c334a','#6e5379'],['#210f1d','#432133','#8b4259']
 ][floor-1];
 dungeonBox(0,0,800,440,palette[0]);
 // Parallax cave walls: one large chamber occupies the entire canvas.
 for(let k=-1;k<12;k++){
  const xx=Math.round(k*150-(cameraX*.19%150));
  dungeonBox(xx,43,123,292,palette[1]);
  dungeonBox(xx+9,47,107,5,palette[2]);
  dungeonBox(xx+16,91,8,229,'#08141a88');
  dungeonBox(xx+100,91,8,229,'#08141a88');
  dungeonBox(xx+27,142,69,170,'#07131955');
  dungeonBox(xx+36,164,51,6,palette[2]);
 }
 for(let k=-1;k<12;k++){
  const xx=Math.round(k*157-(cameraX*.43%157));
  dungeonBox(xx,0,78,30,palette[1]);
  dungeonBox(xx+12,30,13,39,palette[2]);
  dungeonBox(xx+49,30,16,31,palette[2]);
  dungeonBox(xx+28,60,12,19,palette[1]);
 }
 dungeonBox(0,361,800,79,'#151a1c');dungeonBox(0,356,800,9,palette[2]);
 for(let tile=Math.floor(cameraX/59)-1;tile<Math.floor((cameraX+800)/59)+2;tile++){
  const xx=tile*59-cameraX;
  dungeonBox(xx+2,366,55,24,tile%2?'#2b3332':'#323637');
  dungeonBox(xx+5,369,48,3,'#59605a');
  dungeonBox(xx+11,398,42,13,'#252b2a');
  dungeonBox(xx+35,413,3,27,'#0c1214');
 }
 for(let light=0;light<12;light++){
  const x=148+light*194-cameraX;
  if(x<0||x>800)continue;
  dungeonBox(x-3,185,7,90,'#67523b');
  const flame=Math.round(Math.sin(t*9+light)*5);
  dungeonBox(x-13,174+flame,26,31,'#9d432d');
  dungeonBox(x-9,181+flame,18,24,'#e6a24e');
  dungeonBox(x-4,185+flame,9,14,'#ffe3a1');
 }
 // Exit portal is at the START of every floor (left side).
 {
  const x=65-cameraX;
  if(x>-95&&x<895){
   dungeonBox(x-32,224,64,132,'#525d59');
   dungeonBox(x-25,232,50,116,'#11262a');
   dungeonBox(x-21,239,42,105,'#277a80');
   dungeonBox(x-14,248,28,90,'#53afaa');
   dungeonBox(x-34,220,68,12,palette[2]);
   g.fillStyle='#d8f4e2';g.font='bold 10px Arial';g.textAlign='center';
   g.fillText('EXIT PORTAL',x,214);
  }
 }
 // The far end ALWAYS progresses to the next floor. The final raid floor
 // intentionally has NO portal or staircase at its far end.
 if(floor<D.bossFloor){
  const x=D.worldWidth-65-cameraX;
  if(x>-90&&x<890){
   dungeonBox(x-29,249,58,107,'#5e625b');
   dungeonBox(x-23,256,46,100,'#151c20');
   dungeonBox(x-19,277,38,76,'#393d41');
   dungeonBox(x-32,244,64,12,palette[2]);
   g.fillStyle='#e5c997';g.font='bold 10px Arial';g.textAlign='center';
   g.fillText('NEXT FLOOR →',x,234);
  }
 }
 // Adventure discoveries are rendered in the active floor instance only.
 for(const event of ds.dungeon.events||[]){
  if(event.floor!==floor)continue;
  const x=event.x-cameraX;
  if(x<-40||x>840)continue;
  // Each hero remembers discovered rooms independently. A shrine, chest or
  // trap appears used only after all active adventurers on that floor saw it.
  const present=ds.dungeon.adventurers.filter(a=>a.floor===floor&&a.hp>0&&a.status!=='recovering'&&a.status!=='extracted');
  const allDiscovered=present.length>0&&present.every(a=>(a.seenEvents||[]).includes(event.id));
  let drawn=false;
  if(window.DFSprites){
   g.save();g.translate(x,355);g.scale(event.type==='merchant'?1.28:1.65,event.type==='merchant'?1.28:1.65);
   drawn=window.DFSprites.drawEvent(g,event,t,allDiscovered);
   g.restore();
  }
  if(!drawn){
   const icons={chest:'▣',trap:'⚠',shrine:'✚',hidden:'✧',merchant:'◆'};
   const hues={chest:'#b9924c',trap:'#c76d55',shrine:'#88bbad',hidden:'#ae88cb',merchant:'#c9a968'};
   dungeonBox(x-15,316,30,38,'#1c2324');
   dungeonBox(x-13,320,26,30,hues[event.type]||'#a98d62');
   g.textAlign='center';g.font='bold 22px Georgia';g.fillStyle='#1d2425';
   g.fillText(icons[event.type]||'?',x,341);
  }
  g.textAlign='center';g.font='bold 9px Arial';g.fillStyle=allDiscovered?'#92b9a4':'#e3ce9d';
  g.fillText((allDiscovered?'EXPLORED · ':'')+event.type.toUpperCase(),x,event.type==='merchant'?282:306);
  dungeonHit.push({x,y:event.type==='merchant'?317:332,type:'event',ref:event});
 }
 // Filter on the selected floor before painting and collecting touch targets.
 for(const m of ds.dungeon.monsters){
  // Death frames continue briefly after HP reaches zero; dead monsters cannot
  // be selected or attacked again until their ordinary respawn timer expires.
  if(m.floor!==floor||(m.hp<=0&&!(m.deathFX>0)))continue;
  const x=m.x-cameraX;
  if(x<-115||x>915)continue;
  const spriteScale=m.boss?2:m.kind===7?1.85:2.15;
  g.save();g.translate(x,355);g.scale(spriteScale,spriteScale);
  const rendered=window.DFSprites&&window.DFSprites.drawMonster(g,m,t);
  if(!rendered&&m.hp>0)drawMonster(0,0,m.kind,t,m.hp,m.maxHp);
  g.restore();
  if(m.hp>0){
   if(m.boss){
    dungeonBox(x-80,184,160,9,'#2a131a');
    dungeonBox(x-78,186,156*Math.max(0,m.hp)/m.maxHp,5,'#da7384');
    g.textAlign='center';g.font='bold 12px Arial';g.fillStyle='#ffb3be';
    g.fillText('☠ ABYSSAL SOVEREIGN ☠',x,173);
   }else{
    const yy=m.kind===7?258:279;
    dungeonBox(x-21,yy,42,5,'#2b2228');
    dungeonBox(x-20,yy+1,40*Math.max(0,m.hp)/m.maxHp,3,'#d58a70');
   }
   dungeonHit.push({x,y:m.boss?285:325,type:'monster',ref:m});
  }
  if(window.DFSprites){
   if(m.deathFX>0){
    g.save();g.translate(x,317);window.DFSprites.drawEffect(g,'death_burst',1-m.deathFX/(m.deathDuration||.7),m.boss?2:1.2);g.restore();
   }else if(m.flash>0){
    g.save();g.translate(x,m.boss?263:316);window.DFSprites.drawEffect(g,'hit_flash',1-m.flash/.18,m.boss?2.2:1.1);g.restore();
   }
   if(m.attackFX>0&&m.hp>0){
    g.save();g.translate(x-35,m.boss?273:318);
    window.DFSprites.drawEffect(g,m.boss?'heavy_slash':'slash',1-m.attackFX/.5,m.boss?2:1.2);
    g.restore();
   }
  }
 }
 for(const a of ds.dungeon.adventurers){
  if(a.floor!==floor||a.status==='recovering'||a.status==='extracted')continue;
  const x=a.x-cameraX;
  if(x<-80||x>880)continue;
  const clsIndex=classes.indexOf(a.cls);
  g.save();g.translate(x,355);g.scale(2.1,2.1);
  if(!(window.DFSprites&&window.DFSprites.draw(g,a,t)))drawActor(0,0,colors[Math.max(0,clsIndex)]||'#a0a59a',t,'customer',a.cls,a.status==='fighting'?1:0);
  g.restore();
  dungeonBox(x-21,267,42,6,'#322827');
  dungeonBox(x-20,268,40*Math.max(0,a.hp)/a.maxHp,4,'#9ac293');
  if((a.fxTime||0)>0&&a.fxType){
   const isHeal=a.fxType==='healing_pulse';
   const duration=isHeal?.5:a.fxType==='hit_flash'?.22:.34;
   const progress=1-a.fxTime/duration;
   let played=false;
   if(window.DFSprites){
    g.save();g.translate(x+(isHeal?0:a.fxType==='arrow'?39:26),isHeal?317:a.fxType==='magic_bolt'?291:311);
    played=window.DFSprites.drawEffect(g,a.fxType,progress,a.fxType==='critical'?1.4:1.25);
    g.restore();
   }
   // Existing procedural effect remains available if a PNG fails on Android.
   if(!played&&!isHeal){
    if(a.fxType==='magic_bolt'){dungeonBox(x+17,289,18,18,'#9b83e6');dungeonBox(x+23,284,7,7,'#e8d7ff')}
    else if(a.fxType==='arrow'){dungeonBox(x+18,306,32,3,'#caa665');dungeonBox(x+44,302,8,10,'#dde5be')}
    else{dungeonBox(x+16,307,27,4,'#f4d4a2');dungeonBox(x+33,298,5,25,'#ffffffaa')}
   }else if(!played&&isHeal){
    dungeonBox(x-15,292,30,4,'#9fd6b2');dungeonBox(x-2,279,4,30,'#c5ecd1');
   }
  }
  g.textAlign='center';g.fillStyle='#f2e0c2';g.font='bold 12px Arial';
  g.fillText(a.name,x,260);
  g.font='bold 10px Arial';
  if(a.escort){g.fillStyle='#e0c28e';g.fillText('GUILD COURIER',x,280)}
  else if(a.partyId){g.fillStyle='#a9ced2';g.fillText('◆ '+a.partyId,x,280)}
  else{g.fillStyle='#e1bd8c';g.fillText('SOLO',x,280)}
  if(followId===a.id)stroke(x-29,276,58,82,'#e7cf91');
  dungeonHit.push({x,y:315,type:'adventurer',ref:a});
 }
 const heroes=ds.dungeon.adventurers.filter(a=>a.floor===floor&&a.status!=='recovering'&&a.status!=='extracted');
 const partyCount=new Set(heroes.filter(a=>a.partyId).map(a=>a.partyId)).size;
 const solos=heroes.filter(a=>!a.partyId).length;
 dungeonBox(0,0,800,42,'#091016ea');dungeonBox(0,41,800,2,palette[2]);
 g.textAlign='left';g.fillStyle='#f0d4a1';g.font='bold 17px Georgia';
 g.fillText('FLOOR '+floor+' / '+D.floorCount+'  •  '+D.floorNames[floor-1].toUpperCase(),14,25);
 g.textAlign='right';g.font='bold 11px Arial';g.fillStyle='#b6c8c5';
 g.fillText(run?'CONTRACT · '+contractStatusLine(run):partyCount+' PARTIES  /  '+solos+' SOLOS',785,25);
 if(raid){
  const boss=ds.dungeon.monsters.find(m=>m.boss&&m.floor===floor);
  dungeonBox(210,48,380,34,'#381922cc');
  g.textAlign='center';g.fillStyle='#f4b4c0';g.font='bold 14px Arial';
  g.fillText(boss&&boss.hp>0?'☠ RAID FLOOR • ABYSSAL SOVEREIGN ☠':'✦ RAID BOSS DEFEATED • RETURN TO ENTRANCE ✦',400,69);
 }
 // Keep contract context only; old floor and arrow-key instructions are gone.
 if(run){
  g.textAlign='left';g.font='bold 10px Arial';g.fillStyle='#b4c9c2';
  g.fillText('AUTO-FOLLOW · '+run.offer.title.toUpperCase(),12,429);
 }
 paintContractReport();
}
function showAdventurer(o){
 const ds=view==='contract'&&currentContractRun()?currentContractRun().instance:s;
 const members=o.partyId?D.partyMembers(ds,o.partyId):[];
 const card=$('npcCard'),roster=$('partyRoster');
 if(o.partyId){
  $('npcName').textContent='◆ PARTY '+o.partyId+' · '+members.length+' MEMBERS';
  $('npcMeta').textContent='TAP A MEMBER TO FOLLOW';
  $('npcText').textContent='SELECTED: '+o.name+' · '+o.cls+' · '+o.gear;
  roster.innerHTML=members.map(member=>{
   const selected=member.id===o.id;
   const pct=Math.max(0,Math.min(100,Math.round(100*member.hp/member.maxHp)));
   return '<button type="button" class="party-member'+(selected?' selected':'')+'" data-member-id="'+member.id+'" aria-label="Follow '+esc(member.name)+'">'+
     '<span class="party-member-top"><strong>'+esc(member.name)+'</strong><small>F'+member.floor+' · LV '+member.level+'</small></span>'+
     '<span class="party-member-role"><span>'+esc(member.cls)+' · '+esc(member.status)+'</span><small class="party-health">'+member.hp+'/'+member.maxHp+' HP</small></span>'+
     '<span class="party-hp"><span style="width:'+pct+'%"></span></span></button>';
  }).join('');
  roster.classList.remove('hidden');card.classList.add('party-open');
 }else{
  $('npcName').textContent=o.name+' the '+o.cls;
  $('npcMeta').textContent='SOLO · FLOOR '+o.floor+' · LV '+o.level+' · HP '+o.hp+'/'+o.maxHp;
  $('npcText').textContent='Status: '+o.status+'. Equipment: '+o.gear+'. Monsters defeated: '+(o.wins||0)+'.';
  roster.classList.add('hidden');card.classList.remove('party-open');
 }
 focusId=o.id;followId=o.id;updateFollowButton();
 card.classList.remove('hidden');
}
function inspectDungeon(x,y){
 let closest=null,best=Infinity;
 for(const target of dungeonHit){
  const dist=Math.hypot(target.x-x,(target.y+2)-y);
  if(dist<best&&dist<44){closest=target;best=dist}
 }
 if(!closest){$('npcCard').classList.add('hidden');return}
 const o=closest.ref;
 if(closest.type==='adventurer'){showAdventurer(o)}
 else if(closest.type==='event'){
  const names={chest:'Sealed Treasure Chest',trap:'Dungeon Trap',shrine:'Healing Shrine',hidden:'Hidden Chamber',merchant:'Wandering Trader'};
  const tips={chest:'A chest that may contain rare treasure.',trap:'Dangerous pressure plates may injure an adventurer.',shrine:'A sacred rest point that restores health.',hidden:'A secret chamber with unusual loot.',merchant:'A traveler who can refresh supplies.'};
  $('npcName').textContent=names[o.type]||'Dungeon Discovery';
  $('npcMeta').textContent='FLOOR '+o.floor+' · EXPLORATION EVENT';
  $('npcText').textContent=tips[o.type]||'A mysterious find.';
  $('partyRoster').classList.add('hidden');$('npcCard').classList.remove('party-open');$('npcCard').classList.remove('hidden');
 }
 else{
  const spec=D.monsterKinds[o.kind];
  $('npcName').textContent=spec.name;
  $('npcMeta').textContent='FLOOR '+o.floor+' · HP '+o.hp+'/'+o.maxHp;
  $('npcText').textContent=(o.boss?'RAID BOSS. Strong teams recommended. ':'Hostile dungeon creature. ')+'Damage: '+spec.damage+'.';
  $('partyRoster').classList.add('hidden');$('npcCard').classList.remove('party-open');
  $('npcCard').classList.remove('hidden');
 }
}
$('partyRoster').addEventListener('click',e=>{
 const button=e.target.closest('button[data-member-id]');
 if(!button)return;
 const ds=view==='contract'&&currentContractRun()?currentContractRun().instance:s;
 const a=ds.dungeon.adventurers.find(x=>x.id===Number(button.dataset.memberId));
 if(a)showAdventurer(a);
});
function scenePoint(e){const b=canvas.getBoundingClientRect();return{x:(e.clientX-b.left)*800/b.width,y:(e.clientY-b.top)*440/b.height}}
$('dungeonBack').addEventListener('click',()=>view==='contract'?openContractBoard():closeDungeon(true));
$('dungeonFollow').addEventListener('click',()=>{closeFloorMenu();if(followId){followId=null}else if(focusId){const target=s.dungeon.adventurers.find(a=>a.id===focusId);if(target)followId=target.id}updateFollowButton()});
$('dungeonFloorMenuButton').addEventListener('click',()=>{
 const menu=$('dungeonFloorMenu');
 const willOpen=menu.classList.contains('hidden');
 menu.classList.toggle('hidden',!willOpen);
 $('dungeonFloorMenuButton').setAttribute('aria-expanded',String(willOpen));
 if(willOpen)updateFloorPicker();
});
$('dungeonFloorMenu').addEventListener('click',e=>{
 const button=e.target.closest('button[data-floor]');
 if(button)selectDungeonFloor(Number(button.dataset.floor));
});
document.addEventListener('pointerdown',e=>{
 if(!$('dungeonFloorMenu').classList.contains('hidden')&&!e.target.closest('#dungeonFloorMenu')&&!e.target.closest('#dungeonFloorMenuButton'))closeFloorMenu();
});

function frame(now){
 // Always reschedule first so one unexpected UI error cannot permanently stop animation.
 requestAnimationFrame(frame);
 const dt=Math.min(.05,Math.max(0,(now-last)/1000||0));last=now;
 if(!active)return;
 try{
  tick(dt);
  // Thirty canvas draws per second is ample for the current pixel-art animation.
  if(now-renderDue>=33){renderDue=now;draw(now/1000)}
 }catch(err){
  console.error('Dungeonfront frame error',err);
  $('tickerText').textContent='Game interface error: please save and reopen the shop.';
  paused=true;persist();
  $('pauseOverlay').classList.remove('hidden');
 }
}requestAnimationFrame(frame);
function start(){E.ensureInventory(s);D.ensure(s);C.ensure(s);refreshContractBadge();closeDungeon();$('title').classList.add('hidden');$('intro').classList.add('hidden');$('game').classList.remove('hidden');active=true;paused=false;paintPanel();hud();if(s.pendingEncounter)presentVisitor();say('The bell rings. Adventurers are approaching the shop.')}
function title(){closeRoster();closeContractBoard();closeDungeon();active=false;paused=false;visitorOpen=false;$('visitorOverlay').classList.add('hidden');$('pauseOverlay').classList.add('hidden');$('game').classList.add('hidden');$('title').classList.remove('hidden');persist()}
function leaveIntro(){const v=$('introVideo');try{v.pause()}catch(e){}$('intro').classList.add('hidden');$('title').classList.remove('hidden')}
const introVideo=$('introVideo');
// WebView may momentarily render default media chrome while preparing the video.
// Never expose the element until playback has really started.
introVideo.controls=false;
introVideo.removeAttribute('controls');
introVideo.disablePictureInPicture=true;
introVideo.disableRemotePlayback=true;
introVideo.addEventListener('playing',()=>{
  introVideo.controls=false;
  $('intro').classList.remove('is-loading');
  $('intro').classList.add('is-playing');
  $('introPlay').classList.add('hidden');
});
$('skipIntro').onclick=leaveIntro;
introVideo.onended=leaveIntro;
introVideo.onerror=leaveIntro;
$('introPlay').onclick=()=>{introVideo.play().catch(()=>{$('introPlay').classList.remove('hidden')})};
$('startGame').onclick=start;$('pauseBtn').onclick=()=>{paused=true;$('pauseOverlay').classList.remove('hidden');persist();hud()};$('resumeBtn').onclick=()=>{paused=false;$('pauseOverlay').classList.add('hidden');hud()};$('returnTitle').onclick=title;$('saveBtn').onclick=save;$('closeNpc').onclick=()=>$('npcCard').classList.add('hidden');
$('panelContent').addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;let tx=null,id=b.dataset.id,action=b.dataset.action;if(action==='restock')tx=E.restock(s,id);if(action==='price'){E.setPrice(s,id,Number(b.dataset.dir));tx={ok:true}}if(action==='upgrade')tx=E.buyUpgrade(s,id);if(action==='craft')tx=E.craft(s,id);if(action==='commission')tx=E.fulfillCommission(s);if(action==='sell-find')tx=E.sellFind(s,id,1);if(tx?.ok){let msg=action==='restock'?'Restocked '+E.items[id].name+'.':action==='price'?'Price changed for '+E.items[id].name+'.':action==='upgrade'?'Built '+E.upgrades[id].name+'.':action==='commission'?'Guild shipment delivered! Earned '+tx.reward+'G and 3 reputation.':action==='sell-find'?'Sold '+E.lootKinds[id].name+' for '+tx.earned+'G.':'Crafted '+E.items[id].name+'.';say(msg);if(action!=='price')feedback('✦ '+msg);}else if(tx){say(tx.reason||'Not enough resources.');feedback('! '+(tx.reason||'Not enough resources.'));}persist();paintPanel()});
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
 tab=b.dataset.tab;
 document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x===b));
 $('panelContent').scrollTop=0;paintPanel();
});
canvas.addEventListener('pointerdown',e=>{
 drag={id:e.pointerId,start:scenePoint(e),cam:cameraX,moved:false};
 if(view==='dungeon'&&canvas.setPointerCapture)try{canvas.setPointerCapture(e.pointerId)}catch(err){}
});
canvas.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId||view!=='dungeon')return;
 const p=scenePoint(e),dx=p.x-drag.start.x;
 if(Math.abs(dx)>7){drag.moved=true;followId=null;cameraX=cameraClamp(drag.cam-dx);updateFollowButton()}
});
canvas.addEventListener('pointerup',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const p=scenePoint(e),start=drag.start,dx=p.x-start.x,dy=p.y-start.y,moved=drag.moved;
 drag=null;
 if(view==='dungeon'||view==='contract'){
  if(view==='contract'){if(Math.abs(dx)<12&&Math.abs(dy)<12)inspectDungeon(p.x,p.y);return;}
  if(Math.abs(dy)>35&&Math.abs(dy)>Math.abs(dx)){dungeonFloor(dy<0?1:-1);return}
  if(!moved&&Math.abs(dx)<12&&Math.abs(dy)<12)inspectDungeon(p.x,p.y);
  return;
 }
 if(Math.pow((p.x-145)/82,2)+Math.pow((p.y-267)/99,2)<1&&p.y>175&&p.y<367){openDungeon();return}
 const customer=guests.find(c=>Math.abs(c.x-p.x)<35&&Math.abs(c.y-25-p.y)<50);
 if(customer){
  selected=customer;$('partyRoster').classList.add('hidden');$('npcCard').classList.remove('party-open');$('npcName').textContent=customer.name+' the '+customer.cls;
  $('npcMeta').textContent='LEVEL '+customer.level+' · '+customer.budget+'G PURSE · FLOOR '+s.depth;
  $('npcText').textContent=customer.returning?'Returning with dungeon salvage.':'Looking for '+E.items[customer.need].name.toLowerCase()+' before entering the dungeon.';
  $('npcCard').classList.remove('hidden');
 }else{$('npcCard').classList.add('hidden');selected=null}
});
canvas.addEventListener('pointercancel',()=>{drag=null});
if(!new URLSearchParams(location.search).has('skipIntro')&&!new URLSearchParams(location.search).has('debugGame')){
  // Programmatic playback keeps media controls hidden; a custom play button is
  // only shown if the Android WebView refuses autoplay with audio.
  introVideo.play().catch(()=>{$('introPlay').classList.remove('hidden')});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){persist();last=performance.now()}});window.addEventListener('pagehide',persist);
window.Dungeonfront={handleBack(){if(!$('intro').classList.contains('hidden')){leaveIntro();return true}if(rosterOpen){closeRoster(true);return true}if(contractBoardOpen){closeContractBoard(true);return true}if(visitorOpen){
 const enc=E.visitorEncounters[s.pendingEncounter];
 if(enc)chooseVisitor(enc.choices[enc.choices.length-1].id);
 return true;
 }
 if(!$('dungeonFloorMenu').classList.contains('hidden')){closeFloorMenu();return true}if(!$('npcCard').classList.contains('hidden')){$('npcCard').classList.add('hidden');return true}if(view==='contract'){openContractBoard();return true}if(view==='dungeon'){closeDungeon(true);return true}if(!$('pauseOverlay').classList.contains('hidden')){$('resumeBtn').click();return true}if(active){$('pauseBtn').click();return true}return false},getState(){return JSON.parse(JSON.stringify(s))},skipIntro:leaveIntro,start,showTitle:title};
if(new URLSearchParams(location.search).has('skipIntro'))leaveIntro();
if(new URLSearchParams(location.search).has('debugGame'))start();
})();