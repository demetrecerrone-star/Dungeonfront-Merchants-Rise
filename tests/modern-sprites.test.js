'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const requests=[];
const instances=[];
global.Image=class FakeImage {
 constructor(){this.naturalWidth=0;this.naturalHeight=0;instances.push(this)}
 set src(value){this._src=value;requests.push(value)}
 get src(){return this._src}
};
const S=require('../app/src/main/assets/modern-sprites.js');
let checks=0;
function test(title,fn){fn();checks++;console.log('PASS '+title)}
function ctx(){
 const operations=[];
 return {operations,imageSmoothingEnabled:false,save(){operations.push(['save'])},
  restore(){operations.push(['restore'])},scale(...v){operations.push(['scale',...v])},
  drawImage(...v){operations.push(['drawImage',...v])}};
}
const hero={name:'Concept Knight',cls:'Knight',hp:100,status:'exploring',swing:0};
test('modern visuals are off by default with zero image requests',()=>{
 assert.equal(S.isEnabled(),false);
 assert.equal(S.draw(ctx(),hero,10),false);
 assert.equal(S.preloadClass('Knight'),0);
 assert.deepEqual(requests,[]);
 assert.equal(S.status().loaded,0);
});
test('v2 classes and action dimensions match the animation production contract',()=>{
 assert.deepEqual(S.classes,['Knight','Ranger','Mage','Cleric','Rogue','Mercenary']);
 assert.deepEqual(Object.keys(S.actions),['idle','walk','attack','hurt','death','special']);
 assert.equal(S.FRAME_W,128);assert.equal(S.FRAME_H,192);
 assert.equal(S.DRAW_W,72);assert.equal(S.DRAW_H,108);
 assert.equal(S.actions.idle.frames,8);
 assert.equal(S.actions.attack.frames,12);
 assert.equal(S.imagePath('Knight','idle'),'sprites/actors_v2/knight/idle.png');
});
test('explicit opt-in lazily requests only a valid class/action atlas',()=>{
 assert.equal(S.setEnabled(true),true);
 assert.equal(S.draw(ctx(),hero,3),false);
 assert.deepEqual(requests,['sprites/actors_v2/knight/walk.png']);
 assert.equal(S.draw(ctx(),hero,3),false);
 assert.equal(requests.length,1,'loading image is requested only once');
 assert.equal(S.preloadClass('Unknown'),0);
 assert.equal(S.preloadClass('Knight',['madeup']),0);
 assert.equal(S.preloadClass('Knight',['idle','attack']),2);
 assert.equal(requests.length,3,'only requested action sheets load');
});
test('invalid and missing images do not crash and remain fallback-safe',()=>{
 const walking=instances[0];
 walking.naturalWidth=12;walking.naturalHeight=192;walking.onload();
 assert.equal(S.draw(ctx(),hero,3),false);
 assert.equal(S.status().failed,1);
 const idle=instances[1];idle.onerror();
 assert.equal(S.draw(ctx(),{...hero,status:'waiting'},3),false);
 assert.equal(S.status().failed,2);
 assert.equal(requests.length,3,'broken atlases are not re-requested each frame');
});
test('valid transparent animation atlas draws at the feet baseline with smooth sampling',()=>{
 const attack=instances[2];attack.naturalWidth=128*12;attack.naturalHeight=192;attack.onload();
 const attacking={...hero,swing:.22};
 assert.equal(S.selectAction(attacking),'attack');
 const g=ctx();
 assert.equal(S.draw(g,attacking,9),true);
 const image=g.operations.find(x=>x[0]==='drawImage');
 assert.ok(image,'draw call made');
 assert.equal(image[1],attack);
 assert.equal(image[2],0);
 assert.equal(image[4],128);assert.equal(image[5],192);
 assert.equal(image[6],-36);assert.equal(image[7],-107);
 assert.equal(image[8],72);assert.equal(image[9],108);
 assert.equal(g.imageSmoothingEnabled,true,'v2 anti-aliased painting uses smooth canvas sampling');
 assert.equal(g.operations.filter(x=>x[0]==='save').length,1);
 assert.equal(g.operations.filter(x=>x[0]==='restore').length,1);
 const left=ctx();
 assert.equal(S.draw(left,{...attacking,status:'returning'},9),false,'returning requires its own walking atlas and gracefully falls back');
});
test('animation clocks never change game state or produce out-of-range frame numbers',()=>{
 const original=JSON.stringify(hero);
 assert.equal(S.frameIndex({swing:.23},'attack',0),0);
 assert.equal(S.frameIndex({swing:0},'attack',0),11);
 assert.equal(S.frameIndex({swing:-100},'attack',0),11);
 assert.equal(S.frameIndex({},'idle',1),0);
 assert.equal(S.frameIndex({},'walk',.25),3);
 assert.equal(S.frameIndex({fxTime:.11},'hurt',0),2);
 assert.equal(S.frameIndex({fxTime:.25},'special',0),6);
 assert.equal(JSON.stringify(hero),original);
});
test('modern art can be switched off immediately after successful draw',()=>{
 assert.equal(S.setEnabled(false),false);
 const g=ctx();
 assert.equal(S.draw(g,{...hero,status:'fighting',swing:.23},2),false);
 assert.equal(g.operations.length,0,'no visual state changes when disabled');
 assert.equal(requests.length,3,'disabled mode never requests images');
});
test('game loads v2 before scene and retains legacy image fallback and save key',()=>{
 const folder=path.join(__dirname,'../app/src/main/assets');
 const game=fs.readFileSync(path.join(folder,'game.js'),'utf8');
 const html=fs.readFileSync(path.join(folder,'index.html'),'utf8');
 assert.ok(html.indexOf('sprite-system.js')<html.indexOf('modern-sprites.js'));
 assert.ok(html.indexOf('modern-sprites.js')<html.indexOf('game.js'));
 assert.ok(game.includes('window.DFModernSprites.draw(g,a,t)'));
 assert.ok(game.includes('if(!modern){'));
 assert.ok(game.includes('window.DFSprites.draw(g,a,t)'));
 assert.ok(game.includes("dungeonfront_merchants_rise_save_v1"));
 assert.equal(game.includes('DFModernSprites.setEnabled(true)'),false,'main gameplay never forces new art on');
});
test('approved Knight prototype provides six offline animation strips with matching atlas geometry',()=>{
 const Art=require('../app/src/main/assets/modern-knight-art.js');
 assert.deepEqual(Art.counts,{idle:8,walk:10,attack:12,hurt:5,death:12,special:12});
 const {spawnSync}=require('node:child_process');
 for(const [action,frames] of Object.entries(Art.counts)){
  const uri=Art.sheet(action);
  assert.ok(uri.startsWith('data:image/svg+xml;charset=utf-8,'));
  assert.equal(Art.sheet(action),uri,'same image uri is cached');
  const svg=decodeURIComponent(uri.slice(uri.indexOf(',')+1));
  assert.ok(svg.includes('width="'+128*frames+'" height="192"'));
  assert.equal((svg.match(/<g transform="translate\(\d+ 0\)">/g)||[]).length,frames);
  const xml=spawnSync('python3',['-c','import sys,xml.etree.ElementTree as ET; ET.fromstring(sys.stdin.read())'],{input:svg,encoding:'utf8'});
  assert.equal(xml.status,0,'valid SVG source for '+action+': '+xml.stderr);
 }
 assert.equal(Art.sheet('not_an_action'),null);
});
test('only Knight can opt into new art and shop action mapping has no gameplay side-effects',()=>{
 S.setEnabled(true);
 assert.equal(S.draw(ctx(),{cls:'Mage',hp:20,status:'idle'},1),false);
 assert.equal(S.preloadClass('Mage'),0);
 assert.equal(S.selectAction({cls:'Knight',hp:1,status:'waiting'}),'idle');
 assert.equal(S.selectAction({cls:'Knight',hp:1,status:'walking'}),'walk');
 assert.equal(S.selectAction({cls:'Knight',hp:1,status:'moving'}),'walk');
 assert.equal(S.selectAction({cls:'Knight',hp:1,status:'returning'}),'walk');
 assert.equal(S.approvedClasses.has('Knight'),true);
 assert.equal(S.approvedClasses.has('Ranger'),false);
 S.setEnabled(false);
});
test('shop, dungeon, and contract dungeon use the same v2 renderer without modifying save data',()=>{
 const game=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/game.js'),'utf8');
 assert.ok(game.includes("window.DFModernSprites.setEnabled(new URLSearchParams(location.search).get('knightPreview')==='1')"));
 assert.ok(game.includes("modernShop=window.DFModernSprites.draw(g,{"));
 assert.ok(game.includes("status:c.stage===1?'waiting':'walking'"));
 assert.ok(game.includes("window.DFModernSprites.draw(g,a,t)"));
 assert.ok(game.includes("if(view==='dungeon'||view==='contract'){drawDungeon(t);return}"));
 assert.ok(game.includes('if(!modernShop)drawActor('));
 assert.ok(game.includes('if(!modern){'));
 const html=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/index.html'),'utf8');
 assert.ok(html.indexOf('modern-knight-art.js')<html.indexOf('modern-sprites.js'));
 assert.ok(html.indexOf('modern-sprites.js')<html.indexOf('game.js'));
});
delete global.Image;
console.log('All '+checks+' modern actor renderer / save safety tests passed.');
