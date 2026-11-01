import { people, agendas, records, policySteps, sources, judge, shuffledPeople } from './cabinet-model.mjs?v=20261101-random-cards1';
import { pixelArt } from './characters.mjs?v=20261101-nine-candidates2';
import { createRoom } from './cabinet-scene.mjs?v=20261101-shared-line1';
import { meetingSpeech } from './cabinet-speech.mjs';
import { agendaSwipeChoice,nextAgendaIndex } from './cabinet-agenda.mjs';

const $ = selector => document.querySelector(selector);
const stages = ['입장 심사', '안건 고르기', '공개 기록 탐구', '정책 연결'];
const headings = ['국무회의, 문을 열다', '어떤 일을 함께 논의할까', '회의에서 정책으로', '국회와 정부를 잇다'];
const prompts = ['누가 국무회의에 들어올 수 있을까요?', '국무회의에서 심의할 안건은?', '공개 기록에 어떤 역할이 담겼을까요?', '이 법률은 어떤 과정을 거쳤을까요?'];
const modal = $('#question-modal');
const avatar = (id, expression) => `<span class="person-art" aria-hidden="true"><svg viewBox="0 0 16 22">${pixelArt({ id, expression })}</svg></span>`;
const link = (key, label) => `<a class="source-link" href="${sources[key].url}" target="_blank" rel="noopener noreferrer">${label || sources[key].title} ↗</a>`;
const door = '<span class="door-icon" aria-hidden="true"><svg viewBox="0 0 48 55"><path d="M9 50V6h30v44M16 50V13l18-4v41M5 50h38M28 31h1"/><circle cx="28" cy="31" r="1"/></svg></span>';
const branchDiagram = `<span class="civic-branches">
  <span class="civic-branch"><svg viewBox="0 0 80 80" aria-hidden="true"><path class="branch-fill" d="M18 30C18 9 62 9 62 30Z"/><path class="branch-fill" d="M14 33h52v8H14z"/><path d="M22 45v18m12-18v18m12-18v18m12-18v18M12 67h56M9 72h62"/></svg><strong>입법</strong></span>
  <span class="civic-branch"><svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 8v18"/><path class="branch-fill" d="M40 9h17v11H40"/><path class="branch-fill" d="M15 27h50v40H15z"/><path d="M34 67V54h12v13M10 72h60M24 37h3m11 0h3m11 0h3M24 46h3m11 0h3m11 0h3"/></svg><strong>행정</strong></span>
  <span class="civic-branch"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="branch-fill" cx="40" cy="13" r="5"/><path d="M40 18v46M18 28h44M20 28 8 48m12-20 12 20M60 28 48 48m12-20 12 20M27 65h26M21 71h38"/><path class="branch-fill" d="M8 48h24c-2 15-22 15-24 0Zm40 0h24c-2 15-22 15-24 0Z"/></svg><strong>사법</strong></span>
</span>`;
let stage = 0;
let selected = '';
let recordIndex = 0;
let agendaIndex = 0;
let agendaBusy = false;
let meetingOpened = false;
let personOrder = shuffledPeople();
let personAnswers = {};
let agendaAnswers = {};
let policyAnswers = {};
let readRecords = new Set([0]);
let modalReturn = '#question';
let outcomes = {};

const roomOverlay = document.createElement('div');
roomOverlay.id = 'room-overlay';
$('.scene-wrap').append(roomOverlay);
const room = createRoom($('#scene'), $('#scene-labels'), id => {
  if (stage === 0 && people.some(p => p.id === id)) openPerson(id);
  if (stage === 2) {
    const index = records.findIndex(r => r.id === id);
    if (index >= 0) setRecord(index);
  }
});

const count = object => Object.keys(object).length;
function complete(index) {
  return [count(personAnswers) === people.length, count(agendaAnswers) === agendas.length, readRecords.size === records.length, count(policyAnswers) === policySteps.length][index];
}
const policyIndex = () => policySteps.findIndex(p => !Object.hasOwn(policyAnswers, p.id));
const progress = (length, filled) => `<div class="status-line" aria-hidden="true">${Array.from({ length }, (_, i) => `<span class="${i < filled ? 'filled' : ''}"></span>`).join('')}</div>`;
function nextButton(text, enabled, action = 'next') {
  return `<button class="panel-button" data-action="${action}" ${enabled ? '' : 'disabled'}>${text}<span aria-hidden="true">→</span></button>`;
}
function renderPanel() {
  let html = '';
  if (stage === 0) {
    const p = people.find(p => p.id === selected);
    const done = p && Object.hasOwn(personAnswers, p.id);
    html = `<div class="panel-kicker"><span>출입 심사</span><span class="panel-counter">${count(personAnswers)} / ${people.length}</span></div>
      <div class="panel-hero">${p ? avatar(p.avatar) : door}<h2>${p ? p.name : complete(0) ? '입장 심사 완료' : '회의 전, <br>문 앞에서'}</h2>
      <p>${done ? '인물을 눌러 결과를 다시 확인하세요.' : '아래 인물을 골라 주세요.'}</p></div>
      <div class="panel-rule"><span>허용한 인물</span><strong>${people.filter(p=>p.allow&&Object.hasOwn(personAnswers,p.id)).length}명</strong></div>
      ${done && p.allow ? '<button class="replay-button" data-action="replay">↺ 입장 다시 보기</button>' : ''}${nextButton('국무회의 시작', complete(0))}${progress(people.length, count(personAnswers))}`;
  } else if (stage === 1) {
    html = '';
  } else if (stage === 2) {
    const r = records[recordIndex];
    html = `<div class="panel-kicker"><span>만 나이 통일</span><span class="panel-counter">${recordIndex + 1} / ${records.length}</span></div>
      <div class="record-body"><div class="record-byline">${avatar(r.avatar)}<strong>${r.name}<small>${r.date}</small></strong></div>
      <span class="record-label">${r.label}</span><h2>${r.title}</h2><p>${r.text}</p>${r.note ? `<p class="record-note">${r.note}</p>` : ''}</div>
      ${link(r.source, '공개 자료 원문')}${nextButton(recordIndex < records.length - 1 ? '다음 기록' : '정책 연결하기', true, recordIndex < records.length - 1 ? 'record-next' : 'next')}
      ${progress(records.length, readRecords.size)}`;
  } else {
    html = `<div class="panel-kicker"><span>법률이 생활 속으로</span><span class="panel-counter">${count(policyAnswers)} / ${policySteps.length}</span></div>
      <div class="panel-hero"><span class="door-icon policy-symbol" aria-hidden="true">↔</span>
      <h2>정책의 길을 <br>연결해 보세요</h2>
      <p>${complete(3) ? '기관을 눌러 결과를 다시 확인하세요.' : '빈칸에 알맞은 기관을 골라 주세요.'}</p></div>
      <div class="panel-rule"><span>실제 사례</span><strong>만 나이 통일</strong></div>
      ${complete(3) ? nextButton('다시 탐구하기', true, 'restart') : nextButton('역할 연결하기', true, 'policy-question')}${progress(policySteps.length, count(policyAnswers))}`;
  }
  $('#panel').innerHTML = html;
  $('#panel').hidden=stage===1;
}
function renderDock() {
  if (stage === 0) $('#dock').innerHTML = `<h2 class="dock-heading">입장을 기다리는 사람들<span>인물을 눌러 판단하기</span></h2><div class="people-grid">${personOrder.map(p => {
    const done = Object.hasOwn(personAnswers, p.id), reviewed = Boolean(outcomes[`person:${p.id}`]);
    return `<button class="person-button ${done ? 'classified' : ''} ${selected === p.id ? 'active' : ''}" data-person="${p.id}" aria-label="${p.name} · ${reviewed ? '결과 다시 보기' : '입장 판단'}">${avatar(p.avatar)}<span><strong>${p.name}</strong><small>${reviewed ? '결과 다시 보기' : '판단 대기'}</small></span></button>`;
  }).join('')}</div>`;
  if (stage === 1) $('#dock').innerHTML = `<div class="agenda-history" aria-label="확인한 안건">${agendas.filter(a=>outcomes[`agenda:${a.id}`]).map(a=>`<button data-agenda="${a.id}">안건 ${a.number} · 결과 다시 보기</button>`).join('')}</div>`;
  if (stage === 2) $('#dock').innerHTML = `<div class="record-note-band">공개 브리핑·부처 발표를 따라갑니다. 전체 회의록이나 실제 발언 대본이 아닙니다.</div><h2 class="dock-heading">공개 기록의 다섯 장면<span>열어 본 기록 ${readRecords.size} / ${records.length}</span></h2><div class="record-navigation">${records.map((r, i) => `<button class="record-button" data-record="${i}" aria-pressed="${recordIndex === i}">${avatar(r.avatar)}<span><small>${r.date.replace(' 시행', '')}</small><strong>${r.title}</strong></span></button>`).join('')}</div>`;
  if (stage === 3) $('#dock').innerHTML = `<h2 class="dock-heading">만 나이 통일의 실제 경로<span>의원 발의 법률안 사례</span></h2><div class="policy-grid">${policySteps.map((p, i) => {
    const done = Object.hasOwn(policyAnswers, p.id), active = policyIndex() === i;
    return `<button class="policy-node ${done ? 'done' : ''} ${active ? 'active' : ''}" data-policy="${p.id}" ${!done && !active ? 'disabled' : ''}><span class="node-symbol" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span><small>${p.date}</small><strong>${done ? '결과 다시 보기' : '?'}</strong><em>${p.action}</em></span></button>`;
  }).join('')}</div>`;
}
function renderSceneOverlay() {
  if(stage===1){
    document.querySelector('[data-view="speaker"]').hidden=true;
    if(!meetingOpened){
      roomOverlay.innerHTML=`<section class="meeting-opening" aria-labelledby="meeting-opening-title">
        <div class="meeting-chair">${avatar('president')}<strong>대통령 <span>· 의장</span></strong></div>
        <div class="meeting-opening-speech"><span class="opening-caption">학습용 대사</span><h2 id="meeting-opening-title">국무회의를<br>시작하겠습니다.</h2><button class="opening-start" data-action="agenda-start">무엇이 국무회의의 안건이 될 수 있을까요? <span aria-hidden="true">→</span></button></div>
      </section>`;
      return null;
    }
    const a=agendas[agendaIndex],done=Object.hasOwn(agendaAnswers,a.id),reviewed=!!outcomes[`agenda:${a.id}`];
    roomOverlay.innerHTML=`<section class="agenda-sorter" aria-label="안건 한 장씩 분류">
      <div class="agenda-count"><span>오늘의 안건</span><strong>${agendaIndex+1} / ${agendas.length}</strong><span>판단 ${count(agendaAnswers)} / ${agendas.length}</span></div>
      <div class="agenda-sort-grid">
        <button class="agenda-choice agenda-no" data-agenda-choice="false" ${done?'disabled':''}><span aria-hidden="true">←</span><strong>안건 아님</strong></button>
        <article class="agenda-paper" id="agenda-paper" tabindex="0" aria-labelledby="agenda-title" aria-describedby="agenda-instruction">
          <div class="agenda-paper-top"><span>검토할 사안</span><span>${a.number}</span></div>
          <h2 id="agenda-title">${a.title}</h2><span class="agenda-paper-rule" aria-hidden="true"></span>
          <p id="agenda-instruction">${done?'결과를 확인한 뒤 다음 안건으로 넘어가세요.':'왼쪽 또는 오른쪽으로 넘겨 보세요.'}</p>
        </article>
        <button class="agenda-choice agenda-yes" data-agenda-choice="true" ${done?'disabled':''}><span aria-hidden="true">→</span><strong>국무회의 안건</strong></button>
      </div>
      <div class="agenda-card-actions">${reviewed?`<button data-action="agenda-result">결과 다시 보기</button>`:''}${done?`<button class="agenda-continue" data-action="${complete(1)?'next':'agenda-next'}">${complete(1)?'공개 기록 탐구':'다음 안건'} →</button>`:'<span>카드 드래그 · ← / → 방향키 · 양쪽 버튼</span>'}</div>
    </section>`;
    bindAgendaDrag();
    return null;
  }
  const speech=meetingSpeech(stage,selected,recordIndex);
  roomOverlay.innerHTML=speech?`<section class="scene-speech" id="scene-speech" aria-label="현재 발언과 공개 자료" data-side="none">
    <div class="speech-context"><strong>${speech.label}</strong>${speech.date?`<span>${speech.date}</span>`:''}</div>
    <div class="speech-speaker">${avatar(speech.avatar)}<span><small>${speech.badge}</small><strong>${speech.name}</strong></span></div>
    <p class="speech-text">${speech.text}</p>${speech.note?`<p class="speech-note">${speech.note}</p>`:''}
    ${stage===2?`<div class="speech-navigation"><button data-action="record-prev" ${recordIndex===0?'disabled':''}>← 이전</button><span>${recordIndex+1} / ${records.length}</span><button data-action="${recordIndex<records.length-1?'record-next':'next'}">${recordIndex<records.length-1?'다음 →':'정책 연결 →'}</button></div>${link(speech.source,'자료 원문')}`:''}
  </section>`:'';
  document.querySelector('[data-view="speaker"]').hidden=!speech?.personId;
  return speech?{...speech,element:$('#scene-speech')}:null;
}
function render() {
  $('.workspace').classList.toggle('agenda-mode',stage===1);
  $('#scene').inert=stage===1;
  $('#steps').innerHTML = stages.map((name, i) => `<button class="step ${complete(i) ? 'done' : ''}" data-stage="${i}" ${stage === i ? 'aria-current="step"' : ''}><span class="step-number">${complete(i) ? '✓' : String(i + 1).padStart(2,'0')}</span>${name}</button>`).join('');
  $('#eyebrow').textContent = `${String(stage + 1).padStart(2, '0')} / ${['THE CABINET','ON THE AGENDA','PUBLIC RECORDS','MAKING POLICY'][stage]}`;
  $('#heading').textContent = headings[stage];
  $('#page-number').textContent = `${String(stage + 1).padStart(2,'0')} / 04`;
  $('#room-status').textContent = ['입장 대기', '회의 시작', '공개 자료 기반', '입법부와 행정부'][stage];
  $('#scene-caption').textContent = ['대기 중인 인물을 골라 주세요.', '중요한 정부 정책을 함께 심의합니다.', '기록: 2022년 서울·세종 회의', '각 단계의 역할을 연결해 보세요.'][stage];
  $('#footnote').textContent = ['입장 판단 · 겸직·별도 참석 사유가 없는 회의', '헌법 제89조의 국무회의 심의 사항', '공간은 2026년 세종실 참고 모형 · 기록은 2022년 서울·세종 회의', '법률안의 국회 의결과 법률공포안 심의를 구분합니다.'][stage];
  renderPanel();renderDock();const speech=renderSceneOverlay();
  room.update({ stage, personOrder, statuses: personAnswers, selected: stage === 2 ? records[recordIndex].id : selected, speech });
}
function announce(message) { $('#announcer').textContent = message; }
function closeDialog() { room.stopReaction(); modal.close(); }
function showModal({ title, body = '', options = '', context = '', variant = '', result = '', admission = '' }, returnTo = '#question') {
  room.stopReaction();
  modal.dataset.variant=variant;
  modal.dataset.result=result;
  modal.dataset.admission=admission;
  modal.dataset.walkExit='';
  modalReturn = returnTo;
  $('#modal-content').innerHTML = `<div class="modal-top">${result ? `<div class="modal-result" id="modal-result"><span aria-hidden="true">${result==='correct'?'✓':'↻'}</span>${result==='correct'?'정답이에요':'오답이에요'}</div>` : ''}<button class="modal-close" data-action="close" aria-label="모달 닫기">×</button></div><div class="modal-body">${body}<h2 id="modal-title">${title}</h2>${context ? `<p class="modal-context" id="modal-context">${context}</p>` : ''}</div><div class="modal-options">${options}</div>`;
  const description=[result?'modal-result':'',context?'modal-context':''].filter(Boolean).join(' ');
  if (description) modal.setAttribute('aria-describedby', description);
  else modal.removeAttribute('aria-describedby');
  if (!modal.open) modal.showModal();
  modal.querySelector('.modal-options button')?.focus({preventScroll:true});
  modal.scrollTop=0;
}
function openIntro() {
  if(stage===1&&!meetingOpened){
    modalReturn='[data-action="agenda-start"]';
    if(modal.open)closeDialog();
    $('[data-action="agenda-start"]')?.focus({preventScroll:true});
    return;
  }
  const agendaIntro = stage === 1;
  const introBody = agendaIntro ? `<figure class="agenda-intro-art"><div class="agenda-document" aria-hidden="true"><span>?</span><i></i><i></i><i></i></div>${avatar('president')}<figcaption>대통령</figcaption></figure><div class="agenda-intro-choices" id="agenda-directions"><div class="intro-choice intro-no"><span aria-hidden="true">←</span><strong>안건 아님</strong></div><div class="intro-choice intro-yes"><strong>국무회의 안건</strong><span aria-hidden="true">→</span></div></div>` : stage === 0 ? `<div class="president-portrait">${avatar('president')}<strong>대통령</strong></div>` : '';
  showModal({ variant: stage === 0 ? 'president' : agendaIntro ? 'agenda-intro' : '', body: introBody, title: agendaIntro ? '국무회의에서<br>심의할 안건은?' : prompts[stage], context: stage === 0 ? '다른 직책을 겸하지 않고, 별도 참석 사유가 없는 회의입니다.' : stage === 2 ? '회의 중 발언과 회의 밖 발표를 구분해 보세요.' : stage === 3 ? '만 나이 통일법이 실제로 거친 순서입니다.' : '', options: `<button class="primary" data-action="${stage === 3 && !complete(3) ? 'policy-question' : 'close'}">${['입장 여부 결정하기','안건 고르기','기록 살펴보기',complete(3) ? '연결 살펴보기' : '역할 연결하기'][stage]}<span aria-hidden="true">→</span></button>` }, agendaIntro ? '#agenda-paper' : '#question');
  if(agendaIntro)modal.setAttribute('aria-describedby','agenda-directions');
}
function openPerson(id, retry = false) {
  const p = people.find(x => x.id === id);
  if (!p) return;
  selected = id; render();
  if (!retry && outcomes[`person:${id}`]) return showOutcome('person', id);
  const done = Object.hasOwn(personAnswers,id);
  showModal({ variant: 'admission', body: avatar(p.avatar), title: done ? p.name : `${p.name}, 입장시킬까요?`, context: done ? `${p.allow ? p.role : '입장 불가 · ' + p.role} · ${p.result}` : '', options: done ? `<button class="primary" data-action="close">확인<span aria-hidden="true">✓</span></button>` : `<button data-answer-kind="person" data-id="${id}" data-answer="true">입장 허용</button><button data-answer-kind="person" data-id="${id}" data-answer="false">입장 불가</button>` }, `#dock [data-person="${id}"]`);
}
function openAgenda(id, retry = false) {
  const a = agendas.find(x => x.id === id);if (!a) return;
  agendaIndex=agendas.indexOf(a);selected = id;render();
  if (!retry && outcomes[`agenda:${id}`]) return showOutcome('agenda', id);
  closeDialog();$('#agenda-paper')?.focus({preventScroll:true});
}
function openPolicy(id, retry = false) {
  const p = policySteps.find(x => x.id === id);if (!p) return;
  if (!retry && outcomes[`policy:${id}`]) return showOutcome('policy', id);
  const done = Object.hasOwn(policyAnswers,id);
  if (!done && p.id !== policySteps[policyIndex()]?.id) return;
  showModal({ body: `<div class="modal-date">${p.date}</div>`, title: done ? `${p.answer} · ${p.action}` : p.question, options: done ? '<button class="primary" data-action="close">확인<span aria-hidden="true">✓</span></button>' : p.choices.map(c => `<button data-answer-kind="policy" data-id="${id}" data-answer="${c}">${c}</button>`).join('') }, `#dock [data-policy="${id}"]`);
}
function setRecord(index) {
  if (!Number.isInteger(index) || !records[index]) return;
  recordIndex = index;readRecords.add(index);render();
  announce(`${records[index].name}. ${records[index].label}. ${records[index].text}`);
}
function setStage(index) {
  if (!Number.isInteger(index) || index < 0 || index >= stages.length) return;
  stage = index;selected = '';render();openIntro();
}
function restart() {
  personOrder = shuffledPeople();
  personAnswers = {};agendaAnswers = {};policyAnswers = {};outcomes = {};readRecords = new Set([0]);recordIndex = 0;agendaIndex=0;meetingOpened=false;selected = '';stage = 0;
  room.setView('room');
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.view === 'room')));
  render();openIntro();
}
function showOutcome(kind, id, animate = false) {
  const { correct, hint } = outcomes[`${kind}:${id}`];
  const item = (kind === 'person' ? people : kind === 'agenda' ? agendas : policySteps).find(x => x.id === id);
  const final = correct && kind === 'policy' && complete(3);
  if(kind==='person'){
    showModal({ variant: correct ? 'admission' : 'president angry-result',
      result: correct?'correct':'incorrect', admission: correct?(item.allow?'allowed':'denied'):'',
      body: correct ? `<figure class="admission-person">${avatar(item.avatar)}<figcaption>${item.name}</figcaption></figure>` : `<div class="president-portrait ${animate?'is-reacting':''}">${avatar('president','angry')}<strong>대통령</strong></div>`,
      title: correct ? `<span class="admission-symbol" aria-hidden="true">${item.allow?'↪':'⊘'}</span><span>${item.allow?'입장할 수 있어요':'입장할 수 없어요'}</span>` : '잠깐! 다시 확인해 주세요.',
      context: correct ? (item.id==='secretary'?'국무위원이 아닌 배석자이며, 의결권은 없습니다.':item.result)+(item.exception?`<br><br>${item.exception}`:'') : `${item.name}<br>${hint}`,
      options: correct ? `<button class="primary" data-action="close">확인 <span aria-hidden="true">✓</span></button>` : `<button class="primary" data-action="retry" data-kind="person" data-id="${id}">다시 선택하기 <span aria-hidden="true">→</span></button>`
    },`#dock [data-person="${id}"]`);
    if(correct&&!item.allow&&animate)modal.dataset.walkExit='true';
    if(!correct&&animate)room.react();
    return;
  }

  if(kind==='agenda'){
    showModal({
      variant: 'president agenda-result', result: correct?'correct':'incorrect',
      body: `<div class="president-portrait">${!correct?'<span class="agenda-reflection-marker" aria-hidden="true">?</span>':''}${avatar('president')}<strong>대통령</strong></div>`,
      title: correct ? (item.include?'국무회의에서 심의해요.':'국무회의 안건이 아니에요.') : '누가 맡을 일일까요?',
      context: correct ? item.result : branchDiagram,
      options: correct
        ? `<button class="primary" data-action="${complete(1)?'next':'agenda-next'}">${complete(1)?'공개 기록 탐구':'다음 안건'}<span aria-hidden="true">→</span></button>`
        : `<button class="primary" data-action="retry" data-kind="agenda" data-id="${id}">다시 선택하기<span aria-hidden="true">→</span></button>`
    },'#agenda-paper');
    return;
  }

  showModal({
    result: correct?'correct':'incorrect',
    body: !correct ? `<p class="modal-subject">${item.action}</p>` : final ? `<ol class="modal-policy" aria-label="정책이 실현되는 과정">${policySteps.map((p, i) => `<li class="institution-token"><small>${i + 1}. ${p.action}</small><strong>${p.answer}</strong></li>`).join('')}</ol>` : '',
    title: correct ? (final ? '정책 연결을 마쳤어요.' : `${item.answer} · ${item.action}`) : '다시 생각해 보세요.',
    context: correct ? (final ? '국회의 의결과 정부의 집행이 국민의 생활로 이어집니다.' : '') : hint,
    options: correct
      ? `<button class="primary" data-action="close">${final?'탐구 마치기':'확인'}<span aria-hidden="true">✓</span></button>`
      : `<button class="primary" data-action="retry" data-kind="policy" data-id="${id}">다시 선택하기<span aria-hidden="true">→</span></button>`,
  },`#dock [data-policy="${id}"]`);
}
async function submitAgenda(value){
  const a=agendas[agendaIndex],card=$('#agenda-paper');
  if(stage!==1||modal.open||agendaBusy||!card||Object.hasOwn(agendaAnswers,a.id))return;
  agendaBusy=true;
  document.querySelectorAll('[data-agenda-choice]').forEach(button=>button.disabled=true);
  try{
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      await card.animate([{transform:card.style.transform||'none',opacity:1},{transform:`translateX(${value?180:-180}px) rotate(${value?9:-9}deg)`,opacity:0}],{duration:180,easing:'ease-in',fill:'forwards'}).finished;
    }
    if(stage===1&&card.isConnected)answer({dataset:{answerKind:'agenda',id:a.id,answer:String(value)}});
  }finally{agendaBusy=false;}
}
function bindAgendaDrag(){
  const card=$('#agenda-paper');let start=null;
  card.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();submitAgenda(event.key==='ArrowRight');
  });
  card.addEventListener('pointerdown',event=>{
    if(event.button!==0||agendaBusy||Object.hasOwn(agendaAnswers,agendas[agendaIndex].id))return;
    start={x:event.clientX,y:event.clientY};card.setPointerCapture(event.pointerId);card.classList.add('dragging');card.focus({preventScroll:true});
  });
  card.addEventListener('pointermove',event=>{
    if(!start)return;
    const dx=event.clientX-start.x;
    card.style.transform=`translateX(${dx}px) rotate(${Math.max(-10,Math.min(10,dx/20))}deg)`;
  });
  const release=event=>{
    if(!start)return;
    const choice=event.type==='pointercancel'?null:agendaSwipeChoice(event.clientX-start.x,event.clientY-start.y);
    start=null;card.classList.remove('dragging');
    if(choice===null)card.style.transform='';else submitAgenda(choice);
  };
  card.addEventListener('pointerup',release);card.addEventListener('pointercancel',release);
}
function answer(button) {
  const { answerKind: kind, id, answer: raw } = button.dataset;
  const value = kind === 'policy' ? raw : raw === 'true';
  const result = judge(kind,id,value);
  outcomes[`${kind}:${id}`] = { ...result, value };
  if (result.correct) {
    if (kind === 'person') personAnswers[id] = value;
    if (kind === 'agenda') agendaAnswers[id] = value;
    if (kind === 'policy') policyAnswers[id] = value;
  }
  render();
  showOutcome(kind, id, true);
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');if (!button || button.disabled) return;
  const d = button.dataset;
  if(d.agendaChoice!==undefined)return submitAgenda(d.agendaChoice==='true');
  if (d.answerKind) return answer(button);
  if (d.stage !== undefined) return setStage(Number(d.stage));
  if (d.person && button.closest('#dock')) return openPerson(d.person);
  if (d.agenda) return openAgenda(d.agenda);
  if (d.record !== undefined) { setRecord(Number(d.record));$('.scene-wrap').scrollIntoView({block:'start'});$('#scene-speech button:not(:disabled)')?.focus({ preventScroll: true });return; }
  if (d.policy) return openPolicy(d.policy);
  if (d.view) {
    room.setView(d.view);
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    return;
  }
  if (button.id === 'question') return openIntro();
  if (button.id === 'restart' || d.action === 'restart') return restart();
  if (d.action === 'close') return closeDialog();
  if(d.action==='agenda-start'&&stage===1&&!meetingOpened){
    meetingOpened=true;render();$('#agenda-paper')?.focus({preventScroll:true});announce('국무회의에서 다룰 안건을 골라 보세요.');return;
  }
  if(d.action==='agenda-result')return showOutcome('agenda',agendas[agendaIndex].id);
  if(d.action==='agenda-next'){
    closeDialog();agendaIndex=nextAgendaIndex(agendaIndex,agendaAnswers);selected=agendas[agendaIndex].id;render();$('#agenda-paper')?.focus({preventScroll:true});return;
  }
  if (d.action === 'retry') return ({ person: openPerson, agenda: openAgenda, policy: openPolicy })[d.kind]?.(d.id, true);
  if (d.action === 'replay') return room.replay(selected);
  if (d.action === 'next') return setStage(stage + 1);
  if (d.action === 'record-next') { setRecord(recordIndex + 1);$('#scene-speech .speech-navigation button:last-child')?.focus({ preventScroll: true });return; }
  if (d.action === 'record-prev') { setRecord(recordIndex - 1);$('#scene-speech button:not(:disabled)')?.focus({ preventScroll: true });return; }
  if (d.action === 'policy-question') { const p = policySteps[policyIndex()];if (p) openPolicy(p.id); }
});
modal.addEventListener('click',event=>{if(event.target===modal){const rect=modal.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialog();}});
modal.addEventListener('close',()=>{
  room.stopReaction();
  $(modalReturn)?.focus({ preventScroll:true });
  if(modal.dataset.walkExit==='true'&&stage===0)$('.scene-wrap').scrollIntoView({block:'start'});
  modal.dataset.walkExit='';
});
modal.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const targets=[...modal.querySelectorAll('button:not(:disabled),a[href]')];
  const first=targets[0],last=targets.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
render();openIntro();
