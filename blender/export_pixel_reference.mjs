import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { pixelArt } from '../characters.mjs';
const sharp=createRequire(import.meta.url)('sharp');
const appearances={premier:'a1',speaker:'a2',secretary:'a3',justice:'b1',chief:'b2',education:'a4',constitutional:'constitutional',party:'party',auditor:'auditor',president:'president',legislation:'expert'};
const characters={};
for(const [id,avatar] of Object.entries(appearances)){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="88" viewBox="0 0 16 22">${pixelArt({id:avatar})}</svg>`;
  const {data,info}=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==64||info.height!==88)throw new Error('Expected a 4× sample of the original pixel grid');
  const rects=[];
  let occupied=0;
  for(let y=0;y<88;y++)for(let x=0;x<64;){
    const i=(y*64+x)*4;
    if(data[i+3]<128){x++;continue;}
    const color='#'+Array.from(data.subarray(i,i+3),v=>v.toString(16).padStart(2,'0')).join('');
    let end=x+1;
    while(end<64){
      const j=(y*64+end)*4;
      if(data[j+3]<128||data[j]!==data[i]||data[j+1]!==data[i+1]||data[j+2]!==data[i+2])break;
      end++;
    }
    const previous=rects.find(r=>r[0]===x/4&&r[2]===(end-x)/4&&r[4]===color&&r[1]+r[3]===y/4&&(y<56||Math.floor(r[1])===Math.floor(y/4)));
    if(previous)previous[3]+=.25;
    else rects.push([x/4,y/4,(end-x)/4,.25,color]);
    occupied+=end-x;x=end;
  }
  if(occupied<2000||rects.reduce((sum,r)=>sum+r[2]*r[3]*16,0)!==occupied)throw new Error('Pixel rectangle coverage mismatch');
  characters[id]={avatar,rects};
}
await writeFile(new URL('./pixel-reference.json',import.meta.url),JSON.stringify({source:'characters.mjs · pixelArt · 16 × 22',characters},null,2)+'\n');
