/* Browser-lite stress test: live shop tabs must remain responsive during game updates. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('../app/src/main/assets/economy.js');
const D=require('../app/src/main/assets/dungeon.js');
const C=require('../app/src/main/assets/contracts.js');
const code=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/game.js'),'utf8');
const blank=()=>{};
const nodes=new Map();
let panelWrites=0,now=0,nextFrame=null;
class FakeElement{
 constructor(id){
  this.id=id;this.dataset={};this.style={};this.scrollTop=0;
  this.offsetWidth=80;this.listeners={};this._html='';
  this.textContent='';this.disabled=false;
  this.classes=new Set(['npcCard','feedbackToast','visitorOverlay','pauseOverlay','dungeonControls','game'].includes(id)?['hidden']:[]);
  this.classList={
   add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),
   contains:x=>this.classes.has(x),
   toggle:(x,value)=>{let yes=value===undefined?!this.classes.has(x):!!value;yes?this.classes.add(x):this.classes.delete(x);return yes}
  };
 }
 set innerHTML(x){this._html=x;if(this.id==='panelContent')panelWrites++}
 get innerHTML(){return this._html}
 addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn)}
 click(){if(this.onclick)this.onclick();for(const f of this.listeners.click||[])f({target:this})}
 dispatch(type,e){for(const f of this.listeners[type]||[])f(e)}
 setAttribute(){}
 removeAttribute(){}
 pause(){}
 play(){return Promise.resolve()}
 closest(){return element('scene-wrap')}
 getBoundingClientRect(){return{left:0,top:0,width:800,height:440}}
 getContext(){return graphics}
}
const graphics=new Proxy({createLinearGradient:()=>({addColorStop:blank})},{
 get(obj,key){return key in obj?obj[key]:blank},
 set(obj,key,value){obj[key]=value;return true}
});
function element(id){if(!nodes.has(id))nodes.set(id,new FakeElement(id));return nodes.get(id)}
const tabs=['stock','craft','upgrade','ledger'].map(t=>{
 const el=new FakeElement('tab-'+t);el.dataset.tab=t;return el;
});
const win={DFEconomy:E,DFDungeon:D,DFContracts:C,addEventListener:blank};
const ctx={
 window:win,
 document:{getElementById:element,querySelectorAll:s=>s==='.tabs button'?tabs:[],addEventListener:blank,hidden:false},
 localStorage:{getItem:()=>null,setItem:blank},
 performance:{now:()=>now},
 requestAnimationFrame:cb=>{nextFrame=cb},
 setTimeout:blank,clearTimeout:blank,
 URLSearchParams,location:{search:'?debugGame'},Math,console
};
vm.runInNewContext(code,ctx,{filename:'game.js',timeout:10000});
function step(){
 const fn=nextFrame;nextFrame=null;
 assert.equal(typeof fn,'function','frame loop is still alive');
 now+=16.7;fn(now);
}
const headings=['MERCHANT INVENTORY','WORKBENCH & MATERIALS','EXPAND YOUR SHOP','THE BLACK LEDGER'];
for(let i=0;i<700;i++){
 step();
 if(i%5===0){
  const which=(i/5)%4;
  tabs[which].click();
  assert.ok(element('panelTitle').innerHTML.includes(headings[which]),'tab '+which+' works');
  assert.ok(tabs[which].classList.contains('active'),'correct active tab');
 }
}
const writesAfterSwitches=panelWrites;
for(let i=0;i<500;i++)step();
assert.ok(panelWrites-writesAfterSwitches<35,
 'background game updates should not rebuild the same shop panel repeatedly');
assert.ok(win.Dungeonfront.getState().sales>=0,'merchant state remains readable');
console.log('PASS rapid shop tab switching under live simulation');
console.log('PASS non-changing panels retain stable DOM');
console.log('PASS animation loop remains active');

const sceneSource=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/styles.css'),'utf8');
assert.ok(code.includes('function drawShopRoom(t)'), 'shop painter exists separately from dungeon camera');
assert.ok(code.includes('shopStockShelf(328,159,89)'), 'shop displays actual inventory shelves');
assert.ok(code.includes('drawActor(590,299'), 'merchant has a stable anchor behind the counter');
assert.ok(code.includes('shopLamp(316,152,t)'), 'shop has warm interior lanterns');
assert.ok(sceneSource.includes('.scene-wrap.shop-mode + .sidebar'), 'shop-only inventory theme exists');
assert.ok(sceneSource.includes('min-width:32px'), 'shop prices have touch-sized stepper controls');
assert.ok(element('scene-wrap').classList.contains('shop-mode'), 'shop uses themed view');
const stage=element('scene');
const click={pointerId:11,clientX:145,clientY:267};
stage.dispatch('pointerdown',click);stage.dispatch('pointerup',click);
assert.ok(element('scene-wrap').classList.contains('dungeon-mode'), 'portal tap still enters dungeon');
assert.ok(!element('scene-wrap').classList.contains('shop-mode'), 'shop-only visual theme clears in dungeon');
assert.equal(win.Dungeonfront.handleBack(),true);
assert.ok(element('scene-wrap').classList.contains('shop-mode'), 'shop theme returns after extraction back button');
console.log('PASS fantasy shop layout, themed inventory and preserved portal hitbox');

