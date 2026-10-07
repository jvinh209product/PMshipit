import test from 'node:test';
import assert from 'node:assert/strict';
import {scenarios,features} from '../dist/data.mjs';
import {createState,todayScenarios,remaining,reservedHours,canDecide,decide,commitBoard,joinSocial,attendCompeting,focusWork,endDay,liveMetrics,productStyle,restoreState} from '../dist/engine.mjs';

test('all authored chapters have enough meaningful scenarios and unique identities',()=>{
  assert.equal(scenarios.length,37);assert.equal(new Set(scenarios.map(s=>s.id)).size,37);
  const ranges=[[1,5,5],[6,10,5],[11,20,10],[21,27,7],[28,30,10]];
  for(const [start,end,min]of ranges)assert.ok(scenarios.filter(s=>s.day>=start&&s.day<=end).length>=min);
  assert.equal(features.reduce((n,f)=>n+f.points,0),93);
});
test('100 different 30-day journeys finish without a blocked chapter or resource escape',()=>{
  for(let seed=0;seed<100;seed++){
    const state=createState(seed);state.started=true;let n=seed*163+3;
    const rand=()=>{n=(n*16807)%2147483647;return n/2147483647;};
    while(!state.finished){
      if(rand()>.35){try{joinSocial(state,seed%5,rand()>.5);}catch{}}
      if(rand()>.5){try{attendCompeting(state,seed%3);}catch{}}
      while(todayScenarios(state).length){const scene=todayScenarios(state)[0];
        if(scene.type==='board'){
          state.backlog=Object.fromEntries(features.map(f=>[f.id,rand()>.55?'mvp':'later']));if(!Object.values(state.backlog).includes('mvp'))state.backlog.collab='mvp';commitBoard(state);
        }else{const available=scene.options.map((o,i)=>canDecide(state,scene,o)?i:null).filter(i=>i!==null);assert.ok(available.length>0,`Day ${state.day}, ${scene.id}: no available action`);decide(state,scene.id,available[Math.floor(rand()*available.length)]);}
      }
      for(const v of Object.values(state.dimensions))assert.ok(v>=0&&v<=100);
      assert.ok(state.spent<=8);endDay(state);
    }
    assert.equal(state.day,30);assert.equal(state.completed.length,37);assert.ok(state.flags.launched);assert.ok(productStyle(state).name.startsWith('The '));
  }
});
test('optional work protects time for every remaining required decision',()=>{
  const s=createState();s.day=30;
  while(remaining(s)>=reservedHours(s)+1)focusWork(s);
  assert.throws(()=>focusWork(s),/required work/);
  while(todayScenarios(s).length){const scene=todayScenarios(s)[0];const i=scene.options.findIndex(o=>canDecide(s,scene,o));assert.notEqual(i,-1);decide(s,scene.id,i);}
  assert.doesNotThrow(()=>endDay(s));assert.ok(s.finished);
});
test('cannot advance without required work or an empty scope, and cannot decide twice',()=>{
  const s=createState();assert.throws(()=>endDay(s),/required work/);decide(s,'ai',1);assert.throws(()=>decide(s,'ai',1),/unavailable/);
  const b=createState();b.day=6;b.backlog=Object.fromEntries(features.map(f=>[f.id,'later']));assert.throws(()=>commitBoard(b),/at least one/);
});
test('overcommitting creates a delayed delivery cost attached to the original decision',()=>{
  const s=createState();s.day=6;s.backlog=Object.fromEntries(features.map(f=>[f.id,'mvp']));commitBoard(s);
  assert.equal(s.flags.scopePoints,93);assert.ok(s.delayed.some(d=>d.source==='scope'));
  s.day=15;s.completed.push('referrals');endDay(s);
  assert.equal(s.day,16);assert.ok(s.history.find(h=>h.id==='scope').delayed.length>0);assert.ok(s.notifications.some(n=>n.source==='scope'));
});
test('launch exposure and product reliability reflect the player’s choices',()=>{
  const risky=createState();risky.flags.launched=true;risky.flags.rollout='full';
  const careful=createState();Object.assign(careful.flags,{launched:true,rollout:'limited',paymentFixed:true,incidentResolved:true,onboarding:true,supportReady:true,retentionWork:true});
  assert.ok(liveMetrics(careful).users<liveMetrics(risky).users);assert.ok(liveMetrics(careful).payment>liveMetrics(risky).payment);assert.ok(liveMetrics(careful).support>liveMetrics(risky).support);assert.ok(liveMetrics(careful).retention>liveMetrics(risky).retention);
});
test('saved progress restores its complete decision state and malformed saves recover safely',()=>{
  const s=createState();decide(s,'ai',0);assert.deepEqual(restoreState(JSON.stringify(s)),s);assert.equal(restoreState('bad json'),null);assert.equal(restoreState('{"version":1,"day":400}'),null);
});
