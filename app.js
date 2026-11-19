(function(){
'use strict';
const STORAGE='gympilot_pwa_v2';
const todayIndex=()=> (new Date().getDay()+6)%7;
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtNum=n=>Number(n.toFixed(1)).toLocaleString('it-IT');
const fmtMacro=n=>Number(n.toFixed(0)).toLocaleString('it-IT');

const defaultState=()=>({
  selectedDay:todayIndex(),
  selectedWorkoutDay:0,
  view:'plan',
  choices:{},
  consumed:{},
  purchased:{},
  shoppingDone:null,
  water:{},
  notes:{},
  trainingChecks:{},
  trainingNotes:{},
  lastVisitDate:'',
  expandedMeals:{},
  chatUrl:'',
  coachPreset:'swap',
  coachDay:todayIndex(),
  coachMeal:2,
  weekStart:'',
  workoutWeek:'',
  workoutCalendar:{},
  customFoods:{},
  customFavorites:[],
  customRecent:[]
});
let state;
try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'null'); state={...defaultState(), ...(saved&&typeof saved==='object'?saved:{})};}
catch{state=defaultState();}
const now=new Date();
const localDate=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
const newVisit=state.lastVisitDate!==localDate;
if(newVisit){state.selectedDay=todayIndex(); state.lastVisitDate=localDate;}
function dateISO(date){const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function dateLocal(iso){const a=iso.split('-').map(Number);return new Date(a[0],a[1]-1,a[2],12);}
function startMonday(input){const d=new Date(input); d.setDate(d.getDate() - (d.getDay()+6)%7);return dateISO(d);}
function weekDate(start,index){const d=dateLocal(start);d.setDate(d.getDate()+index);return dateISO(d);}
function shiftWeek(start,offset){const d=dateLocal(start);d.setDate(d.getDate()+7*offset);return dateISO(d);}
if(newVisit||!/^\d{4}-\d{2}-\d{2}$/.test(state.weekStart))state.weekStart=startMonday(now);
if(newVisit||!/^\d{4}-\d{2}-\d{2}$/.test(state.workoutWeek))state.workoutWeek=startMonday(now);
for(const key of ['workoutCalendar','customFoods'])if(!state[key]||typeof state[key]!=='object'||Array.isArray(state[key]))state[key]={};
for(const key of ['customFavorites','customRecent'])if(!Array.isArray(state[key]))state[key]=[];
function dateForDay(day){return weekDate(state.weekStart,day);}
if(!state.datedMigration){
  const old={...state.consumed};state.consumed={};
  for(const [key,value] of Object.entries(old)){
    const m=key.match(/^(\d)-(\d)-(\d)-(\d+)$/);
    if(m){state.consumed[`${weekDate(startMonday(now),Number(m[1]))}|${key}`]=value;}
    else state.consumed[key]=value;
  }
  for(const field of ['water','notes']){
    for(let i=0;i<7;i++){
      const oldKey=`day-${i}`;
      if(state[field][oldKey]!==undefined){state[field][weekDate(startMonday(now),i)]=state[field][oldKey];delete state[field][oldKey];}
    }
  }
  state.datedMigration=true;
}


if(!state.expandedMeals || typeof state.expandedMeals!=='object') state.expandedMeals={};
const SHOP_CATEGORIES=[
  {name:'Merendine da scuola',icon:'✦'},
  {name:'Proteine e latticini',icon:'◈'},
  {name:'Carne e pesce',icon:'◒'},
  {name:'Cereali e pane',icon:'▤'},
  {name:'Legumi',icon:'◌'},
  {name:'Frutta e verdura',icon:'❋'},
  {name:'Condimenti e extra',icon:'◉'}
];
const OPTION_LABELS=['Piano','Alt 1','Alt 2','Alt 3','Alt 4'];
let toastTimer=0; let priorFocus=null;

function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{notify('Impossibile salvare tutto sul dispositivo.');}}
function choose(day,meal){const k=`${day}-${meal}`; const v=Number(state.choices[k]); return Number.isInteger(v)&&v>=0&&v<5?v:0;}
function setChoice(day,meal,option){const k=`${day}-${meal}`; if(option===0) delete state.choices[k]; else state.choices[k]=option; state.shoppingDone=null; save();}
function activeMeal(day,meal){return mealChoicesFor(day,meal)[choose(day,meal)];}
function foodKey(day,meal,option,foodIndex){return `${dateForDay(day)}|${day}-${meal}-${option}-${foodIndex}`;}
function isFoodChecked(day,meal,option,foodIndex){return !!state.consumed[foodKey(day,meal,option,foodIndex)];}
function setFoodChecked(day,meal,option,foodIndex,checked){const k=foodKey(day,meal,option,foodIndex); if(checked) state.consumed[k]=1; else delete state.consumed[k]; save();}
function dayKey(day){return dateForDay(day);}
function isExpanded(day,meal){return !!state.expandedMeals[`${day}-${meal}`];}
function setExpanded(day,meal,value){
  const key=`${day}-${meal}`;
  if(value)state.expandedMeals[key]=true;
  else delete state.expandedMeals[key];
  save();
}
function getDayProgress(day){
  let done=0,total=0;
  for(let i=0;i<MEAL_TYPES.length;i++){
    const progress=mealProgress(day,i);
    done+=progress.done;
    total+=progress.total;
  }
  return {done,total,percentage:total?Math.round(done/total*100):0};
}
function renderWeeklyProgress(){
  const cards=WEEK_BASE.map((d,day)=>{
    const progress=getDayProgress(day);
    return `<div class="week-progress-card" aria-label="${d.label}: ${progress.percentage} per cento">
      <span class="week-progress-day">${d.short}</span><div class="week-progress-track"><span style="height:${progress.percentage}%"></span></div>
      <strong>${progress.percentage}%</strong>
    </div>`;
  }).join('');
  $('weekly-progress').innerHTML=cards;
}


function foodMacros(food){
  const base=FOOD[food.id];
  const factor=food.q/base.per;
  return {kcal:base.kcal*factor,p:base.p*factor,c:base.c*factor,f:base.f*factor};
}
function sumFoods(foods){return foods.reduce((acc,food)=>{const m=foodMacros(food);acc.kcal+=m.kcal;acc.p+=m.p;acc.c+=m.c;acc.f+=m.f;return acc;},{kcal:0,p:0,c:0,f:0});}
function fmtQty(food){const meta=FOOD[food.id]; const q=food.q; if(meta.unit==='g' && q>=1000)return `${fmtNum(q/1000)} kg`; if(meta.unit==='ml'&&q>=1000)return `${fmtNum(q/1000)} L`; return `${fmtNum(q)} ${meta.unit}`;}
function pct(actual,target){return Math.min(100, Math.round((actual/target)*100))||0;}
function plannedTotals(day){let t={kcal:0,p:0,c:0,f:0}; for(let i=0;i<MEAL_TYPES.length;i++){const m=sumFoods(activeMeal(day,i).foods); t.kcal+=m.kcal; t.p+=m.p; t.c+=m.c; t.f+=m.f;} return t;}
function consumedTotals(day){let t={kcal:0,p:0,c:0,f:0}; for(let meal=0; meal<MEAL_TYPES.length; meal++){
  const opt=choose(day,meal),foods=mealChoicesFor(day,meal)[opt].foods;
  foods.forEach((food,idx)=>{if(isFoodChecked(day,meal,opt,idx)){const m=foodMacros(food);for(const k of Object.keys(t))t[k]+=m[k];}});
  for(const entry of getCustomMeal(day,meal)){if(entry.eaten!==false){const m=customMacros(entry);for(const k of Object.keys(t))t[k]+=m[k];}}
}return t;}
function getCustomMeal(day,meal){return state.customFoods[`${dateForDay(day)}|${meal}`]||[];}
function customMacros(entry){const ratio=Number(entry.q)/Number(entry.per||100);return {kcal:entry.kcal*ratio,p:entry.p*ratio,c:entry.c*ratio,f:entry.f*ratio};}
function customMealSummary(day,meal){return getCustomMeal(day,meal).reduce((t,e)=>{if(e.eaten!==false){const m=customMacros(e);for(const k of Object.keys(t))t[k]+=m[k];}return t;},{kcal:0,p:0,c:0,f:0});}

function mealProgress(day,meal){const opt=choose(day,meal); const foods=mealChoicesFor(day,meal)[opt].foods; const custom=getCustomMeal(day,meal); const done=foods.filter((_,idx)=>isFoodChecked(day,meal,opt,idx)).length+custom.filter(e=>e.eaten!==false).length; return {done,total:foods.length+custom.length};}

const ICONS={
  dumbbellBench:`<svg viewBox="0 0 64 64"><rect x="7" y="21" width="10" height="22" rx="2"/><rect x="47" y="21" width="10" height="22" rx="2"/><rect x="17" y="27" width="5" height="10" rx="1"/><rect x="42" y="27" width="5" height="10" rx="1"/><rect x="22" y="30" width="20" height="4" rx="2"/><path d="M15 49h34" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M24 49l6-10h8l6 10" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  inclineBench:`<svg viewBox="0 0 64 64"><path d="M18 46h28" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M24 46l6-10h6l8-13" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M35 23h16" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/><rect x="8" y="19" width="6" height="18" rx="2"/><rect x="50" y="19" width="6" height="18" rx="2"/></svg>`,
  pecDeck:`<svg viewBox="0 0 64 64"><path d="M17 52V12h8v40" fill="currentColor"/><path d="M39 52V12h8v40" fill="currentColor"/><path d="M25 25c7 2 7 12 7 12s0-10 7-12" stroke="currentColor" stroke-width="4" fill="none"/><circle cx="32" cy="22" r="4" fill="currentColor"/></svg>`,
  shoulderPress:`<svg viewBox="0 0 64 64"><path d="M20 52V22h24v30" stroke="currentColor" stroke-width="4" fill="none"/><path d="M16 20h10M38 20h10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M25 32l7-7 7 7" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lateralMachine:`<svg viewBox="0 0 64 64"><circle cx="32" cy="18" r="4" fill="currentColor"/><path d="M32 22v14M18 28l14 6 14-6M20 50V26M44 50V26" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  dbTriceps:`<svg viewBox="0 0 64 64"><circle cx="20" cy="18" r="4" fill="currentColor"/><path d="M20 22l8 8 8-8 8 18" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="40" y="39" width="10" height="6" rx="2"/><rect x="50" y="37" width="4" height="10" rx="1"/></svg>`,
  pushdown:`<svg viewBox="0 0 64 64"><path d="M32 10v12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="26" r="4" fill="currentColor"/><path d="M32 30v10M20 24h12M32 24h12" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M24 44l8-4 8 4" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  highRow:`<svg viewBox="0 0 64 64"><path d="M18 52V14h10v38" fill="currentColor"/><path d="M28 24h18" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M31 38l8-8 8 8" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lowRow:`<svg viewBox="0 0 64 64"><path d="M16 50h32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M18 18v32" stroke="currentColor" stroke-width="4"/><path d="M28 30h16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="44" cy="30" r="3" fill="currentColor"/></svg>`,
  rowProna:`<svg viewBox="0 0 64 64"><path d="M16 14v36" stroke="currentColor" stroke-width="4"/><path d="M22 22h20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M24 40l8-6 8 6" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  inclineCurl:`<svg viewBox="0 0 64 64"><path d="M20 46h10l12-22h8" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="22" cy="18" r="4" fill="currentColor"/><path d="M22 22l8 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><rect x="31" y="28" width="10" height="4" rx="2"/></svg>`,
  ropeCurl:`<svg viewBox="0 0 64 64"><path d="M32 10v14" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="27" r="4" fill="currentColor"/><path d="M28 31l-6 14M36 31l6 14" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  stepUp:`<svg viewBox="0 0 64 64"><path d="M12 46h18v8H12zM30 38h22v16H30z" fill="currentColor"/><path d="M24 18l10 8 6 16" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  legExtension:`<svg viewBox="0 0 64 64"><path d="M18 46V20h12l6 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 30l12 8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><rect x="46" y="34" width="8" height="10" rx="2"/></svg>`,
  shoulderDb:`<svg viewBox="0 0 64 64"><circle cx="32" cy="18" r="4" fill="currentColor"/><path d="M32 22v12M20 18l6 8M44 18l-6 8M18 16h8M38 16h8" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  lateralDb:`<svg viewBox="0 0 64 64"><circle cx="32" cy="18" r="4" fill="currentColor"/><path d="M32 22v12M18 30l14-6 14 6" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="13" y="27" width="4" height="8" rx="1"/><rect x="47" y="27" width="4" height="8" rx="1"/></svg>`,
  facePull:`<svg viewBox="0 0 64 64"><path d="M32 10v14" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="28" r="5" fill="currentColor"/><path d="M20 20l8 8M44 20l-8 8M24 44l8-8 8 8" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chestPress:`<svg viewBox="0 0 64 64"><path d="M18 52V16h10v36" fill="currentColor"/><path d="M28 24h16v20H28" stroke="currentColor" stroke-width="4" fill="none"/><path d="M44 28h8M44 40h8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  cableFly:`<svg viewBox="0 0 64 64"><path d="M14 12v40M50 12v40" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="20" r="4" fill="currentColor"/><path d="M32 24v14M18 28l14 7 14-7" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  dipMachine:`<svg viewBox="0 0 64 64"><path d="M18 14v38M46 14v38" stroke="currentColor" stroke-width="4"/><path d="M22 20h20" stroke="currentColor" stroke-width="4"/><path d="M32 24v14M24 36h16" stroke="currentColor" stroke-width="4" fill="none"/></svg>`,
  reversePushdown:`ICONS_PLACEHOLDER`,
  legPress:`<svg viewBox="0 0 64 64"><path d="M14 48l16-24 20 8" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 18v20" stroke="currentColor" stroke-width="4"/><rect x="46" y="12" width="8" height="8" rx="2"/></svg>`,
  hipThrust:`<svg viewBox="0 0 64 64"><path d="M14 40h36" stroke="currentColor" stroke-width="4"/><path d="M18 40l6-10h12l6 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="48" y="34" width="8" height="12" rx="2"/></svg>`,
  calfPress:`<svg viewBox="0 0 64 64"><path d="M14 48l16-18 18 6" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 20h12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  latMachine:`<svg viewBox="0 0 64 64"><path d="M32 12v12" stroke="currentColor" stroke-width="4"/><path d="M18 18l14 8 14-8" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 26v22" stroke="currentColor" stroke-width="4"/><path d="M22 48h20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  neutralRow:`<svg viewBox="0 0 64 64"><path d="M16 50h34" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M18 18v32" stroke="currentColor" stroke-width="4"/><path d="M28 32h14" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M42 30l6 2-6 2" fill="currentColor"/></svg>`,
  preacherCurl:`<svg viewBox="0 0 64 64"><path d="M20 50h24" stroke="currentColor" stroke-width="4"/><path d="M26 50l4-18h10l4 18" stroke="currentColor" stroke-width="4" fill="none" stroke-linejoin="round"/><rect x="28" y="24" width="12" height="4" rx="2"/></svg>`,
  lowCableCurl:`<svg viewBox="0 0 64 64"><path d="M32 12v10" stroke="currentColor" stroke-width="4"/><path d="M24 42l8-8 8 8" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 22v12" stroke="currentColor" stroke-width="4"/><path d="M24 24h16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`
};
ICONS.reversePushdown = ICONS.pushdown;

function renderDaySelector(){
  $('plan-week-label').textContent=`${dateLocal(state.weekStart).toLocaleDateString('it-IT',{day:'numeric',month:'short'})} – ${dateLocal(weekDate(state.weekStart,6)).toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'})}`;

  const root=$('day-selector');
  root.innerHTML=WEEK_BASE.map((d,i)=>`<button class="day-button${state.selectedDay===i?' selected':''}${dateForDay(i)===localDate?' current':''}" data-day="${i}" aria-selected="${state.selectedDay===i}"><span class="day-short">${d.short}</span><span class="day-dot"></span></button>`).join('');
  root.querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>{state.selectedDay=Number(b.dataset.day); save(); renderPlan();}));
}

function renderMetrics(){
  const day=state.selectedDay;
  const consumed=consumedTotals(day);
  const planned=plannedTotals(day);
  $('day-title').textContent=WEEK_BASE[day].label+' · '+dateLocal(dateForDay(day)).toLocaleDateString('it-IT',{day:'numeric',month:'short'});
  $('hero-subtitle').textContent=dateForDay(day)===localDate?'Oggi':'Diario · '+dateForDay(day);
  $('cal-target').textContent=`${TARGETS.kcal} kcal`;
  $('cal-planned').textContent=`${fmtMacro(planned.kcal)} kcal`;
  $('cal-consumed').textContent=`${fmtMacro(consumed.kcal)} kcal`;
  const remainder=Math.round(TARGETS.kcal-consumed.kcal);
  $('cal-remaining').textContent=remainder>=0?`${fmtMacro(remainder)} kcal`:`${fmtMacro(Math.abs(remainder))} kcal`;
  $('cal-remaining-label').textContent=remainder>=0?'ancora disponibili':'oltre il riferimento';
  const wrap=(label,val,target,key)=>`<div class="macro-card"><div class="macro-card-top"><span>${label}</span><strong>${fmtMacro(val)} g</strong></div><div class="macro-bar"><span style="width:${pct(val,target)}%"></span></div><div class="macro-card-bottom">Target ${target} g</div></div>`;
  $('macro-grid').innerHTML=[['Proteine',consumed.p,TARGETS.p],['Carboidrati',consumed.c,TARGETS.c],['Grassi',consumed.f,TARGETS.f]].map(x=>wrap(...x)).join('');
  const adherence = getDayProgress(day).percentage;
  $('daily-adherence').textContent=`Aderenza del giorno: ${adherence}%`;
  $('planned-note').textContent=`Pianificato con le scelte attuali: ${fmtMacro(planned.p)}P · ${fmtMacro(planned.c)}C · ${fmtMacro(planned.f)}F`;
  renderWeeklyProgress();
}

function renderMeals(){
  const day=state.selectedDay;
  $('meal-list').innerHTML=MEAL_TYPES.map((type, mealIdx)=>{
    const choices=mealChoicesFor(day,mealIdx);
    const selected=choose(day,mealIdx);
    const active=choices[selected];
    const summary=sumFoods(active.foods);
    const prog=mealProgress(day,mealIdx);
    const open=isExpanded(day,mealIdx);
    const panelId=`meal-panel-${day}-${mealIdx}`;
    const optionButtons=choices.map((_,idx)=>`<button type="button" class="option-tab${idx===selected?' active':''}" data-day="${day}" data-meal="${mealIdx}" data-option="${idx}">${OPTION_LABELS[idx]}</button>`).join('');
    const customRows=getCustomMeal(day,meal).map((entry,idx)=>{const m=customMacros(entry);return `<div class="food-row custom-food-row${entry.eaten===false?'':' checked'}"><input type="checkbox" data-custom-check="${idx}" data-day="${day}" data-meal="${mealIdx}" ${entry.eaten===false?'':'checked'}><span class="food-main"><span class="food-name">${escapeHTML(entry.name)}</span><span class="food-qty">${fmtNum(entry.q)} ${entry.unit} · ${escapeHTML(entry.source||'Stima')}</span></span><span class="food-macros">${fmtMacro(m.kcal)} kcal · ${fmtMacro(m.p)}P/${fmtMacro(m.c)}C/${fmtMacro(m.f)}F</span><button type="button" class="remove-food" data-custom-remove="${idx}" data-day="${day}" data-meal="${mealIdx}" aria-label="Rimuovi ${escapeHTML(entry.name)}">×</button></div>`;}).join('');
    const ingredientRows=active.foods.map((food,idx)=>{
      const checked=isFoodChecked(day,mealIdx,selected,idx);
      const m=foodMacros(food);
      return `<label class="food-row${checked?' checked':''}">
        <input type="checkbox" data-food-check="1" data-day="${day}" data-meal="${mealIdx}" data-option="${selected}" data-index="${idx}" ${checked?'checked':''}>
        <span class="food-main"><span class="food-name">${escapeHTML(FOOD[food.id].name)}</span><span class="food-qty">${fmtQty(food)}</span></span>
        <span class="food-macros">${fmtMacro(m.kcal)} kcal · ${fmtMacro(m.p)}P/${fmtMacro(m.c)}C/${fmtMacro(m.f)}F</span>
      </label>`;
    }).join('');
    return `<article class="meal-card">
      <div class="meal-head">
        <div class="meal-icon ${type.tone}">${type.icon}</div>
        <div class="meal-head-text"><h3>${type.name}</h3><div class="meal-sub">${type.subtitle}</div></div>
        <div class="mini-progress">${prog.done}/${prog.total}</div>
      </div>
      <div class="option-tabs">${optionButtons}</div>
      <div class="meal-choice-title">${escapeHTML(active.title)}</div>
      <div class="meal-choice-note">${escapeHTML(active.note || 'Spunta i singoli alimenti quando li mangi.')}</div>
      <div class="meal-summary"><span>${fmtMacro(summary.kcal)} kcal</span><span>${fmtMacro(summary.p)}P · ${fmtMacro(summary.c)}C · ${fmtMacro(summary.f)}F</span></div>
      <div class="meal-coach-line"><button type="button" class="secondary-button quick-add-food" data-open-search="${mealIdx}">+ Aggiungi alimento</button><button type="button" class="ghost-button small" data-ask-meal="${mealIdx}" data-day="${day}">Chiedi un'alternativa al coach ↗</button></div>
      <button type="button" class="meal-toggle${open?' is-open':''}" data-toggle-meal="1" data-day="${day}" data-meal="${mealIdx}" aria-expanded="${open}" aria-controls="${panelId}">
        <span class="meal-toggle-caption"><span class="meal-toggle-title">${prog.done===prog.total?'Pasto completato':'Segna gli alimenti mangiati'}</span><span class="meal-toggle-sub">${prog.done} di ${prog.total} alimenti · tocca per ${open?'chiudere':'aprire'}</span></span>
        <svg class="meal-toggle-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="meal-expandable" id="${panelId}" ${open?'':'hidden'}>
        <div class="meal-block-label">Alimenti del piano · spunta solo ciò che hai mangiato</div>
        <div class="food-list">${ingredientRows}</div>
        <div class="meal-block-label meal-block-custom">Registrati da te</div>
        <div class="food-list">${customRows||'<p class="subtle-help">Nessun alimento extra registrato per questo pasto.</p>'}</div>
        <div class="meal-actions custom-cta">
          <button type="button" class="secondary-button" data-open-search="${mealIdx}">+ Aggiungi ciò che ho mangiato</button>
          <button type="button" class="ghost-button small" data-clear-proposed="${mealIdx}">Non ho mangiato il menu proposto</button>
        </div>
        <div class="meal-actions">
          <button type="button" class="secondary-button" data-mark-meal="1" data-day="${day}" data-meal="${mealIdx}">Segna tutto il pasto</button>
          <button type="button" class="ghost-button" data-reset-meal="1" data-day="${day}" data-meal="${mealIdx}">Reset pasto</button>
        </div>
      </div>
    </article>`;
  }).join('');

  $('meal-list').querySelectorAll('[data-open-search]').forEach(b=>b.addEventListener('click',()=>openFoodFinder(day,Number(b.dataset.openSearch))));
  $('meal-list').querySelectorAll('[data-clear-proposed]').forEach(b=>b.addEventListener('click',()=>{
    const meal=Number(b.dataset.clearProposed), opt=choose(day,meal);
    activeMeal(day,meal).foods.forEach((_,i)=>delete state.consumed[foodKey(day,meal,opt,i)]);
    save();renderPlan();notify('Spunte del menu proposto tolte.');
  }));
  $('meal-list').querySelectorAll('[data-custom-check]').forEach(b=>b.addEventListener('change',()=>{const items=getCustomMeal(day,Number(b.dataset.meal));items[Number(b.dataset.customCheck)].eaten=b.checked;save();renderPlan();}));
  $('meal-list').querySelectorAll('[data-custom-remove]').forEach(b=>b.addEventListener('click',()=>{
    const items=getCustomMeal(day,Number(b.dataset.meal));items.splice(Number(b.dataset.customRemove),1);save();renderPlan();
  }));
  $('meal-list').querySelectorAll('[data-ask-meal]').forEach(btn=>btn.addEventListener('click',()=>{state.coachDay=Number(btn.dataset.day);state.coachMeal=Number(btn.dataset.askMeal);state.coachPreset='swap';save();renderCoach();showView('coach');}));
  $('meal-list').querySelectorAll('[data-toggle-meal]').forEach(btn=>btn.addEventListener('click',()=>{
    const day=Number(btn.dataset.day), meal=Number(btn.dataset.meal);
    setExpanded(day,meal,!isExpanded(day,meal));
    renderMeals();
    document.querySelector(`[data-toggle-meal][data-day="${day}"][data-meal="${meal}"]`)?.focus({preventScroll:true});
  }));
  $('meal-list').querySelectorAll('[data-option]').forEach(btn=>btn.addEventListener('click',()=>{setChoice(Number(btn.dataset.day),Number(btn.dataset.meal),Number(btn.dataset.option)); renderPlan(); renderShop();}));
  $('meal-list').querySelectorAll('[data-food-check]').forEach(box=>box.addEventListener('change',()=>{setFoodChecked(Number(box.dataset.day),Number(box.dataset.meal),Number(box.dataset.option),Number(box.dataset.index),box.checked); renderMetrics(); renderMeals();}));
  $('meal-list').querySelectorAll('[data-mark-meal]').forEach(btn=>btn.addEventListener('click',()=>{const day=Number(btn.dataset.day), meal=Number(btn.dataset.meal), option=choose(day,meal), foods=mealChoicesFor(day,meal)[option].foods; foods.forEach((_,idx)=>setFoodChecked(day,meal,option,idx,true)); notify('Pasto segnato come mangiato.'); renderPlan();}));
  $('meal-list').querySelectorAll('[data-reset-meal]').forEach(btn=>btn.addEventListener('click',()=>{const day=Number(btn.dataset.day), meal=Number(btn.dataset.meal), option=choose(day,meal), foods=mealChoicesFor(day,meal)[option].foods; foods.forEach((_,idx)=>setFoodChecked(day,meal,option,idx,false)); notify('Pasto azzerato.'); renderPlan();}));
}

function getCustomMealsForDate(iso){return Object.entries(state.customFoods).filter(([k])=>k.startsWith(iso+'|')).flatMap(([,list])=>list);}
function renderLifestyle(){
  const day=state.selectedDay; const water=Number(state.water[dayKey(day)]||0);
  $('water-grid').innerHTML=Array.from({length:8},(_,i)=>`<button type="button" class="water-dot${i<water?' active':''}" data-water="${i+1}" aria-label="${i+1} bicchieri">💧</button>`).join('');
  $('water-label').textContent=`Acqua: ${water}/8 bicchieri`;
  $('water-grid').querySelectorAll('[data-water]').forEach(btn=>btn.addEventListener('click',()=>{const v=Number(btn.dataset.water); state.water[dayKey(day)] = (water===v? v-1 : v); save(); renderLifestyle();}));
  const notes=$('daily-notes'); notes.value=state.notes[dayKey(day)]||'';
  notes.oninput=()=>{state.notes[dayKey(day)]=notes.value; save();};
}

function resetDay(){
  const day=state.selectedDay;
  for(let meal=0; meal<MEAL_TYPES.length; meal++){
    for(let option=0; option<5; option++){
      const foods=mealChoicesFor(day,meal)[option].foods;
      foods.forEach((_,idx)=>delete state.consumed[foodKey(day,meal,option,idx)]);
    }
  }
  getCustomMealsForDate(dateForDay(day)).forEach(e=>e.eaten=false);
  delete state.water[dayKey(day)];
  save(); renderPlan(); notify('Tracciamento del giorno azzerato.');
}

function computeShoppingList(){
  const totals={};
  for(let day=0; day<WEEK_BASE.length; day++){
    for(let meal=0; meal<MEAL_TYPES.length; meal++){
      activeMeal(day,meal).foods.forEach(food=>{ totals[food.id]=(totals[food.id]||0)+food.q; });
    }
  }
  return Object.keys(totals).map(id=>({id, quantity:totals[id], category:FOOD[id].category, name:FOOD[id].name}));
}
function fmtShopQty(id,q){const unit=FOOD[id].unit; if(unit==='g'&&q>=1000)return `${fmtNum(q/1000)} kg`; if(unit==='ml'&&q>=1000)return `${fmtNum(q/1000)} L`; return `${fmtNum(q)} ${unit}`;}
function renderShop(){
  const items=computeShoppingList();
  const checked=items.filter(it=>state.purchased[it.id]).length;
  $('shop-checked').textContent=checked; $('shop-total').textContent=items.length;
  $('shop-progress-fill').style.width=`${items.length? checked/items.length*100:0}%`;
  $('shop-message').textContent = state.shoppingDone ? 'Spesa registrata sul dispositivo.' : 'La lista riflette tutte le scelte attuali della settimana.';
  $('shop-sections').innerHTML=SHOP_CATEGORIES.map(cat=>{
    const group=items.filter(it=>it.category===cat.name); if(!group.length) return '';
    return `<section class="shop-group"><div class="shop-group-head"><div class="shop-group-icon">${cat.icon}</div><div><h3>${cat.name}</h3><div class="shop-group-sub">${group.filter(it=>state.purchased[it.id]).length}/${group.length} acquistati</div></div></div>${group.map(it=>`<label class="shop-row${state.purchased[it.id]?' checked':''}"><input type="checkbox" data-product="${it.id}" ${state.purchased[it.id]?'checked':''}><span class="shop-name">${escapeHTML(it.name)}</span><span class="shop-qty">${fmtShopQty(it.id,it.quantity)}</span></label>`).join('')}</section>`;
  }).join('');
  $('shop-sections').querySelectorAll('[data-product]').forEach(box=>box.addEventListener('change',()=>{ if(box.checked) state.purchased[box.dataset.product]=1; else delete state.purchased[box.dataset.product]; state.shoppingDone=null; save(); renderShop(); }));
}

function renderWorkoutDays(){
  $('workout-selector').innerHTML=TRAINING_DAYS.map((d,i)=>`<button class="workout-day${state.selectedWorkoutDay===i?' selected':''}" data-workout-day="${i}">${d.label}</button>`).join('');
  $('workout-selector').querySelectorAll('[data-workout-day]').forEach(btn=>btn.addEventListener('click',()=>{state.selectedWorkoutDay=Number(btn.dataset.workoutDay); save(); renderTraining();}));
}
function trainingKey(day,idx){return `w-${day}-${idx}`;}
function iconMarkup(name){return ICONS[name]||ICONS.chestPress;}
function renderTraining(){
  renderWorkoutCalendar();
  renderWorkoutDays();
  const day=state.selectedWorkoutDay; const data=TRAINING_DAYS[day];
  const doneCount=data.exercises.filter((_,idx)=>state.trainingChecks[trainingKey(day,idx)]).length;
  $('training-title').textContent=`${data.label} — ${data.title}`;
  $('training-meta').textContent=`${doneCount}/${data.exercises.length} esercizi segnati · ${TRAINING_INFO.recoveryMain} · ${TRAINING_INFO.recovery12}`;
  $('training-cards').innerHTML=data.exercises.map((ex,idx)=>`<article class="exercise-card${state.trainingChecks[trainingKey(day,idx)]?' done':''}">
    <label class="exercise-check"><input type="checkbox" data-ex-check="${idx}" ${state.trainingChecks[trainingKey(day,idx)]?'checked':''}><span></span></label>
    <div class="exercise-icon">${iconMarkup(ex.icon)}</div>
    <div class="exercise-body"><h4>${escapeHTML(ex.name)}</h4><div class="exercise-meta"><span>${escapeHTML(ex.sets)}</span><span>${escapeHTML(ex.load)}</span></div><div class="exercise-tags"><span class="tag">${escapeHTML(ex.equipment)}</span><span class="tag panatta">${ex.equipment.toLowerCase().includes('panatta')?'PANATTA':'Attrezzo'}</span></div></div>
  </article>`).join('');
  $('training-cards').querySelectorAll('[data-ex-check]').forEach(box=>box.addEventListener('change',()=>{const idx=Number(box.dataset.exCheck); if(box.checked) state.trainingChecks[trainingKey(day,idx)]=1; else delete state.trainingChecks[trainingKey(day,idx)]; save(); renderTraining();}));
  $('core-note').textContent=TRAINING_INFO.core;
  const noteBox=$('training-notes'); noteBox.value=state.trainingNotes[`wd-${day}`]||''; noteBox.oninput=()=>{state.trainingNotes[`wd-${day}`]=noteBox.value; save();};
}


function renderWorkoutCalendar(){
  const start=state.workoutWeek;
  $('workout-calendar-period').textContent=`${dateLocal(start).toLocaleDateString('it-IT',{day:'numeric',month:'short'})} – ${dateLocal(weekDate(start,6)).toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'})}`;
  let n=0;
  $('workout-calendar').innerHTML=WEEK_BASE.map((d,i)=>{
    const date=weekDate(start,i),record=state.workoutCalendar[date],isDone=!!record;
    if(isDone)n++;
    return `<button type="button" data-workout-date="${date}" class="calendar-day${isDone?' trained':''}${date===localDate?' today':''}" aria-pressed="${isDone}">
      <span>${d.short}</span><strong>${dateLocal(date).getDate()}</strong><span class="check-mark">${isDone?'✓':'+'}</span>
    </button>`;
  }).join('');
  $('workout-weekly-summary').textContent=`${n} ${n===1?'allenamento segnato':'allenamenti segnati'} questa settimana`;
  $('workout-calendar').querySelectorAll('[data-workout-date]').forEach(btn=>btn.addEventListener('click',()=>{
    const date=btn.dataset.workoutDate;
    if(state.workoutCalendar[date])delete state.workoutCalendar[date];
    else state.workoutCalendar[date]={workoutDay:state.selectedWorkoutDay+1,markedAt:new Date().toISOString()};
    save();renderWorkoutCalendar();
  }));
}

function showView(view){
  state.view=view;
  $('view-plan').hidden=view!=='plan';
  $('view-shop').hidden=view!=='shop';
  $('view-training').hidden=view!=='training';
  $('view-coach').hidden=view!=='coach';
  document.querySelectorAll('.nav-item').forEach(btn=>btn.classList.toggle('active', btn.dataset.view===view));
  save();
  window.scrollTo({top:0,behavior:'instant'});
}
function notify(msg){const el=$('toast'); el.textContent=msg; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('visible'),2200);}
function openModal(title,message,onConfirm,label='Conferma',icon='✓'){
  priorFocus=document.activeElement;
  $('modal-title').textContent=title; $('modal-message').textContent=message; $('modal-icon').textContent=icon; $('modal-actions').innerHTML='';
  const cancel=document.createElement('button'); cancel.className='ghost-button'; cancel.textContent='Annulla';
  const ok=document.createElement('button'); ok.className='primary-inline'; ok.textContent=label;
  cancel.addEventListener('click',closeModal); ok.addEventListener('click',()=>{closeModal(); onConfirm&&onConfirm();});
  $('modal-actions').append(cancel,ok); $('modal-backdrop').hidden=false; document.body.style.overflow='hidden'; $('modal-close').focus();
}
function closeModal(){ $('modal-backdrop').hidden=true; document.body.style.overflow=''; if(priorFocus&&priorFocus.focus) priorFocus.focus(); }

function renderQuickLog(){
  const root=$('quick-log-actions');if(!root)return;
  root.innerHTML=MEAL_TYPES.map((m,idx)=>`<button type="button" data-quick-meal="${idx}" class="quick-log-button">${m.icon} ${m.name}</button>`).join('');
  root.querySelectorAll('[data-quick-meal]').forEach(b=>b.addEventListener('click',()=>openFoodFinder(state.selectedDay,Number(b.dataset.quickMeal))));
}
function renderPlan(){renderDaySelector(); renderMetrics(); renderMeals(); renderLifestyle(); renderQuickLog();}
function setAllMealsExpanded(value){
  const day=state.selectedDay;
  for(let i=0;i<MEAL_TYPES.length;i++)setExpanded(day,i,value);
  renderMeals();
}
function downloadBackup(){
  const data=JSON.stringify({app:'GymPilot Leonardo',format:1,exportedAt:new Date().toISOString(),data:state},null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=`GymPilot_backup_${localDate}.json`;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  notify('Backup preparato. Salvalo nei File dell’iPhone.');
}
async function restoreBackup(file){
  if(!file)return;
  if(file.size>5*1024*1024){notify('Il file è troppo grande per essere un backup valido.');return;}
  try{
    const parsed=JSON.parse(await file.text());
    if(parsed.app!=='GymPilot Leonardo'||parsed.format!==1||!parsed.data||typeof parsed.data!=='object'||Array.isArray(parsed.data))throw new Error('invalid');
    const restored=parsed.data;
    const keys=['choices','consumed','purchased','water','notes','trainingChecks','trainingNotes','expandedMeals','customFoods','workoutCalendar'];
    if(keys.some(k=>restored[k] && (typeof restored[k]!=='object'||Array.isArray(restored[k]))))throw new Error('invalid');
    openModal('Ripristinare il backup?','Il backup sostituirà i dati attualmente memorizzati sul dispositivo. Esporta prima un backup se vuoi conservarli.',()=>{
      state={...defaultState(),...restored, view:'plan'};
      if(!/^\d{4}-\d{2}-\d{2}$/.test(state.weekStart))state.weekStart=startMonday(now);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(state.workoutWeek))state.workoutWeek=startMonday(now);
      if(!Array.isArray(state.customFavorites))state.customFavorites=[];
      if(!Array.isArray(state.customRecent))state.customRecent=[];
      state.selectedDay=Number.isInteger(state.selectedDay)&&state.selectedDay>=0&&state.selectedDay<7?state.selectedDay:todayIndex();
      state.selectedWorkoutDay=Number.isInteger(state.selectedWorkoutDay)&&state.selectedWorkoutDay>=0&&state.selectedWorkoutDay<4?state.selectedWorkoutDay:0;
      for(const key of keys)if(!state[key]||typeof state[key]!=='object')state[key]={};
      if(!state.datedMigration){
        const old={...state.consumed};state.consumed={};
        for(const [key,value] of Object.entries(old)){
          const m=key.match(/^(\d)-(\d)-(\d)-(\d+)$/);
          state.consumed[m?`${weekDate(startMonday(new Date()),Number(m[1]))}|${key}`:key]=value;
        }
        for(const field of ['water','notes'])for(let i=0;i<7;i++){
          const oldKey=`day-${i}`;
          if(state[field][oldKey]!==undefined){state[field][weekDate(startMonday(new Date()),i)]=state[field][oldKey];delete state[field][oldKey];}
        }
        state.datedMigration=true;
      }
      save(); renderPlan(); renderShop(); renderTraining(); renderCoach(); showView('plan'); notify('Backup ripristinato.');
    },'Ripristina');
  }catch{notify('File non valido: usa un backup esportato da GymPilot.');}
}



/* IMMAGINE GIORNATA: disegno locale su Canvas, nessuna libreria o server. */
function makeDayCanvas(day){
  const w=1080,h=1920,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');
  const round=(x,y,ww,hh,r,fill)=>{ctx.beginPath();ctx.roundRect(x,y,ww,hh,r);ctx.fillStyle=fill;ctx.fill();};
  const label=(s,x,y,size,color,weight='600',align='left')=>{ctx.font=`${weight} ${size}px system-ui,-apple-system,sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(String(s),x,y);};
  const shrink=(text,max,width)=>{let s=text;while(ctx.measureText(s).width>width&&s.length>4)s=s.slice(0,-2);return s===text?s:s.trim()+'…';};
  const nice=n=>Math.round(n).toLocaleString('it-IT');
  const eaten=consumedTotals(day),plan=plannedTotals(day);
  ctx.fillStyle='#eef3ee';ctx.fillRect(0,0,w,h);
  round(42,42,996,305,38,'#173b35');
  round(76,84,222,45,22,'#315e4c'); label('GYMPILOT',97,115,25,'#d4f2d7','800');
  label('PIANO ALIMENTARE',76,188,36,'#d6eadd','800');
  label('LEONARDO SPORTIELLO',76,241,48,'#ffffff','900');
  label(WEEK_BASE[day].label.toUpperCase()+'  ·  RIEPILOGO DELLA GIORNATA',76,303,25,'#c6e0d1','700');
  round(42,374,996,208,32,'#ffffff');
  const col=[95,405,718];
  [['CONSUMATE',`${nice(eaten.kcal)} kcal`],['PIANIFICATE',`${nice(plan.kcal)} kcal`],['TARGET',`${TARGETS.kcal} kcal`]].forEach(([t,v],i)=>{label(t,col[i],422,20,'#6b8377','800');label(v,col[i],486,47,'#174734','900');});
  const macro=[['PROTEINE',eaten.p,TARGETS.p],['CARBOIDRATI',eaten.c,TARGETS.c],['GRASSI',eaten.f,TARGETS.f]];
  macro.forEach(([name,val,target],i)=>{label(`${name}  ${nice(val)} / ${target} g`,col[i],540,19,'#55725f','700');});
  let y=606;
  for(let meal=0;meal<MEAL_TYPES.length;meal++){
    const m=activeMeal(day,meal), macros=sumFoods(m.foods), prog=mealProgress(day,meal),name=MEAL_TYPES[meal].name;
    const ht=215;round(42,y,996,ht,27,'#ffffff');
    round(69,y+18,11,46,5,meal%2===0?'#71ba89':'#d7ab67');
    label(name.toUpperCase(),103,y+39,24,'#46745a','850');
    label(`${prog.done}/${prog.total} segnati`,967,y+39,23,'#6a8777','750','right');
    ctx.font='800 32px system-ui';label(shrink(m.title,32,838),103,y+78,32,'#1c3829','850');
    label(`${nice(macros.kcal)} kcal  ·  ${nice(macros.p)}P  /  ${nice(macros.c)}C  /  ${nice(macros.f)}F`,103,y+112,22,'#416a53','720');
    let line=0;
    const extras=getCustomMeal(day,meal).filter(x=>x.eaten!==false);
    const listed=m.foods.slice(0,extras.length?2:4);
    for(let i=0;i<listed.length;i++){
      const food=m.foods[i],mark=isFoodChecked(day,meal,choose(day,meal),i);
      round(104+(i%2)*430,y+133+Math.floor(i/2)*33,18,18,5,mark?'#327951':'#dce7df');
      if(mark)label('✓',107+(i%2)*430,y+148+Math.floor(i/2)*33,15,'#ffffff','850');
      ctx.font='600 19px system-ui';const s=shrink(FOOD[food.id].name,20,260);
      label(s+' '+fmtQty(food),132+(i%2)*430,y+149+Math.floor(i/2)*33,19,'#597064','620');
      line++;
    }
    if(extras.length){
      label(`+ Consumati fuori piano: ${extras.map(e=>e.name).join(', ').slice(0,64)}`,104,y+201,18,'#276647','700');
    }else if(m.foods.length>4)label(`+ ${m.foods.length-4} altri alimenti`,715,y+202,18,'#819387','650');
    y+=226;
  }
  round(42,1740,996,133,25,'#dfece2');
  label('✓  Consumati = alimenti spuntati nell’app',75,1792,25,'#315b45','750');
  label('Calorie e macronutrienti sono stime; il piano non è prescrittivo.',75,1837,21,'#547561','600');
  return canvas;
}
function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('png')),'image/png'));}
function downloadBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.download=filename;a.href=url;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),7000);}
async function shareDayImage(){
  const day=state.selectedDay;
  try{
    const blob=await canvasBlob(makeDayCanvas(day));
    const filename=`GymPilot_${WEEK_BASE[day].short}_giornata.png`;
    const file=new File([blob],filename,{type:'image/png'});
    if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
      await navigator.share({files:[file],title:`GymPilot · ${WEEK_BASE[day].label}`,text:'Riepilogo della mia giornata alimentare'});
    }else{downloadBlob(blob,filename);notify('Immagine salvata: aprila e condividila su WhatsApp.');}
  }catch(e){if(e.name!=='AbortError')notify('Condivisione non disponibile: usa Salva PNG.');}
}
async function saveDayImage(){
  try{const blob=await canvasBlob(makeDayCanvas(state.selectedDay));downloadBlob(blob,`GymPilot_${WEEK_BASE[state.selectedDay].short}_giornata.png`);notify('PNG pronto per il salvataggio.');}
  catch{notify('Impossibile creare il PNG su questo dispositivo.');}
}

/* COLLEGAMENTO MANUALE A CONVERSAZIONE CHATGPT. Non usa API né credenziali. */
function validateChatUrl(value){
  if(!value.trim()) return '';
  try{const u=new URL(value.trim());return u.protocol==='https:'&&u.hostname==='chatgpt.com'&&u.pathname.includes('/c/')&&!u.pathname.startsWith('/share/')?u.origin+u.pathname:'';}catch{return '';}
}
function coachQuestionText(){
  const day=Math.max(0,Math.min(6,Number(state.coachDay)||0));
  const meal=Math.max(0,Math.min(4,Number(state.coachMeal)||0));
  const chosen=activeMeal(day,meal);
  const macros=sumFoods(chosen.foods);
  const eaten=consumedTotals(day), plan=plannedTotals(day);
  const ingredients=chosen.foods.map(food=>'- '+FOOD[food.id].name+': '+fmtQty(food)).join('\n');
  const intro=`Sto usando GymPilot nel Progetto PALESTRA | COACH. Giorno: ${WEEK_BASE[day].label}. Target orientativo ${TARGETS.kcal} kcal, ${TARGETS.p} g proteine, ${TARGETS.c} g carboidrati e ${TARGETS.f} g grassi. Preferenze: pasti semplici, prodotti comuni da supermercato, senza lattosio, nessuna uova a colazione.`;
  const context=`Pasto: ${MEAL_TYPES[meal].name} — ${chosen.title}\nIngredienti:\n${ingredients}\nStima del pasto: ${Math.round(macros.kcal)} kcal, ${Math.round(macros.p)} g proteine, ${Math.round(macros.c)} g carboidrati, ${Math.round(macros.f)} g grassi.\nGiornata attuale: ${Math.round(eaten.kcal)} kcal segnate, ${Math.round(plan.kcal)} kcal pianificate.`;
  const question=(state.coachPreset==='balance')?'Come posso bilanciare il resto della giornata con cibi semplici? Non proporre compensazioni aggressive.':(state.coachPreset==='check')?'Puoi valutare il riepilogo del giorno e suggerire una modifica pratica, solo se utile?':'Proponimi 2–3 alternative semplici a questo pasto, con grammature e valori nutrizionali orientativi simili, senza aumentare troppo i tempi di preparazione.';
  const extra=($('coach-question')?.value||'').trim();
  return [intro,context,question,extra?`Ulteriori dettagli: ${extra}`:''].filter(Boolean).join('\n\n');
}
function updateCoachPreview(){ $('coach-preview').value=coachQuestionText(); }
function renderCoach(){
  $('coach-day').innerHTML=WEEK_BASE.map((d,i)=>`<option value="${i}" ${Number(state.coachDay)===i?'selected':''}>${d.label}</option>`).join('');
  $('coach-meal').innerHTML=MEAL_TYPES.map((m,i)=>`<option value="${i}" ${Number(state.coachMeal)===i?'selected':''}>${m.name}</option>`).join('');
  $('chat-url').value=state.chatUrl||'';
  $('chat-link-status').textContent=validateChatUrl(state.chatUrl||'')?'Collegamento privato configurato. Nessun dato viene inviato automaticamente.':'Nessun collegamento privato configurato: verrà aperto ChatGPT.';
  document.querySelectorAll('[data-coach-preset]').forEach(el=>el.classList.toggle('active',el.dataset.coachPreset===state.coachPreset));
  updateCoachPreview();
}
async function copyCoachQuestion(alsoOpen){
  const msg=coachQuestionText();let copied=false;
  try{await navigator.clipboard.writeText(msg);copied=true;}catch{
    const ta=$('coach-preview');ta.focus();ta.select();try{copied=document.execCommand('copy');}catch{copied=false;}
  }
  if(!copied){notify('Copia il testo dall’anteprima e poi apri ChatGPT.');return;}
  if(alsoOpen){
    notify('Richiesta copiata. Incollala e premi Invia in ChatGPT.');
    window.location.href=validateChatUrl(state.chatUrl||'')||'https://chatgpt.com/';
  }else notify('Richiesta copiata.');
}

$('share-day-image').addEventListener('click',shareDayImage);
$('save-day-image').addEventListener('click',saveDayImage);
$('coach-day').addEventListener('change',e=>{state.coachDay=Number(e.target.value);save();updateCoachPreview();});
$('coach-meal').addEventListener('change',e=>{state.coachMeal=Number(e.target.value);save();updateCoachPreview();});
$('coach-question').addEventListener('input',updateCoachPreview);
document.querySelectorAll('[data-coach-preset]').forEach(b=>b.addEventListener('click',()=>{state.coachPreset=b.dataset.coachPreset;save();renderCoach();}));
$('save-chat-url').addEventListener('click',()=>{const raw=$('chat-url').value.trim();const good=validateChatUrl(raw);if(!good){notify('Usa un indirizzo privato di conversazione su chatgpt.com con /c/.');return;}state.chatUrl=good;save();renderCoach();notify('Collegamento alla chat salvato.');});
$('clear-chat-url').addEventListener('click',()=>{state.chatUrl='';save();renderCoach();notify('Collegamento rimosso.');});
$('coach-copy').addEventListener('click',()=>copyCoachQuestion(false));
$('coach-open').addEventListener('click',()=>copyCoachQuestion(true));
$('open-all-meals').addEventListener('click',()=>setAllMealsExpanded(true));
$('close-all-meals').addEventListener('click',()=>setAllMealsExpanded(false));
$('export-backup').addEventListener('click',downloadBackup);
$('import-backup').addEventListener('click',()=>$('backup-file').click());
$('backup-file').addEventListener('change',e=>{const file=e.target.files?.[0];restoreBackup(file);e.target.value='';});
$('today-button').addEventListener('click',()=>{state.weekStart=startMonday(new Date());state.selectedDay=todayIndex(); save(); renderPlan();});
$('reset-day').addEventListener('click',()=>openModal('Reset giornata','Cancello le spunte alimentari, azzero gli alimenti extra e l’acqua del giorno selezionato (gli extra restano visibili come non consumati). Le scelte dei pasti restano salvate.', resetDay, 'Reset'));
$('done-shopping').addEventListener('click',()=>openModal('Spesa fatta','Registro sul dispositivo che hai concluso questa spesa.', ()=>{state.shoppingDone={date:new Date().toISOString()}; save(); notify('Spesa registrata.'); renderShop();}, 'Conferma'));
$('clear-shopping').addEventListener('click',()=>openModal('Azzera spesa','Tolgo tutte le spunte della lista spesa, senza toccare il piano.', ()=>{state.purchased={}; state.shoppingDone=null; save(); renderShop();}, 'Azzera'));
$('mark-workout-done').addEventListener('click',()=>{const day=state.selectedWorkoutDay; TRAINING_DAYS[day].exercises.forEach((_,idx)=>state.trainingChecks[trainingKey(day,idx)]=1); save(); renderTraining(); notify('Allenamento segnato come completato.');});
$('reset-workout').addEventListener('click',()=>openModal('Reset allenamento','Tolgo tutte le spunte del giorno di allenamento selezionato.', ()=>{const day=state.selectedWorkoutDay; TRAINING_DAYS[day].exercises.forEach((_,idx)=>delete state.trainingChecks[trainingKey(day,idx)]); save(); renderTraining();}, 'Reset'));
$('about-button').addEventListener('click',()=>openModal('GymPilot Leonardo','Le schede dei pasti si aprono a tendina. Il diario libero permette di cercare alimenti offline o online e aggiungerli alle calorie realmente consumate. Nel calendario allenamento puoi spuntare le date. Spunte, varianti, spesa, acqua, note e allenamenti sono salvati localmente. Usa Esporta backup per conservare i dati fuori dal browser. Calorie e macro sono stime.', ()=>{}, 'Ho capito', 'i'));
$('modal-close').addEventListener('click',closeModal);
$('modal-backdrop').addEventListener('click',e=>{if(e.target===$('modal-backdrop')) closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('modal-backdrop').hidden) closeModal();});
document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));


/* DIARIO ALIMENTARE LIBERO — catalogo locale + Open Food Facts online su richiesta. */
let finder={day:todayIndex(),meal:0,selected:null,online:[],timer:null};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function openFoodFinder(day,meal){
  finder={...finder,day,meal,selected:null,online:[]};
  $('food-finder').hidden=false;document.body.classList.add('finder-open');
  $('finder-context').textContent=`${WEEK_BASE[day].label} ${dateForDay(day)} · ${MEAL_TYPES[meal].name}`;
  $('food-search').value='';$('finder-results').innerHTML='';$('finder-selection').hidden=true;
  $('finder-manual').hidden=true;$('finder-status').textContent='Digita un alimento (es. cornetto ischitano, cappuccino, pasta).';
  $('food-search').focus();
  displayFoodResults('');
}
function closeFoodFinder(){$('food-finder').hidden=true;document.body.classList.remove('finder-open');}
function localResults(q){
  const words=norm(q).split(/\s+/).filter(Boolean);
  const all=[...state.customFavorites,...LOCAL_CATALOG];
  if(!words.length)return all.filter(x=>/cappuccino|cornetto|banana|pasta|skyr|pollo/i.test(x.name)).slice(0,10);
  return all.map(item=>({item,score: words.reduce((total,w)=> total+(norm(item.name).includes(w)?(norm(item.name).startsWith(w)?4:2):0),0)}))
    .filter(x=>x.score>=words.length*2).sort((a,b)=>b.score-a.score).slice(0,16).map(x=>x.item);
}
function displayFoodResults(query){
  const local=localResults(query),online=finder.online||[];
  const candidates=[...local,...online.filter(x=>!local.some(y=>norm(y.name)===norm(x.name)))];
  $('finder-results').innerHTML=candidates.map((item,idx)=>{
    const unit=item.unit||'g',r=Number(item.per||100),kcal=item.kcal;
    return `<button type="button" class="finder-result" data-result="${idx}"><span><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.source||'Stima')} · ${fmtMacro(kcal)} kcal/${r} ${unit}</small></span><span class="finder-arrow">+</span></button>`;
  }).join('') || '<div class="finder-empty">Nessuna corrispondenza offline. Prova la ricerca online oppure crea un alimento.</div>';
  finder.candidates=candidates;
  $('finder-results').querySelectorAll('[data-result]').forEach(b=>b.addEventListener('click',()=>selectFoundFood(finder.candidates[Number(b.dataset.result)])));
}
function selectFoundFood(item){
  finder.selected={...item};
  $('finder-selection').hidden=false;
  $('selected-food-title').textContent=item.name;
  $('selected-food-source').textContent=item.source||'Stima indicativa';
  $('selected-food-qty').value=item.unit==='pz'?'1':item.unit==='ml'?'180':'100';
  $('selected-food-unit').textContent=item.unit;
  updateFoodPreview();
  $('finder-selection').scrollIntoView({block:'nearest',behavior:'smooth'});
}
function updateFoodPreview(){
  const it=finder.selected;if(!it)return;const q=Number($('selected-food-qty').value);
  if(!Number.isFinite(q)||q<=0)return;
  const factor=q/(it.per||100);
  $('selected-food-macros').textContent=`${fmtMacro(it.kcal*factor)} kcal · ${fmtMacro(it.p*factor)} P · ${fmtMacro(it.c*factor)} C · ${fmtMacro(it.f*factor)} F`;
}
function addFoodEntry(item,q){
  const entry={name:String(item.name).slice(0,150),unit:item.unit||'g',per:Number(item.per||100),q:Number(q),kcal:Number(item.kcal),p:Number(item.p),c:Number(item.c),f:Number(item.f),source:item.source||'Stima',eaten:true};
  const key=`${dateForDay(finder.day)}|${finder.meal}`;
  if(!state.customFoods[key])state.customFoods[key]=[];
  state.customFoods[key].push(entry);
  state.customRecent=[entry.name,...state.customRecent.filter(x=>x!==entry.name)].slice(0,20);
  setExpanded(finder.day,finder.meal,true);save();closeFoodFinder();renderPlan();notify('Alimento registrato nel diario.');
}
const lastOnlineLookup={query:'',time:0};
async function searchOnlineFood(){
  const term=$('food-search').value.trim();
  if(term.length<3){$('finder-status').textContent='Inserisci almeno 3 caratteri per la ricerca online.';return;}
  if(Date.now()-lastOnlineLookup.time<6500){$('finder-status').textContent='Attendi qualche secondo prima di una nuova ricerca: il catalogo limita le richieste.';return;}
  lastOnlineLookup.time=Date.now();lastOnlineLookup.query=term;
  $('finder-status').textContent='Ricerca prodotti confezionati in corso…';$('online-food-search').disabled=true;
  try{
    const params=new URLSearchParams({search_terms:term,search_simple:'1',action:'process',json:'1',page_size:'18',fields:'code,product_name,brands,nutriments'});
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
    let result;
    try{const response=await fetch('https://world.openfoodfacts.org/cgi/search.pl?'+params.toString(),{signal:controller.signal,headers:{'Accept':'application/json'}});if(!response.ok)throw Error('HTTP '+response.status);result=await response.json();}
    finally{clearTimeout(timer);}
    finder.online=(result.products||[]).map(prod=>{
      const n=prod.nutriments||{},kcal=Number(n['energy-kcal_100g']),p=Number(n['proteins_100g']),c=Number(n['carbohydrates_100g']),f=Number(n['fat_100g']);
      if(!prod.product_name||[kcal,p,c,f].some(v=>!Number.isFinite(v)||v<0))return null;
      if(!('energy-kcal_100g' in n&&'proteins_100g' in n&&'carbohydrates_100g' in n&&'fat_100g' in n))return null;
      return {name:String(prod.product_name)+(prod.brands?' · '+prod.brands:''),unit:'g',per:100,kcal,p,c,f,source:'Open Food Facts · etichetta prodotto'};
    }).filter(Boolean).slice(0,10);
    $('finder-status').textContent=finder.online.length?`${finder.online.length} prodotti trovati online. Verifica che sia proprio la confezione consumata.`:'Nessun prodotto completo trovato. Puoi usare una stima locale o aggiungerlo manualmente.';
    displayFoodResults(term);
  }catch(e){$('finder-status').textContent='Ricerca online non disponibile (connessione, limite richieste o accesso API). Il catalogo offline funziona comunque.';}
  finally{$('online-food-search').disabled=false;}
}
function manualFoodEntry(){
  const name=$('manual-food-name').value.trim();
  const per=$('manual-food-unit').value==='pz'?1:100;
  const unit=per===1?'pz':$('manual-food-unit').value;
  const vals=['kcal','p','c','f'].map(k=>Number($('manual-'+k).value));
  const q=Number($('manual-food-qty').value);
  if(!name||name.length>150||vals.some(n=>!Number.isFinite(n)||n<0)||!Number.isFinite(q)||q<=0||q>5000){notify('Compila nome, quantità e tutti i valori nutrizionali validi.');return;}
  const food={id:'mine-'+Date.now(),name,unit,per,kcal:vals[0],p:vals[1],c:vals[2],f:vals[3],source:'Inserimento personale · valori da te indicati'};
  state.customFavorites=[food,...state.customFavorites.filter(x=>norm(x.name)!==norm(name))].slice(0,100);
  addFoodEntry(food,q);
}
$('food-search').addEventListener('input',e=>{finder.online=[];displayFoodResults(e.target.value);$('finder-status').textContent='Risultati locali. Per altri prodotti usa «Cerca online».';});
$('online-food-search').addEventListener('click',searchOnlineFood);
$('food-finder-close').addEventListener('click',closeFoodFinder);
$('food-finder').addEventListener('click',e=>{if(e.target===$('food-finder'))closeFoodFinder();});
$('selected-food-qty').addEventListener('input',updateFoodPreview);
$('add-selected-food').addEventListener('click',()=>{
  if(!finder.selected)return;
  const q=Number($('selected-food-qty').value);
  if(!Number.isFinite(q)||q<=0||q>5000){notify('Inserisci una quantità valida.');return;}
  addFoodEntry(finder.selected,q);
});
$('show-manual-food').addEventListener('click',()=>{$('finder-manual').hidden=!$('finder-manual').hidden; $('manual-food-name').value=$('food-search').value;});
$('manual-food-unit').addEventListener('change',()=>{const unit=$('manual-food-unit').value;$('manual-food-label').textContent=unit==='pz'?'per pezzo':`per 100 ${unit}`; $('manual-food-qty').value=unit==='pz'?'1':'100';});
$('save-manual-food').addEventListener('click',manualFoodEntry);
$('prev-plan-week').addEventListener('click',()=>{state.weekStart=shiftWeek(state.weekStart,-1);save();renderPlan();});
$('next-plan-week').addEventListener('click',()=>{state.weekStart=shiftWeek(state.weekStart,1);save();renderPlan();});
$('prev-workout-week').addEventListener('click',()=>{state.workoutWeek=shiftWeek(state.workoutWeek,-1);save();renderWorkoutCalendar();});
$('next-workout-week').addEventListener('click',()=>{state.workoutWeek=shiftWeek(state.workoutWeek,1);save();renderWorkoutCalendar();});

renderPlan(); renderShop(); renderTraining(); renderCoach(); showView(['plan','shop','training','coach'].includes(state.view)?state.view:'plan');
if('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
