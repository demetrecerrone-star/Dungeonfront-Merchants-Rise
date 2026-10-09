/*
 * Dungeonfront six-class anime-fantasy art embellishments (original SVG).
 * Class-distinct, edit-friendly illustration layers for the existing
 * animation rig; not a replacement for future painted character frames.
 * Coordinates are rig-local (feet 0, helmet ~ -150).
 */
'use strict';
const VERSION='anime-polish-1';
const COLORS=Object.freeze({
  Ranger:{hair:'#e0cba3',highlight:'#ffe4ad',thread:'#e5c78a',jewel:'#7cdaab'},
  Mage:{hair:'#b5a3ea',highlight:'#e2d1ff',thread:'#bea3ff',jewel:'#a686ff'},
  Cleric:{hair:'#efdbb6',highlight:'#fff0cf',thread:'#dbb564',jewel:'#fff0b3'},
  Rogue:{hair:'#d5cbd3',highlight:'#fbecf4',thread:'#d46b83',jewel:'#ff7599'},
  Mercenary:{hair:'#46352d',highlight:'#b48b61',thread:'#d4a364',jewel:'#ffb46b'}
});
function p(d,fill='none',stroke='#ffffff',width=1.5,extra=''){
 return '<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round" '+extra+'/>';
}
function e(x,y,rx,ry,fill,extra=''){return '<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" '+extra+'/>'}
function r(x,y,w,h,fill,stroke='none',sw=1){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="1.5" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>'}
function face(h){
 // Lower-lash anime eye, cheek highlight and a sharply shaped hair bang.
 return p('M16 -143 L24 -143','none','#27343a',2.4)
  +p('M19 -147 Q23 -150 26 -145','none',h.highlight,1.1)
  +e(25,-142,1.7,1.7,h.jewel)
  +p('M27 -134 l3 1','none','#b78367',1)
  +p('M3 -157 Q11 -161 16 -154 L11 -146 L4 -151Z',h.hair,'#4b484d',1)
  +p('M10 -154 L17 -148','none',h.highlight,1.7);
}
function chestGems(c,h){
 const glow=h.jewel;
 return p('M-12 -110 Q2 -114 12 -104','none',h.thread,1.4)
  +p('M-10 -95 Q4 -101 11 -92','none',h.thread,1.2)
  +p('M-8 -111 L-2 -105 L-5 -96 L-12 -104Z',glow,h.thread,1.3)
  +p('M-7 -109 L-3 -104','none','#fff5d6',1)
  +p('M-21 -81 L-10 -83 M8 -80 L18 -79','none',h.thread,1.5);
}
function ranger(c,h,action,t){
 const cloth=Math.sin(t*Math.PI*2)*4;
 return '<g class="ranger-detail">'
   +p('M-18 -149 Q-23 -153 -21 -138 L-13 -128', 'none',h.thread,1.8)
   +p('M-15 -147 Q-29 -138 -29 -111 Q-41 -92 -40 -82','none',h.hair,5)
   +p('M-12 -143 Q-22 -128 -23 -118','none',h.highlight,2)
   +p('M-15 -110 L13 -93 M-11 -90 L17 -115','none','#76583d',6)
   +p('M-15 -110 L13 -93 M-11 -90 L17 -115','none',h.thread,1.7)
   +r(-9,-101,7,10,'#6b5239',h.thread)
   +chestGems(c,h)
   +p('M-24 -67 L-18 -36 M-16 -68 L-10 -37','none',h.thread,1.5)
   +p('M-23 -43 L-15 -36 L-19 -26Z',h.jewel,h.thread,1)
   +p('M-34 -113 Q-39 -93 -46 -78 Q-52 -63 -61 -49','none','#9dbb7c',2.1,'transform="translate('+cloth.toFixed(1)+' 0)"')
   +face(h)
   +'</g>';
}
function mage(c,h,action,t){
 const sw=(Math.sin(t*Math.PI*2)*3).toFixed(1);
 let s='<g class="mage-detail">'
  +p('M-23 -146 Q-43 -145 -40 -119 L-29 -86','none',h.hair,7,'transform="translate('+sw+' 0)"')
  +p('M-25 -143 Q-33 -130 -35 -117','none',h.highlight,3)
  +p('M-23 -144 Q-8 -164 16 -151 L22 -144','none',h.thread,1.9)
  +p('M-7 -170 L2 -188 L11 -170 L23 -165','none','#2b264a',2)
  +p('M-17 -130 L28 -128 L35 -124 L-27 -124Z','#42356e',h.thread,1.8)
  +chestGems(c,h)
  +p('M-25 -73 Q-32 -36 -24 -8 M17 -71 Q12 -31 23 -11','none',h.thread,1.6)
  +p('M-18 -37 L-11 -32 L-17 -25 L-24 -32Z','none',h.thread,1.4)
  +face(h);
 const phase=action==='special'||action==='attack'?1:0.5;
 for(let k=0;k<4;k++){
  const ang=k*Math.PI/2+(.4*Math.sin(t*Math.PI*2));
  const x=Math.round(-19+12*Math.cos(ang)),y=Math.round(-103+14*Math.sin(ang));
  s+=e(x,y,1.8+phase,1.8+phase,h.jewel,'opacity=".78"');
 }
 return s+'</g>';
}
function cleric(c,h,action,t){
 return '<g class="cleric-detail">'
  +p('M-17 -150 Q-34 -142 -32 -109 L-23 -80','none',h.hair,8)
  +p('M-24 -132 Q-30 -109 -27 -94','none',h.highlight,3)
  +p('M-23 -149 L-27 -123 L-35 -84','none',h.thread,2)
  +p('M12 -164 L18 -169 L24 -164 M17 -169 L17 -154','none','#f9e1a1',2)
  +p('M-20 -116 L-7 -95 L8 -106 L20 -119','none',h.thread,1.6)
  +p('M-10 -99 L0 -89 L10 -99 L0 -109Z',h.jewel,h.thread,1.9)
  +p('M0 -104 L0 -94 M-5 -99 L5 -99','none','#886e42',2)
  +p('M-26 -72 Q-21 -40 -31 -8 M23 -72 Q23 -39 29 -7','none',h.thread,2)
  +p('M-15 -48 L-9 -38 L-15 -28 L-21 -38Z','none',h.thread,1.7)
  +face(h)
  +'</g>';
}
function rogue(c,h,action,t){
 const tail=(Math.sin(t*Math.PI*2)*6).toFixed(1);
 return '<g class="rogue-detail">'
 +p('M-23 -154 Q-35 -147 -29 -123 L-23 -110','none',h.hair,5)
 +p('M-12 -150 Q-4 -151 4 -148','none',h.highlight,1.7)
 +p('M-27 -130 Q0 -126 21 -132 L28 -124 L-35 -121Z','#352b36',h.thread,2)
 +p('M-22 -119 Q-42 -108 -45 -95 Q-48 -89 -60 -86','none',c.accent,7,'transform="translate('+tail+' 0)"')
 +p('M-22 -119 Q-38 -109 -56 -87','none',h.thread,1.8,'transform="translate('+tail+' 0)"')
 +p('M-17 -117 L17 -92 M20 -117 L-14 -89','none','#61434b',5)
 +p('M-17 -117 L17 -92 M20 -117 L-14 -89','none',h.thread,1.4)
 +r(-6,-105,6,8,'#473d43',h.jewel,1)
 +p('M-22 -78 L-14 -67 L-20 -54','none',h.thread,1.5)
 +p('M12 -73 L21 -61 L14 -47','none',h.thread,1.5)
 +face(h)
 +'</g>';
}
function mercenary(c,h,action,t){
 let s='<g class="mercenary-detail">'
 +p('M-12 -159 Q-24 -162 -19 -146 L-11 -141','none',h.hair,7)
 +p('M-11 -156 Q-5 -169 3 -164','none',h.highlight,2)
 +p('M19 -134 L24 -127 L21 -121 L8 -131Z','#5c4439',h.highlight,1.6)
 +p('M28 -139 L31 -131','none','#ad7561',1.2)
 +p('M-25 -126 Q-36 -131 -39 -116 L-27 -98 L-16 -106Z','url(#metal)',h.thread,2.4)
 +p('M-33 -121 L-19 -111 M-35 -114 L-23 -104','none',h.highlight,1.8)
 +p('M-21 -119 Q0 -109 23 -119','none','#6e493d',9)
 +p('M-20 -119 Q0 -109 23 -119','none',h.thread,1.8)
 +p('M-8 -111 L0 -95 L8 -109','none',h.highlight,1.5)
 +r(-10,-97,8,7,'#795946',h.thread,1.2)
 +p('M-23 -82 L-21 -57 M18 -78 L18 -57','none',h.thread,1.6)
 +face(h);
 for(const [x,y] of [[-28,-117],[-20,-111],[17,-112],[-15,-77],[17,-76]])s+=e(x,y,2,2,h.thread)+e(x-0.6,y-0.6,0.8,0.8,'#fff2c0');
 return s+'</g>';
}
function detail(name,c,action,index,count){
 const h=COLORS[name];if(!h)return '';
 if(!Number.isInteger(index)||index<0||index>=count)throw Error('frame out of range');
 const t=index/count;
 if(name==='Ranger')return ranger(c,h,action,t);
 if(name==='Mage')return mage(c,h,action,t);
 if(name==='Cleric')return cleric(c,h,action,t);
 if(name==='Rogue')return rogue(c,h,action,t);
 return mercenary(c,h,action,t);
}
module.exports={detail,COLORS,VERSION};
