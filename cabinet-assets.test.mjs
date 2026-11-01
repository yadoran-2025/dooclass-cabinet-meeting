import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/addons/loaders/GLTFLoader.js';
import { people } from './cabinet-model.mjs';
import { ANIMATION_RANGES } from './cabinet-motion.mjs';

const base=new URL('./assets/cabinet/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
test('Blender 내보내기와 웹의 동작 구간이 일치한다',()=>{
  assert.deepEqual(manifest.clips,ANIMATION_RANGES);
  assert.deepEqual(manifest.characters.map(p=>p.id).sort(),[...people.map(p=>p.id),'president','legislation'].sort());
  assert.equal(manifest.style,'pixel-voxel');
});
for(const person of manifest.characters){
  test(`${person.role}: 관절과 걷기·착석 동작이 있는 실제 Blender 모델`,async()=>{
    const bytes=await readFile(new URL(person.file,base));
    const data=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    assert.equal(data.animations.length,1);
    let skinned=0;data.scene.traverse(node=>{if(node.isSkinnedMesh){skinned++;assert.equal(node.skeleton.bones.length,12);for(const key of ['position','normal'])assert.ok(node.geometry.attributes[key].array.every(Number.isFinite),key+' must be finite');}});
    assert.ok(skinned>0);
    const mixer=new THREE.AnimationMixer(data.scene);
    const thigh=data.scene.getObjectByName('thigh_L'),knee=data.scene.getObjectByName('shin_L');
    const play=(name,time)=>{
      mixer.stopAllAction();const [from,to]=ANIMATION_RANGES[name];
      const clip=THREE.AnimationUtils.subclip(data.animations[0],name,from-.1,to-.1,30);
      if(name==='Walk'||name==='SitDown')assert.ok(Math.abs(clip.duration-1)<.001);
      const action=mixer.clipAction(clip).reset().play();action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;
      mixer.update(time);data.scene.updateMatrixWorld(true);
    };
    play('Idle',0);const idle=thigh.quaternion.clone();
    const thighLength=thigh.getWorldPosition(new THREE.Vector3()).distanceTo(knee.getWorldPosition(new THREE.Vector3()));
    play('Walk',.25);assert.ok(idle.angleTo(thigh.quaternion)>.3,'다리 관절이 실제로 움직여야 한다');
    const root=data.scene.getObjectByName('root');
    play('Idle',0);const standingHeight=root.getWorldPosition(new THREE.Vector3()).y;
    play('SitDown',.12);const crouchHeight=root.getWorldPosition(new THREE.Vector3()).y;
    play('SitDown',.7);const jumpHeight=root.getWorldPosition(new THREE.Vector3()).y;
    play('Seated',0);
    const seatedHeight=root.getWorldPosition(new THREE.Vector3()).y;
    assert.ok(crouchHeight<standingHeight-.02,'올라앉기 전에 몸을 살짝 낮춘다');
    assert.ok(jumpHeight>seatedHeight+.1,'의자 팔걸이 위로 올라갔다가 내려앉는다');
    const hipPosition=thigh.getWorldPosition(new THREE.Vector3()),kneePosition=knee.getWorldPosition(new THREE.Vector3());
    assert.ok(Math.abs(hipPosition.y-kneePosition.y)<.001,'앉으면 허벅지가 수평이어야 한다');
    assert.ok(Math.abs(kneePosition.z-hipPosition.z-thighLength)<.001,'무릎은 허벅지 길이만큼 몸 앞쪽을 향해야 한다');
    play('SitDown',1);const end=thigh.quaternion.clone();play('Seated',0);
    assert.ok(end.angleTo(thigh.quaternion)<.001,'착석 동작과 앉은 자세가 이어져야 한다');
  });
}
