import test from 'node:test';
import assert from 'node:assert/strict';
import { agendas, records } from './cabinet-model.mjs';
import { meetingSpeech, placeSpeech } from './cabinet-speech.mjs';

test('회의 시작은 학습용 진행으로 표시하고 안건 정답은 말풍선에 노출하지 않는다',()=>{
  assert.equal(meetingSpeech(0),null);assert.equal(meetingSpeech(3),null);
  const opening=meetingSpeech(1);
  assert.equal(opening.personId,'president');assert.equal(opening.label,'학습용 진행');
  for(const agenda of agendas){
    const speech=meetingSpeech(1,agenda.id);
    assert.ok(speech.text.includes(agenda.title));assert.ok(!speech.text.includes(agenda.result));
  }
});
test('실제 개인 발표·회의 결과·시행 안내를 구분하고 출처와 원래 요약을 유지한다',()=>{
  assert.deepEqual(records.map((_,i)=>meetingSpeech(2,'',i).personId),['justice','premier',null,'legislation',null]);
  for(const [index,record] of records.entries()){
    const speech=meetingSpeech(2,'',index);
    for(const key of ['text','label','date','source','note'])assert.equal(speech[key],record[key]);
  }
  assert.equal(meetingSpeech(2,'',2).badge,'회의 결과');
  assert.equal(meetingSpeech(2,'',4).badge,'시행 안내');
  assert.equal(meetingSpeech(2,'',99),null);
});
test('회전·확대로 발언자가 화면 끝에 가도 말풍선을 화면 안에 배치한다',()=>{
  for(const x of [-400,80,607,1170,1800])for(const y of [-200,300,900]){
    const p=placeSpeech({width:1214,height:660,bubbleWidth:360,bubbleHeight:310,x,y,hasActor:true});
    assert.ok(p.left>=20&&p.left+360<=1194);assert.ok(p.top>=50&&p.top+310<=570);
    assert.ok(p.tail>=30&&p.tail<=280);
  }
  const mobile=placeSpeech({width:366,height:610,bubbleWidth:338,bubbleHeight:270,x:183,y:415,hasActor:true});
  assert.deepEqual(mobile,{left:14,top:44,side:'bottom',tail:169});
  const result=placeSpeech({width:366,height:610,bubbleWidth:338,bubbleHeight:240,x:0,y:0,hasActor:false});
  assert.equal(result.side,'none');assert.equal(result.left,14);
});
