// Test that the dungeon camera does not permit shop popups.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/game.js'),'utf8');
assert.doesNotThrow(()=>new vm.Script(source), 'game script must parse');
function contains(text,description){
 assert.ok(source.includes(text),description);
 console.log('PASS '+description);
}
contains("if(view!=='shop')return;\n const el=$('feedbackToast');",
 'commerce feedback is gated to shop view');
contains("if(!enc||!active||view!=='shop')return;",
 'visitor popup is blocked in dungeon');
contains("if(s.pendingEncounter&&view==='shop'){presentVisitor();return}",
 'visitor overlay is opened only in shop');
contains("if(showDeferred&&active&&!paused&&s.pendingEncounter)presentVisitor();",
 'queued visitors resume after explicit return to shop');
contains("clearTimeout(toastTimer);$('feedbackToast').classList.add('hidden');",
 'old purchase popup is cleared when entering dungeon');
contains("if(!s.pendingEncounter&&visitorCountdown<=0&&s.lastVisitorDay!==s.day)",
 'visitor queue does not duplicate events during dungeon view');
contains("g.fillText('EXIT PORTAL',x,214);",
 'entrance-side exit portal is shown on every floor');
contains("if(floor<D.bossFloor){",
 'next-floor passage is shown only before the raid floor');
assert.ok(!source.includes("'RAID EXIT'"),'far end of raid floor has no extraction portal');
console.log('PASS final raid floor has no far-end exit portal');
contains("if(view!=='contract'||!run||(run.status!=='completed'&&run.status!=='failed'))",
 'claim report cannot appear while a contract party is still extracting');
console.log('All ten dungeon UI and extraction guards passed.');
