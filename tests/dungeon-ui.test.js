/* v0.5.1: verify shop-only notifications do not interrupt dungeon gameplay. */
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../app/src/main/assets/economy.js');
const D=require('../app/src/main/assets/dungeon.js');
const gameScript=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/game.js'),'utf8');
class ClassList{
 constructor(hidden=false){this.members=new Set(hidden?['hidden']:[])}
 add(k){this.members.add(k)}
 remove(k){this.members.delete(k)}
 contains(k){return this.members.has(k)}
 toggle(k,forced){const add=forced===undefined?!this.contains(k):!!forced;add?this.add(k):this.remove(k);return add}
}
const nodes=new Map();
const noop=()=>{};
const graphics=new Proxy({createLinearGradient:()=>({addColorStop:noop})},{
 get(o,k){return k in o?o[k]:noop},set(o,k,v){o[k]=v;return true}
});
function node(id){
 if(nodes.has(id))return nodes.get(id);
 const hidden=['visitorOverlay','feedbackToast','npcCard','dungeonControls','game','introPlay','title','pauseOverlay'].includes(id);
 const el={
  id,classList:new ClassList(hidden),listeners:{},dataset:{},
  textContent:'',innerHTML:'',style:{},scrollTop:0,offsetWidth:40,disabled:false,
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)},
  dispatch(type,arg){for(const fn of this.listeners[type]||[])fn(arg)},
  getBoundingClientRect(){return{left:0,top:0,width:800,height:440}},
  getContext:()=>graphics,closest:()=>node('scene-wrap'),
  setPointerCapture:noop,removeAttribute:noop,pause:noop,
  play:()=>Promise.resolve(),click(){if(this.onclick)this.onclick();this.dispatch('click',{})}
 };
 nodes.set(id,el);return el;
}
let nextFrame=null,now=0;
const math=Object.create(Math);math.random=()=>0.4;
const store=new Map(),fakeWindow={DFEconomy:E,DFDungeon:D};
const ctx={
 window:fakeWindow,document:{
  getElementById:node,querySelectorAll:()=>[],addEventListener:noop,hidden:false
 },
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
 performance:{now:()=>now},requestAnimationFrame:fn=>{nextFrame=fn},
 setTimeout:()=>1,clearTimeout:noop,
 Math:math,URLSearchParams,location:{search:'?skipIntro'},
 console
};
vm.runInNewContext(gameScript,ctx,{filename:'game.js',timeout:10000});
fakeWindow.Dungeonfront.start();
const canvas=node('scene');
canvas.dispatch('pointerdown',{pointerId:1,clientX:145,clientY:267});
canvas.dispatch('pointerup',{pointerId:1,clientX:145,clientY:267});
assert.equal(node('dungeonControls').classList.contains('hidden'),false,'portal opens dungeon');
assert.equal(node('feedbackToast').classList.contains('hidden'),true,'entering dungeon clears old shop toast');
for(let frame=0;frame<500;frame++){const f=nextFrame;assert.ok(f,'game loop is active');now+=50;f(now)}
const s=fakeWindow.Dungeonfront.getState();
assert.ok(s.sales>0,'shop customers still purchase supplies in background');
assert.ok(s.pendingEncounter,'visitor is queued until shop return');
assert.equal(node('visitorOverlay').classList.contains('hidden'),true,'no visitor overlay in dungeon');
assert.equal(node('feedbackToast').classList.contains('hidden'),true,'no shop transaction popup in dungeon');
node('dungeonBack').click();
assert.equal(node('dungeonControls').classList.contains('hidden'),true,'returned to shop');
assert.equal(node('visitorOverlay').classList.contains('hidden'),false,'deferred visitor appears only on return');
console.log('PASS dungeon suppresses shop popups and delivers queued visitors on return.');
