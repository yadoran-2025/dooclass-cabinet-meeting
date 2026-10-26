import { agendas } from './cabinet-model.mjs';

export function agendaSwipeChoice(dx,dy){
  return Math.abs(dx)>=80&&Math.abs(dx)>Math.abs(dy)*1.3?dx>0:null;
}

export function nextAgendaIndex(current,answers){
  for(let step=1;step<=agendas.length;step++){
    const index=(current+step)%agendas.length;
    if(!Object.hasOwn(answers,agendas[index].id))return index;
  }
  return current;
}
