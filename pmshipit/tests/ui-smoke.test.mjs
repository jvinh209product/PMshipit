import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scenarios} from '../dist/data.mjs';

test('application boot and major panels work in a DOM harness with the accessible WebGL fallback',async()=>{
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),elements=new Map(),docEvents=new Map(),storage=new Map();
  class Element {
    constructor(id=''){this.id=id;this.innerHTML='';this.textContent='';this.style={};this.dataset={};this.hidden=false;this.disabled=false;this.events=new Map();this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c),toggle:(c,v)=>v?this.classes.add(c):this.classes.delete(c)};}
    addEventListener(name,fn){this.events.set(name,fn);}
    setAttribute(name,value){this[name]=value;}
    getAttribute(name){return this[name]??null;}
    removeAttribute(name){delete this[name];}
    append(){}remove(){}focus(){document.activeElement=this;}getClientRects(){return [{}];}getContext(){return null;}
    closest(selector){return selector==='[data-action]'&&this.dataset.action?this:null;}
    click(){this.events.get('click')?.({target:this});}
  }
  for(const match of html.matchAll(/\bid="([^"]+)"/g))elements.set(match[1],new Element(match[1]));
  const modal=()=>elements.get('modal-root');
  const query=selector=>selector.startsWith('#')?elements.get(selector.slice(1))??null:selector.startsWith('.modal')&&modal().innerHTML?new Element():null;
  const queryAll=selector=>{
    const attribute=selector.match(/^\[data-([\w-]+)\]$/)?.[1];if(!attribute)return [];
    const source=[...elements.values()].map(e=>e.innerHTML).join(''),items=[];
    for(const match of source.matchAll(new RegExp(`data-${attribute}="([^"]+)"`,'g'))){const e=new Element();e.dataset[attribute.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=match[1];items.push(e);}return items;
  };
  const original={};for(const name of ['document','window','localStorage','matchMedia','requestAnimationFrame','setTimeout','clearTimeout','setInterval','clearInterval','devicePixelRatio'])original[name]=globalThis[name];
  globalThis.document={querySelector:query,querySelectorAll:queryAll,createElement:()=>new Element(),createElementNS:()=>new Element(),addEventListener:(name,fn)=>docEvents.set(name,fn),activeElement:new Element()};
  globalThis.window={};globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};globalThis.matchMedia=()=>({matches:true});globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=fn=>fn();
  let nextTimer=0;globalThis.setTimeout=()=>++nextTimer;globalThis.setInterval=()=>++nextTimer;globalThis.clearTimeout=()=>{};globalThis.clearInterval=()=>{};
  const action=(name,data={})=>{const target=new Element();target.dataset={action:name,...data};docEvents.get('click')({target});};
  const saved=()=>JSON.parse(storage.get('ship-it-orbit-v1'));
  const previousError=console.error;console.error=()=>{};
  try {
    await import('../dist/app.mjs');
    assert.equal(elements.get('day-title').textContent,'Your first day.');assert.ok(elements.get('journey').innerHTML.includes('Discover'));assert.equal(elements.get('scene-fallback').hidden,false);assert.ok(elements.get('scene-fallback').innerHTML.includes('full simulation'));
    elements.get('primary-btn').click();assert.ok(modal().innerHTML.includes('data-action="start"'));action('start');assert.ok(modal().innerHTML.includes(scenarios[0].title));
    action('choose',{id:scenarios[0].id,index:'0'});assert.ok(saved().completed.includes(scenarios[0].id));
    elements.get('calendar-btn').click();assert.ok(modal().innerHTML.includes('Engineering risk sync'));
    elements.get('analytics-btn').click();assert.ok(modal().innerHTML.includes('CRASH-FREE SESSIONS'));
    action('team');assert.ok(modal().innerHTML.includes('Eight minds. One product.'));
    action('social');assert.ok(modal().innerHTML.includes('Join the team'));
    elements.get('coffee-btn').click();assert.ok(modal().innerHTML.includes('Make a coffee'));action('coffee');assert.ok(saved().officeActivities.some(k=>k.includes('coffee')));
    action('person',{id:'Support'});assert.ok(modal().innerHTML.includes('without a calendar invite'));action('chat',{id:'Support',topic:'work'});assert.ok(saved().flags.supportSignal);
    elements.get('desk-btn').click();assert.ok(modal().innerHTML.includes('data-action="desk-work"'));action('desk-work',{id:'notes'});assert.ok(elements.get('work-root').innerHTML.includes('Skip animation'));action('skip-work');assert.equal(elements.get('work-root').innerHTML,'');
    elements.get('walk-menu-btn').click();assert.ok(modal().innerHTML.includes('Engineering'));
    elements.get('timeline-btn').click();assert.ok(modal().innerHTML.includes('A trail of trade-offs.'));assert.ok(saved().history.length>=4);
  } finally {console.error=previousError;for(const [name,value] of Object.entries(original))if(value===undefined)delete globalThis[name];else globalThis[name]=value;}
});
