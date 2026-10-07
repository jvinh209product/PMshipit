import {dimensions,chapters,people,scenarios,features,socialEvents,roomInfo} from './data.mjs';
import {createState,restoreState,chapterFor,todayScenarios,remaining,formatTime,decide,canDecide,commitBoard,scopePoints,joinSocial,attendCompeting,focusWork,recoverFocus,handleInterruption,endDay,liveMetrics,productStyle,makeCoffee,informalChat,doDeskWork,settleOfficeMeetings} from './engine.mjs';
import {Office} from './office.mjs';
import {deskActivities,informalTopics} from './activities.mjs';
import {stations} from './navigation.mjs';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
  sound:'<path d="m3 8 4 0 5-4v16l-5-4H3z"/><path d="M16 7c3 3 3 7 0 10m3-13c5 5 5 11 0 16"/>',
  mute:'<path d="m3 8 4 0 5-4v16l-5-4H3z"/><path d="m16 9 5 6m0-6-5 6"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h1m3 0h1m3 0h1m-9 3h1m3 0h1"/>',
  focus:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  home:'<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',
  cube:'<path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9M7.5 5.5l9 5"/>',
  lightbulb:'<path d="M8 16c-1-2-3-3-3-6a7 7 0 0 1 14 0c0 3-2 4-3 6M8 16h8m-7 3h6m-5 3h4"/>',
  customer:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-3c0-5 12-5 12 0v3m1-14c4 0 4 6 0 6m2 2c3 1 3 3 3 6"/>',
  business:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 13h18m-12 0v3h6v-3"/>',
  delivery:'<path d="m5 12 4 4 10-10M4 3h16v18H4z"/>',
  quality:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
  team:'<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20v-3c0-5 12-5 12 0v3m1-6c4-1 7 1 7 4v2"/>',
  strategy:'<path d="m12 3 9 9-9 9-9-9zM12 7v10m-5-5h10"/>',
  energy:'<path d="m13 2-8 12h6l-1 8 9-13h-7z"/>',
  coffee:'<path d="M3 8h12v10c0 5-12 5-12 0zM15 10h3c4 0 4 6 0 6h-3M5 3v2m4-2v2m4-2v2"/>',
  chart:'<path d="M3 3v18h18M7 17v-5m5 5V7m5 10V4"/>',
  check:'<path d="m5 12 4 4 10-10"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v7m0-10v.5"/>',
  arrow:'<path d="M6 18 18 6M7 6h11v11"/>',
  rocket:'<path d="M9 15c-1-6 4-10 11-11-1 7-5 12-11 11zM9 8H5l-3 6h6m8 1v4l-6 3v-6m-4 3-3 3"/><circle cx="15" cy="9" r="2"/>',
  refresh:'<path d="M20 9V3l-3 3a8 8 0 1 0 3 10M20 9h-6"/>',
  arrowright:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chat:'<path d="M4 3h16v13H9l-5 5zM8 8h8m-8 4h5"/>',
  flag:'<path d="M5 22V3m0 1c6-5 7 6 15 1v10c-8 5-9-6-15-1"/>'
};
const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.cube}</svg>`;
const storageKey='ship-it-orbit-v1';let state=createState(),saveAvailable=true;
try{state=restoreState(localStorage.getItem(storageKey))||state;}catch{saveAvailable=false;}
let office=null,soundEnabled=false,audio=null,currentModal=null,previousFocus=null,toastTimer=null,meetingSession=null,heldSummary=null,pendingWork=null,workTimer=null,workInterruptTimer=null;
function save(){const missed=settleOfficeMeetings(state);try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{saveAvailable=false;}render();office?.setState(state);if(missed)$('#office-story').textContent='Design review completed without PM. The team proceeded with Option B.';}
function tone(type='decision') {
  if(!soundEnabled)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);osc.type='sine';osc.frequency.value=type==='launch'?523:type==='alert'?330:440;gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);osc.start();osc.stop(audio.currentTime+.19);}catch{}
}
function toast(text,error=false){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').className=`toast visible${error?' error':''}`;toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4000);}
function action(fn){try{return fn();}catch(e){toast(e.message,true);}}
function socialIndex(){return (state.day+Math.floor(state.seed/1000))%socialEvents.length;}
function render() {
  const chapter=chapterFor(state.day),pending=todayScenarios(state),social=socialEvents[socialIndex()];
  $('#journey').innerHTML=chapters.map((c,i)=>`${i?'<span class="journey-connector" aria-hidden="true"></span>':''}<div class="journey-item ${i===chapter?'active':i<chapter?'completed':''}" ${i===chapter?'aria-current="step"':''}><span class="journey-node">${i<chapter?'✓':String(i+1).padStart(2,'0')}</span><div><strong>${c.name}</strong><small>DAY ${c.range}</small></div></div>`).join('');
  $('#journey-date').innerHTML=`DAY ${String(state.day).padStart(2,'0')} <span>/ 30</span>`;
  $('#day-label').textContent=`${['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'][((state.day-1)%5)]} · DAY ${String(state.day).padStart(2,'0')}`;
  $('#chapter-badge').textContent=chapters[chapter].name.toUpperCase();
  const title=state.finished?'You shipped it.':state.day===1?'Your first day.':state.day===6?'Make the cut.':state.day===27?'The big call.':state.day>=28?'Now we learn.':state.day>=21?'Almost ready.':state.day>=11?'Keep it moving.':'Find your focus.';
  $('#day-title').textContent=title;$('#day-description').innerHTML=state.day===1?'Meet the team.<br>Find the problem.':state.finished?'A product style. A trail of choices.<br>A little more perspective.':esc(chapters[chapter].objective);
  $('#hours-left').textContent=remaining(state)%1===0?`${remaining(state)}h`:`${remaining(state).toFixed(1)}h`;
  const minute=Math.round(state.spent*60)+540;$('#clock-time').textContent=`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
  $('#time-fill').style.width=`${remaining(state)/8*100}%`;$('#focus-fill').style.width=`${state.focus}%`;$('#focus-value').textContent=state.focus;
  const taskHtml=(title,type,meta,ico,attrs)=>`<button class="task ${type}" ${attrs}><span class="task-icon">${icon(ico)}</span><span><span class="task-title">${esc(title)}</span><span class="task-meta"><span class="priority">${type==='must'?'MUST DO':type==='should'?'SHOULD DO':type==='completed'?'DONE':'COULD DO'}</span>${esc(meta)}</span></span><span class="task-arrow">${type==='completed'?'✓':'↗'}</span></button>`;
  let tasks=pending.slice(0,3).map(s=>taskHtml(s.title,'must',`${s.type==='board'?'1h':formatTime(Math.min(...s.options.map(o=>o.hours)))}+ · ${roomInfo[s.room].name}`,s.type==='board'?'cube':s.type==='incident'?'quality':s.person==='CEO'?'flag':s.person==='Engineering'?'delivery':s.person==='Design'?'lightbulb':'chat',`data-action="scenario" data-id="${s.id}"`));
  if(tasks.length<2&&!state.finished)tasks.push(taskHtml('Protect a focus block','should','1h · Product desk','focus','data-action="focus"'));
  const socialDone=state.social.includes(`${state.day}-${social.id}`);
  if(tasks.length<3&&!state.finished)tasks.push(taskHtml(social.title,socialDone?'completed':'could',`${formatTime(social.hours)} · ${people[social.person].name}`,'coffee',`data-action="social"`));
  if(!pending.length&&state.started&&!state.finished)tasks.unshift(taskHtml('Today’s decisions are made','completed','Ready for your daily reflection','check','data-action="summary"'));
  if(state.finished)tasks=[taskHtml('See your product style','must','Your 30-day debrief','strategy','data-action="debrief"'),taskHtml('Replay your decisions','should',`${state.history.length} moments to learn from`,'calendar','data-action="timeline"'),taskHtml('Meet the team again','could','Trust is part of the product','team','data-action="team"')];
  $('#tasks').innerHTML=tasks.slice(0,3).join('');$('#task-count').textContent=`${pending.length||tasks.length} ${pending.length===1?'PRIORITY':'EVENTS'}`;
  const calendarDone=state.calendar.find(c=>c.day===state.day&&c.competing);$('#calendar-badge').textContent=calendarDone?.skipped?'Without PM':calendarDone?'1 attended':'3 overlapping';
  $('#primary-btn').innerHTML=state.finished?'See Your Product Debrief <span>↗</span>':!state.started?'Start Your First Day <span>↗</span>':pending.length?`${pending[0].type==='board'?'Build Your MVP':pending[0].type==='launch'?'Enter the War Room':'Make Your Next Decision'} <span>↗</span>`:`End Day ${String(state.day).padStart(2,'0')} <span>→</span>`;
  $('#primary-caption').innerHTML=`<i></i> ${saveAvailable?'Your progress saves as you play':'Progress stays in this tab'}`;
  $('#dimensions').innerHTML=dimensions.map(([key,label,description])=>`<div class="dimension" title="${label}: ${description}"><div class="dimension-heading">${icon(key)}<span>${label}</span></div><div class="dimension-value">${state.dimensions[key]}<small>/100</small></div><div class="dimension-track"><span style="width:${state.dimensions[key]}%"></span></div></div>`).join('');
  const unstable=state.flags.launched&&!state.flags.incidentResolved;const healthy=(state.dimensions.quality+state.dimensions.customer)/2;
  $('#health-word').textContent=unstable?'Under pressure':healthy>75?'Finding its rhythm':healthy<45?'Needs attention':'Taking shape';$('#health-light').style.background=unstable?'#d58866':healthy<45?'#bd9c65':'#85a76e';
  const latest=state.history.at(-1);$('#daily-insight').innerHTML=latest?esc(latest.insight):'Your job isn’t to have all the answers. <strong>It’s to choose what matters.</strong>';
  $('#note-number').textContent=String(state.history.length+1).padStart(3,'0');$('#office-clock').textContent=`DAY ${String(state.day).padStart(2,'0')} · ${$('#clock-time').textContent}`;$('#office-mood').textContent=unstable?'Incident · head to the war room':state.flags.launched?'Live · watch what happens next':state.day>=21?'Release week · all hands nearby':'A normal day. For now.';
  if(state.started){$('#office-title').innerHTML=state.finished?'You shipped.<br><span>Now reflect.</span>':state.flags.launched?'Hello, world.<br><span>Hello, reality.</span>':state.day>=21?'Ready enough?<br><span>Your call.</span>':state.day>=11?'Less guessing.<br><span>More building.</span>':state.day>=6?'What ships?<br><span>What waits?</span>':'Start with why.<br><span>Then choose.</span>';}
}
function modal(label,body,{wide=false,kind=''}={}) {
  if(!currentModal)previousFocus=document.activeElement;currentModal=label;
  $('#modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal ${wide?'wide':''} ${kind}" role="dialog" aria-modal="true" aria-label="${esc(label)}"><div class="modal-top"><span>${icon(kind==='incident'?'quality':kind==='launch'?'rocket':'cube')}</span><span class="eyebrow">${esc(label)}</span><button class="modal-close" data-action="close" aria-label="Close dialog">×</button></div><div class="modal-body">${body}</div></section></div>`;
  if(window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.from($('.modal'),{y:12,opacity:0,duration:.28,ease:'power2.out'});
  requestAnimationFrame(()=>$('.modal-close')?.focus());
}
function closeModal(){currentModal=null;$('#modal-root').innerHTML='';previousFocus?.focus();previousFocus=null;}
function speaker(person) {const p=people[person];return `<div class="speaker"><span class="avatar" style="background:${p.color}">${p.initial}</span><div><strong>${p.name}</strong><small>${p.role}</small></div><span class="relationship">TRUST ${state.relationships[person]}/100</span></div>`;}
function evidence(items){return `<div class="evidence-grid">${items.map(([label,value])=>`<div class="evidence"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>`;}
function optionsHtml(scene) {return `<div class="decision-label"><span class="eyebrow">CHOOSE YOUR TRADE-OFF</span><span>Exact outcomes stay uncertain.</span></div><div class="options ${scene.type==='launch'?'rollout-options':''}">${scene.options.map((o,i)=>`<button class="option" data-action="choose" data-id="${scene.id}" data-index="${i}" ${!canDecide(state,scene,o)?'disabled title="Not enough time after reserving other required work"':''}><span class="option-number">${String(i+1).padStart(2,'0')}</span><div><strong>${esc(o.label)}</strong><p>${esc(o.tradeoff)}</p><span class="cost">${icon('clock')} ${formatTime(o.hours)}</span></div></button>`).join('')}</div>`;}
function openScenario(id,skipMeeting=false) {
  const scene=scenarios.find(s=>s.id===id);if(!scene||state.completed.includes(id))return toast('You already made this decision.');
  if(scene.day!==state.day)return;
  if(!state.started){state.started=true;save();}
  office?.focus(scene.room);
  if(scene.type==='board')return openBoard();
  if(scene.type==='meeting'&&!skipMeeting)return openMeeting(scene);
  const metrics=liveMetrics(state);let data=scene.evidence;
  if(scene.type==='launch')data=[['Critical bugs',state.flags.bugs],['Payment success',`${metrics.payment}%`],['Support readiness',`${metrics.support}%`]];
  if(scene.type==='incident')data=[['Exposed users',metrics.users.toLocaleString()],['Payment success',`${metrics.payment}%`],['Rollback',state.flags.rollbackReady?'Rehearsed':'Not rehearsed']];
  let context=scene.context;
  if(scene.id==='incident'&&state.flags.paymentFixed&&state.flags.infraReady)context='Your preparation limited the incident. Launch traffic is three times forecast, and queue latency is rising. Payments are steadier than the baseline, but the team still needs a containment decision.';
  if(scene.id==='usability')context+=state.flags.research?' Your earlier interviews give Maya a useful starting point.':' The team has little first-hand evidence to resolve the debate.';
  if(scene.id==='usability'&&state.flags.supportSignal)context+=' Riley flagged the setup confusion in your earlier informal conversation.';
  if(scene.id==='vendor'&&state.flags.dependencySignal)context+=' Dan raised this dependency during your check-in. It is now a delivery constraint.';
  if(scene.id==='sso'&&state.flags.ssoSignal)context+=' Leo mentioned these enterprise expectations when you spoke outside the calendar.';
  const flags=scene.type==='launch'?`<div class="risk-list">${riskPills()}</div>`:'';
  modal(`DAY ${String(state.day).padStart(2,'0')} / ${roomInfo[scene.room].name}`,`${speaker(scene.person)}<h2>${scene.title}</h2><p class="modal-lead">${esc(context)}</p>${evidence(data)}${flags}${optionsHtml(scene)}<div class="modal-note">${icon('info')} You can recover from any outcome. The simulation keeps moving.</div>`,{wide:scene.type==='launch',kind:scene.type==='launch'?'launch':scene.type==='incident'?'incident':''});
}
function feedback(entry) {
  save();tone();
  if(entry.id==='launch')return launchSequence();
  modal('DECISION RECORDED',`<div class="result-check">${icon('check')}</div><h2>${esc(entry.decision)}</h2><p class="modal-lead">The trade-off is yours. Here is what changed immediately.</p><div class="consequence-grid">${Object.entries(entry.effects).filter(([,v])=>v).map(([k,v])=>`<span class="consequence-chip ${v<0?'negative':''}">${dimensions.find(d=>d[0]===k)?.[1]||k}<strong>${v>0?'+':''}${v}</strong></span>`).join('')}</div><div class="lesson">${esc(entry.insight)}</div><div class="modal-note">${icon('clock')} ${formatTime(entry.hours)} spent · Some consequences will appear later.</div><div class="modal-actions"><button class="primary-button" data-action="continue">Back to the office <span>↗</span></button></div>`);
}
function launchSequence() {
  tone('launch');const metric=liveMetrics(state);modal('ORBIT IS LIVE',`<div class="launch-celebration">${icon('rocket')}<h2>You shipped it.</h2><p>${state.flags.rollout==='limited'?'A 10% rollout. A smaller blast radius.':state.flags.rollout==='delayed'?`A ${state.flags.launchSlip||2}-day buffer. A more reliable release.`:'The full release. The world is your beta now.'}</p><div class="mono" id="live-user-count">0</div><p>teams reached · a new chapter begins</p><button class="primary-button" data-action="continue">Back to the office <span>↗</span></button></div>`,{kind:'launch'});
  if(window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const count={n:0};gsap.to(count,{n:metric.users,duration:1.7,ease:'power2.out',onUpdate:()=>{if($('#live-user-count'))$('#live-user-count').textContent=Math.round(count.n).toLocaleString();}});}else $('#live-user-count').textContent=metric.users.toLocaleString();
}
function riskPills(){return [['Payments',!!state.flags.paymentFixed],['Rollback',!!state.flags.rollbackReady],['Support',!!state.flags.supportReady],['Analytics',!!state.flags.analyticsReady],['Infrastructure',!!state.flags.infraReady]].map(([label,ready])=>`<span class="risk-pill ${ready?'good':''}">${ready?'✓':'!'} ${label}: ${ready?'prepared':'watch closely'}</span>`).join('');}

function openBoard(inspected=null) {
  const pts=scopePoints(state),over=pts>42;
  const card=f=>`<div class="feature-card" draggable="true" data-feature="${f.id}"><div class="feature-card-top"><span class="feature-grip">⠿</span><button data-action="inspect" data-id="${f.id}">${f.name}</button><span class="point-tag">${f.points} pts</span></div><div class="feature-detail">${f.evidence} evidence · ${f.risk} risk</div><select aria-label="Prioritize ${f.name}" data-feature-select="${f.id}"><option value="mvp" ${state.backlog[f.id]==='mvp'?'selected':''}>MVP / SHIP IT</option><option value="later" ${state.backlog[f.id]==='later'?'selected':''}>LATER / NOT YET</option><option value="kill" ${state.backlog[f.id]==='kill'?'selected':''}>KILL / LET IT GO</option></select>${inspected===f.id?`<div class="feature-inspect">Value: ${f.value}<br>Evidence: ${f.evidence}<br>Dependency: ${f.dependency}<p>${f.description}</p></div>`:''}</div>`;
  modal('DAY 06 / THE MVP BOARD',`<h2>Make room for what matters.</h2><p class="modal-lead">93 points requested. 42 points available. Drag cards between columns, or use their menus. Click a feature to inspect its evidence and dependencies.</p><div class="board-budget ${over?'over':''}"><span class="mono">${pts} <small>/ 42 pts</small></span><p>${over?'Over capacity. You can commit, but the team will carry the cost.':'A scope the team can discuss, estimate, and defend.'}</p><div class="capacity-track"><i style="width:${Math.min(100,pts/42*100)}%"></i></div></div><div class="board-columns">${[['mvp','MVP','Ship it'],['later','LATER','Not yet'],['kill','KILL','Let it go']].map(([id,title,caption])=>`<section class="board-column" data-lane="${id}"><h3>${title}<small>${caption}</small></h3>${features.filter(f=>state.backlog[f.id]===id).map(card).join('')}</section>`).join('')}</div><div class="modal-actions"><button class="primary-button" data-action="commit-board" ${pts===0?'disabled':''}>Commit this scope <span>↗</span></button></div>`,{wide:true});
  $$('.feature-card').forEach(card=>card.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',card.dataset.feature);e.dataTransfer.effectAllowed='move';}));
  $$('.board-column').forEach(lane=>{lane.addEventListener('dragover',e=>{e.preventDefault();lane.classList.add('dragover');});lane.addEventListener('dragleave',()=>lane.classList.remove('dragover'));lane.addEventListener('drop',e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');if(features.some(f=>f.id===id)){state.backlog[id]=lane.dataset.lane;save();openBoard();}});});
  $$('[data-feature-select]').forEach(select=>select.addEventListener('change',()=>{const feature=select.dataset.featureSelect;state.backlog[feature]=select.value;save();openBoard();requestAnimationFrame(()=>$(`[data-feature-select="${feature}"]`)?.focus());}));
}
function openMeeting(scene) {
  office?.life.startMeeting();
  if(!meetingSession||meetingSession.id!==scene.id)meetingSession={id:scene.id,alignment:32,tension:46,minutes:24,actions:0,log:'Different functions are optimizing for different things.'};
  const m=meetingSession;
  modal('MEETING SIMULATOR / MODERATE THE ROOM',`${speaker(scene.person)}<h2>${scene.title}</h2><p class="modal-lead">${scene.context}</p><div class="meeting-display"><div class="meeting-heading"><strong>ROADMAP / ALIGNMENT REVIEW</strong><span>${m.minutes>0?`${String(m.minutes).padStart(2,'0')}:00`:'MEETING ENDED'}</span></div><div class="meeting-bars"><div><label>Alignment <span>${m.alignment}%</span></label><div class="meeting-track"><i style="width:${m.alignment}%"></i></div></div><div><label>Tension <span>${m.tension}%</span></label><div class="meeting-track tension"><i style="width:${m.tension}%"></i></div></div></div></div>${m.minutes>0?`<div class="meeting-action-grid">${['Ask for evidence','Challenge an assumption','Align on the outcome','Accept the request','Park the discussion','Summarize the decision'].map((t,i)=>`<button data-action="moderate" data-index="${i}">${t}</button>`).join('')}</div>`:''}<p class="meeting-status ${m.minutes<=0?'fail':''}">${esc(m.log)}</p><div class="modal-actions">${m.minutes<=0?'<button class="secondary-button" data-action="meeting-recover">Recover with a written summary</button>':`<button class="secondary-button" data-action="meeting-conclude" ${m.actions<2?'disabled':''}>Close the discussion & make the call ${icon('arrowright')}</button>`}</div><div class="modal-note">${icon('clock')} Each moderation move spends 4 simulated meeting minutes. Avoid discussion without convergence.</div>`);
}
function moderate(index) {
  const m=meetingSession;if(!m||m.minutes<=0)return;
  const deltas=[[13,-6,'Evidence reframes the disagreement.'],[5,9,'A useful challenge. The room gets a little more defensive.'],[16,-10,'You find the shared outcome behind the competing requests.'],[-5,-3,'Agreement arrives before the assumptions are tested.'],[0,-4,'Parked. The decision still needs an owner.'],[18,-8,'The room can now repeat the trade-off in the same words.']];
  const [a,t,log]=deltas[index];m.alignment=Math.min(100,Math.max(0,m.alignment+a));m.tension=Math.min(100,Math.max(0,m.tension+t));m.minutes-=4;m.actions++;m.log=log;
  if(m.minutes<=0)m.log=m.alignment>=60?'You used the full time, but reached a shared interpretation. Write down the decision.':'Meeting ended. Decision: none. Six rounds of discussion, zero agreement. Painfully familiar.';
  openMeeting(scenarios.find(s=>s.id===m.id));
}
function concludeMeeting(recover=false) {
  const m=meetingSession;if(!m)return;
  if(recover){state.dimensions.team=Math.max(0,state.dimensions.team-4);state.dimensions.strategy=Math.max(0,state.dimensions.strategy-3);toast('No decision in the room. Recover with a clear written trade-off.');}
  else {state.dimensions.team=Math.min(100,state.dimensions.team+(m.alignment>=60?3:-2));state.focus=Math.max(0,state.focus-4);}
  save();openScenario(m.id,true);meetingSession=null;
}
function openCalendar() {
  const attended=state.calendar.find(c=>c.day===state.day&&c.competing),slot=[['Design review','Maya','Onboarding needs your feedback.'],['Engineering risk sync','Dan','An integration risk needs an owner.'],['Coffee with Sales','Leo','A customer commitment is waiting.']];
  modal(`DAY ${String(state.day).padStart(2,'0')} / YOUR CALENDAR`,`<h2>One calendar.<br>Three valid priorities.</h2><p class="modal-lead">The 10:00 invitations overlap. You can attend one. The people in the other rooms still need to move forward.</p><div class="calendar-list"><div class="calendar-item"><time>09:00</time><div><strong>Daily product check</strong><p>What matters now? Look at your daily objectives.</p></div><span style="margin-left:auto;color:#a7b590">✓</span></div>${slot.map(([name,person,desc],i)=>`<div class="calendar-item ${attended?.name===name?'completed':'conflict'}"><time>10:00</time><div><strong>${name}</strong><p>${person} · ${desc}</p></div><button class="secondary-button" data-action="attend" data-index="${i}" ${attended?'disabled':''}>${attended?.name===name?'Attended':attended?'Missed':'Join'}</button></div>`).join('')}<div class="calendar-item"><time>14:00</time><div><strong>Protected focus block</strong><p>Work on the PRD. A whole hour without a deck.</p></div><button class="secondary-button" data-action="focus">Focus</button></div><div class="calendar-item"><time>16:30</time><div><strong>${socialEvents[socialIndex()].title}</strong><p>${formatTime(socialEvents[socialIndex()].hours)} · Optional, but relationships compound.</p></div><button class="secondary-button" data-action="social">View</button></div></div><div class="modal-note">${icon('info')} Each attended meeting costs 1.5h. Required work keeps a time reserve.</div>`);
}
function openSocial() {
  const i=socialIndex(),e=socialEvents[i],done=state.social.includes(`${state.day}-${e.id}`);office?.focus(e.room);
  modal('COULD DO / THE HUMAN SIDE',`${speaker(e.person)}<h2>${e.title}</h2><p class="modal-lead">${e.description}</p>${evidence([['Full event',formatTime(e.hours)],['A quick hello','15 min'],['Agenda','None, thankfully']])}<div class="options"><button class="option" data-action="join-social" data-index="${i}" ${done?'disabled':''}><span class="option-number">01</span><div><strong>Join the team</strong><p>A little trust. A little less time for the to-do list.</p><span class="cost">${formatTime(e.hours)}</span></div></button><button class="option" data-action="join-social" data-index="${i}" data-brief="true" ${done?'disabled':''}><span class="option-number">02</span><div><strong>Stop by briefly</strong><p>Show up without giving away the whole afternoon.</p><span class="cost">15 min</span></div></button></div><div class="modal-actions"><button class="secondary-button" data-action="close">${done?'Back to the office':'Skip & protect the time'}</button></div>`);
}
function openAnalytics() {
  office?.focus('analytics');const m=liveMetrics(state),live=state.flags.launched;const metrics=[['TEAMS REACHED',live?m.users.toLocaleString():'Beta cohort',live?'Exposure follows your rollout decision.':'Live acquisition unlocks after launch.',!live],['ACTIVATION',`${m.activation}%`,state.flags.onboarding?'Your first-use improvements are reflected here.':'First-use friction is still a factor.',state.day<10],['RETENTION',`${m.retention}%`,state.flags.retentionWork?'Retention work is changing the projection.':'Day 7 projection. An early signal, not a certainty.',!live],['CONVERSION',`${m.conversion}%`,'A signal of the value teams will pay for.',!live],['PAYMENT SUCCESS',state.flags.paymentDisabled?'Disabled':`${m.payment}%`,state.flags.paymentFixed?'Earlier fixes reduced the reliability risk.':'Reliability is a product constraint.',state.day<11],['SUPPORT READINESS',`${m.support}%`,state.flags.supportReady?'Training changed the support coverage.':'Escalations need a clear owner.',state.day<21],['CRASH-FREE SESSIONS',`${m.crashFree}%`,'Quality choices change release stability.',state.day<11],['SUPPORT VOLUME',`+${m.tickets}%`,state.flags.onboarding?'Less setup friction helps the support team.':'Confusion in the product becomes a ticket.',!live],['BETA NPS',m.nps,'A directional customer signal, not the whole story.',state.day<11]];
  modal('THE ANALYTICS WALL',`<h2>Signals, not certainties.</h2><p class="modal-lead">Your current primary metric: <strong>${esc(state.flags.metric)}</strong>. These are simulated indicators shaped by your decisions. ${state.flags.analyticsReady?'Instrumentation is prepared.':state.day>=25?'Missing instrumentation reduces your confidence in this picture.':'Metrics unlock as the product matures.'}</p><div class="analytics-grid">${metrics.map(([name,value,note,locked],j)=>`<div class="metric-card ${locked?'locked':''}"><label>${name}</label><strong>${locked?'—':esc(value)}</strong><small>${locked?'Not enough product data yet.':note}</small>${!locked?`<div class="mini-chart" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="height:${17+((i*13+j*9+state.dimensions.customer)%34)}px"></i>`).join('')}</div>`:''}</div>`).join('')}</div><div class="risk-list">${riskPills()}</div><div class="modal-note">${icon('info')} Acquisition does not prove retention. Activity does not prove value.</div>`,{wide:true});
}
function openTeam(selected=null) {
  modal(selected?`CONVERSATION / ${people[selected].name.toUpperCase()}`:'THE PEOPLE BEHIND THE PRODUCT',`<h2>${selected?'A different view of the same product.':'Eight minds. One product.'}</h2><p class="modal-lead">Relationships influence cooperation and how early risks are surfaced. Every function is protecting something useful.</p><div class="team-list">${Object.entries(people).filter(([key])=>!selected||key===selected).map(([key,p])=>`<div class="team-card"><div class="team-card-header"><span class="avatar" style="background:${p.color}">${p.initial}</span><div><strong>${p.name}</strong><small>${p.role}</small></div></div><p>“${p.concern}”</p><div class="relationship-meter"><i style="width:${state.relationships[key]}%"></i></div><div class="relationship-caption"><span>RELATIONSHIP CAPITAL</span><span>${state.relationships[key]}/100</span></div>${key==='Engineering'?`<p>${state.relationships[key]>=65?'Dan surfaces risks early because he trusts you to handle them.':state.relationships[key]<40?'Dan is more cautious about raising uncertain risks. You hear about them later.':'Dan is still learning whether you want estimates or promises.'}</p>`:''}</div>`).join('')}</div>${selected?'<div class="modal-actions"><button class="secondary-button" data-action="team">Meet the whole team</button></div>':''}`);
}
function openRoom(id) {
  if(id==='analytics')return openAnalytics();const pending=todayScenarios(state).find(s=>s.room===id);
  if(pending)return openScenario(pending.id);
  if(id==='product'&&state.day===6&&!state.completed.includes('scope'))return openBoard();
  if(id==='coffee')return openCoffee();
  if(id==='product')return openDesk();
  const r=roomInfo[id];modal(`ORBIT HQ / ${r.name.toUpperCase()}`,`${speaker(r.person)}<h2>${r.name}</h2><p class="modal-lead">${r.subtitle}</p><div class="empty-state">${state.completed.some(c=>scenarios.find(s=>s.id===c)?.day===state.day&&scenarios.find(s=>s.id===c)?.room===id)?'Your conversation here is complete for today. Check the decision log to revisit it.':'No required conversation here right now. Your daily objectives show the decisions that matter next.'}</div><div class="modal-actions"><button class="secondary-button" data-action="person" data-id="${r.person}">Talk to ${people[r.person].name}</button><button class="primary-button" data-action="continue">Back to the office <span>↗</span></button></div>`);
}
function openTimeline(debrief=false) {
  const history=state.history;
  const list=history.map(entry=>`<article class="timeline-entry"><span class="eyebrow">DAY ${String(entry.day).padStart(2,'0')} · ${formatTime(entry.hours)}</span><h3>${esc(entry.title)}</h3><p>${esc(entry.decision)}</p><details><summary>What changed & what to consider</summary><p>${Object.entries(entry.effects||{}).filter(([,v])=>v).map(([k,v])=>`${dimensions.find(d=>d[0]===k)?.[1]||k} ${v>0?'+':''}${v}`).join(' · ')||'The conversation is part of the system.'}</p>${entry.delayed?.map(d=>`<p class="delayed-note">DAY ${d.day}: ${esc(d.text)}</p>`).join('')||''}<p>${esc(entry.insight)}</p></details></article>`).join('');
  modal(debrief?'YOUR PRODUCT DEBRIEF':'YOUR DECISION LOG',`<h2>A trail of trade-offs.</h2><p class="modal-lead">${history.length?`${history.length} moments. Every choice made in context. Expand a moment to see its immediate and delayed consequences.`:'Your first decision is still ahead of you. No scores to chase. Just trade-offs to understand.'}</p>${history.length?`<div class="timeline-list">${list}</div>`:'<div class="empty-state">Your decisions will appear here as you play.</div>'}<div class="modal-actions"><button class="secondary-button" data-action="export-log" ${history.length?'':'disabled'}>Download decision journal</button>${state.finished?'<button class="primary-button" data-action="debrief">See my product style <span>↗</span></button>':''}</div>`,{wide:debrief});
}
function openCheckin(person) {
  const topic=informalTopics[person];if(!topic)return openTeam();const done=state.officeActivities.includes(`${state.day}-chat-${person}`);
  modal(`CHECK IN / ${people[person].name.toUpperCase()}`,`${speaker(person)}<h2>A conversation<br>without a calendar invite.</h2><p class="character-dialogue">${esc(topic.quote)}</p><p class="modal-lead">${done?'You have already checked in today. There is no extra relationship reward for repeating the conversation.':'An informal conversation can surface context before the scheduled review does.'}</p><div class="options">${[['work','Ask about the work','Follow the signal. A little insight, a little relationship capital.',20],['team','Ask how the team is doing','Listen to the person behind the deadline.',20],['hello','Say hello and keep moving','Be present, then protect your focus.',10]].map(([id,title,desc,minutes],i)=>`<button class="option" data-action="chat" data-id="${person}" data-topic="${id}" ${done?'disabled':''}><span class="option-number">${i+1}</span><div><strong>${title}</strong><p>${desc}</p><span class="cost">${minutes} min</span></div></button>`).join('')}</div><div class="modal-actions"><button class="secondary-button" data-action="team">Meet the whole team</button><button class="primary-button" data-action="close">Back to the office <span>↗</span></button></div>`);
}
function openCoffee() {
  const cups=state.officeActivities.filter(id=>id.startsWith(`${state.day}-coffee-`)).length;
  const nearby=office?.life.actors.find(a=>a.room==='coffee'&&!a.secondary),person=nearby?.role||'Support';
  modal('THE COFFEE CORNER',`<h2>Small cup.<br>Big roadmap.</h2><p class="modal-lead">Take five minutes. Reset your focus. The office will still have opinions when you get back.</p>${evidence([['Focus','+8'],['Energy','+4'],['Time','5 min']])}<button class="primary-button full-width" data-action="coffee" ${cups>=2?'disabled':''}>${cups>=2?'Your two cups are done for today':'Make a coffee'} <span>↗</span></button><div class="coffee-social">${speaker(person)}<p class="character-dialogue">${esc(informalTopics[person].quote)}</p><button class="secondary-button" data-action="person" data-id="${person}">Check in with ${people[person].name} ↗</button></div><div class="modal-actions"><button class="secondary-button" data-action="social">Today’s social activity</button><button class="secondary-button" data-action="close">Leave the coffee corner</button></div>`);
}
function openDesk() {
  modal('YOUR PRODUCT DESK',`<h2>A little protected focus.</h2><p class="modal-lead">Turn the conversations into something the team can use. Long actions advance simulated time quickly, while the office keeps living around you.</p><div class="options desk-options">${deskActivities.map((a,i)=>`<button class="option" data-action="desk-work" data-id="${a.id}" ${state.officeActivities.includes(`${state.day}-work-${a.id}`)?'disabled':''}><span class="option-number">${i+1}</span><div><strong>${a.title}</strong><p>${a.description}</p><span class="cost">${formatTime(a.hours)}${state.officeActivities.includes(`${state.day}-work-${a.id}`)?' · Done today':''}</span></div></button>`).join('')}</div><div class="modal-note">${icon('info')} Required decisions keep a time reserve. These work blocks cannot trap the story.</div>`);
}
function runDeskWork(id) {
  if(pendingWork)return toast('Your current work block is still running. Finish it or skip the animation.',true);
  const entry=doDeskWork(state,id);pendingWork=entry;closeModal();save();office?.life.perform('Type','product',6);
  $('#work-root').innerHTML=`<aside class="work-dock" role="status"><span class="eyebrow">DEEP WORK / AT YOUR DESK</span><strong>${esc(entry.title)}</strong><p>${formatTime(entry.hours)} of simulated work. The office keeps moving.</p><div class="work-progress"><i></i></div><div><button data-action="skip-work">Skip animation</button><button data-action="speed-work">Fast forward ↗</button></div></aside>`;
  if(window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.to($('.work-progress i'),{width:'100%',duration:5.5,ease:'none'});
  clearTimeout(workTimer);clearTimeout(workInterruptTimer);workTimer=setTimeout(finishWork,6000);workInterruptTimer=setTimeout(()=>maybeInterrupt(true),900);
}
function finishWork() {clearTimeout(workTimer);clearTimeout(workInterruptTimer);if(!pendingWork)return;const entry=pendingWork;pendingWork=null;office?.life.skipAnimation();$('#work-root').innerHTML='';feedback(entry);}
function joinPhysicalMeeting(index) {
  const entry=attendCompeting(state,index),room=['design','engineering','coffee'][index];office?.life.quickPosition(room,'Meeting');office?.focus(room);
  const roles=index===0?['Design','Research']:index===1?['Engineering','QA']:['Sales','CEO'];for(const actor of office?.life.actors||[])if(roles.includes(actor.role))office.life.sendActor(actor,room,index===2?'Talk':'Meeting');feedback(entry);
}
function openCompetingMeeting(index) {
  const meetings=[['Design review','Maya + Jules','design'],['Engineering risk sync','Dan + Sam','engineering'],['Coffee with Sales','Leo + Alex','coffee']],meeting=meetings[index];if(!meeting)return;
  const [name,participants,room]=meeting,selected=state.calendar.find(c=>c.day===state.day&&c.competing);
  modal(`10:00 / ${roomInfo[room].name.toUpperCase()}`,`<h2>${name}</h2><p class="modal-lead">${participants} are here. ${selected?'Today’s overlapping meetings have already concluded.':'Join the conversation. The other teams will keep moving with their own decisions.'}</p><div class="modal-actions">${selected?'':`<button class="primary-button" data-action="attend" data-index="${index}">Join this meeting · 1.5h <span>↗</span></button>`}<button class="secondary-button" data-action="close">Back to the office</button></div>`);
}
function openPhysicalMeeting() {
  const required=todayScenarios(state).find(s=>s.type==='meeting');if(required)return openScenario(required.id);
  const selected=state.calendar.find(c=>c.day===state.day&&c.competing);
  modal('PHYSICAL MEETINGS / THE OFFICE KEEPS MOVING',`<h2>Where will you show up?</h2><p class="modal-lead">${selected?.skipped?'These meetings concluded without Product. The team made its own calls.':selected?'You attended one conversation. The other teams moved forward without you.':'Three overlapping opportunities. Participants walk to their rooms, and the conversations continue even if you stay at your desk.'}</p><div class="physical-meetings">${[['Design review','Maya + Jules','design'],['Engineering risk sync','Dan + Sam','engineering'],['Coffee with Sales','Leo + Alex','coffee']].map(([name,participants,room],i)=>`<article><span class="eyebrow">10:00 · ${roomInfo[room].name}</span><h3>${name}</h3><p>${participants}</p><div><button class="secondary-button" data-action="walk-meeting" data-id="${room}" data-index="${i}">Walk there</button><button class="secondary-button" data-action="attend" data-index="${i}" ${selected?'disabled':''}>Join immediately</button></div></article>`).join('')}</div><div class="modal-actions">${selected?'':'<button class="secondary-button" data-action="skip-meetings">Skip these meetings</button>'}<button class="secondary-button" data-action="close">Keep exploring</button></div>`);
}
function openNearbyRoom(id) {if(id==='product')return openDesk();if(id==='coffee')return openCoffee();if(id==='meeting')return openPhysicalMeeting();return openRoom(id);}
function showWalkMenu() {
  modal('OFFICE NAVIGATION',`<h2>Your next conversation<br>is a few steps away.</h2><p class="modal-lead">Walking uses no simulated workday time. The shortcuts let you join immediately when you want to focus on decisions.</p><div class="navigation-menu">${Object.entries(roomInfo).map(([id,r])=>`<div><strong>${r.name}</strong><div><button class="secondary-button" data-action="walk-room" data-id="${id}">Walk there</button><button class="secondary-button" data-action="quick-room" data-id="${id}">Open now ↗</button></div></div>`).join('')}</div>`);
}
function checkpointHtml(day) {return `<div class="checkpoint"><div><strong>WHAT YOU BELIEVE</strong><p>${esc(state.flags.problem)} Target: ${esc(state.flags.segment)}. ${state.flags.metric==='Not chosen'?'A success metric still needs a decision.':`Primary signal: ${esc(state.flags.metric)}.`}</p></div><div><strong>WHAT THE EVIDENCE SAYS</strong><p>${state.flags.research?'Your first-hand customer evidence is a useful foundation.':'Limited first-hand research leaves more assumptions in the plan.'} ${state.flags.scopeLocked?`You committed ${state.flags.scopePoints} of 42 available story points.`:''}</p></div><div><strong>WHAT REMAINS UNCERTAIN</strong><p>${day<10?'Which segment will find recurring value, and what the smallest useful release looks like.':day<20?'Integration risk, reliability, and whether teams can reach their first useful action.':day<27?'How launch traffic will interact with reliability, support coverage, and rollback readiness.':'Real retention, willingness to pay, and what the acquisition headline might hide.'}</p></div></div>`;}
function openSummary() {
  if(todayScenarios(state).length)return toast('Complete your required decisions first. The next one is highlighted.',true);
  const day=state.day,entries=state.history.filter(h=>h.day===day),changes={};for(const e of entries)for(const [k,v]of Object.entries(e.effects||{}))changes[k]=(changes[k]||0)+v;
  modal(`DAY ${String(day).padStart(2,'0')} / ${[5,10,20,27].includes(day)?'CHAPTER CHECKPOINT':'DAILY REFLECTION'}`,`<h2>Day ${day}, in the books.</h2><p class="modal-lead">${entries.length} decisions and conversations. ${state.spent.toFixed(1)} of 8 hours used. ${remaining(state)>=1?'A little capacity left is a valid choice, too.':'Time is the trade-off behind every other trade-off.'}</p><div class="consequence-grid">${Object.entries(changes).filter(([,v])=>v).map(([k,v])=>`<span class="consequence-chip ${v<0?'negative':''}">${dimensions.find(d=>d[0]===k)?.[1]||k}<strong>${v>0?'+':''}${v}</strong></span>`).join('')}</div>${[5,10,20,27].includes(day)?checkpointHtml(day):`<div class="lesson">${entries.at(-1)?.insight||chapters[chapterFor(day)].question}</div>`}<div class="modal-actions"><button class="secondary-button" data-action="close">Stay in the office</button><button class="primary-button" data-action="end-day">${day===30?'Reveal my product style':`Start Day ${String(day+1).padStart(2,'0')}`} <span>→</span></button></div>`);
}
function advanceDay() {
  settleOfficeMeetings(state,true);heldSummary=endDay(state);$('#interruption-root').innerHTML='';save();office?.overview();tone();
  if(state.finished)return openDebrief();
  const notes=state.notifications.filter(n=>n.day===state.day);
  if(notes.length)modal('YESTERDAY’S CHOICES / TODAY’S CONSEQUENCES',`<h2>Some choices take time to arrive.</h2><p class="modal-lead">It is Day ${state.day}. Earlier decisions are showing up in the product and the team.</p>${notes.map(n=>`<div class="notification-block"><span>DELAYED CONSEQUENCE / DAY ${n.day}</span><p>${esc(n.text)}</p></div>`).join('')}<div class="modal-actions"><button class="primary-button" data-action="continue">Start the day <span>↗</span></button></div>`);
  else{closeModal();toast(`Day ${String(state.day).padStart(2,'0')}. ${chapters[chapterFor(state.day)].objective}`);}
}
function openDebrief() {
  if(!state.finished)return openTimeline();const style=productStyle(state),metrics=liveMetrics(state),major=state.history.filter(h=>['scope','payment','launch','incident','growth'].includes(h.id));
  const completed=state.completed.length,meetingHours=state.calendar.reduce((n,c)=>n+c.hours,0),hours=state.history.reduce((n,c)=>n+c.hours,0);
  modal('30 DAYS / YOUR PRODUCT STYLE',`<div class="style-result"><span class="eyebrow">YOU LEAN TOWARD</span><h2>${style.name}</h2><p>${style.description}</p><div class="profile-detail"><div><span class="eyebrow">YOUR STRENGTH</span><p>${style.strength}</p></div><div><span class="eyebrow">A TRADE-OFF TO WATCH</span><p>${style.risk}</p></div></div><div class="debrief-stats"><div><strong>${completed}</strong><span>Core decisions</span></div><div><strong>${hours.toFixed(1)}h</strong><span>Time invested</span></div><div><strong>${meetingHours.toFixed(1)}h</strong><span>In meetings</span></div><div><strong>${metrics.retention}%</strong><span>Retention signal</span></div></div></div><h2 style="font-size:23px">What your choices set in motion</h2><div class="timeline-list">${major.map(h=>`<div class="timeline-entry"><span class="eyebrow">DAY ${h.day} / ${h.title}</span><h3>${h.decision}</h3><p>${h.insight}</p>${h.delayed?.map(d=>`<p class="delayed-note">${esc(d.text)}</p>`).join('')||''}</div>`).join('')}</div><div class="lesson">Experienced PMs look at evidence strength, blast radius, reversibility, dependencies, customer trust, and the capacity of the people doing the work. Context can make two different decisions reasonable.</div><p class="final-message">There are no perfect product decisions.<br><span>Only trade-offs you understand — or don’t.</span></p><div class="modal-actions"><button class="secondary-button" data-action="timeline">Replay my decisions</button><button class="secondary-button" data-action="export-log">Download my journal</button><button class="primary-button" data-action="restart">Play again <span>↗</span></button></div><div class="modal-note">Enterprise · Growth · Crisis modes: coming later.</div>`,{wide:true});
}
function openGuide() {
  modal('HOW TO PLAY / OBSERVE → CHOOSE → REFLECT',`<h2>This is the job.<br>Now it’s the game.</h2><p class="modal-lead">You are the new PM of Orbit, a team decision workspace. The product needs to launch in 30 simulated workdays. You have 8 hours per day, imperfect evidence, and eight people with valid priorities.</p><div class="guide-steps"><div class="guide-step"><span>01 / OBSERVE</span><strong>Find what matters today.</strong><p>Click highlighted office rooms or your daily task cards. Must-do decisions keep the story moving.</p></div><div class="guide-step"><span>02 / CHOOSE</span><strong>Own the trade-off.</strong><p>Every action uses time. Customer, business, quality, team, and delivery may move in different directions.</p></div><div class="guide-step"><span>03 / EXPERIENCE</span><strong>Let the system respond.</strong><p>Attend one overlapping meeting. Cut the MVP. Moderate a discussion. Make the go / no-go call.</p></div><div class="guide-step"><span>04 / REFLECT</span><strong>End the day and learn.</strong><p>Complete the required work, then advance. Consequences can return later. Day 30 reveals your product style.</p></div></div><div class="lesson">Move your PM with WASD or arrow keys. Click or tap a floor destination to walk. Press E or tap the nearby action. Drag to rotate; scroll to zoom. Quick room shortcuts keep the whole story playable. Walking uses no simulated time.</div><div class="modal-actions"><button class="primary-button" data-action="continue">Back to the office <span>↗</span></button></div>`);
}
function startBriefing() {
  modal('WELCOME TO ORBIT / YOUR FIRST DAY',`<span class="eyebrow">30 DAYS. ONE PRODUCT. TOO MANY DECISIONS.</span><h2 class="dialog-intro" style="margin-top:20px">You’re the new<br>Product Manager.</h2><p class="intro-statement">The roadmap is messy. Engineering is overloaded.<br>Sales has already promised features.<br>And nobody agrees on what “ready” means.</p>${evidence([['Your product','Orbit'],['Your users','Growing teams'],['Your deadline','30 workdays']])}<p class="modal-lead">Orbit helps busy teams turn scattered conversations into clear decisions. Your job is to discover what they need, choose a viable scope, guide the build, launch, and learn. No single score. No perfect answers.</p><div class="modal-actions"><button class="primary-button full-width" data-action="start">Let’s get to work <span>↗</span></button></div>`);
}
function openSettings() {
  modal('YOUR SIMULATION',`<h2>A little control<br>over the chaos.</h2><p class="modal-lead">Day ${state.day} of 30. ${state.completed.length} core decisions made. Your progress is ${saveAvailable?'saved in this browser':'available in this tab'}.</p><div class="guide-steps"><div class="guide-step"><span>SOUND</span><strong>${soundEnabled?'On':'Off by default'}</strong><p>Subtle tones for decisions, interruptions, and launch.</p><button class="secondary-button" data-action="sound" style="margin-top:12px">Turn sound ${soundEnabled?'off':'on'}</button></div><div class="guide-step"><span>YOUR JOURNAL</span><strong>Take the reflection with you.</strong><p>Download your decisions and product style as a readable Markdown journal.</p><button class="secondary-button" data-action="export-log" style="margin-top:12px" ${state.history.length?'':'disabled'}>Download journal</button></div></div><div class="modal-actions"><button class="secondary-button danger" data-action="restart">Start a new simulation</button><button class="primary-button" data-action="continue">Back to the office <span>↗</span></button></div>`);
}
function restartConfirm(){modal('NEW SIMULATION',`<h2>A fresh set of trade-offs.</h2><p class="modal-lead">Starting again replaces this browser’s current progress. Download your journal first if you want to keep the reflection.</p><div class="modal-actions"><button class="secondary-button" data-action="export-log" ${state.history.length?'':'disabled'}>Download journal</button><button class="secondary-button" data-action="close">Keep playing</button><button class="primary-button" data-action="restart-confirm">Start again <span>↗</span></button></div>`);}
function downloadJournal() {
  const style=state.finished?productStyle(state):null;
  const text=`# SHIP IT! — My Product Decision Journal\n\n${style?`Product style: ${style.name}\n\n${style.description}\n\n`:''}Day ${state.day} / 30\n\n`+dimensions.map(([k,label])=>`${label}: ${state.dimensions[k]}/100`).join(' · ')+`\n\n## Decisions\n\n`+state.history.map(h=>`### Day ${h.day} — ${h.title}\n\nDecision: ${h.decision}\n\nTime: ${formatTime(h.hours)}\n\nImmediate changes: ${Object.entries(h.effects||{}).map(([k,v])=>`${k} ${v>0?'+':''}${v}`).join(', ')}\n\n${h.delayed?.map(d=>`Delayed (Day ${d.day}): ${d.text}\n\n`).join('')||''}Reflection: ${h.insight}\n`).join('\n')+'\n\nBuilt by Vinh Nguyen\nhttps://vinh-nguyen-portfolio-three.vercel.app/\n';
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));a.download='SHIP_IT_My_Decision_Journal.md';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);tone();toast('Your decision journal is ready.');
}
function maybeInterrupt(force=false) {
  if((!force&&![4,13,22,28].includes(state.day))||!state.started)return;
  const kind=state.day>=22?'critical':'minor',id=`${state.day}-${kind}`;if(state.interruptions.includes(id)||$('#interruption-root').innerHTML)return;
  $('#interruption-root').innerHTML=`<aside class="interruption ${kind==='critical'?'critical':''}" role="region" aria-label="Incoming interruption"><span class="eyebrow">${kind==='critical'?'! INFRASTRUCTURE ALERT':'ENGINEERING / “QUICK QUESTION…”'}</span><strong>${kind==='critical'?'CPU is at 98%. Can you look?':'Should this button say Cancel or Back?'}</strong><p>${kind==='critical'?'A load spike is building. The team needs an owner and a containment plan.':'A small design question has found its way into your focus time.'}</p><div class="interruption-actions">${['Open now','Ignore','Answer in 5 min','Schedule discussion'].map((t,i)=>`<button data-action="interrupt" data-kind="${kind}" data-index="${i}">${t}</button>`).join('')}</div></aside>`;tone('alert');
}

const handlers={
  close:()=>closeModal(),continue:()=>{closeModal();maybeInterrupt();},
  scenario:b=>openScenario(b.dataset.id),choose:b=>feedback(decide(state,b.dataset.id,+b.dataset.index)),
  inspect:b=>openBoard(b.dataset.id),'commit-board':()=>feedback(commitBoard(state)),
  moderate:b=>moderate(+b.dataset.index),'meeting-conclude':()=>concludeMeeting(),'meeting-recover':()=>concludeMeeting(true),
  attend:b=>joinPhysicalMeeting(+b.dataset.index),social:()=>openSocial(),
  'join-social':b=>feedback(joinSocial(state,+b.dataset.index,b.dataset.brief==='true')),
  focus:()=>feedback(focusWork(state)),summary:()=>openSummary(),'end-day':()=>advanceDay(),
  debrief:()=>openDebrief(),timeline:()=>openTimeline(),team:()=>openTeam(),person:b=>openCheckin(b.dataset.id),
  coffee:()=>{const entry=makeCoffee(state);office?.life.perform('Coffee','coffee',3);feedback(entry);},
  chat:b=>{const entry=informalChat(state,b.dataset.id,b.dataset.topic);office?.life.perform('Talk',null,3);feedback(entry);},
  'desk-work':b=>runDeskWork(b.dataset.id),'walk-room':b=>{const id=b.dataset.id;closeModal();office?.life.walkToRoom(id,true);},
  'walk-meeting':b=>{if(!office)return openCompetingMeeting(+b.dataset.index);closeModal();office.life.walkToRoom(b.dataset.id,true,+b.dataset.index);},
  'quick-room':b=>{const id=b.dataset.id;office?.life.quickPosition(id);openNearbyRoom(id);},
  'skip-meetings':()=>{const entry=settleOfficeMeetings(state,true);if(entry)feedback(entry);else toast('The meetings have already concluded.');},
  'skip-work':()=>finishWork(),'speed-work':()=>{office?.life.skipAnimation();finishWork();},
  start:()=>{state.started=true;save();closeModal();openScenario(todayScenarios(state)[0].id);},
  sound:()=>{toggleSound();if(currentModal==='YOUR SIMULATION')openSettings();},
  restart:()=>restartConfirm(),'restart-confirm':()=>{clearTimeout(workTimer);clearTimeout(workInterruptTimer);pendingWork=null;$('#work-root').innerHTML='';state=createState();save();office?.overview();closeModal();$('#office-title').innerHTML='Big decisions.<br><span>Small office.</span>';$('#interruption-root').innerHTML='';toast('A fresh Day 01. The whole journey is ahead.');},
  'export-log':()=>downloadJournal(),interrupt:b=>{handleInterruption(state,b.dataset.kind,+b.dataset.index);save();$('#interruption-root').innerHTML='';toast('Response sent. Your time and focus changed.');}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)action(()=>handlers[b.dataset.action]?.(b));if(e.target.classList.contains('modal-backdrop'))closeModal();});
document.addEventListener('keydown',e=>{
  if(!currentModal)return;if(e.key==='Escape'){closeModal();return;}
  if(e.key==='Tab'){const f=$$('.modal button:not(:disabled),.modal select,.modal a,.modal summary').filter(el=>el.getClientRects().length);if(!f.length)return;const first=f[0],last=f.at(-1);if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}}
});
function toggleSound(){soundEnabled=!soundEnabled;$('#sound-btn').innerHTML=icon(soundEnabled?'sound':'mute');$('#sound-btn').setAttribute('aria-label',soundEnabled?'Disable sound':'Enable sound');$('#sound-btn').title=soundEnabled?'Disable sound':'Enable sound';if(soundEnabled)tone();}
$('#primary-btn').addEventListener('click',()=>action(()=>state.finished?openDebrief():!state.started?startBriefing():todayScenarios(state).length?openScenario(todayScenarios(state)[0].id):openSummary()));
$('#guide-btn').addEventListener('click',openGuide);$('#menu-btn').innerHTML=icon('menu');$('#menu-btn').addEventListener('click',openSettings);$('#sound-btn').innerHTML=icon('mute');$('#sound-btn').addEventListener('click',toggleSound);
$('#calendar-btn').addEventListener('click',openCalendar);$('#analytics-btn').addEventListener('click',openAnalytics);$('#health-btn').addEventListener('click',openAnalytics);$('#timeline-btn').addEventListener('click',()=>openTimeline());
$('#break-btn').addEventListener('click',()=>action(()=>{recoverFocus(state);save();toast('30 minutes away. Focus and energy recovered.');}));
$('#clock-icon').innerHTML=icon('clock');$('#calendar-icon').innerHTML=icon('calendar');$('#focus-icon').innerHTML=icon('focus');$('#insight-icon').innerHTML=icon('lightbulb');$('#reset-camera').innerHTML=icon('refresh');$('#overview-btn').innerHTML=icon('home')+'<span>Office overview</span>';
$('#overview-btn').addEventListener('click',()=>office?.overview());$('#reset-camera').addEventListener('click',()=>office?.overview());$('#zoom-in').addEventListener('click',()=>office?.zoom(.15));$('#zoom-out').addEventListener('click',()=>office?.zoom(-.15));
$('#room-tabs').innerHTML=[['meeting','Meeting room','team'],['analytics','Analytics','chart'],['war','War room','quality']].map(([id,label,ico])=>`<button class="room-tab" data-room="${id}">${icon(ico)}${label}</button>`).join('');
$$('[data-room]').forEach(b=>b.addEventListener('click',()=>{office?.focus(b.dataset.room);openNearbyRoom(b.dataset.room);}));
$('#office-world').append($('#office-presence'),$('#proximity-hud'));
$('#context-btn').addEventListener('click',()=>office?.life.interact());
$('#desk-btn').addEventListener('click',()=>openDesk());$('#coffee-btn').addEventListener('click',()=>openCoffee());$('#walk-menu-btn').addEventListener('click',showWalkMenu);
$('#follow-btn').addEventListener('click',()=>{if(!office)return;office.life.follow=!office.life.follow;$('#follow-btn').setAttribute('aria-pressed',String(office.life.follow));$('#follow-btn').textContent=`Follow PM ${office.life.follow?'✓':'off'}`;});
render();
let loadPercent=0;const loadInterval=setInterval(()=>{loadPercent=Math.min(90,loadPercent+16);$('#loading-percent').textContent=`${loadPercent}%`;$('#loading-bar').style.width=`${loadPercent}%`;},90);
try{office=new Office($('#office-canvas'),id=>openNearbyRoom(id),id=>openCheckin(id),{
  context:context=>{$('#context-btn').hidden=!context;$('#context-label').textContent=context?.label||'';$('#movement-hint').hidden=!!context;},
  interact:context=>{if(context.type==='meeting')openCompetingMeeting(+context.id);else if(context.type==='person')openCheckin(context.id);else if(context.type==='coffee')openCoffee();else openNearbyRoom(context.id);},
  position:position=>{state.pmPosition=position;try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{saveAvailable=false;}},
  status:message=>toast(message),story:message=>{$('#office-story').textContent=message;}
});office.setState(state);}catch(e){
  $('#scene-fallback').hidden=false;$('#scene-fallback').innerHTML=`<p>Your device is using the accessible office view.<br>The full simulation is ready to play.</p>${Object.entries(roomInfo).map(([id,r])=>`<button data-fallback-room="${id}">${r.name} ↗</button>`).join('')}`;
  $$('[data-fallback-room]').forEach(b=>b.addEventListener('click',()=>openNearbyRoom(b.dataset.fallbackRoom)));$('#office-canvas').hidden=true;$('#room-labels').hidden=true;$('#proximity-hud').hidden=true;
}
setTimeout(()=>{clearInterval(loadInterval);$('#loading-percent').textContent='100%';$('#loading-bar').style.width='100%';setTimeout(()=>{$('#loading').classList.add('hide');setTimeout(()=>$('#loading').remove(),550);},230);},800);
