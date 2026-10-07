import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {Office} from '../dist/office.mjs';
import {OfficeLife,officeMood} from '../dist/office-life.mjs';
import {stations,findPath,clearSegment,distance,advanceRoute,nearestWalkable} from '../dist/navigation.mjs';
import {createState,makeCoffee,informalChat,doDeskWork,settleOfficeMeetings,remaining,reservedHours,restoreState,todayScenarios,decide,canDecide,commitBoard,endDay} from '../dist/engine.mjs';

const noop=()=>{};
function mockDocument() {
  const element=()=>({style:{},width:512,height:300,className:'',textContent:'',getContext:()=>new Proxy({}, {get:()=>noop,set:()=>true}),append:noop,addEventListener:noop,setAttribute:noop,focus:noop});
  globalThis.document={createElement:element,querySelector:s=>s==='.modal-backdrop'?null:element(),addEventListener:noop};
  globalThis.window={addEventListener:noop};return element;
}
function model() {
  mockDocument();const o=Object.create(Office.prototype);Object.assign(o,{world:new THREE.Group(),materials:{},rooms:{},characters:[],pickables:[],navObstacles:[],reduced:false});o.buildOffice();o.world.updateMatrixWorld(true);return o;
}
test('all 90 room-to-room paths avoid the actual office furniture and partitions',()=>{
  const o=model();assert.ok(o.navObstacles.length>40);
  for(const [from,start]of Object.entries(stations))for(const [to,end]of Object.entries(stations)){
    if(from===to)continue;const route=findPath(start,end,o.navObstacles);assert.ok(route.length,`${from} → ${to} unreachable`);let previous=nearestWalkable(start,o.navObstacles);
    for(const point of route){assert.ok(clearSegment(previous,point,o.navObstacles),`${from} → ${to} crosses furniture`);previous=point;}
    assert.ok(distance(previous,end)<.05);const length=route.reduce((n,p,i)=>n+distance(i?route[i-1]:start,p),0);assert.ok(length/6.8<8.5,`${from} → ${to} takes too long`);
  }
});
test('movement is smooth and independent of the frame rate',()=>{
  for(const fps of [30,60,120]){const p={x:0,z:0},r=[{x:12,z:0}];for(let i=0;i<fps;i++)advanceRoute(p,r,6,1/fps);assert.ok(Math.abs(p.x-6)<.01);assert.equal(r.length,1);}
});
test('PM walks, NPCs change position while idle, and an incident routes the team to the war room',()=>{
  const o=model(),el=mockDocument();Object.assign(o,{canvas:el(),width:900,height:646,view:{theta:.71,targetX:0,targetZ:0},camera:new THREE.OrthographicCamera(-20,20,15,-15,.1,120),focus:noop,updateCamera:noop});
  o.camera.position.set(25,30,25);o.camera.lookAt(0,0,0);o.camera.updateMatrixWorld();
  const interactions=[],life=new OfficeLife(o,{interact:context=>interactions.push(context)}),state=createState();life.setState(state);const initial=life.actors.map(a=>({...a.position}));life.walkToRoom('coffee');
  for(let i=1;i<=720;i++)life.update(1/60,i/60);
  assert.ok(distance(life.player.position,stations.coffee)<.05);assert.ok(life.actors.some((a,i)=>distance(a.position,initial[i])>1));assert.equal(state.spent,0);
  life.walkToRoom('design',true,0);for(let i=721;i<=1440;i++)life.update(1/60,i/60);assert.deepEqual(interactions.map(c=>[c.type,c.id]),[['meeting',0]]);
  state.spent=1;life.setState(state);assert.equal(life.actors.find(a=>a.role==='Research').arrivalRoom,'design');assert.equal(life.actors.find(a=>a.role==='QA').arrivalRoom,'engineering');assert.equal(life.actors.find(a=>a.role==='CEO').arrivalRoom,'coffee');
  state.flags.launched=true;life.setState(state);assert.equal(officeMood(state),'incident');assert.ok(life.actors.filter(a=>a.arrivalRoom==='war').length>=6);
  for(let i=1441;i<=2400;i++)life.update(1/60,i/60);assert.ok(life.actors.filter(a=>a.room==='war').length>=6);
});
test('coffee and chitchat have daily cooldowns and unlock informal evidence',()=>{
  const s=createState();s.focus=60;s.dimensions.energy=60;makeCoffee(s);assert.equal(s.focus,68);assert.equal(s.dimensions.energy,64);assert.ok(Math.abs(s.spent-5/60)<.00001);
  makeCoffee(s);assert.throws(()=>makeCoffee(s),/Two cups/);informalChat(s,'Support','work');assert.ok(s.flags.supportSignal);assert.equal(s.relationships.Support,54);assert.throws(()=>informalChat(s,'Support','team'),/already checked|checked in today/);
});
test('desk work preserves required time and cannot farm its daily reward',()=>{
  const s=createState();doDeskWork(s,'prd');assert.throws(()=>doDeskWork(s,'prd'),/finished/);s.spent=7.5;assert.throws(()=>doDeskWork(s,'notes'),/required work/);
});
test('meetings proceed without PM once, and existing saves retain their progress',()=>{
  const s=createState();s.spent=2.25;assert.ok(settleOfficeMeetings(s));assert.equal(settleOfficeMeetings(s),null);assert.ok(s.calendar[0].skipped);assert.equal(s.relationships.Design,44);
  const old=createState();old.day=12;delete old.officeActivities;delete old.pmPosition;const restored=restoreState(JSON.stringify(old));assert.equal(restored.day,12);assert.deepEqual(restored.officeActivities,[]);assert.ok(restored.pmPosition);
});
test('30 days remain completable with exploration, coffee, check-ins, and missed meetings',()=>{
  const s=createState();s.started=true;
  while(!s.finished){
    for(const fn of [()=>makeCoffee(s),()=>informalChat(s,'Support','work'),()=>doDeskWork(s,'notes')])try{fn();}catch{}
    while(todayScenarios(s).length){const scene=todayScenarios(s)[0];if(scene.type==='board')commitBoard(s);else{const i=scene.options.findIndex(o=>canDecide(s,scene,o));assert.ok(i>=0);decide(s,scene.id,i);}settleOfficeMeetings(s);}
    assert.ok(remaining(s)>=reservedHours(s));endDay(s);
  }
  assert.equal(s.completed.length,37);assert.ok(s.finished);
});
