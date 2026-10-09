/* Dungeonfront v3 fully illustrated sprite loader — isolated, opt-in.
 * Only valid 128x192 transparent PNG animation strips are allowed.
 * Until real painted frames exist, EVERY actor safely falls through to v2/v1.
 * Never stores flags or timing in save state, never loads from a network.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.DFIllustratedSprites=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const FRAME_W=128,FRAME_H=192,DRAW_W=72,DRAW_H=108;
 const classes=['Knight','Ranger','Mage','Cleric','Rogue','Mercenary'];
 const actionCounts={idle:8,walk:10,attack:12,hurt:5,death:12,special:12};
 const cache=Object.create(null);
 const readyClasses=new Set(); // No v3 assets ship in this branch.
 let enabled=false;
 function setEnabled(v){enabled=v===true;return enabled}
 function isEnabled(){return enabled}
 function approveClass(cls,approve){
  // Dev-only: opt in AFTER a real painted RGBA class pack has been reviewed.
  if(!classes.includes(cls))return false;
  if(approve===true)readyClasses.add(cls);else readyClasses.delete(cls);
  return readyClasses.has(cls);
 }
 function imagePath(cls,action){return 'sprites/actors_v3/'+cls.toLowerCase()+'/'+action+'.png'}
 function query(cls,action){
  if(!enabled||!readyClasses.has(cls)||!Object.prototype.hasOwnProperty.call(actionCounts,action)||typeof root.Image!=='function')return false;
  const key=cls+'/'+action;
  if(cache[key])return cache[key].state==='ready';
  const record={state:'loading',frames:actionCounts[action],img:new root.Image()};
  cache[key]=record;
  record.img.onload=function(){
   record.state=(record.img.naturalWidth===FRAME_W*record.frames&&record.img.naturalHeight===FRAME_H)?'ready':'invalid';
  };
  record.img.onerror=function(){record.state='missing'};
  try{record.img.src=imagePath(cls,action)}
  catch(_){record.state='missing'}
  return false;
 }
 function selectAction(a){
  return root.DFModernSprites?root.DFModernSprites.selectAction(a):'idle';
 }
 function frameIndex(a,action,t){
  return root.DFModernSprites?root.DFModernSprites.frameIndex(a,action,t):0;
 }
 function facing(a){
  return root.DFModernSprites?root.DFModernSprites.facing(a):1;
 }
 function draw(g,a,t){
  if(!enabled||!g||!a||!readyClasses.has(a.cls))return false;
  const action=selectAction(a);
  const key=a.cls+'/'+action;
  if(!cache[key]){query(a.cls,action);return false}
  const record=cache[key];
  if(record.state!=='ready')return false;
  let saved=false;
  try{
   g.save();saved=true;
   if(facing(a)<0)g.scale(-1,1);
   g.imageSmoothingEnabled=true;
   g.drawImage(record.img,frameIndex(a,action,t)*FRAME_W,0,FRAME_W,FRAME_H,
    -DRAW_W/2,-DRAW_H+1,DRAW_W,DRAW_H);
   g.restore();saved=false;
   return true;
  }catch(_){
   if(saved)try{g.restore()}catch(_e){}
   record.state='invalid';return false;
  }
 }
 function status(){
  const items=Object.values(cache);
  return {enabled,approved:Array.from(readyClasses),loaded:items.filter(x=>x.state==='ready').length,
   failed:items.filter(x=>x.state==='invalid'||x.state==='missing').length};
 }
 return {classes,FRAME_W,FRAME_H,DRAW_W,DRAW_H,actionCounts,readyClasses,
  imagePath,setEnabled,isEnabled,approveClass,selectAction,frameIndex,draw,status};
});
