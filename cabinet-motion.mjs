import layout from './cabinet-layout.json' with { type: 'json' };
export const ANIMATION_RANGES = { Idle:[1,32], Walk:[32,63], SitDown:[63,94], Seated:[94,96] };
export const ENTRANCE = layout.entrance;
export const WALK_SPEED = 1.65;
export const WALK_CYCLE_DISTANCE = .65;
export const TURN_DURATION = .32;
export const SEAT_DURATION = 1.15;

export const lobbyPosition = index => [layout.lobbyX, layout.lobbyStartZ + index * layout.lobbyPitch];

export function entranceRoute(person, index) {
  if (!person?.allow || !Array.isArray(person.seat)) throw new TypeError('입장 가능한 인물과 좌석이 필요합니다.');
  const home = lobbyPosition(index);
  const [x,z] = person.seat;
  const [aisleX,doorZ]=ENTRANCE;
  const route = [home, [layout.lobbyLaneX,home[1]], [layout.lobbyLaneX,doorZ], ENTRANCE];
  const aisleZ=z < -layout.mainAisleZ?layout.rearAisleZ:Math.sign(z)*layout.mainAisleZ;
  // Approach from beside the chair, keeping the rear of the chair out of the walking path.
  route.push([aisleX,aisleZ], [x+.95,aisleZ], [x+.95,z]);
  // Stop beside the armrest; the seating motion carries the character onto the chair.
  return route.filter((point,i) => !i || Math.hypot(point[0]-route[i-1][0],point[1]-route[i-1][1]) > .001);
}

export function exitRoute(index) {
  const home = lobbyPosition(index);
  return [home,[layout.exitX,home[1]],[layout.exitX,index === 1 ? -5.6 : 6.1]];
}

export function pathLength(points) {
  return points.slice(1).reduce((length,p,i)=>length+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
}

export function samplePath(points,distance) {
  if (!Array.isArray(points) || points.length < 2 || !Number.isFinite(distance)) throw new TypeError('경로와 유한한 거리가 필요합니다.');
  let remaining=Math.max(0,distance);
  for(let i=1;i<points.length;i++){
    const [x,z]=points[i-1], [tx,tz]=points[i];
    const length=Math.hypot(tx-x,tz-z);
    if(remaining<length){const t=remaining/length;return {x:x+(tx-x)*t,z:z+(tz-z)*t,angle:Math.atan2(tx-x,tz-z),done:false};}
    remaining-=length;
  }
  const last=points.at(-1),previous=points.at(-2);
  return {x:last[0],z:last[1],angle:Math.atan2(last[0]-previous[0],last[1]-previous[1]),done:true};
}

const clamp01=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp01(value);return t*t*(3-2*t);};
const turn=(from,to,t)=>from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*ease(t);

function roundCorners(points){
  const rounded=[points[0]];
  for(let i=1;i<points.length-1;i++){
    const a=points[i-1],b=points[i],c=points[i+1];
    const ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]);
    const radius=Math.min(.38,ab*.35,bc*.35);
    const start=b.map((v,j)=>v+(a[j]-v)*radius/ab),end=b.map((v,j)=>v+(c[j]-v)*radius/bc);
    rounded.push(start);
    for(let step=1;step<=8;step++){
      const t=step/8;
      rounded.push(b.map((v,j)=>(1-t)**2*start[j]+2*(1-t)*t*v+t*t*end[j]));
    }
  }
  rounded.push(points.at(-1));return rounded;
}

export function planEntrance(person,index){
  const path=roundCorners(person.allow?entranceRoute(person,index):exitRoute(index));
  const length=pathLength(path),ramp=Math.min(.45,length/WALK_SPEED);
  const travelDuration=length/WALK_SPEED+ramp;
  return {path,length,ramp,travelDuration,allow:person.allow,seat:person.seat,
    seatAngle:person.allow?(person.seat[1]>0?Math.PI:0):0,
    arrivalAngle:samplePath(path,length).angle,
    duration:travelDuration+(person.allow?TURN_DURATION+SEAT_DURATION:0)};
}

export function sampleEntrance(plan,elapsed){
  if(!Number.isFinite(elapsed))throw new TypeError('유한한 재생 시간이 필요합니다.');
  const t=Math.max(0,elapsed),end=plan.path.at(-1);
  if(t<plan.travelDuration){
    const remaining=plan.travelDuration-t;
    const distance=t<plan.ramp?WALK_SPEED*t*t/(2*plan.ramp)
      :remaining<plan.ramp?plan.length-WALK_SPEED*remaining*remaining/(2*plan.ramp)
      :WALK_SPEED*(t-plan.ramp/2);
    const point=samplePath(plan.path,distance),ahead=samplePath(plan.path,Math.min(plan.length,distance+.12));
    const heading=Math.atan2(ahead.x-point.x,ahead.z-point.z);
    return {...point,angle:turn(0,heading,t/.32),phase:'walking',distance,
      speed:WALK_SPEED*Math.min(1,t/plan.ramp,remaining/plan.ramp),
      gait:distance/WALK_CYCLE_DISTANCE%1,sitProgress:0,done:false};
  }
  const after=t-plan.travelDuration;
  if(!plan.allow)return {x:end[0],z:end[1],angle:plan.arrivalAngle,phase:'denied',sitProgress:0,done:true};
  if(after<TURN_DURATION)return {x:end[0],z:end[1],angle:turn(plan.arrivalAngle,-Math.PI/2,after/TURN_DURATION),phase:'turning',sitProgress:0,done:false};
  const u=clamp01((after-TURN_DURATION)/SEAT_DURATION),slide=ease((u-.58)/.30);
  return {x:end[0]+(plan.seat[0]-end[0])*slide,z:end[1]+(plan.seat[1]-end[1])*slide,
    angle:turn(-Math.PI/2,plan.seatAngle,(u-.48)/.4),phase:u<1?'sitting':'seated',sitProgress:u,done:u>=1};
}
