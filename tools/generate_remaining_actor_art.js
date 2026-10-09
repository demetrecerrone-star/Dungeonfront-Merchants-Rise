/*
 * Original, directional v2 character prototype art.
 * Generates RGBA-ready 128x192 frame strips for Ranger, Mage, Cleric,
 * Rogue and Mercenary without ever changing the approved Knight artwork.
 * Concept approval is still required before enabling these in an APK.
 */
'use strict';

const counts=Object.freeze({idle:8,walk:10,attack:12,hurt:5,death:12,special:12});
const characters=Object.freeze({
 Ranger:{accent:'#477c51',dark:'#223e31',light:'#99bc70',trim:'#d1ad70',cloth:'#445c3e',skin:'#cfaa82',glow:'#89f0a7',type:'bow'},
 Mage:{accent:'#4b4b97',dark:'#25264d',light:'#9c85df',trim:'#d0b383',cloth:'#363872',skin:'#ddb491',glow:'#a383ff',type:'magic'},
 Cleric:{accent:'#e6d5ab',dark:'#706251',light:'#fff6d8',trim:'#e3b867',cloth:'#f2e5c6',skin:'#c69b79',glow:'#ffe58c',type:'heal'},
 Rogue:{accent:'#883c4d',dark:'#2b222b',light:'#c45b65',trim:'#a98c72',cloth:'#4a2b39',skin:'#ba8d72',glow:'#ff7080',type:'daggers'},
 Mercenary:{accent:'#956848',dark:'#353139',light:'#bfa17a',trim:'#d7a369',cloth:'#594339',skin:'#c5a080',glow:'#ffab63',type:'axe'}
});
const classNames=Object.keys(characters);
function fmt(n){return Number(n.toFixed(2))}
function attrs(a){return Object.entries(a).map(([k,v])=>' '+k+"='"+String(v).replace(/&/g,'&amp;').replace(/'/g,'&apos;')+"'").join('')}
function tag(name,a={},body=''){return '<'+name+attrs(a)+'>'+body+'</'+name+'>'}
function shape(d,fill,stroke,width=2,extra={}){
 return tag('path',Object.assign({d,fill,stroke,'stroke-width':width,'stroke-linejoin':'round'},extra))
}
function ellipse(cx,cy,rx,ry,fill,extra={}){return tag('ellipse',Object.assign({cx,cy,rx,ry,fill},extra))}
function box(x,y,width,height,fill,extra={}){return tag('rect',Object.assign({x,y,width,height,fill},extra))}
function definitions(c){
 return "<defs>"+
 '<linearGradient id="metal" x1="0" y1="0" x2="1" y2=".5"><stop stop-color="#43586a"/><stop offset=".38" stop-color="#d6dedc"/><stop offset=".7" stop-color="#8da1ae"/><stop offset="1" stop-color="#37495d"/></linearGradient>'+
 '<linearGradient id="cape" x1="0" y1="0" x2="1" y2=".9"><stop stop-color="'+c.dark+'"/><stop offset=".5" stop-color="'+c.accent+'"/><stop offset="1" stop-color="'+c.light+'"/></linearGradient>'+
 '<linearGradient id="weapon" x1="0" y1="0" x2="1" y2=".5"><stop stop-color="#e6ebdd"/><stop offset=".5" stop-color="#778e9e"/><stop offset="1" stop-color="#f1e7c9"/></linearGradient>'+
 '<radialGradient id="magic"><stop stop-color="#ffffff"/><stop offset=".3" stop-color="'+c.glow+'"/><stop offset="1" stop-color="'+c.glow+'" stop-opacity="0"/></radialGradient>'+
 "</defs>";
}
function weapon(c,action,p,sway,flight){
 const special=action==='special',attack=action==='attack';
 const burst=(attack||special)&&p>.31&&p<.8;
 const px=30+(attack?fmt(p*7):0),yy=-94+(attack?fmt(Math.sin(p*Math.PI)*6):0);
 let out='';
 if(c.type==='bow'){
  // Bow faces right, with a recognizable string/draw motion.
  const bowX=fmt(px+(burst?4:0));
  const pull=(attack||special)?fmt(Math.sin(p*Math.PI)*18):0;
  out+=shape('M'+bowX+' -148 Q'+(bowX+27)+' -115 '+bowX+' -61','none',c.trim,5);
  out+=shape('M'+bowX+' -148 L'+(bowX-pull)+' -103 L'+bowX+' -61','none','#cdd6b9',1.6);
  out+=shape('M'+(bowX-pull)+' -103 L'+(bowX+42)+' -103','none','#f2e5b8',2);
  out+=shape('M'+(bowX+39)+' -107 L'+(bowX+46)+' -103 L'+(bowX+39)+' -99','none',c.glow,2);
  if(burst){
   out+=shape('M'+(bowX+14)+' -103 Q'+(bowX+43)+' -110 '+(bowX+64)+' -102','none',c.glow,special?7:4,{opacity:0.9});
   out+=ellipse(bowX+59,-103,12,9,'url(#magic)');
   if(special)for(let i=0;i<5;i++)out+=shape('M'+(bowX+27+i*6)+' '+(-105-i*3)+' l7 -3','none',c.glow,2);
  }
 }else if(c.type==='magic'||c.type==='heal'){
  const head=-151+fmt((attack?Math.sin(p*Math.PI)*8:0));
  out+=shape('M'+px+' -55 Q'+(px+1)+' -108 '+(px+5)+' '+head,'none','#8a6950',5);
  out+=shape('M'+(px-4)+' '+head+' Q'+(px+5)+' '+(head-13)+' '+(px+14)+' '+head+' L'+(px+5)+' '+(head+11)+'Z',c.type==='heal'?'#f1d7a1':'#867be2',c.trim,2);
  out+=ellipse(px+5,head,16+(burst?9:0),16+(burst?9:0),'url(#magic)');
  if(burst){
   out+=shape('M'+(px+7)+' '+head+' Q'+(px+27)+' '+(head-20)+' '+(px+68)+' '+(head-8),'none',c.glow,6,{opacity:.82});
   out+=ellipse(px+64,head-8,18,14,'url(#magic)');
   if(c.type==='heal')out+=shape('M'+(px+59)+' '+(head-19)+' v23 M'+(px+49)+' '+(head-8)+' h21','none','#fff4d2',3);
  }
 }else if(c.type==='daggers'){
  const slash=attack||special?Math.sin(Math.PI*p)*38:5;
  out+=tag('g',{transform:'rotate('+fmt(slash)+' 17 -98)'},shape('M12 -94 L38 -108 L51 -106 L32 -94 L19 -84Z','url(#weapon)','#e9d5c0',2)+shape('M12 -91 L2 -85','none',c.trim,4));
  out+=tag('g',{transform:'rotate('+fmt(-slash*.8)+' 23 -85)'},shape('M21 -84 L44 -65 L45 -59 L20 -76Z','url(#weapon)','#d8a2a8',2)+shape('M22 -84 L13 -89','none','#704c48',4));
  if(burst){
   out+=shape('M15 -131 Q64 -123 69 -75','none',c.glow,5,{opacity:.8});
   out+=shape('M18 -62 Q51 -87 69 -104','none','#fbb9c0',3);
  }
 }else if(c.type==='axe'){
  const sweep=attack||special?fmt(Math.sin(Math.PI*p)*80-15):4;
  out+=tag('g',{transform:'rotate('+sweep+' 23 -85)'},
   shape('M23 -77 L60 -133','none','#826248',7)+
   shape('M49 -143 Q70 -146 82 -128 L76 -104 Q59 -117 45 -111 L47 -122Z','url(#weapon)',c.trim,3)+
   shape('M62 -133 L80 -128','none','#fff0d2',2));
  if(burst){
   out+=shape('M35 -151 Q99 -115 71 -46','none',c.glow,8,{opacity:.85});
   out+=shape('M46 -148 Q91 -106 74 -59','none','#ffe2a9',3);
  }
 }
 return out;
}
function characterFrame(name,action,index){
 if(!characters[name]||!counts[action])throw new Error('Unknown actor/action: '+name+'/'+action);
 const c=characters[name],n=counts[action],p=index/Math.max(1,n-1);
 const t=index/n*Math.PI*2,w=action==='walk',hit=action==='hurt',attack=action==='attack';
 const dying=action==='death',casting=action==='special';
 const leg=w?fmt(Math.sin(t)*24):fmt(Math.sin(t)*1.6);
 const flutter=w?fmt(6*Math.cos(t)):(attack?fmt(-5*Math.sin(Math.PI*p)):0);
 const bob=w?fmt(-Math.abs(Math.sin(t))*3):fmt(.7*Math.sin(t));
 const forward=attack?fmt(8*Math.sin(p*Math.PI)):(hit?fmt(-9*Math.sin(p*Math.PI)):0);
 const fall=dying?fmt(-12*p):0;
 const collapse=dying?fmt(1-.68*p):1;
 let out=tag('ellipse',{cx:0,cy:0,rx:24,ry:4,fill:'#030a11',opacity:.28});
 // A different cape / cloth silhouette for each class.
 if(name==='Mage'||name==='Cleric'){
  out+=shape('M-21 -117 Q-37 -80 -34 -30 L-20 -2 L23 -2 Q13 -61 25 -117Z',
      'url(#cape)',c.trim,2,{transform:'translate('+flutter+' 0)'});
  out+=shape('M-13 -65 L-18 -4 M12 -62 L17 -3','none',c.light,2);
 }else{
  out+=shape(name==='Mercenary'?'M-17 -123 Q-45 -121 -47 -100 L-37 -51 L-31 -61 L-16 -90Z':
      'M-18 -130 Q-35 -128 -42 -92 L-58 -31 L-30 -42 L-35 -12 L-8 -68 L-5 -120Z',
       'url(#cape)',c.dark,3,{transform:'translate('+flutter+' 0)'});
 }
 if(name==='Ranger') {
  // Fletched arrows and diagonal quiver behind the left shoulder.
  out+=shape('M-24 -139 L-38 -92 L-28 -88 L-12 -133Z','#76543b',c.trim,2);
  for(let k=0;k<4;k++)out+=shape('M'+(-34+k*5)+' -151 L'+(-33+k*5)+' -111','none','#dad5b0',2);
  out+=shape('M-37 -151 l-4 -8 M-31 -151 l4 -8','none',c.light,2);
 }
 // Striding legs, boots aligned consistently at y=0.
 for(const [offset,rotation,col] of [[-12,-leg,c.dark],[13,leg,c.accent]]){
  out+=tag('g',{transform:'rotate('+rotation+' '+offset+' -57)'},
   shape('M'+(offset-8)+' -67 L'+(offset+7)+' -67 L'+(offset+5)+' -30 L'+(offset-9)+' -29Z',col,'#25303b',2)+
   shape('M'+(offset-8)+' -32 L'+(offset+7)+' -31 L'+(offset+7)+' -9 L'+(offset-8)+' -9Z',
      name==='Mercenary'?'url(#metal)':'#806a52','#31404a',2)+
   shape('M'+(offset-10)+' -13 L'+(offset+8)+' -12 L'+(offset+16)+' -2 L'+(offset-13)+' -2Z',
      name==='Cleric'?'#c8b28c':'#625044',c.trim,2));
 }
 // Body silhouette distinct by role, but all face right.
 out+=shape(name==='Mercenary'?'M-29 -125 L13 -128 Q36 -120 34 -90 L24 -70 L-24 -76Z':
   name==='Rogue'?'M-20 -123 L7 -128 L26 -102 L17 -75 L-20 -76Z':
   'M-22 -123 L8 -125 Q28 -117 27 -97 L18 -73 L-23 -76Z',
   name==='Cleric'?'#e9d9b0':name==='Mage'?'#383e83':'url(#metal)',c.dark,3);
 out+=shape('M-17 -115 Q3 -116 12 -105 L12 -87 L-14 -90Z',
    c.accent,c.trim,2);
 out+=shape('M-22 -78 L23 -76 L28 -64 L4 -67 L-7 -72 L-18 -60 L-31 -67Z',c.cloth,c.trim,2);
 out+=shape('M-24 -81 L23 -79','none',c.trim,4);
 out+=shape('M-7 -83 L3 -83 L3 -76 L-7 -76Z',c.dark,c.light,1.5);
 // Distinct headwear, a 3/4 PROFILE (nose points right).
 out+=shape('M-9 -149 Q0 -163 14 -160 L25 -147 L24 -130 L12 -125 L-5 -130Z',
    c.skin,'#403a38',2);
 if(name==='Mercenary'){
  out+=shape('M-11 -145 Q-15 -163 5 -171 L20 -164 L28 -149 L14 -150Z','url(#metal)',c.trim,3);
  out+=shape('M-2 -170 L7 -178 L16 -169','none',c.light,4);
 }else if(name==='Cleric'){
  out+=shape('M-23 -146 Q-17 -173 4 -169 Q23 -168 30 -138 L15 -152 L-10 -147 L-21 -122Z',
     c.light,c.trim,3);
  out+=shape('M12 -164 L20 -164 M16 -168 L16 -159','none',c.trim,2.3);
 }else{
  out+=shape('M-22 -147 Q-16 -174 6 -174 Q25 -169 27 -146 L15 -155 L-5 -151 L-20 -126Z',
     c.dark,c.trim,3);
  out+=shape('M-16 -145 Q3 -157 23 -146 L28 -141 L14 -140 L-2 -144Z',c.accent,'none',0);
 }
 out+=shape('M17 -140 L31 -137 L34 -132 L25 -127','none',c.skin,3);
 out+=shape('M14 -143 L26 -142','none',name==='Rogue'?'#ff8793':'#23323b',2.7);
 // Right-facing near arm, narrow enough to keep bows/staves unobstructed.
 out+=shape('M5 -124 Q25 -128 32 -108 L27 -92 L17 -92 L12 -108Z',
   name==='Mercenary'?'url(#metal)':c.accent,c.dark,3);
 out+=shape('M26 -102 L34 -91 L30 -81 L21 -91Z',c.skin,c.trim,2);
 if(name==='Mercenary')out+=shape('M-22 -117 L-32 -104 L-23 -92 L-9 -110Z','url(#metal)',c.trim,2.5);
 if(name==='Rogue')out+=shape('M-20 -119 L-32 -105 L-23 -94 L-7 -110Z','#41414c',c.trim,2);
 out+=weapon(c,action,p,leg,0);
 if(hit)out+=shape('M-40 -138 Q-28 -155 -19 -151','none','#fff6d4',3,{opacity:fmt(Math.sin(p*Math.PI))});
 if(dying)out+=ellipse(0,-39,31,9,c.dark,{opacity:.4});
 if(casting&&p>.3&&p<.85&&c.type!=='bow')out+=ellipse(5,-85,30,51,'url(#magic)',{opacity:.4});
 // Slump down on the spot: keep every death frame inside its 128px cell.
 // A large sideways rotation previously clipped heads/capes and weapons.
 const transform='translate(64 190) translate('+forward+' '+bob+') rotate('+fall+' 0 -10) scale(1 '+collapse+')';
 return tag('g',{transform,opacity:dying?fmt(Math.max(.55,1-.35*p)):1},out);
}
function svg(name,action){
 const c=characters[name],num=counts[action];
 if(!c||!num)throw new Error('Unsupported '+name+' '+action);
 let frames='';
 for(let k=0;k<num;k++)frames+=tag('g',{transform:'translate('+(128*k)+' 0)'},characterFrame(name,action,k));
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+(128*num)+'" height="192" viewBox="0 0 '+(128*num)+' 192">'+definitions(c)+frames+'</svg>';
}
module.exports={counts,characters,classNames,svg,characterFrame};
