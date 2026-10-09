/* Knight v2 art prototype, deliberately separate from legacy sprite bitmaps.
   Lightweight vector sheets are generated once, no network or saved state.
   This is a FIRST PLAYABLE vector interpretation of approved armor colors,
   NOT the final painted/anime sprite atlas. Real approved PNGs can replace it. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 root.DFModernKnightArt=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const counts={idle:8,walk:10,attack:12,hurt:5,death:12,special:12};
const built=Object.create(null);
function frame(action,n){
 const count=counts[action],p=n/Math.max(1,count-1);
 const cycle=n/count*2*Math.PI;
 const walking=action==='walk';
 const attacking=action==='attack';
 const hurt=action==='hurt';
 const dying=action==='death';
 const special=action==='special';
 const shift=walking?Math.sin(cycle)*2:Math.sin(cycle)*.75;
 const leg=Math.sin(cycle)* (walking?14:1.7);
 const arm=attacking?(p<.35?-21:p<.68?44:2):walking?Math.sin(cycle)*3:Math.sin(cycle)*1.2;
 const shieldRaise=special?(p<.3?-14:p<.8?-25:-6):hurt?-8*Math.sin(Math.PI*p):0;
 const tilt=hurt?-12*Math.sin(Math.PI*p):dying?-84*p:attacking?Math.sin(Math.PI*p)*-8:0;
 const alpha=dying?Math.max(.6,1-p*.4):1;
 const left=leg.toFixed(2),right=(-leg).toFixed(2);
 const top=(-Math.abs(shift)-(attacking?Math.sin(Math.PI*p)*3:0)).toFixed(2);
 const cape=(walking?Math.cos(cycle)*4:Math.sin(cycle)*2).toFixed(1);
 const flare=attacking&&p>.28&&p<.76;
 const guard=special&&p>.17&&p<.92;
 return `<g transform="translate(64 190) rotate(${tilt.toFixed(2)} 0 -71) translate(0 ${top})" opacity="${alpha}">
 <ellipse cx="0" cy="0" rx="25" ry="4" fill="#050c1a" opacity=".42"/>
 <!-- flowing royal-blue cape -->
 <path d="M-18 -132 Q-39 -121 -37 -77 Q-48 -42 -49 -16 L-20 -28 L-7 -84 L12 -125Z" fill="url(#cape)" stroke="#203454" stroke-width="2"
  transform="translate(${cape} 0)"/>
 <path d="M-35 -31 Q-42 -19 -44 -15 L-21 -27" fill="none" stroke="#e1af63" stroke-width="2"/>
 <!-- independent leg strides -->
 <g transform="rotate(${left} -10 -39)">
  <path d="M-24 -66 L-5 -68 L-5 -30 L-20 -27Z" fill="url(#steel)" stroke="#43596b" stroke-width="2"/>
  <path d="M-20 -35 L-6 -35 L-7 -6 L-18 -4Z" fill="#7d9aa9" stroke="#24394a" stroke-width="2"/>
  <path d="M-22 -10 L-4 -11 L-1 0 L-25 0Z" fill="url(#steel)" stroke="#304255" stroke-width="2"/>
  <path d="M-20 -48 L-6 -45" stroke="#f4d593" stroke-width="2"/>
 </g>
 <g transform="rotate(${right} 11 -38)">
  <path d="M3 -67 L24 -67 L19 -29 L6 -30Z" fill="url(#steel)" stroke="#43596b" stroke-width="2"/>
  <path d="M7 -35 L19 -35 L20 -6 L8 -5Z" fill="#7d9aa9" stroke="#24394a" stroke-width="2"/>
  <path d="M6 -10 L22 -10 L26 0 L5 0Z" fill="url(#steel)" stroke="#304255" stroke-width="2"/>
  <path d="M6 -48 L20 -46" stroke="#f4d593" stroke-width="2"/>
 </g>
 <!-- belt and armor skirt -->
 <path d="M-28 -84 L27 -84 L34 -59 L8 -56 L-6 -72 L-20 -55 L-34 -62Z" fill="#17407b" stroke="#daa960" stroke-width="3"/>
 <path d="M-10 -76 L8 -75 L5 -55 L-13 -53Z" fill="#255d9d" stroke="#edc075" stroke-width="2"/>
 <path d="M-4 -71 L-1 -60 M1 -68 L4 -61" stroke="#e5c486" stroke-width="1.5"/>
 <path d="M-24 -116 L26 -116 L31 -76 L-28 -77Z" fill="url(#steel)" stroke="#39495f" stroke-width="3"/>
 <path d="M-19 -108 L18 -108 L21 -86 L-21 -86Z" fill="#1e3c63" stroke="#bda17b" stroke-width="2"/>
 <path d="M-13 -103 L13 -103 L8 -89 L-10 -89Z" fill="url(#silver)" stroke="#eacb83" stroke-width="1.5"/>
 <path d="M0 -108 L5 -101 L0 -91 L-5 -101Z" fill="#ecca75"/>
 <path d="M-30 -85 L26 -85" stroke="#daaa64" stroke-width="4"/>
 <rect x="-4" y="-89" width="12" height="8" rx="2" fill="#334352" stroke="#f5d18d" stroke-width="2"/>
 <!-- knight pauldrons -->
 <path d="M-24 -120 Q-38 -123 -43 -107 L-34 -96 L-22 -103Z" fill="url(#steel)" stroke="#344f67" stroke-width="3"/>
 <path d="M24 -119 Q43 -124 45 -108 L35 -96 L24 -105Z" fill="url(#steel)" stroke="#344f67" stroke-width="3"/>
 <path d="M-38 -112 L-28 -112 M30 -112 L40 -111" stroke="#f8d697" stroke-width="3"/>
 <!-- sword arm (left) -->
 <g transform="rotate(${arm} -31 -112)">
 <path d="M-33 -111 L-42 -82 L-35 -76 L-23 -103Z" fill="url(#steel)" stroke="#3b5268" stroke-width="3"/>
 <path d="M-41 -85 L-46 -72 L-37 -66 L-30 -79Z" fill="#587085" stroke="#e7bd6d" stroke-width="2"/>
 <g transform="rotate(${attacking?(-24+68*Math.sin(Math.PI*p)):0} -42 -75)">
  <path d="M-46 -73 L-48 -32 L-45 -17 L-42 -31 L-41 -73Z" fill="url(#silver)" stroke="#c6dcf2" stroke-width="1.5"/>
  <path d="M-54 -74 L-33 -74" stroke="#efc16a" stroke-width="4"/>
  <path d="M-45 -74 L-45 -87" stroke="#544031" stroke-width="4"/>
  <circle cx="-45" cy="-86" r="3" fill="#e8ba65"/>
 </g>
 </g>
 <!-- shield arm and layered gold-edged blue heater shield -->
 <g transform="rotate(${shieldRaise} 28 -100)">
 <path d="M28 -113 L40 -80 L34 -69 L24 -96Z" fill="url(#steel)" stroke="#29445a" stroke-width="3"/>
 <path d="M17 -116 Q39 -128 48 -110 L49 -58 Q40 -31 22 -16 Q8 -40 9 -64 L10 -102Z" fill="url(#gold)" stroke="#edd49a" stroke-width="2"/>
 <path d="M16 -111 Q36 -123 43 -107 L43 -61 Q37 -42 23 -25 Q14 -43 15 -65Z" fill="url(#shield)" stroke="#e0b367" stroke-width="2"/>
 <path d="M22 -98 L27 -86 L36 -84 L28 -77 L30 -61 L21 -69 L17 -58 L18 -78 L11 -85 L22 -86Z" fill="#eecb87" opacity=".85" transform="translate(7 4) scale(.75)"/>
 <path d="M22 -107 L38 -106 M19 -55 L25 -34" stroke="#ffdb93" stroke-width="1.5"/>
 </g>
 <!-- faceguard / helmet -->
 <path d="M-17 -145 L16 -145 L20 -124 L12 -118 L-13 -118 L-20 -128Z" fill="url(#steel)" stroke="#263c4e" stroke-width="3"/>
 <path d="M-19 -143 L-9 -160 L7 -161 L19 -145 L16 -136 L-15 -135Z" fill="url(#silver)" stroke="#344b62" stroke-width="3"/>
 <path d="M-3 -161 L0 -172 L6 -161" fill="#e9b86d" stroke="#f8d790" stroke-width="1.5"/>
 <path d="M-13 -138 L13 -138 L11 -132 L-11 -131Z" fill="#122536" stroke="#ddbb79" stroke-width="2"/>
 <path d="M-9 -133 L-7 -123 M1 -134 L1 -121 M9 -133 L7 -124" stroke="#86a5b6" stroke-width="2"/>
 <path d="M-15 -146 L14 -145" stroke="#fff2c3" stroke-width="1.5"/>
 </g>
 ${flare?`<path d="M${(n*6)%37+62} 18 Q102 -6 111 42" fill="none" stroke="#8ad8ff" stroke-width="5" opacity=".85"/><path d="M77 21 Q111 -7 121 35" fill="none" stroke="#f5c875" stroke-width="2" opacity=".9"/>`:''}
 ${guard?`<ellipse cx="64" cy="99" rx="${(25+14*Math.sin(Math.PI*p)).toFixed(1)}" ry="${(57+14*Math.sin(Math.PI*p)).toFixed(1)}" fill="none" stroke="#87bbff" stroke-width="3" opacity=".7"/><path d="M32 100 Q64 18 98 100" fill="none" stroke="#f7d58e" stroke-width="2"/>`:''}`;
}
function svg(action){
 const count=counts[action];if(!count)return '';
 let content='';
 for(let n=0;n<count;n++)content+=`<g transform="translate(${128*n} 0)">${frame(action,n)}</g>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${128*count}" height="192" viewBox="0 0 ${128*count} 192">
 <defs>
 <linearGradient id="steel" x1="0" y1="0" x2="1" y2=".3"><stop stop-color="#3e5368"/><stop offset=".3" stop-color="#c9d6db"/><stop offset=".54" stop-color="#f7f4e6"/><stop offset="1" stop-color="#435a6d"/></linearGradient>
 <linearGradient id="silver" x1=".2" y1="0" x2=".9" y2="1"><stop stop-color="#f5f5e8"/><stop offset=".4" stop-color="#8ca9ba"/><stop offset="1" stop-color="#d4e5e6"/></linearGradient>
 <linearGradient id="shield" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1b3562"/><stop offset=".6" stop-color="#2765a1"/><stop offset="1" stop-color="#102849"/></linearGradient>
 <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f3db9f"/><stop offset=".5" stop-color="#ad7845"/><stop offset="1" stop-color="#f2c373"/></linearGradient>
 <linearGradient id="cape" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#1a2c5a"/><stop offset=".6" stop-color="#2368bd"/><stop offset="1" stop-color="#101d39"/></linearGradient>
 </defs>${content}</svg>`;
}
function sheet(action){
 if(!Object.prototype.hasOwnProperty.call(counts,action))return null;
 if(!built[action])built[action]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg(action));
 return built[action];
}
return {counts,sheet,svg};
});
