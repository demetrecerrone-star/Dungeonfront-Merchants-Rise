'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const loaded=[],instances=[];
global.Image=class FakeImage {
 constructor(){this.naturalWidth=0;this.naturalHeight=0;instances.push(this)}
 set src(x){loaded.push(x);this._src=x}
 get src(){return this._src}
};
const V2=require('../app/src/main/assets/modern-sprites.js');
const V3=require('../app/src/main/assets/illustrated-sprites.js');
const actions={idle:8,walk:10,attack:12,hurt:5,death:12,special:12};
const names=['Knight','Ranger','Mage','Cleric','Rogue','Mercenary'];
const ctx=()=>{
 const operations=[];
 return {operations,save(){operations.push(['save'])},restore(){operations.push(['restore'])},
  scale(...x){operations.push(['scale',...x])},
  drawImage(...x){operations.push(['drawImage',...x])},imageSmoothingEnabled:false};
};
assert.deepEqual(V3.classes,names);
assert.deepEqual(V3.actionCounts,actions);
assert.equal(V3.isEnabled(),false);
assert.deepEqual(V3.status().approved,[]);
assert.equal(V3.draw(ctx(),{cls:'Ranger',hp:100,status:'waiting'},0),false);
assert.equal(loaded.length,0,'not a single image request before explicit opt in');
assert.equal(V3.imagePath('Ranger','walk'),'sprites/actors_v3/ranger/walk.png');
assert.equal(V3.approveClass('Unknown',true),false);
assert.equal(V3.approveClass('Ranger',true),true);
assert.equal(V3.draw(ctx(),{cls:'Ranger',hp:100,status:'waiting'},0),false);
assert.equal(loaded.length,0,'class allowed but feature disabled');
assert.equal(V3.setEnabled(true),true);
const ranger={cls:'Ranger',hp:100,status:'waiting'};
assert.equal(V3.draw(ctx(),ranger,0),false,'first render lazy loads');
assert.deepEqual(loaded,['sprites/actors_v3/ranger/idle.png']);
const idle=instances.at(-1);
idle.naturalWidth=1024;idle.naturalHeight=192;idle.onload();
assert.equal(V3.draw(ctx(),ranger,.1),true,'valid painted PNG overlays prototypes');
assert.equal(V3.status().loaded,1);
const shopLeft={...ranger,status:'walking',facing:-1};
assert.equal(V3.draw(ctx(),shopLeft,.15),false);
const walk=instances.at(-1);
walk.naturalWidth=1280;walk.naturalHeight=192;walk.onload();
const g=ctx();
assert.equal(V3.draw(g,shopLeft,.15),true);
assert.ok(g.operations.some(o=>o[0]==='scale'&&o[1]===-1),'moving left mirrors sprite');
const guard=ctx();
assert.equal(V3.draw(guard,{...shopLeft,facing:1},.15),true);
assert.ok(!guard.operations.some(o=>o[0]==='scale'),'moving right never looks back');
assert.equal(V3.draw(ctx(),{cls:'Ranger',hp:0,status:'retreating',facing:-1},1),true,
 'wounded retreating archer stays upright (walk action)');
assert.equal(V3.draw(ctx(),{cls:'Ranger',hp:100,status:'fighting',swing:.23},1),false);
const attack=instances.at(-1);
attack.naturalWidth=1500;attack.naturalHeight=192;attack.onload();
assert.equal(V3.draw(ctx(),{cls:'Ranger',hp:100,status:'fighting',swing:.23},1),false,
 'invalid atlas immediately falls back to v2');
assert.equal(V3.status().failed,1);
assert.equal(V3.draw(ctx(),{cls:'Mage',hp:100,status:'waiting'},1),false,
 'non-approved class never loads illustrated assets');
assert.equal(V3.approveClass('Ranger',false),false);
assert.equal(V3.draw(ctx(),ranger,0),false,'class can be disabled without affecting v2');
assert.equal(V3.setEnabled(false),false);
assert.equal(V3.draw(ctx(),ranger,0),false);
const game=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/game.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/index.html'),'utf8');
assert.ok(html.indexOf('modern-sprites.js')<html.indexOf('illustrated-sprites.js'));
assert.ok(html.indexOf('illustrated-sprites.js')<html.indexOf('game.js'));
assert.ok(game.includes("get('illustratedPreview')==='1'"));
assert.ok(game.includes('DFIllustratedSprites.draw(g,actor,t)'),'painted asset renders in shop');
assert.ok(game.includes('DFIllustratedSprites.draw(g,drawActorState,t)'),'painted asset renders in both dungeons');
assert.ok(game.includes('if(!illustrated&&!modern)'),'three-tier fallback');
assert.ok(game.includes('dungeonfront_merchants_rise_save_v1'),'save key unchanged');
assert.ok(game.includes('DFModernSprites.combatFacing'),'enemy target logic preserved');
assert.ok(!fs.existsSync(path.join(__dirname,'../app/src/main/assets/sprites/actors_v3/ranger/idle.png')),
 'no unapproved final painted assets silently shipped');
console.log('PASS V3 painted art loader: safe opt-in, validated image dimensions, direction, retreat, and v2/v1 fallback');
delete global.Image;
