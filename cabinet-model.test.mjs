import test from 'node:test';
import assert from 'node:assert/strict';
import { people, agendas, records, policySteps, sources, judge } from './cabinet-model.mjs';

test('입장은 구성원·배석자와 구분하며 비서실장은 국무위원이 아니다', () => {
  for (const p of people) {
    assert.equal(judge('person',p.id,p.allow).correct,true);
    assert.equal(judge('person',p.id,!p.allow).correct,false);
    assert.ok(judge('person',p.id,!p.allow).hint);
    assert.equal(!!p.seat,p.allow);
  }
  assert.equal(people.find(p=>p.id==='speaker').allow,false);
  const secretary=people.find(p=>p.id==='secretary');
  assert.equal(secretary.allow,true);
  assert.match(secretary.role,/배석자.*의결권 없음/);
});
test('법률안·예산안·대통령령·중요 정책을 심의하고 재판과 의장 선출은 구분한다', () => {
  assert.deepEqual(agendas.filter(a=>a.include).map(a=>a.id),['budget','law','decree','policy']);
  for (const a of agendas) {
    assert.equal(judge('agenda',a.id,a.include).correct,true);
    assert.equal(judge('agenda',a.id,!a.include).correct,false);
  }
});
test('공개 자료의 출처와 회의 밖 발언이 명시되어 있다', () => {
  for (const r of records) {
    assert.ok(sources[r.source]);assert.match(sources[r.source].url,/^https:\/\//);
    assert.ok(r.text);assert.ok(r.date);
  }
  assert.match(records.find(r=>r.id==='justice').label,/회의 밖/);
  assert.match(records.find(r=>r.id==='legislation').label,/회의 밖.*배석자/);
  assert.match(records.find(r=>r.id==='premier').note,/예산/);
});
test('의원 발의 사례는 국회 의결이 국무회의 공포안 심의보다 앞선다', () => {
  assert.deepEqual(policySteps.map(p=>p.answer),['국회','국무회의','대통령','행정부']);
  assert.deepEqual(policySteps.map(p=>p.date),['2022.12.08','2022.12.20','2022.12.27','2023.06.28']);
  assert.match(policySteps[1].action,/공포안/);
  for (const p of policySteps)for(const choice of p.choices)assert.equal(judge('policy',p.id,choice).correct,choice===p.answer);
});
test('알 수 없는 문항과 올바르지 않은 값은 처리하지 않는다', () => {
  assert.throws(()=>judge('person','missing',true),RangeError);
  assert.throws(()=>judge('bad','premier',true),RangeError);
  assert.throws(()=>judge('person','premier','true'),TypeError);
  assert.throws(()=>judge('policy','passage','unknown'),TypeError);
});
