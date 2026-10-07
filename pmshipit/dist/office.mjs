import * as THREE from './vendor/three.module.js';
import {roomInfo,people} from './data.mjs';
import {liveMetrics} from './engine.mjs';
import {OfficeLife} from './office-life.mjs';

export class Office {
  constructor(canvas,onRoom,onPerson,callbacks={}) {
    this.canvas=canvas;this.onRoom=onRoom;this.onPerson=onPerson;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.scene=new THREE.Scene();this.world=new THREE.Group();this.scene.add(this.world);
    this.camera=new THREE.OrthographicCamera();this.camera.near=.1;this.camera.far=120;
    this.view={theta:.71,zoom:1,targetX:0,targetY:2.8,targetZ:0};this.clock=new THREE.Clock();this.characters=[];this.pickables=[];this.rooms={};this.labels={};this.animations=[];this.running=true;
    this.materials={};this.state=null;this.activeRoom='ceo';this.focused=null;this.navObstacles=[];
    this.initLights();this.buildOffice();this.life=new OfficeLife(this,callbacks);this.createLabels();this.resize();this.bindEvents();
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);
    document.addEventListener('visibilitychange',()=>{this.running=!document.hidden;if(this.running){this.clock.getDelta();this.frame();}});
    this.frame();
  }
  mat(color,opts={}){const key=color+JSON.stringify(opts);return this.materials[key]??(this.materials[key]=new THREE.MeshStandardMaterial({color,roughness:.82,metalness:0,...opts}));}
  box(parent,w,h,d,x,y,z,color,opts={}) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),this.mat(color,opts));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  cylinder(parent,top,bottom,h,x,y,z,color,segments=16,opts={}) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,h,segments),this.mat(color,opts));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  sphere(parent,r,x,y,z,color){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),this.mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;}
  edges(mesh,color='#73806b',opacity=.12){const edge=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity}));mesh.add(edge);}
  initLights() {
    this.scene.add(new THREE.HemisphereLight('#fff7e6','#929879',1.8));
    const sun=new THREE.DirectionalLight('#ffead2',2.7);sun.position.set(-12,28,15);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;sun.shadow.camera.near=1;sun.shadow.camera.far=70;sun.shadow.bias=-.001;sun.shadow.normalBias=.045;this.scene.add(sun);
    const fill=new THREE.DirectionalLight('#e1ebd7',1.4);fill.position.set(16,10,-12);this.scene.add(fill);
  }
  zone(id,x,z,w,d,color) {
    const g=new THREE.Group();g.position.set(x,0,z);g.userData.room=id;this.world.add(g);
    this.box(g,w,.025,d,0,.2,0,color);
    const hit=this.box(g,w,.1,d,0,.22,0,color,{transparent:true,opacity:0,depthWrite:false});hit.userData.room=id;this.pickables.push(hit);
    this.rooms[id]={group:g,x,z,w,d,anchor:new THREE.Vector3(x,.6,z+d*.38)};return g;
  }
  wall(parent,w,x,z,height=2.8,rotation=0) {
    const mesh=this.box(parent,w,height,.16,x,height/2+.22,z,'#e1e1d2');mesh.rotation.y=rotation;
    const top=this.box(parent,w,.08,.19,x,height+.25,z,'#eff0e5');top.rotation.y=rotation;
    const skirt=this.box(parent,w,.16,.19,x,.33,z,'#cbcbbc');skirt.rotation.y=rotation;this.edges(mesh);
    this.obstacle(parent,x,z,Math.abs(Math.cos(rotation))*w+Math.abs(Math.sin(rotation))*.18,Math.abs(Math.sin(rotation))*w+Math.abs(Math.cos(rotation))*.18);
  }
  obstacle(parent,x,z,w,d){this.navObstacles?.push({x:x+parent.position.x,z:z+parent.position.z,w,d});}
  plant(parent,x,z,scale=1) {
    const g=new THREE.Group();g.position.set(x,.22,z);g.scale.setScalar(scale);parent.add(g);
    this.obstacle(parent,x,z,.65*scale,.65*scale);
    this.cylinder(g,.34,.27,.5,0,.25,0,'#d0b695',10);this.cylinder(g,.29,.29,.055,0,.515,0,'#756b4a',10);
    this.cylinder(g,.025,.05,1,0,1,0,'#6b7b48',6);
    for(let i=0;i<7;i++){const a=i*2.4,r=.23+(i%2)*.08;const leaf=this.sphere(g,.32,Math.cos(a)*r,.9+i*.09,Math.sin(a)*r,i%2?'#778b5e':'#59734d');leaf.scale.set(.6,1.6,.9);leaf.rotation.z=Math.cos(a)*.55;leaf.rotation.x=Math.sin(a)*.5;}
  }
  desk(parent,x,z,rotation=0,accent='#ddcdb2') {
    const g=new THREE.Group();g.position.set(x,.23,z);g.rotation.y=rotation;parent.add(g);
    this.obstacle(parent,x,z,Math.abs(Math.cos(rotation))*2.45+Math.abs(Math.sin(rotation))*1.2,Math.abs(Math.sin(rotation))*2.45+Math.abs(Math.cos(rotation))*1.2);
    this.box(g,2.45,.13,1.2,0,1.13,0,'#e8dfc9');
    for(const dx of [-.98,.98])for(const dz of [-.42,.42])this.box(g,.09,1.1,.09,dx,.55,dz,'#879487');
    this.box(g,.92,.58,.065,0,1.54,-.3,'#38483d');this.box(g,.81,.46,.016,0,1.55,-.257,'#889d91',{emissive:'#4f7564',emissiveIntensity:.2});
    this.box(g,.065,.16,.07,0,1.29,-.3,'#596e5b');this.box(g,.38,.025,.25,0,1.21,-.28,'#6c7c67');
    this.box(g,.64,.035,.24,0,1.215,.22,'#bfc9b7');this.box(g,.2,.055,.25,.55,1.23,.25,'#a7b8a1');
    this.cylinder(g,.07,.065,.13,-.77,1.25,.2,accent,10);
    this.box(g,.24,.018,.34,.91,1.21,.1,'#f6f0da');return g;
  }
  chair(parent,x,z,rotation=0,color='#aaae8c') {
    const g=new THREE.Group();g.position.set(x,.23,z);g.rotation.y=rotation;parent.add(g);
    this.obstacle(parent,x,z,.6,.6);
    this.box(g,.64,.13,.64,0,.64,0,color);this.box(g,.64,.6,.1,0,1,-.29,color);this.cylinder(g,.05,.07,.52,0,.32,0,'#717f72',8);
    for(let i=0;i<4;i++){const leg=this.box(g,.66,.04,.045,0,.065,0,'#7f8b7b');leg.rotation.y=i*Math.PI/4;}return g;
  }
  person(parent,x,z,color,role,rot=0) {
    const g=new THREE.Group();g.position.set(x,.23,z);g.rotation.y=rot;parent.add(g);
    const body=this.cylinder(g,.2,.25,.64,0,.92,0,color,8),head=this.sphere(g,.22,0,1.44,0,'#d7b494');
    const hair=this.sphere(g,.224,0,1.52,-.035,role==='Design'?'#665143':'#4c5145');hair.scale.set(1,.65,1);
    const legs=[],arms=[],knees=[];
    for(const dx of [-.13,.13]){const leg=new THREE.Group();leg.position.set(dx,.66,0);g.add(leg);this.box(leg,.16,.29,.18,0,-.145,0,'#596553');const knee=new THREE.Group();knee.position.y=-.29;leg.add(knee);this.box(knee,.15,.28,.17,0,-.14,0,'#596553');this.box(knee,.19,.09,.29,0,-.27,.055,'#494e43');legs.push(leg);knees.push(knee);}
    for(const dx of [-.27,.27]){const arm=new THREE.Group();arm.position.set(dx,1.18,0);g.add(arm);this.cylinder(arm,.07,.075,.53,0,-.26,0,color,6);this.sphere(arm,.074,0,-.54,0,'#d7b494');arms.push(arm);}
    const cup=this.cylinder(g,.074,.063,.16,.31,.91,.27,'#ecdfc0',8);cup.visible=false;
    g.userData.person=role;g.traverse(m=>{if(m.isMesh){m.userData.person=role;this.pickables.push(m);}});
    this.characters.push({group:g,x,z,targetX:x,targetZ:z,role,seed:this.characters.length*1.71,parent,baseRot:rot,parts:{legs,knees,arms,head,body,cup}});return g;
  }
  roundTable(parent,x,z,r=1.05,color='#dec9a2'){this.obstacle(parent,x,z,r*2,r*2);this.cylinder(parent,r,r,.12,x,1.2,z,color,24);this.cylinder(parent,.14,.22,1,x,.68,z,'#869381',12);this.cylinder(parent,.65,.7,.065,x,.28,z,'#859280',16);}
  screen(parent,x,z,w=2.9,h=1.6,kind='analytics') {
    const texture=this.screenTexture(kind);const g=new THREE.Group();g.position.set(x,2,z);parent.add(g);
    this.box(g,w+.15,h+.15,.13,0,0,0,'#364638');
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}));screen.position.set(0,0,.08);g.add(screen);return g;
  }
  screenTexture(kind,metrics=null) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=300;const ctx=canvas.getContext('2d');
    ctx.fillStyle=kind==='war'?'#3c4d40':'#435343';ctx.fillRect(0,0,512,300);ctx.fillStyle='#b8c9a7';ctx.font='20px Arial';ctx.fillText(kind==='war'?'RELEASE CANDIDATE 1.0':kind==='design'?'DESIGN / MAKE IT CLEAR':'ORBIT / PRODUCT SIGNALS',28,40);
    ctx.fillStyle='#e2e7d5';ctx.font='bold 39px Arial';ctx.fillText(kind==='war'?`94%   /   ${metrics?.bugs??2} BUGS`:kind==='design'?'Less friction.':metrics?`${metrics.activation}%     ${metrics.retention}%     ${metrics.conversion}%`:'42%     31%     7.8%',28,100);
    if(kind==='design'){for(let i=0;i<3;i++){ctx.fillStyle=['#a1b195','#dbbb92','#b4b6a1'][i];ctx.fillRect(29+i*158,138,133,132);ctx.fillStyle='#eee9d6';ctx.fillRect(38+i*158,150,113,35);ctx.fillStyle='#607354';ctx.fillRect(49+i*158,232,90,22);}}
    else {for(let i=0;i<11;i++){ctx.fillStyle=i%3===0?'#d6b081':'#8ca879';const ht=30+i*7+Math.sin(i*.9)*24;ctx.fillRect(29+i*41,260-ht,24,ht);}ctx.strokeStyle='#677b5d';ctx.beginPath();ctx.moveTo(27,270);ctx.lineTo(485,270);ctx.stroke();}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  buildOffice() {
    const slab=this.box(this.world,25,.35,19,0,-.02,0,'#d2cfb9');this.edges(slab,'#858873',.15);
    this.box(this.world,24.9,.08,18.9,0,.19,0,'#e8e2ce');
    // The open front and short partitions preserve the miniature cutaway view.
    this.wall(this.world,25,0,-9.35,3.1);this.wall(this.world,19,-12.36,0,3.1,Math.PI/2);
    for(let i=0;i<7;i++){this.box(this.world,.045,.025,18.5,-10.5+i*3.5,.245,0,'#d7d1bc');this.box(this.world,24.5,.025,.045,0,.245,-7.9+i*2.65,'#d7d1bc');}
    const ceo=this.zone('ceo',-8.3,-5.85,7.1,5.5,'#ddd7c2');this.wall(ceo,7.1,0,-2.85,2.95);this.wall(ceo,5.5,3.62,0,1.35,Math.PI/2);
    this.desk(ceo,-.7,-.3,0);this.chair(ceo,-.7,.9,0,'#b7956c');this.person(ceo,-.75,.95,'#a37654','CEO',Math.PI);
    this.box(ceo,1.8,1.7,.55,-2.1,1.07,-2.45,'#b6b49d');for(let i=0;i<3;i++)this.box(ceo,1.7,.05,.6,-2.1,.52+i*.56,-2.44,'#d8d5bf');
    this.plant(ceo,2.3,-2.1,1.1);this.box(ceo,1.7,.8,.07,.35,2.2,-2.73,'#879471');this.box(ceo,1.4,.5,.03,.35,2.23,-2.67,'#c5c7a4');
    const eng=this.zone('engineering',-.25,-5.85,8.5,5.5,'#dedfd0');
    for(const x of [-2.1,1.5]){this.desk(eng,x,-1.4,0);this.chair(eng,x,-.25,0,'#94a497');this.desk(eng,x,1.5,Math.PI);this.chair(eng,x,.4,Math.PI,'#94a497');}
    this.person(eng,-2.1,-.1,'#7d9380','Engineering',Math.PI);this.person(eng,1.5,.15,'#8d918c','Engineering',0);
    this.screen(eng,-.3,-2.73,2.4,1.3);this.plant(eng,3.8,-2,1.1);
    const design=this.zone('design',8.3,-5.85,7.2,5.5,'#e0d9c9');this.wall(design,5.5,-3.69,0,1.2,Math.PI/2);
    this.desk(design,-1,-.9,0,'#ab9986');this.chair(design,-1,.3,0,'#b49b94');this.person(design,-1,.4,'#a391a5','Design',Math.PI);
    this.screen(design,.6,-2.76,3.1,1.65,'design');this.box(design,1.6,1.1,.7,2.7,.8,1.9,'#ccbb9c');
    for(let i=0;i<4;i++)this.box(design,.24,.2,.25,2.2+i*.29,1.48,1.9,['#b69c8b','#9aab8a','#b2baa5','#d9bd94'][i]);this.plant(design,2.7,-1.8,1.1);
    const meeting=this.zone('meeting',-8.3,.05,7.1,5.8,'#e1ddca');this.wall(meeting,4.7,3.6,-.58,1.1,Math.PI/2);
    this.box(meeting,3.65,.16,1.7,-.2,1.28,-.15,'#cfbc99');for(const x of [-1.1,.7])this.box(meeting,.15,1,.85,x,.71,-.15,'#9eaa8d');
    for(let i=0;i<3;i++){this.chair(meeting,-1.5+i*1.35,-1.5,0,'#9eaa8b');this.chair(meeting,-1.5+i*1.35,1.3,Math.PI,'#9eaa8b');}
    this.person(meeting,-1.5,-1.55,'#a79277','Sales',0);this.person(meeting,1.15,1.45,'#8c9b7e','Marketing',Math.PI);
    this.box(meeting,.8,.018,.45,.2,1.38,-.1,'#e8e4d1');this.cylinder(meeting,.09,.09,.18,-1.2,1.47,.2,'#dad6bf',10);this.plant(meeting,-2.7,2.1,1);
    const product=this.zone('product',-.25,.05,8.5,5.8,'#e9e3cc');
    this.cylinder(product,1.2,1.28,.13,0,.35,0,'#d7d6bc',40);this.cylinder(product,.68,.8,.5,0,.67,0,'#c6cbb6',32);this.cylinder(product,.55,.65,.12,0,.97,0,'#94a68b',32);
    this.obstacle(product,0,0,2.5,2.5);
    this.orb=new THREE.Group();this.orb.position.set(0,2.2,0);product.add(this.orb);
    this.orbCore=new THREE.Mesh(new THREE.IcosahedronGeometry(.61,0),this.mat('#a5bf88',{emissive:'#7d9f59',emissiveIntensity:.45,metalness:.1,roughness:.3}));this.orb.add(this.orbCore);this.edges(this.orbCore,'#ebf8d5',.65);
    this.orbShell=new THREE.Mesh(new THREE.IcosahedronGeometry(.89,0),new THREE.MeshStandardMaterial({color:'#aacb8c',transparent:true,opacity:.16,roughness:.2,depthWrite:false}));this.orb.add(this.orbShell);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1,.019,6,48),this.mat('#9baa7e',{emissive:'#a1b376',emissiveIntensity:.2}));ring.rotation.x=Math.PI/2;ring.rotation.z=.25;this.orb.add(ring);
    this.desk(product,-2.8,1.55,Math.PI/2);this.chair(product,-1.55,1.55,Math.PI/2,'#c4ae88');
    this.box(product,.3,.05,.45,2.55,.36,1.9,'#c2b08c');this.plant(product,2.9,2.25,.95);
    const research=this.zone('research',8.3,.05,7.2,5.8,'#dfdfc9');
    this.box(research,3.6,.4,1.2,.25,.54,-1.15,'#a3af94');this.box(research,3.6,.64,.32,.25,1.02,-1.7,'#a3af94');for(const x of [-1.67,2.17])this.box(research,.28,.65,1.23,x,.79,-1.16,'#a3af94');
    this.obstacle(research,.25,-1.15,3.9,1.3);
    this.roundTable(research,.2,.6,.76,'#d6c4a1');this.person(research,1.9,.65,'#a89d75','Research',-Math.PI/2);this.plant(research,-2.65,-1.7,1.2);
    this.wall(research,3.6,.4,-2.88,2.8);this.box(research,2.8,1.4,.04,.4,1.99,-2.76,'#c6b997');
    for(let i=0;i<9;i++){const color=['#dfc69b','#c6d1b1','#d9afa0'][i%3];this.box(research,.44,.36,.015,-.43+(i%3)*.72,1.65+Math.floor(i/3)*.4,-2.72,color);}
    const coffee=this.zone('coffee',-8.3,6.1,7.1,5.8,'#ddd9c3');
    this.box(coffee,4.7,1.3,.82,-.6,.88,-2,'#c9c2a7');this.box(coffee,4.8,.09,.87,-.6,1.59,-2,'#f0e8d2');
    this.obstacle(coffee,-.6,-2,4.8,.87);
    this.box(coffee,.64,.62,.48,-1.8,1.94,-2,'#4a574a');this.box(coffee,.45,.2,.2,-1.8,1.95,-1.73,'#adbaa2');this.cylinder(coffee,.09,.09,.2,-.8,1.73,-1.9,'#ba9c74',10);
    this.box(coffee,.7,.04,.55,.9,1.66,-2,'#929d89');this.roundTable(coffee,.7,.2,.85);this.chair(coffee,-.45,.2,Math.PI/2,'#c2b187');this.chair(coffee,1.75,.35,-Math.PI/2,'#c2b187');this.person(coffee,1.8,.35,'#ba9876','Support',-Math.PI/2);this.plant(coffee,-2.8,1.8,1.2);
    const analytics=this.zone('analytics',-.25,6.1,8.5,5.8,'#dde0cc');this.wall(analytics,5.7,-.7,-2.6,2.8);this.analyticsScreen=this.screen(analytics,-.7,-2.46,4.8,2.2);
    this.box(analytics,3.4,.42,1.18,-.5,.5,1.1,'#a1aa8d');this.box(analytics,3.4,.5,.3,-.5,.93,1.6,'#a1aa8d');this.plant(analytics,3,1.75,1.2);
    this.obstacle(analytics,-.5,1.25,3.4,1.5);
    this.roundTable(analytics,2,-.3,.6,'#c9bf9b');
    const war=this.zone('war',8.3,6.1,7.2,5.8,'#e0d8c3');this.wall(war,5.6,.7,-2.6,2.85);this.warScreen=this.screen(war,.7,-2.43,4.6,2.1,'war');
    this.box(war,3.8,.15,1.6,.45,1.25,.25,'#b6b49a');for(const x of [-.8,1.65])this.box(war,.1,1,.8,x,.68,.25,'#75856e');
    this.obstacle(war,.45,.25,3.8,1.6);this.obstacle(meeting,-.2,-.15,3.65,1.7);
    for(let i=0;i<3;i++){this.chair(war,-.9+i*1.35,1.65,Math.PI,'#7f9279');this.chair(war,-.9+i*1.35,-1.1,0,'#7f9279');}
    this.person(war,-.95,1.7,'#7f9c9d','QA',Math.PI);this.box(war,.58,.03,.4,.5,1.35,.28,'#e8e9d9');this.plant(war,2.8,2.05,.95);
    // A small commercial desk shares the open circulation area.
    this.rooms.sales={group:meeting,x:-11.1,z:-2.05,w:2,d:2,anchor:new THREE.Vector3(-11.1,.6,-2.05)};
    // Window details and tiny floor-level lighting keep the world architectural.
    for(let i=0;i<4;i++){const x=-4+i*3.7;this.box(this.world,2.7,1.75,.025,x,2.05,-9.24,'#b7c6b3',{transparent:true,opacity:.7});this.box(this.world,.04,1.78,.045,x,2.05,-9.2,'#a6b5a2');this.box(this.world,2.75,.07,.27,x,1.2,-9.11,'#e4e5d4');}
    this.plant(this.world,-11.25,-8.1,1.1);this.plant(this.world,11.1,-8,1.25);
    this.marker=new THREE.Group();this.marker.position.set(-8.3,3.5,-5.85);this.world.add(this.marker);
    const marker=this.cylinder(this.marker,.18,.18,.38,0,0,0,'#ec8554',8,{emissive:'#ed7645',emissiveIntensity:.18});marker.rotation.z=.13;
    this.sphere(this.marker,.075,0,-.35,0,'#ec8554');
  }
  createLabels() {
    const parent=document.querySelector('#room-labels');
    for(const [id,room] of Object.entries(this.rooms)) {
      if(id==='sales')continue;
      const b=document.createElement('button');b.className='room-label';b.textContent=roomInfo[id].name.toUpperCase();b.setAttribute('aria-label',`Walk to ${roomInfo[id].name}`);b.addEventListener('click',()=>this.life.walkToRoom(id));parent.append(b);this.labels[id]=b;
    }
  }
  resize() {
    const {width,height}=this.canvas.parentElement.getBoundingClientRect();if(!width||!height)return;
    this.width=width;this.height=height;this.renderer.setSize(width,height,false);const aspect=width/height;
    const span=Math.max(27.5,36/aspect);this.camera.left=-span*aspect/2;this.camera.right=span*aspect/2;this.camera.top=span/2;this.camera.bottom=-span/2;this.updateCamera();
  }
  updateCamera() {
    const v=this.view,dist=42,phi=.74;const x=Math.sin(v.theta)*Math.cos(phi)*dist,z=Math.cos(v.theta)*Math.cos(phi)*dist;
    this.camera.position.set(x+v.targetX,Math.sin(phi)*dist+v.targetY,z+v.targetZ);this.camera.lookAt(v.targetX,v.targetY,v.targetZ);this.camera.zoom=v.zoom;this.camera.updateProjectionMatrix();
  }
  bindEvents() {
    let down=null,drag=false;
    this.canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,theta:this.view.theta};drag=false;this.canvas.setPointerCapture(e.pointerId);});
    this.canvas.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x;if(Math.abs(dx)>4||Math.abs(e.clientY-down.y)>4)drag=true;this.view.theta=down.theta-dx*.007;this.updateCamera();});
    this.canvas.addEventListener('pointerup',e=>{if(down&&!drag)this.pick(e);down=null;});this.canvas.addEventListener('pointercancel',()=>{down=null;});
    this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(-e.deltaY*.0007);},{passive:false});
  }
  pick(event) {
    const rect=this.canvas.getBoundingClientRect(),pointer=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
    const ray=new THREE.Raycaster();ray.setFromCamera(pointer,this.camera);const hit=ray.intersectObjects(this.pickables,false)[0];
    if(hit?.object.userData.person){this.life.walkToPerson(hit.object.userData.person);return;}
    const destination=new THREE.Vector3(),intersection=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-.25),destination);
    if(intersection)this.life.walkTo({x:destination.x,z:destination.z});
  }
  animateView(target) {
    if(window.gsap&&!this.reduced){window.gsap.killTweensOf(this.view);window.gsap.to(this.view,{...target,duration:1.1,ease:'power2.inOut',onUpdate:()=>this.updateCamera()});}
    else {Object.assign(this.view,target);this.updateCamera();}
  }
  focus(id) {
    const room=this.rooms[id];if(!room)return;this.focused=id;
    for(const [key,label] of Object.entries(this.labels))label.classList.toggle('selected',key===id);
    this.animateView({targetX:room.x*.53,targetZ:room.z*.53,targetY:1.8,zoom:1.3});
  }
  overview(){this.focused=null;for(const label of Object.values(this.labels))label.classList.remove('selected');this.animateView({targetX:0,targetZ:0,targetY:2.8,zoom:1,theta:.71});}
  zoom(delta){this.view.zoom=Math.min(1.85,Math.max(.75,this.view.zoom+delta));this.updateCamera();}
  setState(state) {
    this.state=state;const active=state.finished?'product':state.day>=27&&!state.flags.incidentResolved&&state.flags.launched?'war':state.day===6?'product':state.day>=21?'war':null;
    this.activeRoom=active||({1:'ceo',2:'research',3:'sales',4:'research',5:'analytics',7:'ceo',8:'sales',9:'analytics',10:'design',11:'engineering',12:'design',13:'engineering',14:'engineering',15:'sales',16:'engineering',17:'war',18:'meeting',19:'coffee',20:'ceo',28:'analytics',29:'analytics',30:'product'}[state.day]||'product');
    const room=this.rooms[this.activeRoom];this.marker.position.set(room.x,3.5,room.z);
    for(const [id,label] of Object.entries(this.labels)){label.classList.toggle('active-event',id===this.activeRoom);label.querySelector('.room-notify')?.remove();if(id===this.activeRoom){const dot=document.createElement('span');dot.className='room-notify';dot.textContent='!';label.append(dot);}}
    const incident=state.flags.launched&&!state.flags.incidentResolved;
    const quality=(state.dimensions.quality+state.dimensions.customer)/2,color=incident?'#d77b56':quality>70?'#9ebc75':quality<45?'#c79368':'#aab68a';
    this.orbCore.material.color.set(color);this.orbCore.material.emissive.set(color);this.orbShell.material.color.set(color);this.orbShell.material.opacity=quality<45?.1:.19;
    if(incident)this.warScreen.children[1].material.color.set('#e7a780');else this.warScreen.children[1].material.color.set('#ffffff');
    this.incident=incident;this.debt=state.flags.debt||0;
    if(!incident)this.orbCore.scale.setScalar(1);
    this.orbCore.children[0].material.opacity=this.debt>10?.85:.4;
    const metrics={...liveMetrics(state),bugs:state.flags.bugs};
    for(const [surface,kind] of [[this.analyticsScreen,'analytics'],[this.warScreen,'war']]){const material=surface.children[1].material;material.map.dispose();material.map=this.screenTexture(kind,metrics);material.needsUpdate=true;}
    this.life?.setState(state);
  }
  frame=()=> {
    if(!this.running)return;const delta=this.clock.getDelta(),t=this.clock.elapsedTime;
    if(!this.reduced){this.orb.rotation.y=t*.27;this.orb.position.y=2.2+Math.sin(t*1.5)*.1;this.orbCore.rotation.z=Math.sin(t*.8)*.1;if(this.incident){const p=1+Math.sin(t*5)*.045;this.orbCore.scale.setScalar(p);}
      this.marker.position.y=3.5+Math.sin(t*2.3)*.12;
    }
    this.life?.update(delta,t);
    for(const [id,room] of Object.entries(this.rooms)){if(!this.labels[id])continue;const p=room.anchor.clone().project(this.camera);this.labels[id].style.left=`${(p.x+1)/2*this.width}px`;this.labels[id].style.top=`${(-p.y+1)/2*this.height}px`;this.labels[id].style.visibility=Math.abs(p.x)>1||Math.abs(p.y)>1?'hidden':'visible';}
    this.renderer.render(this.scene,this.camera);requestAnimationFrame(this.frame);
  }
}
