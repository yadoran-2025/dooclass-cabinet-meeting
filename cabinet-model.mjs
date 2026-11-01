import layout from './cabinet-layout.json?v=20261101-nine-candidates2' with { type: 'json' };
export const sources = {
  constitution: { title: '대한민국헌법 제88·89조', url: 'https://www.law.go.kr/법령/대한민국헌법' },
  rules: { title: '국무회의 규정 제8조', url: 'https://www.law.go.kr/법령/국무회의규정' },
  auditBudget: { title: '국가재정법 제41조', url: 'https://www.law.go.kr/법령/국가재정법/제41조' },
  meeting: { title: '2022.12.20 제56회 국무회의 결과 브리핑', url: 'https://www.korea.kr/news/policyNewsView.do?newsId=156543517' },
  passage: { title: '2022.12.8 법제처·법무부 발표', url: 'https://moleg.go.kr/board.es?act=view&bid=0048&list_no=135843&mid=a10501000000' },
  promulgation: { title: '2022.12.27 만 나이 통일법 공포', url: 'https://www.korea.kr/news/policyNewsView.do?newsId=148909874' },
  effect: { title: '2023.6.26 만 나이 통일법 시행 브리핑', url: 'https://www.korea.kr/news/policyNewsView.do?newsId=156577051' },
};

export const people = [
  { id: 'premier', avatar: 'a1', name: '국무총리', allow: true, role: '구성원 · 부의장', seat: layout.peopleSeats.premier, color: '#7da7d0', result: '국무회의의 부의장입니다.', hint: '국무회의의 구성원을 떠올려 보세요.', source: 'constitution' },
  { id: 'speaker', avatar: 'a2', name: '국회의장', allow: false, role: '입법부', seat: null, color: '#e7a6a1', result: '국회의 회의를 진행합니다.', hint: '국회의장과 국무회의 의장은 다릅니다.', source: 'constitution' },
  { id: 'secretary', avatar: 'a3', name: '대통령비서실장', allow: true, role: '배석자 · 의결권 없음', seat: layout.peopleSeats.secretary, color: '#e3b647', result: '구성원은 아니지만 배석할 수 있습니다.', hint: '국무위원이 아니어도 배석할 수 있는 사람이 있어요.', source: 'rules' },
  { id: 'justice', avatar: 'b1', name: '법무부장관', allow: true, role: '국무위원', seat: layout.peopleSeats.justice, color: '#c4ad7a', result: '국무위원으로 회의에 참여합니다.', hint: '국무위원으로 임명된 장관입니다.', source: 'constitution' },
  { id: 'chief', avatar: 'b2', name: '대법원장', allow: false, role: '사법부', seat: null, color: '#94bec4', result: '사법부인 법원에 속합니다.', hint: '재판을 담당하는 기관은 어디일까요?', source: 'constitution' },
  { id: 'education', avatar: 'a4', name: '교육부장관', allow: true, role: '국무위원', seat: layout.peopleSeats.education, color: '#b6a3d4', result: '국무위원으로 회의에 참여합니다.', hint: '국무회의는 여러 부처의 정책을 함께 심의합니다.', source: 'constitution' },
  { id: 'constitutional', avatar: 'constitutional', name: '헌법재판소 재판관', allow: false, role: '헌법재판소', seat: null, color: '#929fbf', result: '헌법재판을 담당하며, 국무회의 구성원이 아닙니다.', hint: '헌법재판소는 어떤 일을 하는 기관일까요?', source: 'constitution' },
  { id: 'party', avatar: 'party', name: '여당 당대표', allow: false, role: '정당', seat: null, color: '#d5a6a0', result: '정당의 대표라는 직책만으로 국무회의에 참석하지는 않습니다.', hint: '여당과 행정부는 같은 조직일까요?', source: 'constitution' },
  { id: 'auditor', avatar: 'auditor', name: '감사원장', allow: false, role: '감사원', seat: null, color: '#91b3a6', result: '대통령 소속 기관의 장이지만, 국무회의 구성원이나 일반 배석자는 아닙니다.', exception: '다만 정부가 감사원의 예산 요구액을 줄이려면, 국무회의에서 감사원장의 의견을 들어야 합니다.', hint: '대통령 소속 기관의 장은 모두 국무회의 구성원일까요?', source: 'auditBudget' },
];

export function shuffledPeople() {
  const order = [...people];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export const agendas = [
  { id: 'budget', number: '01', title: '내년도 정부 예산안', category: '예산', include: true, result: '예산안은 국무회의 심의 대상입니다.', hint: '국가 재정에 관한 중요한 사항입니다.' },
  { id: 'trial', number: '02', title: '절도 사건의 유죄 판결', category: '재판', include: false, result: '개별 사건의 재판은 법원의 역할입니다.', hint: '구체적인 사건의 유무죄는 누가 판단할까요?' },
  { id: 'law', number: '03', title: '정부가 제출할 법률안', category: '법률', include: true, result: '정부 제출 법률안은 국무회의 심의를 거칩니다.', hint: '정부가 국회에 제출하기 전의 절차입니다.' },
  { id: 'speaker-election', number: '04', title: '국회의장 선출', category: '국회 운영', include: false, result: '국회의장은 국회에서 선출합니다.', hint: '입법부가 스스로 정하는 일입니다.' },
  { id: 'decree', number: '05', title: '법률 시행을 위한 대통령령안', category: '시행령', include: true, result: '대통령령안도 국무회의 심의 대상입니다.', hint: '법률이 위임한 내용을 구체화하는 정부의 안입니다.' },
  { id: 'policy', number: '06', title: '전국 단위 재난 대응 기본정책', category: '정부 정책', include: true, result: '정부의 중요한 정책을 함께 심의합니다.', hint: '여러 부처가 함께 추진해야 하는 중요한 정책입니다.' },
];

// shortcut: 공개된 전체 회의록을 확보하지 않아 공개 브리핑·회의 밖 발표를 구분한다. 전체 회의록 확보 시 발언 단위로 교체한다.
export const records = [
  { id: 'justice', speakerId: 'justice', avatar: 'b1', name: '한동훈 · 당시 법무부장관', label: '회의 밖 발표 요약', date: '2022.12.08', title: '법률안, 국회를 통과하다', text: '민법·행정기본법 개정안의 국회 통과를 알리고, 시행을 위한 후속 조치를 준비하겠다고 밝혔습니다.', source: 'passage' },
  { id: 'premier', speakerId: 'premier', avatar: 'a1', name: '한덕수 · 당시 국무총리', label: '국무회의 모두말씀 요지', date: '2022.12.20', title: '국회 의결과 정부 집행', text: '예산안의 조속한 국회 처리를 요청하고, 통과 후 집행을 준비하겠다고 밝혔습니다.', note: '같은 회의의 예산 관련 발언입니다.', source: 'meeting' },
  { id: 'council', avatar: 'president', name: '제56회 국무회의', label: '공개 결과 브리핑 요약', date: '2022.12.20', title: '만 나이 법률공포안 심의', text: '만 나이 기준을 담은 민법·행정기본법 개정 법률공포안을 심의·의결했습니다.', source: 'meeting' },
  { id: 'legislation', speakerId: 'legislation', avatar: 'expert', name: '이완규 · 당시 법제처장', label: '회의 밖 발표 요약 · 배석자', date: '2022.12.27', title: '공포 이후, 생활 속으로', text: '법률 공포를 알리고, 만 나이 사용이 정착하도록 관계 부처와 홍보를 추진하겠다고 밝혔습니다.', source: 'promulgation' },
  { id: 'government', avatar: 'a4', name: '정부 · 관계 부처', label: '시행 브리핑 요약', date: '2023.06.28 시행', title: '만 나이 원칙을 시행하다', text: '특별한 규정이 없는 경우, 법령상 나이는 만 나이로 계산하는 원칙이 시행됐습니다.', note: '취학 연령·병역 등 별도 규정은 유지됩니다.', source: 'effect' },
];

export const policySteps = [
  { id: 'passage', date: '2022.12.08', action: '법률안 의결', question: '법률안을 심의·의결한 곳은?', choices: ['국회', '국무회의'], answer: '국회', hint: '법률을 만드는 입법부의 역할입니다.' },
  { id: 'review', date: '2022.12.20', action: '법률공포안 심의', question: '법률공포안을 심의한 곳은?', choices: ['국회', '국무회의'], answer: '국무회의', hint: '이미 국회를 통과한 법률안의 공포 절차입니다.' },
  { id: 'promulgate', date: '2022.12.27', action: '법률 공포', question: '법률을 공포한 사람은?', choices: ['대통령', '국회의장'], answer: '대통령', hint: '국회에서 의결된 법률안은 정부로 이송됩니다.' },
  { id: 'execute', date: '2023.06.28', action: '법률 시행·집행', question: '법률을 집행하는 곳은?', choices: ['행정부', '법원'], answer: '행정부', hint: '법을 실제 생활에 적용하는 정부의 역할입니다.' },
];

export function judge(kind, id, answer) {
  const list = { person: people, agenda: agendas, policy: policySteps }[kind];
  const item = list?.find(x => x.id === id);
  if (!item) throw new RangeError('알 수 없는 문항입니다.');
  const expected = kind === 'person' ? item.allow : kind === 'agenda' ? item.include : item.answer;
  if (kind === 'policy' ? !item.choices.includes(answer) : typeof answer !== 'boolean') throw new TypeError('올바른 선택지가 아닙니다.');
  return { correct: answer === expected, hint: item.hint };
}
