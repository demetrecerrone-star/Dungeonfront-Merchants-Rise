/* Sprite renderer: optional, asynchronous, and safe for offline Android WebView. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.DFSprites=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const FRAME_W=32,FRAME_H=48;
const sheets=Object.create(null);
const classes=['Knight','Ranger','Mage','Cleric','Rogue','Mercenary'];
const frameCount={idle:4,walk:6,attack:6};
const fps={idle:5,walk:9,attack:12};
function key(cls,action){return cls.toLowerCase()+'/'+action}
function preload(){
 if(typeof root.Image!=='function')return 0;
 let requested=0;
 for(const cls of classes){
  for(const action of ['idle','walk','attack']){
   const id=key(cls,action);
   if(sheets[id])continue;
   const item={state:'loading',img:new root.Image(),frames:frameCount[action]};
   sheets[id]=item;
   item.img.onload=function(){
    item.state=(item.img.naturalWidth===FRAME_W*item.frames&&item.img.naturalHeight===FRAME_H)?'ready':'invalid';
   };
   item.img.onerror=function(){item.state='missing'};
   item.img.src='sprites/actors/'+id+'.png';
   requested++;
  }
 }
 return requested;
}
function selectAction(a){
 if((a.swing||0)>0&&(a.status==='fighting'||a.status==='exploring'))return 'attack';
 if(['exploring','escorting','returning','retreating'].includes(a.status))return 'walk';
 return 'idle';
}
function getFrame(a,action,t){
 const frames=frameCount[action]||4;
 if(action==='attack'){
  const swing=Math.max(0,Math.min(.23,Number(a.swing)||0));
  return Math.max(0,Math.min(frames-1,Math.floor((1-swing/.23)*frames)));
 }
 return Math.floor(Math.max(0,Number(t)||0)*fps[action])%frames;
}
function draw(g,a,t){
 if(!a||!classes.includes(a.cls))return false;
 const action=selectAction(a);
 const id=key(a.cls,action);
 const item=sheets[id];
 if(!item||item.state!=='ready')return false;
 const frame=getFrame(a,action,t);
 try{
  g.save();
  // Animation cells have a shared bottom-center pivot; returning heroes face left.
  if(a.status==='returning'||a.status==='retreating')g.scale(-1,1);
  g.imageSmoothingEnabled=false;
  g.drawImage(item.img,frame*FRAME_W,0,FRAME_W,FRAME_H,-FRAME_W/2,-FRAME_H+1,FRAME_W,FRAME_H);
  g.restore();
  return true;
 }catch(e){
  try{g.restore()}catch(_){} // canvas state must not leak into other actors
  item.state='invalid';
  return false;
 }
}

/* Monster art shares the same bottom-center pivot as the hero atlases.
   Action clocks are derived from simulation pulses so no new saved frame state
   or detached animation loop is required. */
const monsterIds=['slime','goblin','skeleton','imp','spider','wraith','hound','guardian','abyssal_sovereign'];
const monsterSizes=monsterIds.map((id,i)=>i===8?80:i===7?48:32);
const monsterActions={idle:{frames:4,fps:5},walk:{frames:6,fps:9},attack:{frames:6,fps:12},hurt:{frames:2,fps:12},death:{frames:6,fps:10},special:{frames:6,fps:10}};
const fxSpecs={
 slash:[32,32,4],heavy_slash:[48,48,5],arrow:[32,16,4],magic_bolt:[32,32,6],
 healing_pulse:[48,48,6],hit_flash:[32,32,3],critical:[48,48,5],death_burst:[48,48,6]
};
const monsters=Object.create(null),effects=Object.create(null);
function queueImage(cache,id,path,frameW,frameH,frames){
 if(typeof root.Image!=='function'||cache[id])return false;
 const item={state:'loading',img:new root.Image(),frameW,frameH,frames};
 cache[id]=item;
 item.img.onload=function(){item.state=item.img.naturalWidth===frameW*frames&&item.img.naturalHeight===frameH?'ready':'invalid'};
 item.img.onerror=function(){item.state='missing'};
 item.img.src=path;
 return true;
}
function preloadMonsters(){
 let n=0;
 for(let i=0;i<monsterIds.length;i++){
  const id=monsterIds[i],size=monsterSizes[i];
  for(const [action,spec] of Object.entries(monsterActions)){
   if(action==='special'&&i!==8)continue;
   if(queueImage(monsters,id+'/'+action,'sprites/monsters/'+id+'/'+action+'.png',size,size,spec.frames))n++;
  }
 }
 for(const [id,[w,h,frames]] of Object.entries(fxSpecs))
  if(queueImage(effects,id,'sprites/effects/'+id+'.png',w,h,frames))n++;
 return n;
}
function chooseMonsterAction(m){
 if((m.hp||0)<=0)return 'death';
 if((m.flash||0)>0)return 'hurt';
 if(m.boss&&(m.attackFX||0)>0)return 'special';
 if((m.attackFX||0)>0)return 'attack';
 if(!m.boss&&(m.phase||0)%4<2)return 'walk';
 return 'idle';
}
function monsterFrame(m,action,t){
 const spec=monsterActions[action];
 if(action==='death')return Math.min(spec.frames-1,Math.floor(Math.max(0,(m.deathDuration||.7)-(m.deathFX||0))*spec.frames/(m.deathDuration||.7)));
 if(action==='hurt')return Math.min(spec.frames-1,Math.floor((.18-Math.max(0,m.flash||0))*spec.frames/.18));
 if(action==='attack'||action==='special')return Math.min(spec.frames-1,Math.floor((.5-Math.max(0,m.attackFX||0))*spec.frames/.5));
 return Math.floor(Math.max(0,t)*spec.fps)%spec.frames;
}
function drawMonster(g,m,t){
 const id=monsterIds[m.kind];
 if(!id)return false;
 const action=chooseMonsterAction(m),item=monsters[id+'/'+action];
 if(!item||item.state!=='ready')return false;
 const frame=Math.max(0,Math.min(item.frames-1,monsterFrame(m,action,t)));
 try{
  g.save();
  g.imageSmoothingEnabled=false;
  g.drawImage(item.img,frame*item.frameW,0,item.frameW,item.frameH,-item.frameW/2,-item.frameH+1,item.frameW,item.frameH);
  g.restore();
  return true;
 }catch(e){try{g.restore()}catch(_){}item.state='invalid';return false;}
}
function drawEffect(g,id,progress,scale=1){
 const item=effects[id];
 if(!item||item.state!=='ready')return false;
 const pct=Math.max(0,Math.min(.999999,Number(progress)||0));
 const frame=Math.floor(pct*item.frames);
 try{
  g.save();g.scale(scale,scale);g.imageSmoothingEnabled=false;
  g.drawImage(item.img,frame*item.frameW,0,item.frameW,item.frameH,-item.frameW/2,-item.frameH/2,item.frameW,item.frameH);
  g.restore();return true;
 }catch(e){try{g.restore()}catch(_){}item.state='invalid';return false;}
}


/* Discoveries have stable world anchors and simulation-timed activation.
   Per-adventurer seenEvents remain the authoritative gameplay state; sprite
   changes never make an event claimable again or alter dungeon resources. */
const eventKinds=['chest','trap','shrine','hidden','merchant'];
const eventSheets=Object.create(null);
const eventSpecs={};
for(const kind of eventKinds){
 const height=kind==='merchant'?48:32;
 eventSpecs[kind]={
  idle:{frameW:32,frameH:height,frames:4,fps:5},
  activate:{frameW:32,frameH:height,frames:6,fps:12}
 };
}
function preloadEvents(){
 let count=0;
 for(const kind of eventKinds){
  for(const [action,spec] of Object.entries(eventSpecs[kind])){
   const id=kind+'/'+action;
   if(queueImage(eventSheets,id,'sprites/events/'+kind+'/'+action+'.png',spec.frameW,spec.frameH,spec.frames))count++;
  }
 }
 return count;
}
function eventAnimation(event,allDiscovered){
 return (event.visualPulse||0)>0||allDiscovered?'activate':'idle';
}
function eventFrame(event,action,t,allDiscovered){
 if(action==='idle')return Math.floor(Math.max(0,t)*5)%4;
 if((event.visualPulse||0)>0)return Math.max(0,Math.min(5,Math.floor((1-event.visualPulse/.65)*6)));
 return allDiscovered?5:0;
}
function drawEvent(g,event,t,allDiscovered=false){
 if(!event||!eventKinds.includes(event.type))return false;
 const action=eventAnimation(event,allDiscovered),item=eventSheets[event.type+'/'+action];
 if(!item||item.state!=='ready')return false;
 const frame=eventFrame(event,action,t,allDiscovered);
 try{
  g.save();g.imageSmoothingEnabled=false;
  g.drawImage(item.img,frame*item.frameW,0,item.frameW,item.frameH,-item.frameW/2,-item.frameH+1,item.frameW,item.frameH);
  g.restore();return true;
 }catch(e){try{g.restore()}catch(_){}item.state='invalid';return false;}
}
function eventReadyCount(){return Object.values(eventSheets).filter(x=>x.state==='ready').length}

function readyCount(){return Object.values(sheets).filter(x=>x.state==='ready').length}
function status(){return {total:classes.length*3,ready:readyCount(),failed:Object.values(sheets).filter(x=>x.state==='invalid'||x.state==='missing').length}}
if(typeof root.Image==='function'){preload();preloadMonsters();preloadEvents();}
return{classes,frameCount,fps,preload,selectAction,getFrame,draw,readyCount,status,monsterIds,monsterSizes,monsterActions,fxSpecs,preloadMonsters,chooseMonsterAction,monsterFrame,drawMonster,drawEffect,eventKinds,eventSpecs,preloadEvents,eventAnimation,eventFrame,drawEvent,eventReadyCount};
});
