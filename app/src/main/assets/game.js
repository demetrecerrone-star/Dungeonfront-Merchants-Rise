(function(){
'use strict';
const E=window.DFEconomy,$=id=>document.getElementById(id),key='dungeonfront_merchants_rise_save_v1';
let s=E.initialState();try{const old=JSON.parse(localStorage.getItem(key));if(E.valid(old))s=Object.assign(E.initialState(),old)}catch(e){}
const canvas=$('scene'),g=canvas.getContext('2d',{alpha:false});
let active=false,paused=false,tab='stock',guests=[],next=2,clock=0,last=performance.now(),selected=null,renderDue=0,guestId=0;
const names=['Elara','Bram','Seren','Torr','Nyx','Aldric','Veda','Kestrel','Rowan','Mira','Dain','Iris','Sable','Thorne'],classes=['Knight','Rogue','Mage','Ranger','Cleric','Mercenary'],colors=['#b9a4a0','#8795a8','#b093bd','#9ab49d','#d1af73','#a48d87'],needs=['potion','potion','torch','bandage','blade','torch','bandage','forged'];
const r=(a,b)=>a+Math.random()*(b-a),esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function persist(){try{localStorage.setItem(key,JSON.stringify(s))}catch(e){}}
function say(msg){s.events.unshift(msg);s.events=s.events.slice(0,45);$('tickerText').textContent=msg;paintPanel()}
function save(){persist();$('tickerText').textContent='◇ Progress saved to this device.'}
function hud(){$('goldValue').textContent=Math.floor(s.gold).toLocaleString();$('repValue').textContent=s.reputation;$('dayValue').textContent=s.day;$('depthValue').textContent='FLOOR '+s.depth;$('visitorsValue').textContent=s.visitors;$('liveStatus').textContent=paused?'SHOP CLOSED':'OPEN • ACTIVE';$('safetyNote').textContent=s.upgrades.guard?'⚔ THREAT: GUARDED':'⚔ THREAT: UNEASY'}
function paintPanel(){if(!active)return;hud();const labels={stock:'MERCHANT INVENTORY',craft:'WORKBENCH & MATERIALS',upgrade:'EXPAND YOUR SHOP',ledger:'THE BLACK LEDGER'};$('panelTitle').innerHTML=labels[tab]+' <small>◈ '+(tab==='stock'?'LIVE':'MANAGE')+'</small>';
let html='';
if(tab==='stock'){const order=E.commission(s);html+='<article class="commission"><div class="commission-top"><span>✉ GUILD SUPPLY ORDER</span><b>DAY '+s.day+'</b></div><div class="commission-name">'+order.qty+' × '+esc(E.items[order.id].name)+'</div><div class="commission-bottom"><span>REWARD '+order.reward+'G · +3 REP</span><button class="action-btn" data-action="commission" '+(order.claimed||(s.stock[order.id]||0)<order.qty?'disabled':'')+'>'+(order.claimed?'DELIVERED ✓':'DELIVER')+'</button></div></article>';for(const [id,it] of Object.entries(E.items)){const qty=s.stock[id]||0,limit=s.upgrades.shelf?30:14,disabled=s.gold<it.cost*3||qty+3>limit;html+='<article class="item '+(qty===0?'out-stock':qty<=2?'low-stock':'')+'"><div class="item-top"><span class="item-name"><span class="item-icon">'+it.icon+'</span>'+esc(it.name)+'</span><span class="item-qty">'+qty+'/'+limit+'</span></div><div class="item-meta">'+esc(it.desc)+'</div><div class="item-bot"><div class="price-controls"><button data-action="price" data-id="'+id+'" data-dir="-1">−</button><b>'+s.price[id]+'G</b><button data-action="price" data-id="'+id+'" data-dir="1">+</button></div>'+(id==='forged'?'<small>CRAFT ONLY</small>':'<button data-action="restock" data-id="'+id+'" '+(disabled?'disabled':'')+'>+3 · '+it.cost*3+'G</button>')+'</div></article>'}html+='<div class="panel-tip">Set fair prices, watch stock levels, and supply dungeon-bound adventurers.</div>'}
if(tab==='craft'){html='<div class="ledger-grid"><div class="ledger-box"><small>SCRAP IRON</small><strong>⚒ '+s.mats.iron+'</strong></div><div class="ledger-box"><small>WILD HERBS</small><strong>❀ '+s.mats.herb+'</strong></div></div><article class="upgrade-card"><strong>✚ Brew Healing Potions</strong><p>Two potions, using wild herbs.</p><div class="recipe-footer"><span>2 herbs + 8G</span><button class="action-btn" data-action="craft" data-id="potion" '+(s.mats.herb<2||s.gold<8?'disabled':'')+'>BREW ×2</button></div></article><article class="upgrade-card"><strong>⚔ Reforge Dungeon Iron</strong><p>One longblade. Requires the Ember Forge.</p><div class="recipe-footer"><span>3 iron + 14G</span><button class="action-btn" data-action="craft" data-id="forged" '+(!s.upgrades.forge||s.mats.iron<3||s.gold<14?'disabled':'')+'>FORGE ×1</button></div></article><div class="panel-tip">Returning adventurers sometimes sell the shop salvage.</div>'}
if(tab==='upgrade'){for(const [id,u] of Object.entries(E.upgrades))html+='<article class="upgrade-card"><strong>⚒ '+esc(u.name)+'</strong><p>'+esc(u.desc)+'</p><div class="upgrade-bottom"><span>'+(s.upgrades[id]?'BUILT ✓':u.cost+' GOLD')+'</span><button class="action-btn" data-action="upgrade" data-id="'+id+'" '+(s.upgrades[id]||s.gold<u.cost?'disabled':'')+'>'+(s.upgrades[id]?'COMPLETE':'BUILD')+'</button></div></article>'}
if(tab==='ledger'){html='<div class="ledger-grid"><div class="ledger-box"><small>GROSS SALES</small><strong>'+s.earned+'G</strong></div><div class="ledger-box"><small>EXPENSES</small><strong>'+s.spent+'G</strong></div><div class="ledger-box"><small>ITEMS SOLD</small><strong>'+s.sales+'</strong></div><div class="ledger-box"><small>BANDIT RAIDS</small><strong>'+s.raidCount+'</strong></div><div class="ledger-box"><small>GUILD ORDERS</small><strong>'+(s.commissionsCompleted||0)+'</strong></div></div>'+s.events.map(e=>'<div class="log-entry">'+esc(e)+'</div>').join('')}
const panel=$('panelContent'),scroll=panel.scrollTop;panel.innerHTML=html;panel.scrollTop=scroll}
function spawn(){if(guests.length>=(s.upgrades.shelf?5:4))return;const i=Math.floor(r(0,classes.length));guests.push({id:++guestId,name:names[Math.floor(r(0,names.length))],cls:classes[i],color:colors[i],level:1+Math.floor(r(0,7+s.depth*3)),need:needs[Math.floor(r(0,needs.length))],budget:Math.floor(r(30,160)+s.depth*16),returning:Math.random()<.3,x:-25,y:346+Math.floor(r(-3,17)),stage:0,hold:0,line:''})}
function transact(c){if(c.returning){const mat=Math.random()<.5?'iron':'herb',count=1+Math.floor(r(0,3)),cost=count*(mat==='iron'?8:5);const tx=E.buyLoot(s,mat,count,cost);c.line=tx.ok?'Loot sold':'No deal';say(tx.ok?c.name+' returned from the dungeon. Bought '+count+' '+mat+' for '+cost+'G.':c.name+' offered salvage, but the treasury was empty.')}else{let tx=E.attemptSale(s,c.need,c.budget,Math.random());c.line=tx.ok?'Thank you!':tx.reason==='out-of-stock'?'Out of stock!':'No sale';say(tx.ok?c.name+' the '+c.cls+' bought '+E.items[c.need].name+' for '+tx.earned+'G.':c.name+' the '+c.cls+' left without a purchase.')}persist()}
function tick(dt){if(!active||paused)return;s.clock+=dt;next-=dt;if(next<=0){spawn();next=r(s.upgrades.lantern?2.7:3.8,s.upgrades.lantern?5.2:7.1)}for(const c of guests){if(c.stage===0){c.x+=dt*70;if(c.x>=520){c.x=520;c.stage=1;c.hold=1.2;transact(c)}}else if(c.stage===1){c.hold-=dt;if(c.hold<=0)c.stage=2}else c.x-=dt*94}guests=guests.filter(c=>c.x>-70||c.stage===0);
if(s.clock>=95){s.clock-=95;s.day++;const raid=E.raid(s,Math.random());say(raid.happened?'NIGHT RAID: Bandits stole '+raid.loss+'G.':'Dawn breaks over the dungeon. Day '+s.day+' begins.');persist()}clock+=dt;if(clock>=3){clock=0;persist();paintPanel()}}
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
function draw(t){g.imageSmoothingEnabled=false;box(0,0,800,440,'#0c171e');
 for(let i=0;i<34;i++){let xx=(i*113+31)%800,yy=(i*47+11)%185;box(xx,yy,(i%3===0?2:1),2,'#8ca3a766')}
 for(let i=0;i<14;i++){let ridge=130+(i*19)%80;box(i*63,ridge,70,235,'#172226');box(i*63,ridge,65,4,'#283033')}
 for(let i=0;i<5;i++){let xx=((i*190+t*5)%1150)-200;box(xx,116+i*17,125,9,'#778e8e13')}

box(0,365,800,75,'#242c2b');
 for(let y=378;y<445;y+=16){box(0,y,800,2,'#343a37');for(let x=((y/16|0)%2)*22;x<800;x+=51){box(x+3,y+3,43,10,'#2e3431');box(x+3,y+3,38,2,'#3c4039')}}

// Dungeon, glowing portal and ancient gate.
stonework(15,150,260,215);box(56,206,180,160,'#0a151b');g.fillStyle='#071019';g.beginPath();g.arc(146,220,89,Math.PI,0);g.fill();const alpha=.3+.1*Math.sin(t*2);g.fillStyle='rgba(81,178,166,'+alpha+')';g.beginPath();g.ellipse(145,271,62,92,0,0,Math.PI*2);g.fill();for(let i=0;i<12;i++){const xx=145+Math.sin(t+i*2)*50,yy=185+((i*29+t*16)%170);box(xx,yy,3,3,'#83aaa0')}for(let i=0;i<12;i++){let a=Math.PI+i*Math.PI/11;box(146+99*Math.cos(a)-13,219-103*Math.sin(a)-9,28,19,'#61605a')}box(21,139,250,16,'#6e6659');box(49,140,20,223,'#4f4f49');box(231,140,20,223,'#4f4f49');g.fillStyle='#e4c48c';g.textAlign='center';g.font='bold 17px Georgia';g.fillText('THE HOLLOW',145,94);g.font='11px Georgia';g.fillText('D E S C E N T',145,110);torch(49,205,t);torch(241,205,t);
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
const shade=g.createLinearGradient(0,0,0,440);shade.addColorStop(0,'#00000088');shade.addColorStop(.4,'#00000000');shade.addColorStop(1,'#05070999');g.fillStyle=shade;g.fillRect(0,0,800,440);g.strokeStyle='#090c0d';g.lineWidth=9;g.strokeRect(0,0,800,440);
}
function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;if(active){tick(dt);draw(now/1000)}requestAnimationFrame(frame)}requestAnimationFrame(frame);
function start(){$('title').classList.add('hidden');$('intro').classList.add('hidden');$('game').classList.remove('hidden');active=true;paused=false;paintPanel();hud();say('The bell rings. Adventurers are approaching the shop.')}
function title(){active=false;paused=false;$('pauseOverlay').classList.add('hidden');$('game').classList.add('hidden');$('title').classList.remove('hidden');persist()}
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
$('panelContent').addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;let tx=null,id=b.dataset.id,action=b.dataset.action;if(action==='restock')tx=E.restock(s,id);if(action==='price'){E.setPrice(s,id,Number(b.dataset.dir));tx={ok:true}}if(action==='upgrade')tx=E.buyUpgrade(s,id);if(action==='craft')tx=E.craft(s,id);if(action==='commission')tx=E.fulfillCommission(s);if(tx?.ok){let msg=action==='restock'?'Restocked '+E.items[id].name+'.':action==='price'?'Price changed for '+E.items[id].name+'.':action==='upgrade'?'Built '+E.upgrades[id].name+'.':action==='commission'?'Guild shipment delivered! Earned '+tx.reward+'G and 3 reputation.':'Crafted '+E.items[id].name+'.';say(msg);}else if(tx)say(tx.reason||'Not enough resources.');persist();paintPanel()});
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x===b));paintPanel()});
canvas.addEventListener('pointerdown',e=>{let rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*800/rect.width,y=(e.clientY-rect.top)*440/rect.height;let c=guests.find(c=>Math.abs(c.x-x)<35&&Math.abs(c.y-25-y)<50);if(c){selected=c;$('npcName').textContent=c.name+' the '+c.cls;$('npcMeta').textContent='LEVEL '+c.level+' • '+c.budget+'G PURSE • FLOOR '+s.depth;$('npcText').textContent=c.returning?'Returning with dungeon salvage.':'Looking for '+E.items[c.need].name.toLowerCase()+' before entering the dungeon.';$('npcCard').classList.remove('hidden')}else{$('npcCard').classList.add('hidden');selected=null}});
if(!new URLSearchParams(location.search).has('skipIntro')&&!new URLSearchParams(location.search).has('debugGame')){
  // Programmatic playback keeps media controls hidden; a custom play button is
  // only shown if the Android WebView refuses autoplay with audio.
  introVideo.play().catch(()=>{$('introPlay').classList.remove('hidden')});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){persist();last=performance.now()}});window.addEventListener('pagehide',persist);
window.Dungeonfront={handleBack(){if(!$('intro').classList.contains('hidden')){leaveIntro();return true}if(!$('npcCard').classList.contains('hidden')){$('npcCard').classList.add('hidden');return true}if(!$('pauseOverlay').classList.contains('hidden')){$('resumeBtn').click();return true}if(active){$('pauseBtn').click();return true}return false},getState(){return JSON.parse(JSON.stringify(s))},skipIntro:leaveIntro,start,showTitle:title};
if(new URLSearchParams(location.search).has('skipIntro'))leaveIntro();
if(new URLSearchParams(location.search).has('debugGame'))start();
})();