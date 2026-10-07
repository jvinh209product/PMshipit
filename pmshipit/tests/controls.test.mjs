import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {Office} from '../dist/office.mjs';
import {OfficeLife} from '../dist/office-life.mjs';
import {createState} from '../dist/engine.mjs';
import {distance,walkable,clearSegment} from '../dist/navigation.mjs';

const noop=()=>{};
function setup(reduced=false) {
  let modal=false;const listeners={};
  const element=()=>({style:{},width:512,height:300,className:'',textContent:'',getContext:()=>new Proxy({},{get:()=>noop,set:()=>true}),append:noop,addEventListener:(name,fn)=>{listeners[name]=fn;},setAttribute:noop,setPointerCapture:noop,focus:noop,getBoundingClientRect:()=>({left:0,top:0,width:900,height:646})});
  globalThis.document={createElement:element,querySelector:s=>s==='.modal-backdrop'?(modal?{}:null):element(),addEventListener:noop};globalThis.window={addEventListener:noop};
  const o=Object.create(Office.prototype);Object.assign(o,{world:new THREE.Group(),materials:{},rooms:{},characters:[],pickables:[],navObstacles:[],reduced,canvas:element(),width:900,height:646,view:{theta:0,targetX:0,targetZ:0},camera:new THREE.OrthographicCamera(-20,20,15,-15,.1,120),focus:noop,updateCamera:noop});
  o.buildOffice();o.world.updateMatrixWorld(true);o.camera.position.set(25,30,25);o.camera.lookAt(0,0,0);o.camera.updateMatrixWorld();
  const actions=[];o.life=new OfficeLife(o,{interact:c=>actions.push(c)});o.life.setState(createState());o.bindEvents();
  return {o,life:o.life,actions,listeners,setModal:value=>{modal=value;}};
}
test('keyboard walking and E interaction work without consuming time, and dialogs protect keyboard input',()=>{
  const {life,o,actions,setModal}=setup(),target={closest:()=>null};
  let start;for(let x=-11;x<=11&&!start;x++)for(let z=-6;z<=8&&!start;z++)if(walkable({x,z},o.navObstacles)&&clearSegment({x,z},{x,z:z-2},o.navObstacles))start={x,z};assert.ok(start,'Office has an open aisle');life.player.position={...start};
  life.onKey({key:'w',target,preventDefault:noop},true);for(let i=1;i<=15;i++)life.update(1/60,i/60);
  assert.ok(Math.abs(distance(start,life.player.position)-1.6)<.01);life.onKey({key:'w',target},false);assert.equal(life.keys.size,0);assert.equal(life.state.spent,0);
  life.onKey({key:'ArrowRight',target,preventDefault:noop},true);assert.ok(life.keys.has('arrowright'));life.onKey({key:'ArrowRight',target},false);
  setModal(true);life.onKey({key:'w',target,preventDefault:noop},true);assert.equal(life.keys.size,0);setModal(false);
  life.onKey({key:'w',target:{closest:()=>({tagName:'INPUT'})},preventDefault:noop},true);assert.equal(life.keys.size,0);
  life.context={type:'room',id:'product',label:'Work at your desk'};life.onKey({key:'e',target,preventDefault:noop},true);assert.equal(actions[0].id,'product');
});
test('mouse click and touch tap share floor picking, while dragging rotates without selecting a destination',()=>{
  const {o,listeners}=setup();o.pickables=[];const picked=[];o.life.walkTo=point=>picked.push(point);
  for(const pointerType of ['mouse','touch']) {listeners.pointerdown({clientX:450,clientY:323,pointerId:1,pointerType});listeners.pointerup({clientX:450,clientY:323,pointerId:1,pointerType});}
  assert.equal(picked.length,2);for(const p of picked)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z));
  listeners.pointerdown({clientX:450,clientY:323,pointerId:1});listeners.pointermove({clientX:480,clientY:323,pointerId:1});listeners.pointerup({clientX:480,clientY:323,pointerId:1});assert.equal(picked.length,2);assert.notEqual(o.view.theta,0);
});
test('reduced motion preserves PM destination navigation and actionable context',()=>{
  const {life}=setup(true);life.walkToRoom('coffee');for(let i=1;i<=600;i++)life.update(1/60,i/60);
  assert.equal(life.context.id,'coffee');assert.equal(life.state.spent,0);assert.equal(life.player.route.length,0);
});
