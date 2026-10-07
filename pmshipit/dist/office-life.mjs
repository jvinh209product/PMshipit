import * as THREE from './vendor/three.module.js';
import {people,roomInfo} from './data.mjs';
import {stations,distance,walkable,nearestWalkable,findPath,advanceRoute} from './navigation.mjs';

const routines={
  CEO:[['ceo','Type'],['sales','Talk'],['meeting','Meeting'],['coffee','Coffee'],['ceo','Type']],
  Engineering:[['engineering','Type'],['engineering','Talk'],['coffee','Coffee'],['meeting','Meeting'],['engineering','Type']],
  Design:[['design','Type'],['research','Talk'],['coffee','Coffee'],['meeting','Meeting'],['design','Type']],
  Research:[['research','Talk'],['design','Talk'],['analytics','Concerned'],['coffee','Coffee'],['research','Type']],
  Sales:[['sales','Type'],['ceo','Talk'],['coffee','Coffee'],['meeting','Meeting'],['sales','Type']],
  Marketing:[['sales','Type'],['design','Talk'],['analytics','Talk'],['coffee','Coffee'],['sales','Type']],
  QA:[['war','Type'],['engineering','Talk'],['coffee','Coffee'],['war','Concerned'],['war','Type']],
  Support:[['coffee','Coffee'],['design','Talk'],['analytics','Concerned'],['meeting','Talk'],['coffee','Coffee']]
};
export const officeMood=s=>s.flags.launched&&!s.flags.incidentResolved?'incident':s.flags.launched?'live':s.day>=21?'release':s.dimensions.team<40?'strained':'normal';
export class OfficeLife {
  constructor(office,callbacks={}) {
    this.office=office;this.callbacks=callbacks;this.keys=new Set();this.context=null;this.destination=null;this.pendingPerson=null;this.day=null;this.mood='normal';this.state=null;this.lastContext='';this.follow=true;this.speedMultiplier=1;this.storyIndex=0;
    this.actors=office.characters.map((c,i)=>{
      const p={x:c.group.position.x+c.parent.position.x,z:c.group.position.z+c.parent.position.z};office.world.attach(c.group);
      return {...c,position:{...p},home:{...p},route:[],mode:i===7?'Coffee':'Type',elapsed:0,dwell:4+i*1.1,routine:i%2,arrivalMode:'Type',arrivalRoom:null,room:Object.keys(stations).find(id=>distance(stations[id],p)<3)||'product',secondary:i===2,lastDestination:null};
    });
    const pg=office.person(office.world,stations.product.x,stations.product.z,'#dc713d','PM',0),pc=office.characters.at(-1);office.characters.pop();
    this.player={...pc,position:{...stations.product},route:[],mode:'Idle',elapsed:0};this.player.group.scale.setScalar(1.08);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.027,6,32),office.mat('#e17e43',{emissive:'#d86632',emissiveIntensity:.4}));ring.rotation.x=Math.PI/2;ring.position.y=.055;pg.add(ring);
    this.playerTag=document.createElement('span');this.playerTag.className='player-tag';this.playerTag.textContent='YOU · PM';document.querySelector('#room-labels').append(this.playerTag);
    this.destinationMarker=new THREE.Mesh(new THREE.RingGeometry(.19,.28,24),new THREE.MeshBasicMaterial({color:'#e47a42',side:THREE.DoubleSide,transparent:true,opacity:.85}));this.destinationMarker.rotation.x=-Math.PI/2;this.destinationMarker.position.y=.3;this.destinationMarker.visible=false;office.world.add(this.destinationMarker);
    office.canvas.tabIndex=0;office.canvas.setAttribute('aria-label','3D office. Move your PM with WASD or arrow keys, click or tap a floor destination, and press E for nearby actions. Drag to rotate.');
    document.addEventListener('keydown',e=>this.onKey(e,true));document.addEventListener('keyup',e=>this.onKey(e,false));window.addEventListener('blur',()=>this.keys.clear());
  }
  onKey(e,down) {
    const key=e.key.toLowerCase();if(!down){this.keys.delete(key);return;}
    if(document.querySelector('.modal-backdrop')||e.target.closest('input,textarea,select,button,a,summary'))return;
    if(key==='e'){if(this.context){e.preventDefault();this.interact();}return;}
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();this.keys.add(key);this.player.route=[];this.pendingPerson=null;this.destination=null;this.destinationMarker.visible=false;}
  }
  setState(state) {
    this.state=state;const mood=officeMood(state),changed=this.day!==state.day||this.mood!==mood;
    if(this.day!==state.day){this.day=state.day;this.storyIndex=0;this.pendingPerson=null;this.destination=null;this.player.route=[];const p=nearestWalkable(state.pmPosition||stations.product,this.office.navObstacles);if(p){this.player.position=p;this.player.group.position.set(p.x,.23,p.z);}for(const a of this.actors){a.elapsed=0;a.dwell=2+((a.seed+state.day)%8);a.lastDestination=null;}}
    this.mood=mood;if(changed){for(const a of this.actors){if(a.secondary)continue;if(mood==='incident'||mood==='release')this.sendActor(a,'war',mood==='incident'?'Concerned':'Meeting');else if(mood==='live')this.sendActor(a,'meeting','Celebrate');}}
    const spent=state.spent;
    if(spent>=.9&&spent<2&&['normal','strained'].includes(mood)){for(const a of this.actors){if(a.secondary)continue;if(['Design','Research'].includes(a.role))this.sendActor(a,'design','Meeting');else if(['Engineering','QA'].includes(a.role))this.sendActor(a,'engineering','Meeting');else if(['Sales','CEO'].includes(a.role))this.sendActor(a,'coffee','Talk');}}
    if(spent>=7.5&&mood==='normal'){for(const a of this.actors)if(['Engineering','Marketing','Sales','Support'].includes(a.role))this.sendActor(a,'coffee','Talk');}
    if(this.office.incident)this.reportStory('Incident in progress · Engineering and QA are heading to the war room.');
    if(this.previousBugs!==undefined&&state.flags.bugs<this.previousBugs){const dan=this.actors.find(a=>a.role==='Engineering');if(dan&&mood==='normal')this.sendActor(dan,'engineering','Celebrate');this.reportStory('Dan celebrates a fixed bug. One fewer thing between the team and launch.');}
    this.previousBugs=state.flags.bugs;
  }
  actorPoint(actor,room) {
    const station=stations[room];const i=this.actors.indexOf(actor);
    const offsets=[[-.48,.5],[.5,.45],[0,-.55],[.7,-.35],[-.7,-.4],[.9,.75],[-.8,.85],[.25,1.1]];
    const [x,z]=offsets[i%offsets.length];return nearestWalkable({x:station.x+x,z:station.z+z},this.office.navObstacles,.18)||station;
  }
  sendActor(actor,room,mode) {
    const key=`${room}-${mode}`;if(actor.lastDestination===key&&(actor.route.length||actor.mode===mode))return;
    const homeRoom={CEO:'ceo',Engineering:'engineering',Design:'design',Research:'research',Sales:'sales',Marketing:'sales',QA:'war',Support:'coffee'}[actor.role];
    const goingHome=mode==='Type'&&room===homeRoom;
    const point=goingHome?nearestWalkable(actor.home,this.office.navObstacles,.18):this.actorPoint(actor,room),origin=nearestWalkable(actor.position,this.office.navObstacles,.18);if(!origin||!point)return;
    const route=findPath(origin,point,this.office.navObstacles,.18);if(!route.length){actor.elapsed=0;actor.dwell=8;return;}
    if(distance(actor.position,origin)>.04)route.unshift(origin);if(goingHome&&distance(point,actor.home)>.04)route.push({...actor.home});
    actor.route=route;actor.arrivalMode=mode;actor.arrivalRoom=room;actor.mode='Stand';actor.elapsed=0;actor.lastDestination=key;
  }
  walkTo(destination) {
    const goal=nearestWalkable(destination,this.office.navObstacles);if(!goal)return this.callbacks.status?.('Choose an open part of the office floor.');
    const route=findPath(this.player.position,goal,this.office.navObstacles);if(!route.length)return this.callbacks.status?.('That spot is behind a desk. Try the open aisle.');
    this.player.route=route;this.player.mode='Walk';this.keys.clear();this.destinationMarker.position.set(goal.x,.3,goal.z);this.destinationMarker.visible=true;this.office.canvas.focus({preventScroll:true});
  }
  walkToRoom(id,openOnArrival=false,meetingIndex=null) {
    if(!stations[id])return;this.destination={room:id,openOnArrival,meetingIndex};this.pendingPerson=null;this.walkTo(stations[id]);this.office.focus(id);this.callbacks.status?.(`Walking to ${roomInfo[id].name}. Travel uses no workday time.`);
  }
  walkToPerson(role) {
    if(role==='PM')return;const actor=this.actors.find(a=>a.role===role);if(!actor)return;
    this.pendingPerson=role;this.destination=null;this.walkTo({x:actor.position.x-.65,z:actor.position.z+.55});this.callbacks.status?.(`Walk over to ${people[role].name}, then press E to check in.`);
  }
  quickPosition(id,mode='Idle') {
    const point=nearestWalkable(stations[id],this.office.navObstacles);if(!point)return;
    this.player.position={...point};this.player.group.position.set(point.x,.23,point.z);this.player.route=[];this.player.mode=mode;this.destinationMarker.visible=false;this.keys.clear();this.persistPosition();
  }
  perform(mode,room,seconds=3) {
    if(room)this.quickPosition(room,mode);this.player.mode=mode;this.performUntil=(this.time||0)+seconds;this.speedMultiplier=2.4;
  }
  skipAnimation(){this.performUntil=0;this.player.mode='Idle';this.speedMultiplier=1;}
  startMeeting(){for(const actor of this.actors)if(['CEO','Engineering','Design','Sales'].includes(actor.role))this.sendActor(actor,'meeting','Meeting');}
  interact(){if(this.context)this.callbacks.interact?.(this.context);}
  persistPosition(){this.callbacks.position?.({...this.player.position});}
  nearestContext() {
    const p=this.player.position;
    if(this.destination&&distance(p,stations[this.destination.room])<1.15)return this.destination.meetingIndex!==null?{type:'meeting',id:this.destination.meetingIndex,label:'Join this meeting'}:{type:'room',id:this.destination.room,label:this.roomAction(this.destination.room)};
    if(this.pendingPerson){const actor=this.actors.find(a=>a.role===this.pendingPerson);if(actor&&distance(p,actor.position)<1.75)return {type:'person',id:actor.role,label:`Talk to ${people[actor.role].name}`};}
    const coffee=stations.coffee;if(distance(p,coffee)<1.35)return {type:'coffee',id:'coffee',label:'Make coffee'};
    const nearby=this.actors.filter(a=>distance(p,a.position)<1.35).sort((a,b)=>distance(p,a.position)-distance(p,b.position))[0];if(nearby)return {type:'person',id:nearby.role,label:`Talk to ${people[nearby.role].name}`};
    const room=Object.entries(stations).find(([id,point])=>distance(p,point)<1.35);return room?{type:'room',id:room[0],label:this.roomAction(room[0])}:null;
  }
  roomAction(id) {return id==='product'?'Work at your desk':id==='analytics'?'View metrics':id==='meeting'?'Join meeting':id==='war'?'Enter war room':id==='coffee'?'Make coffee':`Check in · ${roomInfo[id].name}`;}
  reportStory(text){if(text===this.lastStory)return;this.lastStory=text;this.callbacks.story?.(text);}
  pose(actor,t,moving) {
    const p=actor.parts,mode=moving?'Walk':actor.mode,phase=t*8+actor.seed;
    const seated=['Sit','Type','Meeting'].includes(mode);
    p.legs.forEach((leg,i)=>{leg.rotation.x=seated?-1.25:mode==='Walk'?Math.sin(phase+i*Math.PI)*.48:0;p.knees[i].rotation.x=seated?1.25:0;});
    p.arms.forEach((arm,i)=>{arm.rotation.x=mode==='Walk'?-Math.sin(phase+i*Math.PI)*.32:mode==='Type'?-1.45+Math.sin(t*12+i)*.045:mode==='Talk'||mode==='Meeting'?(i?-.6+Math.sin(t*3)*.18:-.12):mode==='Coffee'?(i?-1.1:0):mode==='Celebrate'?-2.2+Math.sin(t*4+i)*.2:mode==='Concerned'?(i?-.75:-.1):0;arm.rotation.z=(i?-.1:.1)+(mode==='Talk'?Math.sin(t*2+i)*.12:0);});
    p.cup.visible=mode==='Coffee';actor.group.position.y=.23+(moving&&!this.office.reduced?Math.abs(Math.sin(phase))*.025:0);
  }
  update(delta,t) {
    this.time=t;if(!this.state)return;const dt=Math.min(delta,.08),blocked=!!document.querySelector('.modal-backdrop');
    if(this.pendingPerson&&!blocked&&t-(this.repathAt||0)>1.2){const actor=this.actors.find(a=>a.role===this.pendingPerson);if(actor&&distance(this.player.position,actor.position)>1.8){this.repathAt=t;this.walkTo({x:actor.position.x-.65,z:actor.position.z+.55});}}
    let changed=false,moving=false;const before={...this.player.position};
    if(!blocked&&this.keys.size){let x=0,z=0;const angle=this.office.view.theta;
      if(this.keys.has('w')||this.keys.has('arrowup')){x-=Math.sin(angle);z-=Math.cos(angle);}if(this.keys.has('s')||this.keys.has('arrowdown')){x+=Math.sin(angle);z+=Math.cos(angle);}if(this.keys.has('d')||this.keys.has('arrowright')){x+=Math.cos(angle);z-=Math.sin(angle);}if(this.keys.has('a')||this.keys.has('arrowleft')){x-=Math.cos(angle);z+=Math.sin(angle);}
      const norm=Math.hypot(x,z)||1,step=6.4*dt/norm,next={x:this.player.position.x+x*step,z:this.player.position.z+z*step};
      if(walkable(next,this.office.navObstacles))this.player.position=next;else{const slideX={x:next.x,z:this.player.position.z},slideZ={x:this.player.position.x,z:next.z};if(walkable(slideX,this.office.navObstacles))this.player.position=slideX;else if(walkable(slideZ,this.office.navObstacles))this.player.position=slideZ;}
      moving=distance(before,this.player.position)>.001;
    }else if(!blocked&&this.player.route.length){const result=advanceRoute(this.player.position,this.player.route,6.8,dt);moving=result.moving;if(result.arrived){this.destinationMarker.visible=false;this.persistPosition();if(this.destination?.openOnArrival){const {room:id,meetingIndex}=this.destination;this.destination=null;this.callbacks.interact?.(meetingIndex!==null?{type:'meeting',id:meetingIndex,label:'Join this meeting'}:{type:'room',id,label:this.roomAction(id)});}}}
    if(moving){this.player.group.rotation.y=Math.atan2(this.player.position.x-before.x,this.player.position.z-before.z);this.player.mode='Walk';changed=true;}else if(this.player.mode==='Walk')this.player.mode='Idle';
    this.player.group.position.x=this.player.position.x;this.player.group.position.z=this.player.position.z;
    if(this.performUntil&&t>=this.performUntil){this.skipAnimation();this.callbacks.actionComplete?.();}
    this.pose(this.player,this.office.reduced?0:t,moving&&!this.office.reduced);
    for(const actor of this.actors){actor.elapsed+=dt*this.speedMultiplier;const was={...actor.position};
      if(this.pendingPerson===actor.role&&distance(this.player.position,actor.position)<1.8){actor.mode='Talk';actor.elapsed=0;actor.group.rotation.y=Math.atan2(this.player.position.x-actor.position.x,this.player.position.z-actor.position.z);}
      else if(actor.route.length){if(actor.elapsed>.3){const result=advanceRoute(actor.position,actor.route,this.mood==='incident'?5:3.2,dt*this.speedMultiplier);actor.mode=result.moving?'Walk':actor.arrivalMode;if(result.arrived){actor.mode=actor.arrivalMode;actor.room=actor.arrivalRoom;actor.elapsed=0;actor.dwell=6+(actor.seed%7);if(['Talk','Coffee'].includes(actor.mode))this.reportStory(`${people[actor.role].name} ${actor.mode==='Coffee'?'is taking a coffee break':'is catching up with the team'} · ${roomInfo[actor.room]?.name}.`);}}}
      else if(!this.office.reduced&&actor.elapsed>actor.dwell&&this.actors.filter(a=>a.route.length).length<6){if(this.mood==='incident'){actor.mode='Concerned';actor.dwell=8;actor.elapsed=0;}else if(this.mood==='release'&&actor.room==='war'){actor.mode='Meeting';actor.dwell=9;actor.elapsed=0;}else {const list=routines[actor.role],item=list[actor.routine%list.length];actor.routine++;this.sendActor(actor,item[0],item[1]);}}
      actor.group.position.x=actor.position.x;actor.group.position.z=actor.position.z;const walking=distance(was,actor.position)>.001;
      if(walking)actor.group.rotation.y=Math.atan2(actor.position.x-was.x,actor.position.z-was.z);else if(actor.room==='coffee')actor.group.rotation.y=Math.PI;else if(actor.mode==='Talk')actor.group.rotation.y=Math.sin(actor.seed)*.8;else actor.group.rotation.y=actor.baseRot;
      this.pose(actor,this.office.reduced?0:t,walking&&!this.office.reduced);
    }
    this.context=this.nearestContext();const key=this.context?`${this.context.type}-${this.context.id}`:'';
    if(key!==this.lastContext){this.lastContext=key;this.callbacks.context?.(this.context);}
    const v=new THREE.Vector3(this.player.position.x,2.35,this.player.position.z).project(this.office.camera);this.playerTag.style.left=`${(v.x+1)/2*this.office.width}px`;this.playerTag.style.top=`${(-v.y+1)/2*this.office.height}px`;
    if(this.follow&&!this.office.reduced&&changed&&(Math.abs(v.x)>.66||v.y<-.6||v.y>.5)){this.office.view.targetX+=(this.player.position.x*.55-this.office.view.targetX)*.04;this.office.view.targetZ+=(this.player.position.z*.55-this.office.view.targetZ)*.04;this.office.updateCamera();}
    if(changed&&t-(this.savedAt||0)>1){this.savedAt=t;this.persistPosition();}
  }
}
