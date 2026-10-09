/* Dungeonfront v2 actor renderer: optional, isolated, opt-in.
   The published app remains on v1 art. No image requests happen while disabled.
   Concept art is NOT a spritesheet and must not be loaded here. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.DFModernSprites=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const FRAME_W=128,FRAME_H=192,DRAW_W=72,DRAW_H=108;
const classes=['Knight','Ranger','Mage','Cleric','Rogue','Mercenary'];
const actions={
 idle:{frames:8,fps:8,loop:true},
 walk:{frames:10,fps:12,loop:true},
 attack:{frames:12,fps:20,loop:false},
 hurt:{frames:5,fps:15,loop:false},
 death:{frames:12,fps:14,loop:false},
 special:{frames:12,fps:18,loop:false}
};
const cache=Object.create(null);
let enabled=false;
// Preview art is limited to Knight. Other classes always use v1 until approved.
const approvedClasses=new Set(['Knight']);
function isEnabled(){return enabled}
function setEnabled(value){enabled=value===true;return enabled}
function validClass(cls){return typeof cls==='string'&&approvedClasses.has(cls)}
function key(cls,action){return cls.toLowerCase()+'/'+action}
function imagePath(cls,action){return 'sprites/actors_v2/'+key(cls,action)+'.png'}
function queue(cls,action){
 if(!enabled||!validClass(cls)||!Object.prototype.hasOwnProperty.call(actions,action)||typeof root.Image!=='function')return false;
 const id=key(cls,action);
 if(cache[id])return cache[id].state==='ready';
 const record={state:'loading',img:new root.Image(),frames:actions[action].frames};
 cache[id]=record;
 record.img.onload=function(){
  record.state=record.img.naturalWidth===FRAME_W*record.frames&&record.img.naturalHeight===FRAME_H?'ready':'invalid';
 };
 record.img.onerror=function(){record.state='missing'};
 try{
  // SVG strip is real, transparent, offline animation for the Knight prototype.
  // Final high-resolution art can replace it with the regular PNG atlas path.
  const preview=cls==='Knight'&&root.DFModernKnightArt&&root.DFModernKnightArt.sheet(action);
  record.img.src=preview||imagePath(cls,action);
 }
 catch(e){record.state='missing'}
 return false;
}
function preloadClass(cls,requested=['idle','walk','attack']){
 if(!enabled||!validClass(cls)||!Array.isArray(requested))return 0;
 let count=0;
 for(const action of requested){
  const id=key(cls,action);
  if(!cache[id]&&Object.prototype.hasOwnProperty.call(actions,action)){
   queue(cls,action);if(cache[id])count++;
  }
 }
 return count;
}
function selectAction(a){
 if(!a||typeof a!=='object')return 'idle';
 // An HP-zero adventurer may still be ALIVE and actively retreating.
 // The simulation deliberately sends wounded Knights to the entrance at 0 HP.
 // Never draw the prone death pose while their world position is moving.
 if(['retreating','returning'].includes(a.status))return 'walk';
 if((a.hp||0)<=0)return 'death';
 if(a.fxType==='hit_flash'&&(a.fxTime||0)>0)return 'hurt';
 if(a.cls==='Cleric'&&a.fxType==='healing_pulse'&&(a.fxTime||0)>0)return 'special';
 if((a.swing||0)>0&&(a.status==='fighting'||a.status==='exploring'))return 'attack';
 if(['exploring','escorting','returning','retreating','walking','moving'].includes(a.status))return 'walk';
 return 'idle';
}
function frameIndex(a,action,t){
 const def=actions[action];
 if(!def)return 0;
 if(action==='attack'){
  const swing=Math.max(0,Math.min(.23,Number(a.swing)||0));
  return Math.min(def.frames-1,Math.floor((1-swing/.23)*def.frames));
 }
 if(action==='hurt'){
  const remains=Math.max(0,Math.min(.22,Number(a.fxTime)||0));
  return Math.min(def.frames-1,Math.floor((1-remains/.22)*def.frames));
 }
 if(action==='special'){
  const remains=Math.max(0,Math.min(.5,Number(a.fxTime)||0));
  return Math.min(def.frames-1,Math.floor((1-remains/.5)*def.frames));
 }
 // Do not store visual animation clocks in game saves.
 // Retreat/return stride should match the faster travel speed, rather than
 // appearing to slide between the old exploration-speed walking frames.
 const walkFps=action==='walk'&&a.status==='retreating'?18:
  action==='walk'&&a.status==='returning'?16:def.fps;
 const position=Math.max(0,Number(t)||0)*walkFps;
 return def.loop?Math.floor(position)%def.frames:Math.min(def.frames-1,Math.floor(position));
}
function draw(g,a,t){
 if(!enabled||!a||!validClass(a.cls)||!g)return false;
 const action=selectAction(a),id=key(a.cls,action);
 if(!cache[id]){queue(a.cls,action);return false}
 const record=cache[id];
 if(record.state!=='ready')return false;
 const frame=frameIndex(a,action,t);
 try{
  g.save();
  if(a.status==='returning'||a.status==='retreating')g.scale(-1,1);
  g.imageSmoothingEnabled=true;
  // Coordinates relative to the hero's world-baseline, NOT the canvas top.
  g.drawImage(record.img,frame*FRAME_W,0,FRAME_W,FRAME_H,-DRAW_W/2,-DRAW_H+1,DRAW_W,DRAW_H);
  g.restore();
  return true;
 }catch(e){
  try{g.restore()}catch(_){}
  record.state='invalid';
  return false;
 }
}
function status(){
 const values=Object.values(cache);
 return {enabled,loaded:values.filter(x=>x.state==='ready').length,
  loading:values.filter(x=>x.state==='loading').length,
  failed:values.filter(x=>x.state==='missing'||x.state==='invalid').length};
}
return {classes,approvedClasses,actions,FRAME_W,FRAME_H,DRAW_W,DRAW_H,imagePath,isEnabled,setEnabled,preloadClass,selectAction,frameIndex,draw,status};
});
