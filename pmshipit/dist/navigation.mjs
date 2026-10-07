// A small navigation grid joins authored room waypoints around the furniture.
// Travel never spends the player's simulated workday.
export const officeBounds={minX:-11.9,maxX:11.9,minZ:-8.8,maxZ:8.9};
export const stations={
  product:{x:-1.05,z:1.65},ceo:{x:-6.3,z:-4.7},engineering:{x:-.5,z:-5.8},
  design:{x:8.8,z:-4.6},research:{x:8.4,z:2.05},meeting:{x:-6,z:2.3},
  coffee:{x:-10.1,z:5.25},analytics:{x:-.8,z:5.2},war:{x:6,z:6.5},sales:{x:-10.65,z:-2.1}
};
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function walkable(p,obstacles=[],radius=.22) {
  const b=officeBounds;if(p.x<b.minX+radius||p.x>b.maxX-radius||p.z<b.minZ+radius||p.z>b.maxZ-radius)return false;
  return !obstacles.some(o=>p.x>o.x-o.w/2-radius&&p.x<o.x+o.w/2+radius&&p.z>o.z-o.d/2-radius&&p.z<o.z+o.d/2+radius);
}
export function nearestWalkable(p,obstacles=[],radius=.22) {
  const b=officeBounds,point={x:Math.min(b.maxX-radius,Math.max(b.minX+radius,p.x)),z:Math.min(b.maxZ-radius,Math.max(b.minZ+radius,p.z))};
  if(walkable(point,obstacles,radius))return point;
  for(let r=.25;r<4;r+=.25)for(let i=0;i<20;i++){const candidate={x:point.x+Math.cos(i*Math.PI/10)*r,z:point.z+Math.sin(i*Math.PI/10)*r};if(walkable(candidate,obstacles,radius))return candidate;}
  return null;
}
export function clearSegment(a,b,obstacles,radius=.22) {const n=Math.ceil(distance(a,b)/.12);for(let i=0;i<=n;i++){const t=n?i/n:0;if(!walkable({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},obstacles,radius))return false;}return true;}
class Heap {
  constructor(){this.items=[];}
  push(item){const a=this.items;a.push(item);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p].f<=item.f)break;a[i]=a[p];i=p;}a[i]=item;}
  pop(){const a=this.items,first=a[0],last=a.pop();if(!a.length)return first;let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=last.f)break;a[i]=a[c];i=c;}a[i]=last;return first;}
}
export function findPath(start,destination,obstacles=[],radius=.22) {
  const origin=nearestWalkable(start,obstacles,radius),goal=nearestWalkable(destination,obstacles,radius);if(!origin||!goal)return [];
  if(clearSegment(origin,goal,obstacles,radius))return [goal];
  const step=.4,b=officeBounds,key=(x,z)=>`${x},${z}`,cell=p=>({x:Math.round((p.x-b.minX)/step),z:Math.round((p.z-b.minZ)/step)}),point=(x,z)=>({x:b.minX+x*step,z:b.minZ+z*step});
  const valid=new Map();function isValid(x,z){const k=key(x,z);if(!valid.has(k))valid.set(k,walkable(point(x,z),obstacles,radius));return valid.get(k);}
  function validCell(p){const c=cell(p);let best=null,dist=Infinity;for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){const x=c.x+i,z=c.z+j;if(!isValid(x,z)||!clearSegment(p,point(x,z),obstacles,radius))continue;const d=distance(p,point(x,z));if(d<dist){best={x,z};dist=d;}}return best;}
  const a=validCell(origin),g=validCell(goal);if(!a||!g)return [];
  const open=new Heap(),cost=new Map([[key(a.x,a.z),0]]),prev=new Map(),closed=new Set(),dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],heuristic=(x,z)=>Math.hypot(x-g.x,z-g.z);
  open.push({...a,f:heuristic(a.x,a.z)});let found=false;
  while(open.items.length){const cur=open.pop(),k=key(cur.x,cur.z);if(closed.has(k))continue;closed.add(k);if(cur.x===g.x&&cur.z===g.z){found=true;break;}
    for(const [dx,dz]of dirs){const x=cur.x+dx,z=cur.z+dz,nk=key(x,z);if(!isValid(x,z)||closed.has(nk)||!clearSegment(point(cur.x,cur.z),point(x,z),obstacles,radius))continue;const score=cost.get(k)+Math.hypot(dx,dz);if(score>=(cost.get(nk)??Infinity))continue;cost.set(nk,score);prev.set(nk,k);open.push({x,z,f:score+heuristic(x,z)});}
  }
  if(!found)return [];
  const route=[goal];let k=key(g.x,g.z);while(k){const [x,z]=k.split(',').map(Number);route.push(point(x,z));k=prev.get(k);}route.push(origin);route.reverse();
  const smooth=[];let anchor=0;while(anchor<route.length-1){let next=route.length-1;while(next>anchor+1&&!clearSegment(route[anchor],route[next],obstacles,radius))next--;smooth.push(route[next]);anchor=next;}return smooth;
}
export function advanceRoute(position,route,speed,delta) {
  let budget=Math.min(delta,.08)*speed;const before={...position};
  while(route.length&&budget>0){const next=route[0],d=distance(position,next);if(d<=budget){position.x=next.x;position.z=next.z;budget-=d;route.shift();}else{position.x+=(next.x-position.x)/d*budget;position.z+=(next.z-position.z)/d*budget;budget=0;}}
  return {moving:distance(before,position)>.001,arrived:!route.length};
}
