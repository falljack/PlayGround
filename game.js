import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const mount = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101715);
scene.fog = new THREE.FogExp2(0x101715, 0.019);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.08, 180);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
mount.appendChild(renderer.domElement);

const mats = {};
const mat = (name, color, roughness = 1, extra = {}) => mats[name] ||= new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const wood = mat('wood', 0x54463a), darkWood = mat('darkWood', 0x302d28), wallMat = mat('wall', 0x736c5c), roofMat = mat('roof', 0x303a34), groundMat = mat('ground', 0x28342b), roadMat = mat('road', 0x252a27), asphaltMat = mat('asphalt', 0x323532), pineMat = mat('pine', 0x172b22), pineHi = mat('pineHi', 0x263b2b), barkMat = mat('bark', 0x40372d), metalMat = mat('metal', 0x59605a, .55, { metalness: .5 }), rustyMat = mat('rust', 0x574339, .8, { metalness: .2 }), glassMat = mat('glass', 0x202c2b, .25, { metalness: .65 }), windowMat = mat('window', 0x111a18, .2, { emissive: 0x101b18, emissiveIntensity: .35 }), clothMat = mat('cloth', 0x777d70), ghostMat = mat('ghost', 0xc8d7c9, .35, { transparent: true, opacity: .68, emissive: 0x8eaa9b, emissiveIntensity: 1.25, side: THREE.DoubleSide }), ghostDark = mat('ghostDark', 0x28372f, .8), partGlow = mat('partGlow', 0xb9c99c, .35, { emissive: 0x829e68, emissiveIntensity: 2.2 }), lightMat = mat('light', 0xffdf9a, .4, { emissive: 0xffbc62, emissiveIntensity: 1.8 });
const boxGeo = new THREE.BoxGeometry(1,1,1);
function box(parent, x,y,z, sx,sy,sz, material, cast=true) { const m = new THREE.Mesh(boxGeo, material); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow=cast; m.receiveShadow=true; parent.add(m); return m; }
function group(parent=scene,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function cylinder(parent,x,y,z,r1,r2,h,material,segments=8){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function sphere(parent,x,y,z,r,material,segments=12){const m=new THREE.Mesh(new THREE.SphereGeometry(r,segments,segments),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}

// Moonlit, rain-soaked county.
scene.add(new THREE.HemisphereLight(0x899a9a, 0x171d19, .58));
const moon = new THREE.DirectionalLight(0x9cadbd, 1.15); moon.position.set(-22,32,-35); moon.castShadow=true; moon.shadow.mapSize.set(1024,1024); moon.shadow.camera.left=-55;moon.shadow.camera.right=55;moon.shadow.camera.top=55;moon.shadow.camera.bottom=-55;scene.add(moon);
const ambient = new THREE.AmbientLight(0x6a7668,.32);scene.add(ambient);
const flashlight = new THREE.SpotLight(0xdce9ca, 0, 27, Math.PI/7, .52, 1.35); flashlight.position.set(0,0,0); flashlight.castShadow=false;camera.add(flashlight);const flashTarget=new THREE.Object3D();flashTarget.position.set(0,-.12,-1);camera.add(flashTarget);flashlight.target=flashTarget;scene.add(camera);
// Correctly add a small warm point light for the starting room.
const houseLamp = new THREE.PointLight(0xcaa879, 1.2, 13, 2);houseLamp.position.set(1,3,1);scene.add(houseLamp);

// Terrain, lane, and derelict town.
box(scene,0,-.42,-48,220,.8,220,groundMat,false);
box(scene,0,-.02,-52,7,.08,128,roadMat,false);
for(let z=-10;z>-112;z-=13){box(scene,0,.03,z, .12,.04,2.4,mat(`dash${z}`,0x77776b),false)}
// A weathered house you must leave first: door faces the road.
const house=group(scene,0,0,0);
box(house,0,1.8,0,10,3.6,10,wallMat);box(house,0,3.85,0,10.6,.35,10.6,darkWood);
// split front wall, leaving central door opening toward -Z
box(house,-3.65,1.8,-4.95,2.7,3.6,.28,wallMat);box(house,3.65,1.8,-4.95,2.7,3.6,.28,wallMat);box(house,0,3.2,-4.95,4.6,.8,.28,wallMat);
// roof planes
const roofL=box(house,-2.62,4.35,0,5.7,.32,11,roofMat);roofL.rotation.z=-.42;const roofR=box(house,2.62,4.35,0,5.7,.32,11,roofMat);roofR.rotation.z=.42;
box(house,0,.1,0,9.7,.2,9.7,darkWood,false);
// broken window panes / sills
for(const x of [-3.6,3.6]){box(house,x,2.15,-5.12,1.35,1.25,.12,windowMat);box(house,x,1.48,-5.16,1.55,.12,.28,wood);box(house,x,2.15,-5.22,.08,1.35,.1,darkWood);box(house,x,2.15,-5.22,1.5,.07,.1,darkWood)}
// Door ajar
const door=group(house,-2.05,0,-4.83);door.rotation.y=Math.PI/2;box(door,1.03,1.35,0,2.05,2.7,.16,darkWood);sphere(door,.28,1.35,-.12,.06,lightMat,8);
// Interior set dressing
box(house,-2,.55,-1.7,2.2,.9,1.35,darkWood);box(house,-2,1.04,-1.7,2.27,.12,1.4,clothMat);box(house,-2.65,1.22,-1.68,.78,.26,1.2,mat('pillow',0x9b9380));
box(house,3,.75,1,1.1,1.5,1.1,wood);box(house,3,1.54,1,1.2,.12,1.15,darkWood);box(house,2.55,2.8,-1.8,1.1,1.8,.12,darkWood);box(house,2.55,2.8,-1.7,.86,1.5,.04,mat('portrait',0x4c554a));
// Door threshold and outside porch
box(scene,0,.05,-5.6,4.5,.16,2.4,wood);

function makeHouse(x,z,scale=1){const g=group(scene,x,0,z);box(g,0,1.7,0,8*scale,3.4,8*scale,mat(`housewall${x}`,0x514f43));box(g,0,3.55,0,8.5*scale,.3,8.5*scale,roofMat);for(const sx of [-1,1]){const r=box(g,sx*2,4.15,0,4.5*scale,.25,8.7*scale,mat(`roof${x}${sx}`,0x29332e));r.rotation.z=-sx*.48;}for(const sx of [-2.6,2.6])box(g,sx*scale,1.8,-4.05*scale,1.2*scale,1.1,.08,windowMat);return g;}
makeHouse(-17,-34,1);makeHouse(17,-64,.9);makeHouse(-18,-87,1.08);
// Lean-to garage with a recognizable open front.
const garage=group(scene,-12,0,-28);box(garage,0,1.55,0,9,3.1,7,mat('garageWall',0x4d4b40));box(garage,0,3.18,0,9.4,.22,7.4,roofMat);box(garage,0,1.35,-3.55,4.2,2.7,.16,darkWood);box(garage,-2.8,1.5,-3.62,1.4,1.6,.08,windowMat);box(garage,2.8,1.5,-3.62,1.4,1.6,.08,windowMat);
// Trees along road and far ridge.
let seed=872;
const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<92;i++){const z=-7-rand()*112;const side=rand()<.5?-1:1;const x=side*(11+rand()*43);const h=5+rand()*8;const g=group(scene,x,0,z);cylinder(g,0,h*.28,0,.22,.38,h*.56,barkMat,7);for(let n=0;n<3;n++)cylinder(g,0,h*(.45+n*.17),0,h*(.31-n*.075),0,h*.43,n%2?pineMat:pineHi,7);}
// roadside telephone poles and leaning power cables (thin segments)
for(let z=-12;z>-110;z-=19){for(const x of [-8,8]){cylinder(scene,x,4.3,z,.12,.16,8,barkMat,6);box(scene,x,7.5,z,1.5,.12,.15,darkWood);}}

// Abandoned car, detail props, and escape checkpoint.
const car=group(scene,0,0,-98);const carBody=mat('carBody',0x5b625b,.52,{metalness:.48});box(car,0,.82,0,4.2,.85,7.4,carBody);box(car,0,1.55,-.25,3.5,1.2,3.6,carBody);box(car,0,1.62,-.25,3.18,.85,3.3,glassMat,false);box(car,0,2.18,-.25,3.7,.12,3.8,darkWood);box(car,0,1.3,-3.73,3.7,.16,.12,metalMat);box(car,-1.65,.73,-3.8,.7,.25,.12,lightMat);box(car,1.65,.73,-3.8,.7,.25,.12,lightMat);
const wheels=[];for(const x of [-2.05,2.05])for(const z of [-2.4,2.4]){const w=cylinder(car,x,.52,z,.57,.57,.34,mat('rubber',0x171a18),12);w.rotation.z=Math.PI/2;wheels.push(w);cylinder(car,x*1.1,.52,z,.29,.29,.36,metalMat,10).rotation.z=Math.PI/2;}
// Exit road barrier
box(scene,0,.65,-109,10,.18,.18,mat('barrier',0x746347));for(let i=0;i<5;i++){box(scene,-4+i*2,.68,-109,1,.22,.2,i%2?mat(`stripe${i}`,0xc4b995):mat(`stripeb${i}`,0x343936));}
// Part props with little beacon light and labels represented in-world.
const collectibles=[];
function makePart(id,label,x,z,kind){const g=group(scene,x,0,z);const baseY=.3;if(kind==='battery'){box(g,0,.47,0,.66,.72,.44,mat('batteryBody',0x39463d,.5,{metalness:.25}));box(g,-.19,.86,0,.15,.08,.2,metalMat);box(g,.19,.86,0,.15,.08,.2,metalMat);box(g,0,.52,.228,.38,.26,.025,mat('batteryLabel',0xaaa78f));}
if(kind==='tire'){const tire=new THREE.Mesh(new THREE.TorusGeometry(.53,.19,9,18),mat('tireRubber',0x171a18));tire.rotation.x=Math.PI/2;tire.position.y=.54;tire.castShadow=true;g.add(tire);cylinder(g,0,.54,0,.25,.25,.4,metalMat,12);}
if(kind==='fuel'){const can=group(g,0,.48,0);box(can,0,0,0,.62,.82,.38,mat('gascan',0x7d4234,.6,{metalness:.18}));box(can,0,.48,0,.24,.14,.24,rustyMat);box(can,0,.06,.2,.39,.2,.025,mat('fuelLabel',0xb7a58d));}
const orb=sphere(g,0,1.18,0,.12,partGlow);const glow=new THREE.PointLight(0xc0d898,.8,4,2);glow.position.set(0,1.3,0);g.add(glow);collectibles.push({id,label,group:g,orb,found:false,baseY});}
makePart('battery','CAR BATTERY',-12,-28,'battery');makePart('tire','SPARE TIRE',12,-51,'tire');makePart('fuel','GAS CAN',-8,-76,'fuel');

// Hide spots — lockers in the garage and roadside crates.
const hides=[];
function makeLocker(x,z){const g=group(scene,x,0,z);box(g,0,1.05,0,1.35,2.1,.85,mat('locker',0x394641,.5,{metalness:.48}));box(g,-.55,1.06,.45,.055,1.9,.05,metalMat);box(g,.55,1.06,.45,.055,1.9,.05,metalMat);box(g,0,.08,.46,.12,.12,.06,lightMat);hides.push({group:g,x,z,label:'LOCKER'});}
function makeCrate(x,z){const g=group(scene,x,0,z);box(g,0,.65,0,1.6,1.3,1.4,wood);for(let i=0;i<4;i++){const b=box(g,-.6+i*.4,.66,.72,.12,1.15,.06,darkWood);b.rotation.z=(i%2?.1:-.1)}hides.push({group:g,x,z,label:'CRATE'});}
makeLocker(-4,-40);makeCrate(5,-62);makeLocker(4,-83);
// scattered wreckage, barrels, fence silhouettes
for(const [x,z] of [[-8,-18],[8,-35],[-5,-47],[7,-71],[-13,-58],[13,-90]]){cylinder(scene,x,.65,z,.42,.42,1.3,rustyMat,10);cylinder(scene,x,.1,z,.46,.46,.12,metalMat,10);}
for(let z=-18;z>-107;z-=6){if(z>-30)continue;for(const side of [-1,1]){if(rand()>.16)continue;const x=side*(9+rand()*2);box(scene,x,.6,z,.13,1.2,.13,wood);}}

// The Hollow's visitor: an echo with a face but no features.
const ghost=group(scene,7,0,-15);ghost.visible=false;
const ghostBody=new THREE.Mesh(new THREE.CapsuleGeometry(.56,1.25,5,10),ghostMat);ghostBody.position.y=1.5;ghostBody.castShadow=true;ghost.add(ghostBody);
const head=sphere(ghost,0,2.65,0,.42,ghostMat,14);const veil= new THREE.Mesh(new THREE.ConeGeometry(.64,1.2,9,1,true),ghostMat);veil.position.set(0,1.02,0);veil.rotation.x=Math.PI;ghost.add(veil);
for(const sx of [-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.75,4,7),ghostMat);arm.position.set(sx*.68,1.6,0);arm.rotation.z=sx*.28;ghost.add(arm);}
const faceMat=new THREE.MeshBasicMaterial({color:0x101713});sphere(ghost,-.15,2.68,.365,.055,faceMat,8);sphere(ghost,.15,2.68,.365,.055,faceMat,8);
const ghostLight=new THREE.PointLight(0x9bbbaa,1.2,8,2);ghostLight.position.y=2;ghost.add(ghostLight);

const state={started:false,ended:false,inside:true,hiding:false,flash:false,parts:new Set(),fear:100,player:new THREE.Vector3(0,1.65,1.9),yaw:0,pitch:0,keys:{},near:null,hideSpot:null,hideTimer:0,ghostWake:0,elapsed:0,toastTimer:0,lookTouch:null,moveTouch:{}};
camera.position.copy(state.player);camera.rotation.order='YXZ';
const intro=document.querySelector('#intro'),hud=document.querySelector('#hud'),mobile=document.querySelector('#mobileControls'),prompt=document.querySelector('#prompt');
function showToast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');state.toastTimer=2.4;}
function setObjective(text,progress){document.querySelector('#objective').textContent=text;document.querySelector('#progress').style.width=`${progress}%`;}
function toggleFlash(){state.flash=!state.flash;flashlight.intensity=state.flash?5.8:0;showToast(state.flash?'FLASHLIGHT ON':'FLASHLIGHT OFF');}
function startGame(){if(state.started)return;state.started=true;intro.classList.add('hidden');hud.classList.remove('hidden');if(innerWidth<800)mobile.classList.remove('hidden');setObjective('Find a way out of the house',0);showToast('THE FRONT DOOR IS OPEN');if(innerWidth>=800&&renderer.domElement.requestPointerLock)renderer.domElement.requestPointerLock();}
document.querySelector('#start').addEventListener('click',startGame);
document.querySelector('#restart').addEventListener('click',()=>location.reload());
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&state.started&&!state.ended&&innerWidth>=800){showToast('CLICK TO LOOK AROUND');}});
renderer.domElement.addEventListener('click',()=>{if(state.started&&!state.ended&&innerWidth>=800&&!document.pointerLockElement)renderer.domElement.requestPointerLock?.();});
window.addEventListener('keydown',e=>{state.keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(!state.started)return;if(e.code==='KeyE'||e.code==='Space')interact();if(e.code==='KeyF')toggleFlash();});
window.addEventListener('keyup',e=>state.keys[e.code]=false);
document.querySelectorAll('[data-move]').forEach(button=>{const key=button.dataset.move;button.addEventListener('pointerdown',e=>{e.preventDefault();state.moveTouch[key]=true;button.setPointerCapture(e.pointerId)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(ev,()=>state.moveTouch[key]=false);});
document.querySelector('#mobileUse').addEventListener('pointerdown',e=>{e.preventDefault();interact()});document.querySelector('#mobileRun').addEventListener('pointerdown',e=>{e.preventDefault();state.moveTouch.run=true});document.querySelector('#mobileRun').addEventListener('pointerup',()=>state.moveTouch.run=false);document.querySelector('#mobileRun').addEventListener('pointercancel',()=>state.moveTouch.run=false);
let lastTouch=null;renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&state.started){lastTouch={x:e.clientX,y:e.clientY};}});renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&lastTouch&&state.started){state.yaw-=(e.clientX-lastTouch.x)*.004;state.pitch=Math.max(-1.25,Math.min(1.25,state.pitch-(e.clientY-lastTouch.y)*.003));lastTouch={x:e.clientX,y:e.clientY};}});renderer.domElement.addEventListener('pointerup',()=>lastTouch=null);
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement){state.yaw-=e.movementX*.0022;state.pitch=Math.max(-1.3,Math.min(1.3,state.pitch-e.movementY*.002));}});
function distanceTo(p){return Math.hypot(state.player.x-p.x,state.player.z-p.z);}
function interact(){if(!state.started||state.ended)return;if(state.hiding){state.hiding=false;state.hideTimer=0;showToast('YOU STEP BACK INTO THE NIGHT');return;}const target=state.near;if(!target)return;
if(target.type==='door'){state.inside=false;state.ghostWake=2;setObjective('Search Hollow County for car parts',8);showToast('DON’T LOOK BACK. FIND THE CAR.');}
else if(target.type==='part'){const part=target.item;part.found=true;state.parts.add(part.id);part.group.visible=false;const el=document.querySelector(`[data-part="${part.id}"]`);el.classList.add('found');el.querySelector('b').textContent='✓';document.querySelector('#partCount').textContent=`0${state.parts.size} / 03`;showToast(`${part.label} RECOVERED`);setObjective(state.parts.size===3?'Return to the car and escape':'Find the remaining car parts',20+state.parts.size*21);}
else if(target.type==='car'){if(state.parts.size<3){showToast(`THE CAR NEEDS ${3-state.parts.size} MORE PART${state.parts.size===2?'':'S'}`);}else{winGame();}}
else if(target.type==='hide'){state.hiding=true;state.hideSpot=target.spot;state.hideTimer=0;ghost.visible=false;showToast(`HIDING IN ${target.spot.label.toLowerCase()}…`);}
}
function winGame(){state.ended=true;document.exitPointerLock?.();document.querySelector('#endTitle').textContent='YOU MADE IT OUT.';document.querySelector('#endText').textContent='The engine coughs, catches, and the headlights find the county line. In the rear-view mirror, something is still standing in the road.';document.querySelector('#endScreen').classList.remove('hidden');}
function loseGame(){state.ended=true;document.exitPointerLock?.();document.querySelector('#endTitle').textContent='THE HOLLOW KEPT YOU.';document.querySelector('#endText').textContent='You hear the engine turn over somewhere in the dark. It sounds almost like your own voice.';document.querySelector('#endScreen').classList.remove('hidden');}
function updateTarget(){let best=2.7;let chosen=null;const doorPoint=new THREE.Vector3(0,1.4,-5.4);if(state.inside){const d=distanceTo(doorPoint);if(d<best){best=d;chosen={type:'door',label:'OPEN FRONT DOOR'}}}
for(const part of collectibles){if(!part.found){const d=distanceTo(part.group.position);if(d<best){best=d;chosen={type:'part',item:part,label:`TAKE ${part.label}`}}}}
if(state.parts.size===3){const d=distanceTo(car.position);if(d<4.2&&d<best){best=d;chosen={type:'car',label:'START THE CAR'}}}else{const d=distanceTo(car.position);if(d<3.1&&d<best){best=d;chosen={type:'car',label:'THE CAR IS MISSING PARTS'}}}
for(const spot of hides){const d=distanceTo(spot.group.position);if(d<2.4&&d<best){best=d;chosen={type:'hide',spot,label:`HIDE IN ${spot.label}`}}}
state.near=chosen;if(chosen){prompt.innerHTML=`<b>[ E ]</b>${chosen.label}`;prompt.classList.add('show')}else prompt.classList.remove('show');}
function updatePlayer(dt){const forward=Number(Boolean(state.keys.KeyW||state.keys.ArrowUp||state.moveTouch.forward))-Number(Boolean(state.keys.KeyS||state.keys.ArrowDown||state.moveTouch.back));const side=Number(Boolean(state.keys.KeyD||state.keys.ArrowRight||state.moveTouch.right))-Number(Boolean(state.keys.KeyA||state.keys.ArrowLeft||state.moveTouch.left));let moving=Math.abs(forward)+Math.abs(side)>0;const sprint=state.keys.ShiftLeft||state.keys.ShiftRight||state.moveTouch.run;const speed=sprint?6.6:4.15;if(!moving||state.hiding)return;const fwd=new THREE.Vector3(-Math.sin(state.yaw),0,-Math.cos(state.yaw));const right=new THREE.Vector3(Math.cos(state.yaw),0,-Math.sin(state.yaw));const dir=fwd.multiplyScalar(forward).add(right.multiplyScalar(side)).normalize();const nx=state.player.x+dir.x*speed*dt,nz=state.player.z+dir.z*speed*dt;
// House bounds: only the open front doorway can be crossed.
if(state.inside){if(nx>-4.15&&nx<4.15)state.player.x=nx;if(nz<4.2&&nz>-4.55)state.player.z=nz;else if(nz<=-4.55&&Math.abs(nx)<2.05){state.player.z=nz;}else if(nz>4.2)state.player.z=4.2;else if(nz<=-4.55)state.player.z=-4.55;}else{state.player.x=THREE.MathUtils.clamp(nx,-45,45);state.player.z=THREE.MathUtils.clamp(nz,-107,8);}
}
function updateGhost(dt){if(state.inside||state.hiding){ghost.visible=false;return;}state.ghostWake=Math.min(1,state.ghostWake+dt*.16);if(state.ghostWake<.13)return;ghost.visible=true;const px=state.player.x,pz=state.player.z;const dx=px-ghost.position.x,dz=pz-ghost.position.z;const d=Math.hypot(dx,dz);const chaseSpeed=1.05+(state.parts.size*.16)+(state.fear<45?.42:0);if(d>1.3){ghost.position.x+=dx/d*chaseSpeed*dt;ghost.position.z+=dz/d*chaseSpeed*dt;}ghost.position.y=.09+Math.sin(state.elapsed*2.7)*.18;ghost.lookAt(px,1.5,pz);
const intensity=d<18?Math.max(0,(18-d)/18):0;state.fear=Math.max(0,Math.min(100,state.fear+(intensity? -dt*(4.2+intensity*5):dt*2.4)));if(d<1.6){loseGame();}if(intensity>.25){document.querySelector('#soundText').textContent=d<6?'IT’S RIGHT BEHIND YOU':'SOMETHING IS FOLLOWING';document.querySelector('.sound-wave').style.color=d<7?'#ef6956':'#c66f5c';}else{document.querySelector('#soundText').textContent='THE WOODS ARE LISTENING';document.querySelector('.sound-wave').style.color='#c66f5c';}}
function animate(t){requestAnimationFrame(animate);const dt=Math.min(.04,(t-(state.lastTime||t))/1000);state.lastTime=t;state.elapsed+=dt;if(state.toastTimer>0){state.toastTimer-=dt;if(state.toastTimer<=0)document.querySelector('#toast').classList.remove('show');}
if(state.started&&!state.ended){updatePlayer(dt);if(state.hiding){state.hideTimer+=dt;if(state.hideTimer>5&&state.fear<100)state.fear=Math.min(100,state.fear+dt*9);}updateGhost(dt);updateTarget();camera.position.copy(state.player);camera.rotation.set(state.pitch,state.yaw,0,'YXZ');const fear=Math.round(state.fear);document.querySelector('#fearValue').textContent=String(fear).padStart(2,'0');document.querySelector('#fearBar').style.width=`${fear}%`;document.querySelector('#fearBar').style.background=fear<35?'#c16b58':'#a9b68c';}
for(const item of collectibles){if(!item.found){item.orb.position.y=1.18+Math.sin(state.elapsed*2+item.group.position.x)*.13;item.group.rotation.y=Math.sin(state.elapsed*.45)*.13;}}
renderer.render(scene,camera);}
requestAnimationFrame(animate);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));if(innerWidth<800&&state.started)mobile.classList.remove('hidden');else mobile.classList.add('hidden');});
