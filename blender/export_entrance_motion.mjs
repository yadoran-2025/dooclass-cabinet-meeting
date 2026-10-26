import { writeFile } from 'node:fs/promises';
import { people } from '../cabinet-model.mjs';
import { planEntrance, sampleEntrance, TURN_DURATION, SEAT_DURATION, WALK_CYCLE_DISTANCE } from '../cabinet-motion.mjs';

let cursor=31;
const characters=[];
for(const [index,person] of people.entries()){
  const plan=planEntrance(person,index),frames=[];
  const count=Math.ceil(plan.duration*30);
  for(let frame=0;frame<=count;frame++){
    const elapsed=Math.min(frame/30,plan.duration),point=sampleEntrance(plan,elapsed);
    if(![point.x,point.z,point.angle].every(Number.isFinite))throw new Error(`Invalid motion: ${person.id}`);
    let source=1,previous=1,weight=1;
    if(point.phase==='walking')source=32+point.gait*30;
    if(point.phase==='turning'){
      previous=32+(plan.length/WALK_CYCLE_DISTANCE%1)*30;
      weight=Math.min(1,(elapsed-plan.travelDuration)/.14);
    }
    if(point.phase==='sitting'){
      source=63+point.sitProgress*30;
      weight=Math.min(1,point.sitProgress*SEAT_DURATION/.14);
    }
    if(point.phase==='seated')source=94;
    if(weight===1)previous=source;
    frames.push([cursor+frame,point.x,point.z,point.angle,source,previous,weight]);
  }
  characters.push({id:person.id,start:cursor,turn:cursor+Math.ceil(plan.travelDuration*30),
    sit:cursor+Math.ceil((plan.travelDuration+TURN_DURATION)*30),
    [person.allow?'seated':'exit']:cursor+count,frames});
  cursor+=count+15;
}
await writeFile(new URL('./entrance-motion.json',import.meta.url),JSON.stringify({fps:30,end:cursor,characters})+'\n');
