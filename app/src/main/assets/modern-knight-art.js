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
/* Directional three-quarter Knight.
   All live movement/combat poses point right in source coordinates.
   The game flips the complete frame for leftward motion: no backpedalling
   because feet, visor, shield and sword are all physically side-on. */
function sideFrame(action,n){
 const count=counts[action],p=n/Math.max(1,count-1),phase=n/count*Math.PI*2;
 const walk=action==='walk',strike=action==='attack',hurt=action==='hurt',guard=action==='special';
 const run=walk?Math.sin(phase)*22:0;
 const front=run.toFixed(2),rear=(-run).toFixed(2);
 const bounce=walk?Math.abs(Math.sin(phase))*3:Math.sin(phase)*1.2;
 const thrust=strike?Math.sin(Math.PI*p)*8:0;
 const backstep=hurt?-Math.sin(Math.PI*p)*10:0;
 const cape=walk?Math.sin(phase+.8)*12:strike?-11*Math.sin(Math.PI*p):Math.sin(phase)*3;
 const blade=strike?(p<.3?-38:p<.63?(-38+(p-.3)*295):59):walk?-9:guard?32:12;
 const shield=guard?(-17*Math.sin(Math.PI*p)):hurt?-12:walk?3:0;
 const ready=strike?Math.sin(Math.PI*p)*7:0;
 const slash=strike&&p>.34&&p<.75;
 return `<g transform="translate(64 190) translate(${(thrust+backstep).toFixed(2)} ${(-bounce).toFixed(2)})">
  <!-- Motion always faces RIGHT: the cape trails LEFT, visor and sword point RIGHT. -->
  <ellipse cx="-1" cy="0" rx="27" ry="4" fill="#09121c" opacity=".37"/>
  <!-- trailing layered blue cape -->
  <path d="M-21 -126 Q-44 -116 -42 -93 Q-50 -63 -61 -49 L-34 -55 Q-42 -24 -51 -14 L-17 -38 L-9 -103Z"
   fill="url(#cape)" stroke="#1e365b" stroke-width="3" transform="translate(${cape.toFixed(2)} 0)"/>
  <path d="M-38 -82 Q-45 -47 -55 -38" fill="none" stroke="#6399ce" stroke-width="2" opacity=".85"/>
  <!-- far leg stays behind near leg -->
  <g transform="rotate(${(rear*.76).toFixed(2)} -9 -60)">
   <path d="M-18 -64 L-2 -64 L-1 -37 L-15 -30Z" fill="#344a64" stroke="#18283c" stroke-width="2"/>
   <path d="M-12 -39 L0 -35 L-9 -9 L-21 -11Z" fill="url(#steel)" stroke="#39556d" stroke-width="2"/>
   <path d="M-20 -14 L-4 -10 L-2 -2 L-28 -2Z" fill="#7895ac" stroke="#233c56" stroke-width="2"/>
  </g>
  <g transform="rotate(${front} 9 -60)">
   <path d="M6 -66 L24 -63 L22 -34 L8 -36Z" fill="url(#steel)" stroke="#34495d" stroke-width="2.7"/>
   <path d="M11 -38 L24 -33 L20 -10 L8 -10Z" fill="#b8c6cb" stroke="#385169" stroke-width="2"/>
   <path d="M7 -13 L23 -12 L32 -3 L8 -2Z" fill="url(#steel)" stroke="#304c65" stroke-width="2"/>
   <path d="M14 -31 L21 -29" stroke="#f7d089" stroke-width="2"/>
  </g>
  <!-- tall side-on plate cuirass, protected flank -->
  <path d="M-23 -115 L4 -123 Q25 -118 26 -99 L22 -73 L-18 -75Z"
    fill="url(#steel)" stroke="#2d4255" stroke-width="3"/>
  <path d="M-17 -108 L8 -114 Q17 -111 17 -101 L10 -84 L-14 -87Z"
    fill="url(#shield)" stroke="#a88e66" stroke-width="2"/>
  <path d="M-2 -110 L14 -102 L7 -89 L-10 -92Z"
    fill="#b8c7cf" stroke="#eacb88" stroke-width="2"/>
  <path d="M-23 -82 L21 -77 L26 -59 L6 -61 L-6 -70 L-20 -53 L-33 -58Z"
    fill="#18487c" stroke="#e3b96e" stroke-width="2.5"/>
  <path d="M-19 -77 L20 -77" stroke="#e4b574" stroke-width="5"/>
  <path d="M-2 -80 L7 -80 L7 -73 L-2 -73Z" fill="#30415a" stroke="#efd196" stroke-width="2"/>
  <!-- large rearward defensive shield: stays LEFT of the body -->
  <g transform="rotate(${shield} -20 -100)">
   <path d="M-33 -120 Q-18 -127 -8 -113 L-7 -73 Q-12 -54 -24 -39 Q-40 -62 -43 -83 L-43 -110Z"
      fill="url(#gold)" stroke="#f3d192" stroke-width="2"/>
   <path d="M-32 -115 Q-20 -122 -13 -110 L-13 -74 Q-16 -60 -24 -47 Q-35 -66 -37 -83 L-37 -109Z"
      fill="url(#shield)" stroke="#dfaa58" stroke-width="2"/>
   <path d="M-26 -103 L-21 -94 L-16 -90 L-22 -85 L-21 -72 L-27 -79 L-30 -71 L-29 -86 L-35 -92 L-26 -92Z"
     fill="#f0c778"/>
   <path d="M-36 -110 L-14 -109" stroke="#ffe5aa" stroke-width="1.5"/>
  </g>
  <!-- shoulder / sword arm point towards destination -->
  <path d="M6 -124 Q27 -127 31 -111 L20 -103 L5 -106Z"
   fill="url(#silver)" stroke="#435873" stroke-width="3"/>
  <path d="M17 -112 L32 -89 L24 -79 L9 -105Z" fill="url(#steel)" stroke="#3e556d" stroke-width="2.8"/>
  <g transform="rotate(${blade.toFixed(2)} 25 -83)">
   <path d="M24 -85 L34 -79 L37 -73 L29 -68 L20 -77Z" fill="#71859b" stroke="#eac17e" stroke-width="1.5"/>
   <path d="M28 -83 L48 -83 L53 -80 L50 -76 L29 -77Z" fill="url(#silver)" stroke="#e7f0f3" stroke-width="1.4"/>
   <path d="M29 -86 L29 -74" stroke="#f1cb82" stroke-width="3.5"/>
   <path d="M24 -80 L17 -80" stroke="#59412f" stroke-width="3"/>
   <circle cx="17" cy="-80" r="2.5" fill="#efc677"/>
  </g>
  <!-- unmistakable knight helmet PROFILE: back on left, protruding visor to right -->
  <path d="M-6 -147 L3 -162 L18 -161 L29 -146 L25 -132 L12 -123 L-4 -132Z"
    fill="url(#silver)" stroke="#294358" stroke-width="3"/>
  <path d="M2 -162 L7 -171 L14 -163" fill="#e7be70" stroke="#ffdfa2" stroke-width="1.5"/>
  <path d="M13 -151 L34 -146 L38 -139 L32 -132 L21 -133 L16 -141Z"
    fill="url(#steel)" stroke="#435b6f" stroke-width="2"/>
  <path d="M18 -143 L36 -141 L31 -137 L19 -139Z" fill="#13283c" stroke="#e5ba75" stroke-width="1.8"/>
  <path d="M26 -135 L30 -129 L18 -126" fill="none" stroke="#e7c98f" stroke-width="2"/>
  <path d="M-4 -142 L8 -144" stroke="#fff1d4" stroke-width="2"/>
  <!-- Anime-fantasy polish: engraved shoulder, raised shield crest, cape seams,
       armor rivets and a clean luminous visor rim; no character pose changes. -->
  <path d="M-21 -118 Q-24 -127 -11 -122 M-17 -113 L-7 -114" stroke="#e8c98c" stroke-width="1.6" fill="none"/>
  <path d="M11 -119 L22 -112 L16 -106 M10 -116 L18 -110" stroke="#f3dca0" stroke-width="1.5" fill="none"/>
  <path d="M-13 -105 Q3 -111 12 -100" fill="none" stroke="#d4bb88" stroke-width="1.7"/>
  <path d="M-12 -100 L-4 -94 L3 -100 L10 -94" fill="none" stroke="#86b6d6" stroke-width="1.2"/>
  <path d="M-15 -84 L8 -82" fill="none" stroke="#f5d59a" stroke-width="1.1"/>
  <path d="M-33 -100 L-16 -97 M-35 -85 L-16 -82 M-30 -62 L-22 -53" fill="none" stroke="#f5ca80" stroke-width="1.5"/>
  <path d="M-31 -105 L-24 -97 L-20 -105 L-16 -97" fill="none" stroke="#ffe1a8" stroke-width="1.2"/>
  <path d="M-48 -92 Q-44 -80 -49 -62 Q-52 -47 -57 -40" fill="none" stroke="#97bce4" stroke-width="1.6" opacity=".85"/>
  <path d="M-46 -90 Q-48 -59 -54 -51" fill="none" stroke="#e9c37f" stroke-width="1" opacity=".7"/>
  <path d="M4 -158 Q16 -164 24 -148 M20 -143 L33 -140" fill="none" stroke="#fff6cf" stroke-width="1.4"/>
  <path d="M23 -147 L30 -144" fill="none" stroke="#9bd8fb" stroke-width="2.1"/>
  <circle cx="-14" cy="-115" r="2" fill="#f8dda3"/><circle cx="15" cy="-111" r="2" fill="#f8dda3"/>
  <circle cx="-24" cy="-99" r="2" fill="#97d7ed" stroke="#f5d299" stroke-width="1"/>
  ${slash?`<path d="M35 -157 Q65 -123 51 -77" fill="none" stroke="#80d7ff" stroke-width="6" opacity=".85"/>
     <path d="M39 -156 Q62 -117 50 -78" fill="none" stroke="#f3cb85" stroke-width="2"/>`:''}
  ${guard&&p>.22&&p<.86?`<path d="M-47 -134 Q-67 -78 -45 -33" fill="none" stroke="#a0d5ff" stroke-width="5" opacity=".72"/>`:''}
 </g>`;
}
function frame(action,n){
 // Side-profile frames are required for convincing movement and combat.
 if(action!=='death')return sideFrame(action,n);
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
 const tilt=hurt?-12*Math.sin(Math.PI*p):dying?-84*p:attacking?Math.sin(Math.PI*p)*-8:walking?7:0;
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
 <!-- Side-profile visor makes the direction of travel unambiguous.
      Default art faces RIGHT; the renderer mirrors it for left motion. -->
 ${walking?`<path d="M7 -143 L23 -141 L24 -133 L18 -126 L8 -128Z" fill="url(#steel)" stroke="#e5bf78" stroke-width="1.6"/>
 <path d="M12 -137 L23 -136 L20 -133 L12 -133Z" fill="#122535"/>
 <path d="M17 -128 L20 -122 L9 -121" fill="none" stroke="#b8c5d1" stroke-width="1.5"/>`:''}
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
