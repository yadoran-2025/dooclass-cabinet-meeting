import * as THREE from './vendor/three.module.min.js';
import layout from './cabinet-layout.json' with { type: 'json' };
import { people } from './cabinet-model.mjs';
import { GLTFLoader } from './vendor/addons/loaders/GLTFLoader.js';
import { OrbitControls } from './vendor/addons/controls/OrbitControls.js';
import { placeSpeech } from './cabinet-speech.mjs';
import { lobbyPosition, exitRoute, planEntrance, sampleEntrance, ANIMATION_RANGES } from './cabinet-motion.mjs?v=20261023-entrance-seat1';

export function createRoom(host, labels, onPerson) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    host.innerHTML = '<div class="fallback-room"><div class="fallback-table">국무회의</div><p>3D를 사용할 수 없는 기기입니다. 아래 인물 버튼으로 활동할 수 있어요.</p></div>';
    return { update() {}, setView() {}, replay() {} };
  }
  host.append(renderer.domElement);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor('#dfe9e9', 1);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-9, 9, 5.5, -5.5, .1, 80);
  camera.position.set(13.8, 12, 17);
  camera.lookAt(1.6, .6, .3);
  const hemi = new THREE.HemisphereLight('#fff9e9', '#789693', 2.5);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff5dc', 3.2);
  sun.position.set(-3, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 15, bottom: -15 });
  sun.shadow.normalBias = .035;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#c4e0ed', 1.1);
  fill.position.set(8, 5, -6);
  scene.add(fill);

  const materials = new Map();
  function mat(color, roughness = .8) {
    const key = color + roughness;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness }));
    return materials.get(key);
  }
  function box(parent, x, y, z, w, h, d, color, shadow = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(parent, x, y, z, top, bottom, h, color, sides = 40) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, h, sides), mat(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function imagePlane(parent, width, height, x, y, z, draw, rotation = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = 384;
    draw(canvas.getContext('2d'), canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, roughness: 1 }));
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotation;
    parent.add(mesh);
    return mesh;
  }

  const room = new THREE.Group();scene.add(room);
  // Spatial features follow the official 2026-09-29 Sejong Room photographs.
  // Dimensions, reduced seat count, and the outside admission lane are teaching adaptations.
  const [roomX,roomZ]=layout.roomHalf;
  const back=-roomZ+.1, left=-roomX+.1;
  box(room,0,-.28,0,roomX*2,.55,roomZ*2,'#b19a7b');
  box(room,0,.015,0,roomX*2-.2,.05,roomZ*2-.2,'#ded8c8');
  box(room,0,2.3,back,roomX*2,4.6,.16,'#ece4d5');
  box(room,left,2.3,0,.16,4.6,roomZ*2,'#e9e1d1');
  const wood='#a47846', darkWood='#795033';
  for(const y of [.17,3.68,4.25,4.51]){
    box(room,0,y,back+.14,roomX*2-.1,.11,.15,wood);
    box(room,left+.14,y,0,.15,.11,roomZ*2-.3,wood);
  }
  for(const x of [-9,-6.2,-3.2,3.2,6.2,9])box(room,x,2.25,back+.17,.16,4.5,.16,wood);
  for(const z of [-8,-5,-2.2,2.2,5,8])box(room,left+.16,2.25,z,.18,4.5,.16,wood);
  function lattice(ctx,w,h){
    ctx.fillStyle='#e5ddcd';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#aa8458';ctx.lineWidth=3;
    for(let x=-h;x<w+h;x+=35){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+h,h);ctx.stroke();ctx.beginPath();ctx.moveTo(x,h);ctx.lineTo(x+h,0);ctx.stroke();}
  }
  imagePlane(room,roomX*2-.3,.47,0,3.96,back+.24,lattice);
  imagePlane(room,roomZ*2-.5,.47,left+.25,3.96,0,lattice,Math.PI/2);
  for(const x of [-7.5,-4.7,4.7,7.5]){
    box(room,x,2.15,back+.26,2.12,2.68,.08,'#c9d2d3');
    for(let xx=-.9;xx<=.9;xx+=.3)box(room,x+xx,2.15,back+.33,.018,2.54,.02,'#9b8a6e',false);
    for(let y=1;y<3.4;y+=.32)box(room,x,y,back+.34,2.04,.018,.02,'#9b8a6e',false);
    for(const side of [-1,1])for(let i=0;i<4;i++)box(room,x+side*(.87+i*.055),2.14,back+.43,.07,2.75,.08,i%2?'#e5decd':'#d4cbbb',false);
  }
  box(room,0,2.15,back+.3,5.66,3.95,.12,'#214a92');
  imagePlane(room,1.28,1.28,0,3.04,back+.38,(ctx,w,h)=>{
    ctx.save();ctx.translate(w/2,h/2);ctx.scale(w/h,1);
    ctx.fillStyle='#f3e9c9';ctx.beginPath();ctx.arc(0,0,171,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#244777';ctx.beginPath();ctx.arc(0,0,139,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ddbd69';
    for(const side of [-1,1]){
      ctx.save();ctx.scale(side,1);ctx.beginPath();ctx.moveTo(13,-20);ctx.bezierCurveTo(55,-110,125,-100,103,-50);ctx.bezierCurveTo(80,-87,61,-35,53,32);ctx.lineTo(38,68);ctx.lineTo(43,-15);ctx.closePath();ctx.fill();
      for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(55+i*8,-50);ctx.lineTo(121-i*5,6+i*15);ctx.lineTo(52+i*5,-20);ctx.fill();}ctx.restore();
    }
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(Math.sin(a)*17,38+Math.cos(a)*17,13,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#214a92';ctx.font='bold 23px sans-serif';ctx.textAlign='center';ctx.fillText('대 한 민 국',0,-146);ctx.restore();
  });
  // A schematic landscape occupies the photographed mural position; no photo texture is copied.
  imagePlane(room,6.2,2.7,left+.25,2.18,0,(ctx,w,h)=>{
    ctx.fillStyle='#98c1ce';ctx.fillRect(0,0,w,h);
    for(let layer=0;layer<3;layer++){
      ctx.fillStyle=['#8aab76','#547d61','#315b52'][layer];ctx.beginPath();ctx.moveTo(0,h);
      for(let i=0;i<=10;i++){const x=i*w/10,y=i%2===0?200+layer*27:45+layer*45;ctx.lineTo(x,y);}ctx.lineTo(w,h);ctx.fill();
    }
    for(const [x,color] of [[w*.17,'#f4eee0'],[w*.83,'#c76a55']]){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,48,18,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#c6ddca';ctx.lineWidth=3;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(0,h-7-i*9);for(let x=0;x<w;x+=12)ctx.lineTo(x,h-7-i*9+Math.sin(x/28)*4);ctx.stroke();}
  },Math.PI/2);
  for(const z of [-4.3,4.3]){
    box(room,left+.25,1.67,z,.13,3.2,1.65,darkWood);
    box(room,left+.35,1.65,z,.08,3.02,1.42,'#e8dfce');
  }
  function screen(x,y,z,w,h,rotation=0){
    const panel=new THREE.Group();panel.position.set(x,y,z);panel.rotation.y=rotation;room.add(panel);
    box(panel,0,0,0,w,h,.08,'#252b32');
    imagePlane(panel,w-.08,h-.08,0,0,.046,(ctx,cw,ch)=>{
      ctx.fillStyle='#12356a';ctx.fillRect(0,0,cw,ch);ctx.strokeStyle='#eee1b2';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cw/2,ch*.3,30,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#ffffff';ctx.font='bold 41px sans-serif';ctx.textAlign='center';ctx.fillText('국 무 회 의',cw/2,ch*.66);
    });return panel;
  }
  screen(-4.7,2.4,back+.56,1.65,.99);screen(4.7,2.4,back+.56,1.65,.99);
  function flag(x,presidential=false){
    cylinder(room,x,.13,back+.58,.23,.3,.16,'#9c8557');cylinder(room,x,1.64,back+.58,.018,.018,3.05,'#c3a366',12);
    imagePlane(room,1,.68,x+.43,2.6,back+.6,(ctx,w,h)=>{
      ctx.fillStyle=presidential?'#244d8b':'#fffdf5';ctx.fillRect(0,0,w,h);
      if(presidential){ctx.strokeStyle='#d6b760';ctx.lineWidth=18;ctx.strokeRect(18,18,w-36,h-36);ctx.fillStyle='#e5c578';ctx.font='bold 125px serif';ctx.textAlign='center';ctx.fillText('✿',w/2,h/2+40);return;}
      ctx.save();ctx.translate(w/2,h/2);const r=71;
      ctx.fillStyle='#bd4c51';ctx.beginPath();ctx.arc(0,0,r,Math.PI,0);ctx.arc(r/2,0,r/2,0,Math.PI);ctx.arc(-r/2,0,r/2,0,Math.PI,true);ctx.fill();
      ctx.fillStyle='#34558a';ctx.beginPath();ctx.arc(0,0,r,0,Math.PI);ctx.arc(-r/2,0,r/2,Math.PI,0);ctx.arc(r/2,0,r/2,Math.PI,0,true);ctx.fill();ctx.restore();
      [[245,90,-.6,[1,1,1]],[525,90,.6,[0,1,0]],[245,290,.6,[1,0,1]],[525,290,-.6,[0,0,0]]].forEach(([x,y,a,bars])=>{
        ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#29333c';bars.forEach((solid,i)=>{if(solid)ctx.fillRect(-34,-22+i*17,68,10);else{ctx.fillRect(-34,-22+i*17,28,10);ctx.fillRect(6,-22+i*17,28,10);}});ctx.restore();
      });
    });
  }
  flag(-2.67);flag(2.27,true);
  // A hollow rectangular table with paneled fronts, not a filled oval dining table.
  function desk(x,z,w,d){
    box(room,x,1.17,z,w,.13,d,'#895035');
    box(room,x,.66,z,w-.08,.91,d-.13,'#85492e');
    if(w>2)for(let xx=x-w/2+.6;xx<x+w/2;xx+=1.15){
      for(const edge of [-1,1])box(room,xx,.7,z+edge*(d/2-.05),1.02,.62,.045,'#9e6040');
    }
  }
  const [outerX,outerZ]=layout.tableOuter,[innerX,innerZ]=layout.tableInner;
  const railZ=(outerZ+innerZ)/2;
  desk(0,-railZ,outerX*2,outerZ-innerZ);desk(0,railZ,outerX*2,outerZ-innerZ);
  for(const x of [-1,1])desk(x*(outerX+innerX)/2,0,outerX-innerX,innerZ*2);
  for(const x of [-3.2,0,3.2]){
    const display=screen(x,.52,-innerZ+.22,1.35,.76);display.rotation.x=-.28;
  }
  function chair(x,z,angle,secondary=false){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;room.add(g);
    box(g,0,.59,0,.69,.17,.64,'#453936');box(g,0,1.05,-.26,.69,.92,.14,'#493936');
    for(const xx of [-.34,.34])box(g,xx,.83,0,.07,.09,.52,'#332f2d');
    cylinder(g,0,.3,0,.05,.06,.5,'#7c7d7c',12);
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5;const foot=box(g,Math.sin(a)*.18,.09,Math.cos(a)*.18,.06,.05,.42,'#686c6b');foot.rotation.y=a;
    }
    if(secondary)return;
    const deskZ=Math.sign(z)*(railZ+.18);
    const work=new THREE.Group();work.position.set(x,1.25,deskZ);work.rotation.y=z>0?Math.PI:0;room.add(work);
    box(work,0,.018,0,.54,.03,.37,'#303b47');
    const laptop=box(work,0,.23,.16,.54,.4,.035,'#354050');laptop.rotation.x=.15;
    box(work,0,.23,.137,.47,.32,.012,'#6f8998',false);
    box(work,.36,.015,-.01,.18,.02,.25,'#ebe9df');
    const mic=cylinder(work,-.35,.16,.07,.012,.018,.3,'#242b30',8);mic.rotation.x=-.4;
    box(work,.3,.07,.27,.28,.12,.035,'#463725');
  }
  for(const z of [-layout.mainRowZ,layout.mainRowZ])for(const x of layout.mainRowX)chair(x,z,z>0?Math.PI:0);
  for(const z of [-1.2,1.2])chair(-outerX-.7,z,Math.PI/2,true);
  for(const row of layout.observerRows){
    for(const x of row.x){
      chair(x,row.z,row.z>0?Math.PI:0,true);
      box(room,x,1.13,row.deskZ,1.45,.1,.64,'#90583b');
      const work=new THREE.Group();work.position.set(x,1.2,row.deskZ);work.rotation.y=row.z>0?Math.PI:0;room.add(work);
      box(work,-.1,.015,0,.45,.02,.3,'#e9e7da');
      box(work,.43,.07,-.12,.24,.13,.035,'#6b5844');
    }
    // A small floor sign identifies the area without assigning real-world fixed seats to offices.
    const sign=imagePlane(room,3,.52,0,.06,row.z>0?7.75:-5.75,(ctx,w,h)=>{
      ctx.fillStyle='#dfd8c8';ctx.fillRect(0,0,w,h);ctx.fillStyle='#53655f';
      ctx.font='bold 105px sans-serif';ctx.textAlign='center';ctx.fillText('배 석 석',w/2,h*.7);
    });sign.rotation.x=-Math.PI/2;
  }
  const lobbyCenter=roomX+2.5;
  box(room,lobbyCenter,-.28,0,5,.55,roomZ*2,'#b6a58e');box(room,lobbyCenter,.015,0,4.9,.05,roomZ*2-.2,'#e4ded0');
  for(let i=0;i<6;i++)box(room,layout.lobbyX,.048,layout.lobbyStartZ+i*layout.lobbyPitch,.85,.008,.02,'#c4baa6',false);
  const [doorX,doorZ]=layout.door;
  for(const z of [doorZ-.93,doorZ+.93])box(room,doorX,1.43,z,.26,2.86,.17,wood);
  box(room,doorX,2.84,doorZ,.26,.18,2.04,wood);
  const doorPivot=new THREE.Group();doorPivot.position.set(doorX,.05,doorZ-.82);room.add(doorPivot);
  box(doorPivot,0,1.28,.81,.10,2.56,1.62,'#9a754b');
  box(doorPivot,-.065,1.4,.81,.04,1.72,1.32,'#e5d7bd');box(doorPivot,.065,1.4,.81,.04,1.72,1.32,'#e5d7bd');
  cylinder(doorPivot,-.1,1.05,1.38,.035,.035,.19,'#c8ac75',12);
  const loadNotice=document.createElement('span');loadNotice.className='model-status';
  loadNotice.textContent='3D 인물 준비 중';loadNotice.setAttribute('role','status');host.append(loadNotice);
  const actors = new Map();
  function person(id,color,x,z,style=0){
    const hair=['#3b3538','#704631','#343e47','#8c5c3d','#363c49','#573b32','#4d3e36','#775543'][style];
    const skin=['#f0c4a0','#deb08b','#f2c89f','#f2c89f','#deb08b','#f0c4a0','#f0c4a0','#f2c89f'][style];
    const root=new THREE.Group();root.position.set(x,.08,z);root.userData.id=id;
    box(root,-.13,.12,.05,.2,.18,.34,'#344b4b');box(root,.13,.12,.05,.2,.18,.34,'#344b4b');
    box(root,-.13,.39,0,.19,.43,.22,'#516366');box(root,.13,.39,0,.19,.43,.22,'#516366');
    box(root,0,.84,0,.55,.57,.3,color);
    box(root,-.35,.83,0,.16,.47,.24,color);box(root,.35,.83,0,.16,.47,.24,color);
    box(root,-.35,.56,.02,.16,.14,.24,skin);box(root,.35,.56,.02,.16,.14,.24,skin);
    box(root,0,1.34,0,.51,.5,.43,skin);
    box(root,0,1.6,-.02,.55,.13,.47,hair);
    box(root,-.23,1.47,-.02,.09,.2,.43,hair);
    box(root,-.12,1.36,.222,.055,.07,.015,'#344442',false);box(root,.12,1.36,.222,.055,.07,.015,'#344442',false);
    box(root,0,1.2,.222,.1,.025,.015,'#b4786b',false);
    if(style===2||style===3){box(root,0,1.36,.24,.39,.025,.025,'#655b45',false);for(const xx of [-.12,.12]){box(root,xx,1.29,.24,.17,.02,.025,'#655b45',false);for(const edge of [-.085,.085])box(root,xx+edge,1.325,.24,.02,.09,.025,'#655b45',false);}}
    if([1,4,7].includes(style))box(root,0,1.28,-.2,.54,.61,.15,hair);
    if(style===1){box(root,.16,1.64,.1,.13,.11,.08,'#d27891');box(root,.3,1.64,.1,.13,.11,.08,'#d27891');}
    if(style===4||style===7){box(root,-.04,1.69,0,.65,.15,.51,'#b09acb');box(root,-.13,1.79,0,.38,.06,.35,'#b09acb');}
    if(style===5){box(root,0,1.74,-.08,.22,.18,.23,hair);box(root,0,1.1,-.2,.5,.3,.14,hair);}
    if(style===6){box(root,0,1.09,.17,.44,.1,.08,'#e19d86');box(root,.13,.96,.17,.12,.2,.08,'#e19d86');}
    scene.add(root);
    root.traverse(mesh=>{if(mesh.isMesh)mesh.userData.person=id;});
    const label=document.createElement('button');label.className='seat-label';label.dataset.person=id;
    label.addEventListener('click',()=>onPerson(id));labels.append(label);
    const entry={id,root,label,home:new THREE.Vector3(x,.08,z),phase:'waiting',pose:'Idle',mode:'waiting',mixer:null,actions:{}};
    actors.set(id,entry);return entry;
  }
  const president=person('president','#6688a8',...layout.president,6);
  president.root.rotation.y=0;president.pose='Seated';president.phase='seated';
  president.label.innerHTML='대통령<small>의장</small>';
  president.label.disabled=true;
  people.forEach((p,i)=>{const [x,z]=lobbyPosition(i);person(p.id,p.color,x,z,i);});
  const legal=person('legislation','#e5d3ae',...layout.legislation,7);
  legal.root.visible=false;legal.label.hidden=true;legal.pose='Seated';legal.phase='seated';
  const ring = new THREE.Mesh(new THREE.RingGeometry(.47,.53,40), new THREE.MeshBasicMaterial({color:'#c79c42',side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.07;ring.visible=false;scene.add(ring);
  const speakingLight=new THREE.PointLight('#ffe3a0',0,6,2);scene.add(speakingLight);
  function emphasize(actor,speaking){
    actor.speaking=speaking;actor.label.classList.toggle('speaking',speaking);
    actor.label.dataset.speakingLabel=speech?.badge||'';
    if(speaking)actor.label.setAttribute('aria-current','true');else actor.label.removeAttribute('aria-current');
    for(const item of actor.highlightMaterials||[]){
      item.material.emissive.copy(speaking?new THREE.Color('#c79936'):item.emissive);
      item.material.emissiveIntensity=speaking?.22:item.intensity;
    }
  }
  const areaMarkers=layout.observerRows.map(row=>{
    const label=document.createElement('span');label.className='seat-label area-label';label.textContent='배석석';labels.append(label);
    return {label,position:new THREE.Vector3(row.z<0?-7.8:-6.5,1.5,row.deskZ)};
  });

  let stage=0, selected='', statuses={}, view='room', frame=0, lastTime=0, active=null, speech=null;
  let queue=[], contextLost=false;
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;
  controls.minPolarAngle=.15;
  controls.maxPolarAngle=Math.PI/2-.08;
  controls.minZoom=.55;
  controls.maxZoom=4;
  controls.rotateSpeed=.65;
  controls.zoomSpeed=.85;
  let interacting=false, pointerStart=null, dragged=false;
  function customView(){
    view='custom';
    document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed','false'));
  }
  controls.addEventListener('start',()=>{interacting=true;});
  controls.addEventListener('end',()=>{interacting=false;});
  controls.addEventListener('change',()=>{if(interacting)customView();schedule();});
  const canvas=renderer.domElement;
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','국무회의실. 드래그로 회전, 휠로 확대·축소. 키보드는 Shift와 방향키로 회전, 더하기·빼기로 확대·축소합니다.');
  canvas.addEventListener('keydown',event=>{
    if(event.shiftKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)){
      event.preventDefault();
      const orbit=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if(event.code==='ArrowLeft')orbit.theta-=.08;
      if(event.code==='ArrowRight')orbit.theta+=.08;
      if(event.code==='ArrowUp')orbit.phi-=.08;
      if(event.code==='ArrowDown')orbit.phi+=.08;
      orbit.phi=THREE.MathUtils.clamp(orbit.phi,controls.minPolarAngle,controls.maxPolarAngle);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit));
      controls.update();customView();schedule();return;
    }
    if(!['+','=','-','_'].includes(event.key))return;
    event.preventDefault();
    camera.zoom=THREE.MathUtils.clamp(camera.zoom*(['+','='].includes(event.key)?1.15:1/1.15),controls.minZoom,controls.maxZoom);
    camera.updateProjectionMatrix();controls.update();customView();schedule();
  });
  canvas.addEventListener('pointerdown',event=>{
    if(event.isPrimary){pointerStart={id:event.pointerId,x:event.clientX,y:event.clientY};dragged=false;}
    else dragged=true;
    canvas.classList.add('dragging');
    canvas.focus({preventScroll:true});
  });
  canvas.addEventListener('pointermove',event=>{
    if(pointerStart?.id===event.pointerId&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>5)dragged=true;
  });
  function endPointer(){pointerStart=null;canvas.classList.remove('dragging');}
  canvas.addEventListener('pointerup',endPointer);
  canvas.addEventListener('pointercancel',()=>{dragged=true;endPointer();});
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const seatAngle=(x,z)=>Math.abs(z)>2.5?(z>0?Math.PI:0):Math.atan2(-x,-z);
  function pose(actor,name,immediate=false){
    actor.pose=name;
    if(!actor.mixer)return;
    const next=actor.actions[name];
    if(!next)return;
    if(actor.action===next&&!immediate)return;
    const previous=actor.action;
    if(immediate||name==='Seated')actor.mixer.stopAllAction();
    next.stopFading().reset().setEffectiveWeight(1).setEffectiveTimeScale(name==='Walk'||name==='SitDown'?0:1).play();
    next.setLoop(name==='Walk'||name==='Idle'?THREE.LoopRepeat:THREE.LoopOnce,Infinity);
    next.clampWhenFinished=true;actor.action=next;
    if(previous&&previous!==next&&!immediate&&name!=='Seated')next.crossFadeFrom(previous,.14,false);
    if(immediate&&name==='SitDown')next.time=(actor.sitProgress||0)*next.getClip().duration;
    actor.mixer.update(0);
  }
  function locate(actor,point,angle=0){actor.root.position.set(point[0],.08,point[1]);actor.root.rotation.y=angle;}
  function snap(actor,p,done){
    if(p.allow&&(done||stage>0)){
      const point=stage===2&&p.id==='premier'?layout.president:p.seat;
      locate(actor,point,seatAngle(...point));pose(actor,'Seated');actor.phase='seated';
    }else if(done){locate(actor,exitRoute(people.indexOf(p)).at(-1),-Math.PI/2);pose(actor,'Idle');actor.phase='denied';}
    else{actor.root.position.copy(actor.home);actor.root.rotation.y=0;pose(actor,'Idle');actor.phase='waiting';}
  }
  function startNext(){
    if(active||!queue.length)return;
    active=queue.shift();const actor=actors.get(active.id);
    locate(actor,active.plan.path[0]);actor.phase='walking';active.elapsed=0;
    pose(actor,'Walk');
  }
  function enqueue(p){
    const actor=actors.get(p.id);
    if(active?.id===p.id||queue.some(job=>job.id===p.id))return;
    const index=people.indexOf(p);
    queue.push({id:p.id,person:p,plan:planEntrance(p,index),elapsed:0});
    actor.phase='queued';startNext();schedule();
  }
  function publishState(actor){
    // These attributes also let accessible labels report whether a person is still moving.
    actor.label.dataset.phase=actor.phase;
    actor.label.dataset.x=actor.root.position.x.toFixed(3);
    actor.label.dataset.z=actor.root.position.z.toFixed(3);
    actor.label.dataset.pose=actor.pose;
  }
  function draw(time){
    frame=0;if(contextLost)return;
    const dt=lastTime?Math.min((time-lastTime)/1000,.15):1/60;lastTime=time;
    if(active){
      const actor=actors.get(active.id);
      if(reduced.matches){snap(actor,active.person,true);active=null;startNext();}
      else{
        active.elapsed+=dt;
        const point=sampleEntrance(active.plan,active.elapsed);
        actor.root.position.set(point.x,.08,point.z);actor.root.rotation.y=point.angle;
        actor.phase=point.phase;actor.sitProgress=point.sitProgress;
        pose(actor,point.phase==='walking'?'Walk':point.phase==='sitting'?'SitDown':point.phase==='seated'?'Seated':'Idle');
        if(actor.action&&point.phase==='walking')actor.action.time=point.gait*actor.action.getClip().duration;
        if(actor.action&&point.phase==='sitting')actor.action.time=point.sitProgress*actor.action.getClip().duration;
        if(point.done){active=null;startNext();}
      }
    }
    const doorTarget=active?.person.allow?-Math.PI/2:0;
    const difference=doorTarget-doorPivot.rotation.y;
    doorPivot.rotation.y+=reduced.matches?difference:Math.sign(difference)*Math.min(Math.abs(difference),dt*3.5);
    host.dataset.motion=active?`${active.id}:${actors.get(active.id).phase}`:'idle';
    camera.updateMatrixWorld();
    for(const marker of areaMarkers){
      const v=marker.position.clone().project(camera);
      marker.label.style.visibility=v.x>-.96&&v.x<.96&&v.y>-.88&&v.y<.9?'visible':'hidden';
      marker.label.style.left=`${(v.x+1)*host.clientWidth/2}px`;
      marker.label.style.top=`${(-v.y+1)*host.clientHeight/2}px`;
    }
    for(const actor of actors.values()){
      if(actor.mixer&&actor.root.visible)actor.mixer.update(dt);
      publishState(actor);
      if(actor.root.visible){
        const v=(actor.head?actor.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,actor.speaking?1.9:1.5,0))
          :actor.root.position.clone().add(new THREE.Vector3(0,2.2,0))).project(camera);
        const visible=v.x>-.98&&v.x<.98&&v.y>-.9&&v.y<.91;
        actor.label.style.visibility=visible?'visible':'hidden';
        actor.label.style.left=`${(v.x+1)*host.clientWidth/2}px`;
        actor.label.style.top=`${(-v.y+1)*host.clientHeight/2}px`;
      }
    }
    const speaker=speech?.personId?actors.get(speech.personId):null;
    const current=speaker||actors.get(selected);ring.visible=!!current?.root.visible;
    ring.scale.setScalar(speaker?1.5:1);
    if(current)ring.position.set(current.root.position.x,.071,current.root.position.z);
    speakingLight.intensity=speaker?1.5:0;
    if(speaker)speakingLight.position.set(speaker.root.position.x,3.4,speaker.root.position.z);
    if(speech?.element?.isConnected){
      const point=speaker?(speaker.head?speaker.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,1.1,0))
        :speaker.root.position.clone().add(new THREE.Vector3(0,2,0))):new THREE.Vector3(0,2.7,0);
      point.project(camera);
      const element=speech.element;
      const position=placeSpeech({width:host.clientWidth,height:host.clientHeight,bubbleWidth:element.offsetWidth,bubbleHeight:element.offsetHeight,
        x:(point.x+1)*host.clientWidth/2,y:(1-point.y)*host.clientHeight/2,hasActor:!!speaker});
      element.style.left=`${position.left}px`;element.style.top=`${position.top}px`;
      element.dataset.side=Math.abs(point.x)<1&&Math.abs(point.y)<1?position.side:'none';
      element.style.setProperty('--speech-tail',`${position.tail}px`);
    }
    renderer.render(scene,camera);
    if(active||Math.abs(doorTarget-doorPivot.rotation.y)>.001)frame=requestAnimationFrame(draw);
    else lastTime=0;
  }
  function schedule(){if(!frame&&!contextLost)frame=requestAnimationFrame(draw);}
  function preset(next){
    if(next==='speaker'&&!speech?.personId)return preset('table');
    view=next;
    const speaker=actors.get(speech?.personId),small=host.clientWidth<760;
    const speakerZoom=small?3.2:2.2;
    const worldWidth=Math.max(30.5,19.6*host.clientWidth/host.clientHeight);
    const speakerHeight=small?2+host.clientHeight*.18/(host.clientWidth*speakerZoom/worldWidth*.875):1.6;
    const focus=view==='speaker'?[speaker.root.position.x,speakerHeight,speaker.root.position.z]
      :view==='entrance'?[10.6,1,2.3]:view==='observers'?[0,1.15,-5.6]:view==='table'?[0,1.55,0]:[2.6,1.55,0];
    controls.target.set(...focus);
    camera.position.set(focus[0]+12.2,focus[1]+11.4,focus[2]+16.7);
    camera.zoom=view==='speaker'?speakerZoom:view==='entrance'?2.3:view==='observers'?1.65:view==='table'?1.45:1;
    document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));
    camera.updateProjectionMatrix();controls.update();schedule();
  }
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);
    const width=Math.max(30.5,19.6*w/h);
    camera.left=-width/2;camera.right=width/2;camera.top=width*h/w/2;camera.bottom=-camera.top;
    if(view==='speaker')return preset('speaker');
    camera.updateProjectionMatrix();schedule();
  }
  preset('room');
  new ResizeObserver(resize).observe(host);
  const raycaster=new THREE.Raycaster();
  renderer.domElement.addEventListener('click',event=>{
    if(dragged||event.button!==0)return;
    const rect=renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
    const hit=raycaster.intersectObjects([...actors.values()].filter(a=>a.root.visible).map(a=>a.root),true)[0];
    if(hit?.object.userData.person)onPerson(hit.object.userData.person);
  });
  renderer.domElement.addEventListener('webglcontextlost',event=>{
    event.preventDefault();contextLost=true;cancelAnimationFrame(frame);frame=0;active=null;queue=[];
    controls.dispose();
    host.innerHTML='<div class="fallback-room"><div class="fallback-table">국무회의</div><p>3D 연결이 끊겼습니다. 아래 버튼으로 활동을 계속할 수 있어요.</p></div>';labels.replaceChildren();
  });
  const loader=new GLTFLoader();
  Promise.allSettled([...actors.values()].map(async actor=>{
    const gltf=await loader.loadAsync(`./assets/cabinet/${actor.id}.glb?v=pixel-motion-5`);
    if(contextLost)return;
    const source=gltf.animations[0];
    if(!source)throw new Error(`Animation missing: ${actor.id}`);
    const old=[...actor.root.children];
    actor.root.clear();actor.root.add(gltf.scene);
    for(const child of old)child.traverse(node=>{if(node.isMesh)node.geometry.dispose();});
    gltf.scene.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;node.userData.person=actor.id;}});
    actor.mixer=new THREE.AnimationMixer(gltf.scene);
    actor.head=gltf.scene.getObjectByName('head');
    const actorMaterials=new Set();gltf.scene.traverse(node=>{if(node.isMesh)for(const material of Array.isArray(node.material)?node.material:[node.material])if(material.emissive)actorMaterials.add(material);});
    actor.highlightMaterials=[...actorMaterials].map(material=>({material,emissive:material.emissive.clone(),intensity:material.emissiveIntensity}));
    emphasize(actor,!!speech?.personId&&speech.personId===actor.id);
    for(const [name,[from,to]] of Object.entries(ANIMATION_RANGES)){
      // A fraction-of-frame margin avoids Float32 timestamps crossing clip boundaries.
      actor.actions[name]=actor.mixer.clipAction(THREE.AnimationUtils.subclip(source,name,from-.1,to-.1,30));
    }
    actor.label.dataset.model='blender';pose(actor,actor.pose,true);schedule();
  })).then(results=>{
    if(contextLost)return;
    const failures=results.filter(result=>result.status==='rejected');
    host.dataset.models=failures.length?'fallback':'ready';
    if(failures.length){loadNotice.textContent='일부 인물은 간단 모형으로 표시됩니다.';console.warn('3D model load failed',failures.map(f=>f.reason));}
    else loadNotice.remove();
    schedule();
  });
  return {
    update(next){
      const changedStage=stage!==next.stage;
      speech=next.speech||null;
      const reset=Object.keys(statuses).some(id=>!Object.hasOwn(next.statuses,id));
      const previous=statuses;stage=next.stage;selected=next.selected||'';statuses={...next.statuses};
      if(changedStage||reset){active=null;queue=[];}
      president.root.visible=stage!==2;president.label.hidden=stage===2;pose(president,'Seated');
      for(const p of people){
        const actor=actors.get(p.id),done=Object.hasOwn(statuses,p.id);
        actor.root.visible=stage===0||p.allow;actor.label.hidden=!actor.root.visible;
        if(changedStage||reset||stage>0||!done)snap(actor,p,done);
        else if(!Object.hasOwn(previous,p.id)){
          if(reduced.matches)snap(actor,p,true);else enqueue(p);
        }
        actor.label.classList.toggle('active',p.id===selected);
        actor.label.classList.toggle('waiting',!done&&stage===0);
        actor.label.innerHTML=p.name+(done||stage>0?`<small>${p.allow?(stage===2&&p.id==='premier'?'이 회의 주재':p.role):'입장 불가'}</small>`:'');
        actor.label.setAttribute('aria-label',p.name+(done||stage>0?` · ${p.allow?(stage===2&&p.id==='premier'?'이 회의 주재':p.role):'입장 불가'}`:' · 입장 판단'));
      }
      legal.root.visible=stage===2;legal.label.hidden=stage!==2;
      locate(legal,layout.legislation,0);pose(legal,'Seated');
      legal.label.innerHTML='법제처장<small>배석자</small>';legal.label.classList.toggle('active',selected==='legislation');
      for(const actor of actors.values())emphasize(actor,!!speech?.personId&&speech.personId===actor.id);
      if(changedStage)preset(speech?'table':'room');
      schedule();
    },
    setView(next){preset(next);},
    replay(id){
      const p=people.find(person=>person.id===id);
      if(stage!==0||!p?.allow||!Object.hasOwn(statuses,id))return;
      if(reduced.matches){snap(actors.get(id),p,true);schedule();return;}
      enqueue(p);
    },
  };
}
