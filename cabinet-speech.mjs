import { agendas, records } from './cabinet-model.mjs';

export function meetingSpeech(stage,selected='',recordIndex=0){
  if(stage===1){
    const agenda=agendas.find(item=>item.id===selected);
    return {personId:'president',avatar:'president',name:'대통령 · 의장',label:'학습용 진행',badge:'진행 중',
      text:agenda?`이번 안건은 ‘${agenda.title}’입니다. 국무회의에서 심의할 사안인지 함께 판단해 봅시다.`
        :'국무회의를 시작하겠습니다. 회의에서 심의할 안건을 골라 봅시다.'};
  }
  if(stage!==2||!records[recordIndex])return null;
  const record=records[recordIndex];
  return {...record,personId:record.speakerId||null,
    badge:record.speakerId?'발언 요약':record.id==='council'?'회의 결과':'시행 안내'};
}

export function placeSpeech({width,height,bubbleWidth,bubbleHeight,x,y,hasActor}){
  const small=width<760,edge=small?14:20;
  const clamp=(value,min,max)=>Math.max(min,Math.min(Math.max(min,max),value));
  if(!hasActor)return {left:(width-bubbleWidth)/2,top:50,side:'none',tail:0};
  if(small)return {left:edge,top:44,side:'bottom',tail:clamp(x-edge,24,bubbleWidth-24)};
  const right=x+100+bubbleWidth<=width-edge;
  const left=clamp(right?x+100:x-bubbleWidth-100,edge,width-bubbleWidth-edge);
  const top=clamp(y-110,50,height-bubbleHeight-90);
  return {left,top,side:right?'left':'right',tail:clamp(y-top,30,bubbleHeight-30)};
}
