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
function readyCount(){return Object.values(sheets).filter(x=>x.state==='ready').length}
function status(){return {total:classes.length*3,ready:readyCount(),failed:Object.values(sheets).filter(x=>x.state==='invalid'||x.state==='missing').length}}
if(typeof root.Image==='function')preload();
return{classes,frameCount,fps,preload,selectAction,getFrame,draw,readyCount,status};
});
