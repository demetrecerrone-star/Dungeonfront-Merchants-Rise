/* Pure deterministic economy helpers, shared by browser and node tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.DFEconomy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const items={
 potion:{name:'Healing Potion',icon:'✚',cost:14,base:29,desc:'Keeps another poor soul breathing.'},
 torch:{name:'Pitch Torch',icon:'♨',cost:6,base:15,desc:'Light for the lower halls.'},
 bandage:{name:'Field Bandages',icon:'▤',cost:5,base:12,desc:'For cuts, burns, and claw wounds.'},
 blade:{name:'Iron Shortsword',icon:'⚔',cost:35,base:72,desc:'Reliable iron. No promises.'},
 forged:{name:'Reforged Longblade',icon:'⚒',cost:50,base:124,desc:'Made from dungeon-scavenged iron.'}
};
const upgrades={
 shelf:{name:'Reinforced Shelving',cost:220,desc:'More stock space, +1 customer at a time.'},
 forge:{name:'Ember Forge',cost:420,desc:'Unlock longblade crafting and warm the shop.'},
 guard:{name:'Hire a Door Guard',cost:340,desc:'Reduces losses from bandit raids by 85%.'},
 lantern:{name:'Beacon Lantern',cost:170,desc:'Adventurers find you easier; earn more reputation.'}
};
function initialState(){return {version:1,gold:280,reputation:10,day:1,clock:0,visitors:0,sales:0,earned:0,spent:0,depth:1,stock:{potion:5,torch:7,bandage:6,blade:2,forged:0},price:{potion:29,torch:15,bandage:12,blade:72,forged:124},mats:{iron:1,herb:2},upgrades:{shelf:false,forge:false,guard:false,lantern:false},events:['The shop opens beneath a hungry dungeon.'],raidCount:0,commissionDay:0,commissionsCompleted:0,lastVisitorDay:0,pendingEncounter:null,visitorsResolved:0};}
function valid(s){return !!s&&s.version===1&&Number.isFinite(s.gold)&&s.gold>=0&&s.stock&&s.price&&s.upgrades&&s.mats&&Number.isFinite(s.clock)&&s.day>=1;}
function earnRep(s,amount){s.reputation=Math.min(100,Math.max(0,s.reputation+amount));}
function restock(s,id,qty){qty=qty||3;const item=items[id];if(!item||id==='forged')return {ok:false,reason:'This item must be crafted.'};if((s.stock[id]||0)+qty>(s.upgrades.shelf?30:14))return {ok:false,reason:'Build shelving to increase stock capacity.'};const amount=qty*item.cost;if(s.gold<amount)return {ok:false,reason:'Not enough gold to restock.'};s.gold-=amount;s.spent+=amount;s.stock[id]=(s.stock[id]||0)+qty;return{ok:true,cost:amount};}
function setPrice(s,id,direction){const item=items[id];if(!item)return false;const current=s.price[id];const next=current+direction*2;s.price[id]=Math.max(item.cost+1,Math.min(item.base*3,next));return next===s.price[id];}
function buyUpgrade(s,id){let upgrade=upgrades[id];if(!upgrade)return{ok:false,reason:'Unknown upgrade.'};if(s.upgrades[id])return{ok:false,reason:'Already built.'};if(s.gold<upgrade.cost)return{ok:false,reason:'Not enough gold.'};s.gold-=upgrade.cost;s.spent+=upgrade.cost;s.upgrades[id]=true;return{ok:true};}
function craft(s,id){if(id==='potion'){if(s.mats.herb<2||s.gold<8)return{ok:false,reason:'Requires 2 wild herbs and 8 gold.'};s.mats.herb-=2;s.gold-=8;s.spent+=8;s.stock.potion+=2;return{ok:true,amount:2};}
if(id==='forged'){if(!s.upgrades.forge)return{ok:false,reason:'Build the Ember Forge first.'};if(s.mats.iron<3||s.gold<14)return{ok:false,reason:'Requires 3 scrap iron and 14 gold.'};s.mats.iron-=3;s.gold-=14;s.spent+=14;s.stock.forged+=1;return{ok:true,amount:1};}
return{ok:false,reason:'Unknown recipe.'};}
function attemptSale(s,id,budget,roll){const item=items[id];if(!item||!s.stock[id])return{ok:false,reason:'out-of-stock'};if(budget<s.price[id])return{ok:false,reason:'too-expensive'};const premium=s.price[id]/item.base;const chance=Math.max(.12,Math.min(.97,.85-(premium-1)*.56+s.reputation*.001));if(roll>chance)return{ok:false,reason:'declined'};s.stock[id]-=1;s.gold+=s.price[id];s.earned+=s.price[id];s.sales++;s.visitors++;earnRep(s,s.upgrades.lantern?2:1);if(s.sales%7===0)s.depth=Math.min(20,s.depth+1);return{ok:true,earned:s.price[id],chance};}
function buyLoot(s,type,amount,price){if(!['iron','herb'].includes(type)||!Number.isInteger(amount)||amount<=0||price<=0||s.gold<price)return{ok:false};s.gold-=price;s.spent+=price;s.mats[type]+=amount;return{ok:true};}
function commission(s){
 const rotation=[['torch',2],['bandage',2],['potion',2],['blade',1]];
 const [id,qty]=rotation[(s.day-1)%rotation.length];
 return {id,qty,reward:Math.round(items[id].base*qty*1.35+s.depth*4),claimed:s.commissionDay===s.day};
}
function fulfillCommission(s){
 const order=commission(s);
 if(order.claimed)return{ok:false,reason:'The guild has already received today’s shipment.'};
 if((s.stock[order.id]||0)<order.qty)return{ok:false,reason:'Not enough stock to fulfill the guild order.'};
 s.stock[order.id]-=order.qty;
 s.gold+=order.reward;s.earned+=order.reward;
 s.commissionDay=s.day;s.commissionsCompleted=(s.commissionsCompleted||0)+1;
 earnRep(s,3);
 return{ok:true,reward:order.reward,id:order.id,qty:order.qty};
}

const visitorEncounters={
 herbalist:{title:'The Traveling Herbalist',who:'Merrin • Roadside Apothecary',icon:'❀',
  story:'A weathered herbalist arrives with a basket of rare wild herbs. “The dungeon has made them hard to find. Care to trade?”',
  choices:[
   {id:'purchase',label:'BUY HERBS',desc:'Pay 18G for 3 herbs',gold:-18,herb:3,rep:1,result:'Merrin sells you three bundles of fresh herbs.'},
   {id:'barter',label:'BARTER',desc:'1 potion for 2 herbs and +3 rep',item:'potion',qty:1,herb:2,rep:3,result:'Merrin praises your fair barter.'},
   {id:'decline',label:'NOT TODAY',desc:'Politely decline',result:'Merrin wishes you good fortune.'}
  ]},
 wounded:{title:'A Wounded Ranger',who:'Kael • Forest Ranger',icon:'✚',
  story:'A bloodied ranger leans against the counter. “My companions are trapped below. Can you spare anything?”',
  choices:[
   {id:'heal',label:'GIVE POTION',desc:'1 potion for +6 rep',item:'potion',qty:1,rep:6,result:'Kael thanks you and hurries back to his party.'},
   {id:'bandage',label:'SELL BANDAGES',desc:'1 bandage for 25G and +2 rep',item:'bandage',qty:1,gold:25,rep:2,result:'Kael buys field bandages and leaves relieved.'},
   {id:'refuse',label:'SEND AWAY',desc:'Save your supplies',result:'The ranger continues toward the dungeon.'}
  ]},
 caravan:{title:'The Scrap Caravan',who:'Old Tovin • Salvage Trader',icon:'⚒',
  story:'An iron-laden cart creaks to a stop. “I have dungeon scrap. Or maybe you have something for my crew?”',
  choices:[
   {id:'iron',label:'BUY SCRAP',desc:'Pay 24G for 3 iron',gold:-24,iron:3,result:'Tovin unloads three bundles of usable iron.'},
   {id:'torches',label:'SELL TORCHES',desc:'2 torches for 35G and +2 rep',item:'torch',qty:2,gold:35,rep:2,result:'The caravan stocks up on your torches.'},
   {id:'pass',label:'PASS',desc:'Keep your current stock',result:'The caravan rolls on toward the western road.'}
  ]},
 delver:{title:'Loot from the Lower Halls',who:'Rook • Returning Delver',icon:'⚒',
  story:'An exhausted delver spreads iron fragments across the counter. “I survived. The scrap should be worth something, merchant.”',
  choices:[
   {id:'buy',label:'BUY SCRAP',desc:'18G for 3 iron',gold:-18,iron:3,result:'Rook sells you three bundles of dungeon scrap.'},
   {id:'haggle',label:'HAGGLE',desc:'11G for 2 iron',gold:-11,iron:2,result:'Rook reluctantly accepts your counteroffer.'},
   {id:'pass',label:'DECLINE',desc:'Keep your gold',result:'Rook takes the iron elsewhere.'}
  ]},
 forager:{title:'A Pouch of Wild Herbs',who:'Fenna • Dungeon Forager',icon:'❀',
  story:'A ranger opens a leather satchel. “These healing herbs grow beside the old crypt. Interested?”',
  choices:[
   {id:'buy',label:'BUY HERBS',desc:'15G for 3 herbs',gold:-15,herb:3,result:'Fenna leaves three fresh herb bundles.'},
   {id:'haggle',label:'SMALL BUNDLE',desc:'7G for 1 herb',gold:-7,herb:1,result:'Fenna sells you a smaller bundle.'},
   {id:'pass',label:'NOT TODAY',desc:'Decline the offer',result:'Fenna heads back to the trail.'}
  ]},
 swordhunter:{title:'An Iron Blade for Sale',who:'Sable • Relic Hunter',icon:'⚔',
  story:'A treasure hunter offers a usable sword recovered from the dungeon. “I would rather have coin than carry it.”',
  choices:[
   {id:'buy',label:'BUY THE BLADE',desc:'25G for 1 shortsword',gold:-25,stockItem:'blade',stockQty:1,result:'Sable sells you a refurbished iron shortsword.'},
   {id:'scrap',label:'BUY SCRAP',desc:'14G for 2 iron',gold:-14,iron:2,result:'Sable sells you the spare iron fragments.'},
   {id:'pass',label:'PASS',desc:'Decline',result:'Sable wraps the blade and departs.'}
  ]},
 apothecary:{title:'Surplus Potions',who:'Linna • Dungeon Apothecary',icon:'✚',
  story:'A healer offers unopened potions rescued from an abandoned camp. “I can sell them below market price.”',
  choices:[
   {id:'buy',label:'BUY POTIONS',desc:'22G for 2 healing potions',gold:-22,stockItem:'potion',stockQty:2,result:'Linna leaves two sealed healing potions.'},
   {id:'herbs',label:'BUY HERBS',desc:'10G for 2 herbs',gold:-10,herb:2,result:'Linna parts with two healing herb bundles.'},
   {id:'pass',label:'DECLINE',desc:'Save gold',result:'Linna continues to the next settlement.'}
  ]},
 scout:{title:'Scout Returns with Spoils',who:'Korin • Independent Scout',icon:'✦',
  story:'An independent scout empties a pack of mixed dungeon supplies. “I took the risk. Care to buy the salvage?”',
  choices:[
   {id:'iron',label:'BUY IRON',desc:'16G for 3 iron',gold:-16,iron:3,result:'Korin sells the heavy scrap from the lower passage.'},
   {id:'herbs',label:'BUY HERBS',desc:'12G for 2 herbs',gold:-12,herb:2,result:'Korin sells useful herbs gathered on the climb.'},
   {id:'leave',label:'PASS',desc:'Decline',result:'Korin keeps the hard-won supplies.'}
  ]},
 pilgrim:{title:'A Pilgrim at Sundown',who:'Sister Veya • Wanderer',icon:'✦',
  story:'A quiet pilgrim asks for aid before entering the Hollow Descent. “The light is fading, merchant.”',
  choices:[
   {id:'light',label:'GIFT A TORCH',desc:'1 torch for +5 rep',item:'torch',qty:1,rep:5,result:'Sister Veya promises to spread word of your kindness.'},
   {id:'help',label:'GIVE COIN',desc:'Pay 12G for +4 rep',gold:-12,rep:4,result:'The pilgrim accepts your donation with gratitude.'},
   {id:'farewell',label:'WISH LUCK',desc:'Wish her safe passage',result:'She blesses the shop before moving on.'}
  ]}
};
function resolveVisitor(s,eventId,choiceId){
 if(s.lastVisitorDay===s.day)return{ok:false,reason:'This visitor has already been served today.'};
 if(s.pendingEncounter!==eventId)return{ok:false,reason:'This visitor is no longer at the counter.'};
 const event=visitorEncounters[eventId],choice=event?.choices.find(x=>x.id===choiceId);
 if(!choice)return{ok:false,reason:'Unknown visitor choice.'};
 if((choice.gold||0)<0&&s.gold < -choice.gold)return{ok:false,reason:'Not enough gold.'};
 if(choice.item&&(s.stock[choice.item]||0)<choice.qty)return{ok:false,reason:'Not enough '+items[choice.item].name+' in stock.'};
 if(choice.stockItem&&(s.stock[choice.stockItem]||0)+choice.stockQty>(s.upgrades.shelf?30:14))return{ok:false,reason:'Not enough room on the shop shelves.'};
 if(choice.item)s.stock[choice.item]-=choice.qty;
 if(choice.stockItem)s.stock[choice.stockItem]=(s.stock[choice.stockItem]||0)+choice.stockQty;
 if(choice.gold){s.gold+=choice.gold;if(choice.gold>0)s.earned+=choice.gold;else s.spent-=choice.gold;}
 if(choice.iron)s.mats.iron+=choice.iron;
 if(choice.herb)s.mats.herb+=choice.herb;
 if(choice.rep)earnRep(s,choice.rep);
 s.lastVisitorDay=s.day;s.pendingEncounter=null;s.visitorsResolved=(s.visitorsResolved||0)+1;
 return {ok:true,message:choice.result,goldDelta:choice.gold||0,repDelta:choice.rep||0};
}

function raid(s,roll){if(roll>=.28)return {happened:false};s.raidCount++;const loss=Math.min(s.gold,Math.ceil(s.gold*(s.upgrades.guard?.025:.16)));s.gold-=loss;return{happened:true,loss};}
return{items,upgrades,initialState,valid,restock,setPrice,buyUpgrade,craft,attemptSale,buyLoot,raid,earnRep,commission,fulfillCommission,visitorEncounters,resolveVisitor};
});