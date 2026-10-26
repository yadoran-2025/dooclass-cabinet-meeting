import test from 'node:test';
import assert from 'node:assert/strict';
import layout from './cabinet-layout.json' with { type: 'json' };
import { people } from './cabinet-model.mjs';
import { entranceRoute, exitRoute, lobbyPosition, pathLength, samplePath, planEntrance, sampleEntrance, TURN_DURATION, SEAT_DURATION, WALK_CYCLE_DISTANCE } from './cabinet-motion.mjs';

test('모든 입장 동선은 문을 지나 배정된 좌석에 도착하며 테이블을 통과하지 않는다',()=>{
  people.forEach((person,index)=>{
    if(!person.allow)return;
    const route=entranceRoute(person,index);
    assert.deepEqual(route[0],lobbyPosition(index));
    assert.deepEqual(route.at(-1),[person.seat[0]+.95,person.seat[1]]);
    assert.ok(route.some(([x,z])=>x===layout.entrance[0]&&z===layout.entrance[1]));
    for(const path of [route,planEntrance(person,index).path])for(let d=0;d<=pathLength(path);d+=.05){
      const {x,z}=samplePath(path,d);
      assert.ok(Math.abs(x)>layout.tableOuter[0]+.35||Math.abs(z)>layout.tableOuter[1]+.35,`${person.id} table collision at ${x}, ${z}`);
    }
  });
});
test('거절한 인물은 입구 밖에 머무른다',()=>{
  for(const i of [1,4])for(let d=0;d<pathLength(exitRoute(i));d+=.1)assert.ok(samplePath(exitRoute(i),d).x>layout.roomHalf[0]);
});
test('프레임 간격과 관계없이 경로 끝에 도착하고 초과 거리는 마지막 위치에 고정한다',()=>{
  const route=entranceRoute(people[0],0), length=pathLength(route);
  const end=samplePath(route,length+100);
  assert.deepEqual([end.x,end.z],route.at(-1));assert.equal(end.done,true);
  assert.deepEqual([samplePath(route,-1).x,samplePath(route,-1).z],lobbyPosition(0));
  assert.throws(()=>entranceRoute(people[1],1),TypeError);
  assert.throws(()=>samplePath(route,NaN),TypeError);
});

test('천천히 출발·정지하고 이동 거리와 걸음 박자가 일치한다',()=>{
  const plan=planEntrance(people[0],0);
  assert.equal(sampleEntrance(plan,0).speed,0);
  assert.ok(sampleEntrance(plan,.1).speed<sampleEntrance(plan,.3).speed);
  let previous=0;
  for(let t=0;t<plan.travelDuration;t+=1/60){
    const frame=sampleEntrance(plan,t);
    assert.ok(frame.distance>=previous);
    assert.ok(Math.abs(frame.gait-(frame.distance/WALK_CYCLE_DISTANCE%1))<1e-8);
    assert.ok(Math.abs(frame.x)>layout.tableOuter[0]+.35||Math.abs(frame.z)>layout.tableOuter[1]+.35,'둥근 모서리 동선도 탁자를 통과하지 않는다');
    previous=frame.distance;
  }
  assert.ok(sampleEntrance(plan,plan.travelDuration-.01).speed<.05);
});

test('의자 옆에서 멈춰 돌아본 뒤 올라앉으며 모든 좌석에 정확히 도착한다',()=>{
  people.filter(p=>p.allow).forEach(person=>{
    const plan=planEntrance(person,people.indexOf(person));
    const turn=sampleEntrance(plan,plan.travelDuration+TURN_DURATION/2);
    assert.equal(turn.phase,'turning');
    assert.deepEqual([turn.x,turn.z],plan.path.at(-1));
    const sittingAt=plan.travelDuration+TURN_DURATION;
    const anticipation=sampleEntrance(plan,sittingAt+SEAT_DURATION*.3);
    assert.equal(anticipation.phase,'sitting');assert.equal(anticipation.x,turn.x,'도약 전에 옆으로 미끄러지지 않는다');
    const landing=sampleEntrance(plan,sittingAt+SEAT_DURATION*.8);
    assert.ok(landing.x<turn.x&&landing.x>person.seat[0]);
    const final=sampleEntrance(plan,plan.duration+1);
    assert.equal(final.phase,'seated');assert.equal(final.done,true);
    assert.deepEqual([final.x,final.z],person.seat);
    assert.ok(Math.abs(Math.sin(final.angle-plan.seatAngle))<1e-8);
  });
  const rejected=planEntrance(people[1],1);
  assert.equal(sampleEntrance(rejected,rejected.duration+1).phase,'denied');
  assert.throws(()=>sampleEntrance(rejected,NaN),TypeError);
});

test('회의석 사이 여유와 별도 배석 책상 뒤·앞 통로를 확보한다',()=>{
  for(let i=1;i<layout.mainRowX.length;i++)assert.ok(layout.mainRowX[i]-layout.mainRowX[i-1]>=1.79);
  for(const row of layout.observerRows){
    assert.ok(Math.abs(row.z)-layout.mainRowZ>=2.8);
    const clearAisle=Math.abs(row.deskZ)-.32-(layout.mainRowZ+.33);
    assert.ok(clearAisle>=1.4,'주 회의석 뒤와 배석 책상 사이 통로');
    for(let i=1;i<row.x.length;i++)assert.ok(row.x[i]-row.x[i-1]>=2);
    assert.ok(Math.abs(row.z)+.4<layout.roomHalf[1]);
  }
  for(const seat of [layout.peopleSeats.secretary,layout.legislation])assert.ok(layout.observerRows.some(row=>row.z===seat[1]&&row.x.includes(seat[0])));
});
