import test from 'node:test';
import assert from 'node:assert/strict';
import { agendas } from './cabinet-model.mjs';
import { agendaSwipeChoice,nextAgendaIndex } from './cabinet-agenda.mjs';

test('오른쪽은 안건, 왼쪽은 안건 아님이며 짧거나 세로인 움직임은 제출하지 않는다',()=>{
  assert.equal(agendaSwipeChoice(100,20),true);
  assert.equal(agendaSwipeChoice(-100,20),false);
  for(const [x,y] of [[79,0],[-79,0],[100,100],[30,150],[0,0]])assert.equal(agendaSwipeChoice(x,y),null);
});
test('확인한 안건을 건너뛰고 다음 미완료 안건으로 돌아온다',()=>{
  assert.equal(agendas[0].include,true);
  assert.equal(nextAgendaIndex(0,{budget:true,trial:false}),2);
  assert.equal(nextAgendaIndex(5,{policy:true}),0);
  assert.equal(nextAgendaIndex(3,Object.fromEntries(agendas.map(a=>[a.id,a.include]))),3);
});
