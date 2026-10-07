import {scenarios,features,chapters,people,socialEvents} from './data.mjs';
import {deskActivities,informalTopics} from './activities.mjs';
export const clamp=(n,min=0,max=100)=>Math.min(max,Math.max(min,n));
export const chapterFor=day=>chapters.findIndex(c=>day>=c.start&&day<=c.end);
export function createState(seed=Date.now()) {
  return {version:1,seed,started:false,day:1,spent:0,focus:100,
    dimensions:{customer:50,business:55,delivery:60,quality:65,team:50,strategy:45,energy:100},
    relationships:Object.fromEntries(Object.keys(people).map(k=>[k,50])),
    flags:{problem:'Busy teams lose decisions across tools.',segment:'Growing teams',metric:'Not chosen',debt:0,bugs:2},
    backlog:Object.fromEntries(features.map(f=>[f.id,['collab','dashboard','feed'].includes(f.id)?'mvp':'later'])),
    completed:[],history:[],delayed:[],notifications:[],social:[],calendar:[],interruptions:[],checkpoints:[],officeActivities:[],pmPosition:{x:-1.05,z:1.65},finished:false};
}
export function todayScenarios(state) {return scenarios.filter(s=>s.day===state.day&&!state.completed.includes(s.id));}
export function reservedHours(state) {return todayScenarios(state).reduce((n,s)=>n+(s.type==='board'?1:Math.min(...s.options.map(o=>o.hours))),0);}
export const remaining=s=>Math.max(0,8-s.spent);
export function canDecide(state,scene,option) {
  const minimum=scene.type==='board'?1:Math.min(...scene.options.map(o=>o.hours));
  return option.hours+reservedHours(state)-minimum<=remaining(state)+.00001;
}
export const formatTime=h=>h%1===0?`${h}h`:`${Math.round(h*60)} min`;
export function applyEffects(state,effects) {
  const applied={};
  for (const [key,value] of Object.entries(effects||{})) {
    if(!(key in state.dimensions))continue;
    let amount=value;
    if(state.focus<35&&value>0&&['customer','strategy','quality'].includes(key))amount=Math.max(1,Math.round(value*.8));
    const prev=state.dimensions[key];state.dimensions[key]=clamp(prev+amount);applied[key]=state.dimensions[key]-prev;
  }
  return applied;
}
function applyFlags(state,flags) {
  for(const [k,v] of Object.entries(flags||{})) {
    if(['debt','bugs','launchSlip'].includes(k))state.flags[k]=Math.max(0,(state.flags[k]||0)+v);
    else state.flags[k]=v;
  }
}
function relationships(state,values){for(const [key,value] of Object.entries(values||{}))state.relationships[key]=clamp((state.relationships[key]??50)+value);}
function spend(state,hours) {state.spent=Math.min(8,state.spent+hours);state.focus=clamp(state.focus-Math.round(hours*9));state.dimensions.energy=clamp(state.dimensions.energy-Math.round(hours*3));}
export function decide(state,scenarioId,optionIndex) {
  const scene=scenarios.find(s=>s.id===scenarioId),option=scene?.options[optionIndex];
  if(!scene||!option||state.completed.includes(scenarioId))throw new Error('This decision is unavailable.');
  if(scene.day!==state.day)throw new Error('This decision belongs to another day.');
  if(!canDecide(state,scene,option))throw new Error('Keep enough time for the other required decisions. Choose a shorter action.');
  const effects=applyEffects(state,option.effects);applyFlags(state,option.flags);relationships(state,option.relations);spend(state,option.hours);
  state.completed.push(scene.id);
  const entry={id:scene.id,day:state.day,title:scene.title,decision:option.label,insight:scene.insight,hours:option.hours,effects,delayed:[]};state.history.push(entry);
  if(option.delay)state.delayed.push({...option.delay,source:scene.id});
  if(scene.type==='meeting')state.calendar.push({day:state.day,name:scene.title,hours:option.hours});
  state.started=true;return entry;
}
export function scopePoints(state) {return features.reduce((n,f)=>n+(state.backlog[f.id]==='mvp'?f.points:0),0);}
export function commitBoard(state) {
  if(state.day!==6||state.completed.includes('scope'))throw new Error('The scope decision is unavailable.');
  if(remaining(state)<1)throw new Error('Keep one hour for the scope decision.');
  const points=scopePoints(state),selected=features.filter(f=>state.backlog[f.id]==='mvp');
  if(!points)throw new Error('Choose at least one feature for your MVP.');
  const over=Math.max(0,points-42),missingCore=!selected.some(f=>f.id==='collab');
  const effects=applyEffects(state,over?{delivery:-Math.min(20,Math.ceil(over/2)),quality:-10,team:-8,strategy:-5}:{delivery:7,strategy:8,team:5,customer:missingCore?-6:4});
  state.flags.scopePoints=points;state.flags.scopeLocked=true;state.flags.featureFlag=false;spend(state,1);state.completed.push('scope');
  if(over)state.delayed.push({day:16,source:'scope',text:`The ${points}-point MVP exceeds the 42-point capacity. Unfinished work is piling up.`,effects:{delivery:-8,quality:-5}});
  const entry={id:'scope',day:6,title:'Your MVP scope',decision:`Commit ${points} points: ${selected.map(f=>f.name).join(', ')}`,insight:'A scope decision is also a capacity decision.',hours:1,effects,delayed:[]};
  state.history.push(entry);return entry;
}
export function joinSocial(state,index,brief=false) {
  const event=socialEvents[index],id=`${state.day}-${event.id}`;if(state.social.includes(id))throw new Error('You already joined this event.');
  const hours=brief?.25:event.hours;if(hours+reservedHours(state)>remaining(state))throw new Error('Keep enough time for today’s required decisions.');
  const effects=Object.fromEntries(Object.entries(event.effects).map(([k,v])=>[k,brief?Math.round(v/2):v]));
  applyEffects(state,effects);relationships(state,brief?Object.fromEntries(Object.entries(event.relations).map(([k,v])=>[k,Math.round(v/2)])):event.relations);spend(state,hours);state.social.push(id);
  const entry={id,day:state.day,title:event.title,decision:brief?'Stop by briefly':'Join the team',hours,effects,insight:'Relationship capital often grows outside formal meetings.',delayed:[]};state.history.push(entry);return entry;
}
export function attendCompeting(state,which) {
  if(state.calendar.some(c=>c.day===state.day&&c.competing))throw new Error('You chose a meeting in this time slot.');
  if(1.5+reservedHours(state)>remaining(state))throw new Error('Keep enough time for your required work.');
  const settings=[{name:'Design review',effects:{quality:6,customer:3},relations:{Design:7,Engineering:-3,Sales:-2}},
    {name:'Engineering risk sync',effects:{quality:7,delivery:3},relations:{Engineering:7,Design:-3,Sales:-2}},
    {name:'Coffee with Sales',effects:{business:6,customer:2},relations:{Sales:7,Engineering:-3,Design:-2}}];
  const meeting=settings[which];if(!meeting)throw new Error('Unknown meeting.');
  const effects=applyEffects(state,meeting.effects);relationships(state,meeting.relations);spend(state,1.5);state.calendar.push({day:state.day,name:meeting.name,hours:1.5,competing:true});
  const entry={id:`calendar-${state.day}`,day:state.day,title:'Three invitations. One calendar.',decision:meeting.name,hours:1.5,effects,delayed:[],insight:'Choosing a meeting also means choosing which conversations to miss.'};state.history.push(entry);
  const missed=which===1?'Maya makes a design call without your input.':which===0?'Dan surfaces an integration risk one day later.':'Engineering and Design have to make a trade-off without Product.';
  state.delayed.push({day:Math.min(30,state.day+3),source:entry.id,text:missed,effects:which===1?{quality:-2}:which===0?{delivery:-3}:{team:-3}});return entry;
}
export function focusWork(state) {
  if(1+reservedHours(state)>remaining(state))throw new Error('Keep enough time for today’s required work.');
  applyEffects(state,{strategy:3,delivery:2});spend(state,1);state.focus=clamp(state.focus+4);
  const entry={id:`focus-${state.history.length}`,day:state.day,title:'Protected focus block',decision:'Clarify the PRD and decisions',hours:1,effects:{strategy:3,delivery:2},delayed:[],insight:'A quiet hour can prevent several noisy meetings.'};state.history.push(entry);return entry;
}
export function recoverFocus(state) {
  if(.5+reservedHours(state)>remaining(state))throw new Error('Keep enough time for your required work.');
  spend(state,.5);state.focus=clamp(state.focus+25);state.dimensions.energy=clamp(state.dimensions.energy+9);
}
export function makeCoffee(state) {
  const key=`${state.day}-coffee`,cups=state.officeActivities.filter(k=>k.startsWith(key)).length;
  if(cups>=2)throw new Error('Two cups is enough for today. Take a break or return to your desk.');
  const hours=5/60;if(hours+reservedHours(state)>remaining(state)+.00001)throw new Error('Keep enough time for today’s required work.');
  const focusBefore=state.focus;spend(state,hours);state.focus=clamp(focusBefore+8);const effects=applyEffects(state,{energy:4});state.officeActivities.push(`${key}-${cups+1}`);
  const entry={id:`${key}-${cups+1}`,day:state.day,title:'Make coffee',decision:'Small cup. Big roadmap.',hours,effects,focus:8,delayed:[],insight:'A short reset can help. It cannot make the roadmap smaller.'};state.history.push(entry);return entry;
}
export function informalChat(state,person,topic='work') {
  const detail=informalTopics[person],id=`${state.day}-chat-${person}`;
  if(!detail)throw new Error('This conversation is unavailable.');
  if(state.officeActivities.includes(id))throw new Error('You checked in today. The conversation can continue tomorrow.');
  const hours=topic==='hello'?10/60:20/60;if(hours+reservedHours(state)>remaining(state)+.00001)throw new Error('Keep enough time for today’s required work.');
  const effects=applyEffects(state,topic==='work'?detail.effects:topic==='team'?{team:3,energy:2}:{team:1});
  relationships(state,{[person]:topic==='hello'?1:4});spend(state,hours);state.officeActivities.push(id);
  if(topic==='work')state.flags[detail.flag]=true;
  const entry={id,day:state.day,title:`Check in with ${people[person].name}`,decision:topic==='work'?`Ask about the work: ${detail.signal}`:topic==='team'?'Ask how the team is doing':'Say hello and keep moving',hours,effects,delayed:[],insight:topic==='work'?`${detail.quote} Useful information does not only appear in scheduled meetings.`:'A person is more than the next decision they need from you.'};state.history.push(entry);return entry;
}
export function doDeskWork(state,id) {
  const activity=deskActivities.find(a=>a.id===id),key=`${state.day}-work-${id}`;
  if(!activity)throw new Error('Unknown desk activity.');if(state.officeActivities.includes(key))throw new Error('You finished this desk activity today.');
  if(activity.hours+reservedHours(state)>remaining(state)+.00001)throw new Error('Keep enough time for today’s required work.');
  const effects=applyEffects(state,activity.effects);spend(state,activity.hours);state.officeActivities.push(key);
  const entry={id:key,day:state.day,title:activity.title,decision:activity.description,hours:activity.hours,effects,delayed:[],insight:'Focused work happens inside an organization that keeps moving.'};state.history.push(entry);return entry;
}
export function settleOfficeMeetings(state,force=false) {
  if((state.spent<2&&!force)||state.calendar.some(c=>c.day===state.day&&c.competing))return null;
  const effects=applyEffects(state,{quality:-3,team:-2});relationships(state,{Design:-6,Engineering:-3,Sales:-2});
  state.calendar.push({day:state.day,name:'Meetings continued without PM',hours:0,competing:true,skipped:true});
  const entry={id:`missed-${state.day}`,day:state.day,title:'The meetings happened without you',decision:'Design proceeded with Option B. Engineering documented its risk. Sales followed up asynchronously.',hours:0,effects,delayed:[],insight:'The room does not stop making decisions when Product is absent. You protected your time and gave up some alignment.'};state.history.push(entry);return entry;
}
export function handleInterruption(state,kind,action) {
  const id=`${state.day}-${kind}`;if(state.interruptions.includes(id))return;
  const costs=[.25,0,.1,.5];if(costs[action]+reservedHours(state)>remaining(state))throw new Error('There is not enough time for that response.');
  const important=kind==='critical';
  const effects=important?(action===1?{quality:-6,team:-2}:{quality:5,team:2}):(action===0?{team:2,energy:-2}:{strategy:2});
  applyEffects(state,effects);spend(state,costs[action]);if(action===0)state.focus=clamp(state.focus-8);state.interruptions.push(id);
  state.history.push({id,day:state.day,title:important?'Infrastructure alert':'“Quick question…”',decision:['Open now','Ignore','Answer in five minutes','Schedule a discussion'][action],hours:costs[action],effects,delayed:[],insight:'Not every interruption deserves the same priority.'});
}
export function processDelayed(state) {
  const due=state.delayed.filter(d=>d.day<=state.day);state.delayed=state.delayed.filter(d=>d.day>state.day);
  for(const event of due) {
    const effects=applyEffects(state,event.effects);const note={text:event.text,day:state.day,effects,source:event.source};state.notifications.push(note);
    state.history.find(h=>h.id===event.source)?.delayed.push(note);
  }
  if([14,22,26].includes(state.day)) {
    const trust=state.relationships.Engineering;
    if(trust>=70){const text='Dan raises an uncertain risk early. The trust you built gives the team more room to prepare.';const effects=applyEffects(state,{quality:3,delivery:2});state.notifications.push({day:state.day,text,effects,source:'engineering-trust'});}
    else if(trust<35){const text='Engineering hesitates to surface uncertain estimates. A risk reaches you later than it could have.';const effects=applyEffects(state,{delivery:-3,team:-2});state.notifications.push({day:state.day,text,effects,source:'engineering-trust'});}
  }
  return due;
}
export function endDay(state) {
  if(todayScenarios(state).length)throw new Error('Complete today’s required work before ending the day.');
  const summary={day:state.day,hours:state.spent,decisions:state.history.filter(h=>h.day===state.day),checkpoint:[5,10,20,27].includes(state.day)};
  if(state.day===30){state.finished=true;return summary;}
  state.day++;state.spent=0;state.focus=100;state.dimensions.energy=clamp(state.dimensions.energy+23);
  processDelayed(state);return summary;
}
export function liveMetrics(state) {
  const d=state.dimensions,f=state.flags,live=!!f.launched;
  return {users:!live?0:f.rollout==='limited'?620:f.rollout==='delayed'?1700:6200,
    activation:clamp(Math.round(29+d.customer*.23+(f.onboarding?10:0))),
    retention:clamp(Math.round(14+d.customer*.2+(f.retentionWork?9:0))),
    conversion:Math.max(1,+(2.5+d.business*.07+(f.pricingTest?1:0)).toFixed(1)),
    payment:!live?(f.paymentFixed?99.8:97):f.paymentDisabled?0:f.incidentResolved?(f.paymentFixed?99.9:98.7):f.paymentFixed?(f.rollout==='limited'?99.1:97.8):91.4,
    crashFree:+clamp(95+d.quality*.046,90,99.99).toFixed(2),
    tickets:Math.round(15+(100-d.quality)*.5+(f.onboarding?0:18)+(f.supportReady?-8:12)),
    nps:Math.round(-10+d.customer*.6),support:f.supportReady?96:f.escalation?82:60};
}
export function productStyle(state) {
  const d=state.dimensions,meetings=state.calendar.reduce((n,c)=>n+c.hours,0);
  if(meetings>18&&d.strategy<60)return {name:'The Meeting Machine',description:'You were there for every conversation. The next step is turning more of that alignment into a decision.',strength:'Presence and stakeholder availability',risk:'Meetings can consume the capacity they are meant to unlock.'};
  const styles=[
    {name:'The Customer Advocate',score:(d.customer+d.quality)/2,description:'You kept the people using the product close to the decisions shaping it.',strength:'Customer understanding and experience quality',risk:'Protect room for business urgency and delivery, too.'},
    {name:'The Strategist',score:(d.strategy+d.business)/2,description:'You turned competing requests into a direction the product could follow.',strength:'Strategic clarity and business context',risk:'Keep translating the direction into small, observable releases.'},
    {name:'The Diplomat',score:d.team*.97,description:'You treated trust and shared understanding as part of the product system.',strength:'Cross-functional trust and stakeholder alignment',risk:'Some hard decisions cannot wait for everyone to agree.'},
    {name:'The Operator',score:(d.delivery+d.quality)/2,description:'You gave the team a path through dependencies, uncertainty, and delivery pressure.',strength:'Execution, coordination, and release discipline',risk:'Make sure speed leaves space for fresh discovery.'},
    {name:'The Shipper',score:d.delivery+(d.quality<55?5:-3),description:'You kept momentum alive and learned by getting the product into the world.',strength:'Delivery speed and experimentation',risk:'Quality and sustainability are the interest on that speed.'}
  ];return styles.sort((a,b)=>b.score-a.score)[0];
}
export function restoreState(raw) {
  try {const s=JSON.parse(raw);if(s.version!==1||!Number.isInteger(s.day)||s.day<1||s.day>30||!Array.isArray(s.history)||!s.dimensions)return null;
    const base=createState(s.seed);return {...base,...s,dimensions:{...base.dimensions,...s.dimensions},relationships:{...base.relationships,...s.relationships},flags:{...base.flags,...s.flags},backlog:{...base.backlog,...s.backlog}};
  } catch{return null;}
}
