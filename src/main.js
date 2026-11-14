import * as THREE from 'three';
import './style.css';

const $ = id => document.getElementById(id);
const sceneCanvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a7b3a5');
scene.fog = new THREE.FogExp2('#a7b3a5', 0.0038);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 650);
const clock = new THREE.Clock();
scene.add(new THREE.HemisphereLight('#dce5d2', '#344235', 2.15));
const sun = new THREE.DirectionalLight('#fff0d6', 3.1);
sun.position.set(-80, 120, 45);
scene.add(sun);

const regions = [
  { country:'United States', name:'North Cascades', label:'NORTH CASCADES, USA', lat:48, lon:-121, tint:0x718566 },
  { country:'Brazil', name:'Amazon Basin', label:'AMAZON BASIN, BRAZIL', lat:-8, lon:-63, tint:0x718a5d },
  { country:'Norway', name:'Nordland Frontier', label:'NORDLAND FRONTIER, NORWAY', lat:63, lon:10, tint:0x758c76 },
  { country:'Kenya', name:'Rift Valley', label:'RIFT VALLEY, KENYA', lat:0, lon:37, tint:0x938762 },
  { country:'Japan', name:'Northern Honshu', label:'NORTHERN HONSHU, JAPAN', lat:39, lon:140, tint:0x7d8b72 },
  { country:'Australia', name:'Western Range', label:'WESTERN RANGE, AUSTRALIA', lat:-25, lon:121, tint:0x9a8b67 },
  { country:'France', name:'Alpine Corridor', label:'ALPINE CORRIDOR, FRANCE', lat:46, lon:3, tint:0x87906e },
  { country:'Nepal', name:'Himalayan Pass', label:'HIMALAYAN PASS, NEPAL', lat:28, lon:84, tint:0x8c8d77 }
];
let regionIndex = 0;
let countryFeatures = [];
let gamePaused = false, isFiring = false, reloading = false;
let health = 100, shield = 75, ammo = 30, reserve = 180, xp = 2450, level = 4, kills = 0;
let missionStep = 0, objective = new THREE.Vector3(0, 0, 104), evac = new THREE.Vector3(0, 0, 25);
let enemies = [], clouds = [], beacon = null, evacMarker = null;
const keys = Object.create(null);
const player = { pos:new THREE.Vector3(0,0,25), vel:new THREE.Vector3(), yaw:0, pitch:0, onGround:true, sprinting:false };
const terrainGroup = new THREE.Group(); scene.add(terrainGroup);
const worldGroup = new THREE.Group(); scene.add(worldGroup);
const playerModel = new THREE.Group(); scene.add(playerModel);

function random(){ let x = random.seed = (random.seed || 84721) * 16807 % 2147483647; return (x - 1) / 2147483646; }
function terrainHeight(x,z){ return Math.sin(x*.025)*1.8 + Math.cos(z*.021)*2.1 + Math.sin((x+z)*.013)*1.4 + Math.sin(x*.075+z*.04)*.35; }
function mat(color, roughness=.85, metalness=0){ return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }
function box(parent, size, material, pos){ const m=new THREE.Mesh(new THREE.BoxGeometry(...size), material); m.position.set(...pos); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m; }
function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2300)}
function notice(text){const el=$('notice');el.textContent=text;if(!text)return;el.classList.add('show');clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.classList.remove('show'),1350)}

function makeTerrain(){
  terrainGroup.clear();
  const size=440, segments=130, geo=new THREE.PlaneGeometry(size,size,segments,segments);
  geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position, colors=[];
  const base=new THREE.Color(regions[regionIndex].tint);
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i), z=pos.getZ(i), h=terrainHeight(x,z);pos.setY(i,h);
    const variation=.88+Math.sin(x*.06+z*.03)*.04+Math.cos(z*.045)*.05;
    const c=base.clone().multiplyScalar(variation); if(h>2.5)c.lerp(new THREE.Color('#9c9b82'),.22);
    colors.push(c.r,c.g,c.b);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;terrainGroup.add(ground);
  // Sparse low-poly woodland, instanced to keep the open region lightweight.
  const trunkGeo=new THREE.CylinderGeometry(.13,.21,2.1,5), crownGeo=new THREE.ConeGeometry(1.15,3.8,6);
  const trunks=new THREE.InstancedMesh(trunkGeo,mat('#51483a'),240), crowns=new THREE.InstancedMesh(crownGeo,mat('#40543c'),240);
  const dummy=new THREE.Object3D();let n=0;
  for(let i=0;i<360;i++){
    const x=(random()-.5)*390,z=(random()-.5)*390;
    if(Math.hypot(x,z-25)<18||Math.hypot(x,z+104)<24)continue;
    const scale=.65+random()*.85,y=terrainHeight(x,z);
    dummy.position.set(x,y+1*scale,z);dummy.scale.setScalar(scale);dummy.rotation.y=random()*6.28;dummy.updateMatrix();trunks.setMatrixAt(n,dummy.matrix);
    dummy.position.y=y+3.1*scale;dummy.scale.setScalar(scale);dummy.updateMatrix();crowns.setMatrixAt(n,dummy.matrix);n++;
    if(n>=240)break;
  }
  trunks.count=n;crowns.count=n;terrainGroup.add(trunks,crowns);
  const rockGeo=new THREE.DodecahedronGeometry(1,0), rocks=new THREE.InstancedMesh(rockGeo,mat('#777968'),90);
  for(let i=0;i<90;i++){const x=(random()-.5)*400,z=(random()-.5)*400;dummy.position.set(x,terrainHeight(x,z)+.35,z);dummy.scale.set(.4+random()*1.5,.3+random()*.8,.5+random()*1.3);dummy.rotation.set(random(),random()*6,random());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix)}
  terrainGroup.add(rocks);
  // A pale service road winds through the valley.
  const pts=[];for(let i=0;i<=24;i++){const z=75-i*11;pts.push(new THREE.Vector3(Math.sin(i*.22)*13,terrainHeight(Math.sin(i*.22)*13,z)+.035,z))}
  const road=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),90,2.1,5,false),mat('#827f6b'));
  terrainGroup.add(road);
}

function buildRelay(){
  if(beacon)worldGroup.remove(beacon);beacon=new THREE.Group();
  const metal=mat('#59615b',.42,.5), dark=mat('#232d2a',.6,.25), glow=new THREE.MeshBasicMaterial({color:'#c0f27a',transparent:true,opacity:.08,side:THREE.DoubleSide});
  const x=objective.x,z=objective.z,y=terrainHeight(x,z);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(4.5,5.4,.8,8),dark);base.position.set(x,y+.4,z);beacon.add(base);
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,10,8),metal);mast.position.set(x,y+5.4,z);mast.castShadow=true;beacon.add(mast);
  for(let i=0;i<3;i++){const arm=new THREE.Mesh(new THREE.BoxGeometry(5,.18,.2),metal);arm.position.set(x,y+8.1+i*.7,z);arm.rotation.y=i*2.1;beacon.add(arm)}
  const ring=new THREE.Mesh(new THREE.TorusGeometry(6.7,.12,8,48),new THREE.MeshBasicMaterial({color:'#c0f27a'}));ring.rotation.x=Math.PI/2;ring.position.set(x,y+.18,z);beacon.add(ring);
  const halo=new THREE.Mesh(new THREE.CircleGeometry(13,40),glow);halo.rotation.x=-Math.PI/2;halo.position.set(x,y+.06,z);beacon.add(halo);
  const lamp=new THREE.PointLight('#c0f27a',18,36,2);lamp.position.set(x,y+8,z);beacon.add(lamp);
  if(evacMarker)worldGroup.remove(evacMarker);
  evacMarker=new THREE.Mesh(new THREE.TorusGeometry(4.5,.12,8,32),new THREE.MeshBasicMaterial({color:'#9dd9ce'}));evacMarker.rotation.x=Math.PI/2;evacMarker.position.set(evac.x,terrainHeight(evac.x,evac.z)+.16,evac.z);worldGroup.add(evacMarker);
  worldGroup.add(beacon);
}

function buildPlayer(){
  playerModel.clear();
  const armor=mat('#303b38',.54,.18), fabric=mat('#18221f'), accent=mat('#c0f27a',.4,.15), visor=new THREE.MeshStandardMaterial({color:'#a9d8bd',metalness:.65,roughness:.2,emissive:'#294438'});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.47,.92,5,8),armor);body.position.y=1.3;body.castShadow=true;playerModel.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.31,10,8),fabric);head.position.set(0,2.13,0);playerModel.add(head);
  const face=new THREE.Mesh(new THREE.BoxGeometry(.4,.13,.12),visor);face.position.set(0,2.15,.27);playerModel.add(face);
  const pack=box(playerModel,[.66,.86,.27],fabric,[0,1.42,-.45]);
  for(const side of [-1,1]){
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.61,4,6),fabric);leg.position.set(side*.24,.48,0);playerModel.add(leg);
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.6,4,6),armor);arm.position.set(side*.55,1.42,.07);arm.rotation.z=side*.18;playerModel.add(arm);
  }
  const rifle=box(playerModel,[.16,.16,1.2],mat('#111817',.38,.35),[.48,1.32,.68]);rifle.rotation.x=-.08;
  const stripe=box(playerModel,[.08,.54,.07],accent,[.48,1.47,-.6]);
  playerModel.position.copy(player.pos);playerModel.position.y=terrainHeight(player.pos.x,player.pos.z);playerModel.rotation.y=player.yaw;
}
function makeEnemy(index,x,z){
  const e=new THREE.Group(), shell=mat(index===1?'#6e4640':'#66554a',.46,.3), dark=mat('#202625',.55,.25), eye=new THREE.MeshBasicMaterial({color:'#ff6d55'});
  const torso=new THREE.Mesh(new THREE.BoxGeometry(1.05,1.25,.62),shell);torso.position.y=1.35;torso.castShadow=true;e.add(torso);
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.42,0),dark);head.position.set(0,2.25,0);head.castShadow=true;e.add(head);
  const eyes=new THREE.Mesh(new THREE.BoxGeometry(.42,.12,.08),eye);eyes.position.set(0,2.28,.39);e.add(eyes);
  const pelvis=new THREE.Mesh(new THREE.BoxGeometry(.8,.38,.55),dark);pelvis.position.y=.63;e.add(pelvis);
  for(const s of [-1,1]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.13,.17,.72,6),dark);leg.position.set(s*.25,.27,0);e.add(leg);
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,.76,6),shell);arm.position.set(s*.62,1.34,.12);arm.rotation.z=s*.16;e.add(arm);
  }
  const gun=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.88),dark);gun.position.set(.48,1.14,.65);e.add(gun);
  const light=new THREE.PointLight('#ff563e',1.4,6);light.position.set(0,2.25,.5);e.add(light);
  e.position.set(x,terrainHeight(x,z),z);e.userData={alive:true,hp:100,phase:index*2.15,origin:new THREE.Vector3(x,0,z),index,shoot:1+random()*2};
  return e;
}
function placeEnemies(){
  for(const e of enemies)worldGroup.remove(e);enemies=[];
  const points=[[-13,89],[14,111],[0,126]];
  points.forEach(([x,z],i)=>{const e=makeEnemy(i,x,z);worldGroup.add(e);enemies.push(e)});
}
function updateUI(){
  health=Math.max(0,Math.min(100,health));shield=Math.max(0,Math.min(75,shield));
  $('healthFill').style.width=health+'%';$('shieldFill').style.width=(shield/75*100)+'%';$('healthValue').textContent=Math.round(health);$('shieldValue').textContent=Math.round(shield);
  $('ammoCount').textContent=ammo;$('reserveCount').textContent=reserve;$('level').textContent=String(level).padStart(2,'0');$('xpFill').style.width=Math.min(100,xp/3000*100)+'%';$('xpLabel').textContent=`${xp.toLocaleString()} / 3,000`;
  $('hostileCount').textContent=String(enemies.filter(e=>e.userData.alive).length).padStart(2,'0');
}
function addXP(n){xp+=n;while(xp>=3000){xp-=3000;level++;toast(`LEVEL UP · FIELD RANK ${String(level).padStart(2,'0')}`)}updateUI()}
const raycaster=new THREE.Raycaster();raycaster.far=170;
function fire(){
  if(gamePaused||document.hidden||reloading)return;
  if(ammo<=0){toast('MAGAZINE EMPTY · PRESS R');return}
  ammo--;updateUI();$('ammoFill').style.width=(ammo/30*100)+'%';scene.updateMatrixWorld(true);
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const alive=enemies.filter(e=>e.userData.alive),hits=raycaster.intersectObjects(alive,true);
  if(hits.length){let bot=hits[0].object;while(bot&& !bot.userData?.alive)bot=bot.parent;
    if(bot?.userData?.alive){bot.userData.hp-=52;notice(bot.userData.hp<=0?'TARGET DOWN':'');
      if(bot.userData.hp<=0){bot.userData.alive=false;bot.visible=false;kills++;addXP(175);toast('HOSTILE DOWN  +175 XP');
        if(missionStep===1&&enemies.every(e=>!e.userData.alive)){missionStep=2;objective.copy(evac);$('objectiveText').textContent='Return to the extraction point';$('objectiveCount').textContent='03 / 03';$('objectiveMarker').textContent='◉';toast('AREA SECURE · EXTRACTION AVAILABLE')}
      }
    }
  }
  if(ammo===0)toast('MAGAZINE EMPTY · PRESS R');
}
function startReload(){if(reloading||ammo===30||reserve<=0||gamePaused)return;reloading=true;notice('RELOADING');$('ammoFill').style.background='#f2bd66';setTimeout(()=>{if(!reloading)return;const loaded=Math.min(30-ammo,reserve);ammo+=loaded;reserve-=loaded;reloading=false;$('ammoFill').style.background='';updateUI()},1250)}
function checkObjective(){
  const dist=objective.distanceTo(player.pos);$('distanceReadout').innerHTML=`${Math.round(dist)}<span> m</span>`;$('distanceBar').style.width=Math.max(4,Math.min(100,100-dist/2.5))+'%';
  if(missionStep===0&&dist<10){missionStep=1;$('objectiveText').textContent='Neutralize hostile synths';$('objectiveCount').textContent='02 / 03';$('objectiveMarker').textContent='⌖';toast('UPLINK REACHED · HOSTILES INBOUND');notice('HOSTILES INBOUND')}
  if(missionStep===2&&dist<10){missionStep=3;addXP(450);toast('OPERATION COMPLETE · +450 XP');$('objectiveText').textContent='Operation complete · choose your next deployment';$('objectiveCount').textContent='03 / 03';$('objectiveMarker').textContent='✓'}
}
function updateEnemies(dt,t){
  for(const e of enemies){if(!e.userData.alive)continue;const d=e.position.distanceTo(player.pos),active=missionStep>=1;
    if(active&&d<105){e.userData.phase+=dt*1.7;const origin=e.userData.origin;e.position.x=origin.x+Math.sin(e.userData.phase*.48)*3;e.position.z=origin.z+Math.cos(e.userData.phase*.4)*2;e.position.y=terrainHeight(e.position.x,e.position.z)+Math.abs(Math.sin(t*2+e.userData.index))*.08;e.rotation.y=Math.atan2(player.pos.x-e.position.x,player.pos.z-e.position.z);
      e.userData.shoot-=dt;if(d<66&&e.userData.shoot<0){e.userData.shoot=2.2+random()*2.5;if(random()>.42){if(shield>0)shield=Math.max(0,shield-8);else health=Math.max(0,health-8);notice('INCOMING FIRE');updateUI();if(health<=0){health=70;shield=35;ammo=Math.max(ammo,15);player.pos.set(0,0,25);toast('FIELD REVIVE · REGROUP AND REDEPLOY');updateUI()}}}
    }else e.position.y=terrainHeight(e.position.x,e.position.z);
  }
}
function updatePlayer(dt){
  const forwardInput=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-touchMove.y;
  const sideInput=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+touchMove.x;
  const mag=Math.hypot(forwardInput,sideInput),norm=mag>1?1/mag:1;
  const forward=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)),right=new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw));
  player.sprinting=!!(keys.ShiftLeft||keys.ShiftRight||touchSprint);const speed=player.sprinting?22:13;
  const desired=forward.multiplyScalar(forwardInput*norm).add(right.multiplyScalar(sideInput*norm)).multiplyScalar(speed);
  player.vel.x=THREE.MathUtils.damp(player.vel.x,desired.x,mag?9:7,dt);player.vel.z=THREE.MathUtils.damp(player.vel.z,desired.z,mag?9:7,dt);
  if(keys.Space&&player.onGround){player.vel.y=8.5;player.onGround=false;keys.Space=false}player.vel.y-=23*dt;
  player.pos.x+=player.vel.x*dt;player.pos.z+=player.vel.z*dt;player.pos.y+=player.vel.y*dt;
  const floor=terrainHeight(player.pos.x,player.pos.z);if(player.pos.y<floor){player.pos.y=floor;player.vel.y=0;player.onGround=true}
  const moving=mag>.08;if(moving)player.yaw=Math.atan2(player.vel.x,player.vel.z);
  playerModel.position.copy(player.pos);playerModel.position.y=floor;playerModel.rotation.y=player.yaw;
  if(moving){const swing=Math.sin(performance.now()*.012)*(player.sprinting?.12:.07);playerModel.children[0].position.y=1.3+Math.abs(swing);playerModel.children[0].rotation.x=swing}
  const dist=13.5,lookAhead=5.5;
  const desiredCam=new THREE.Vector3(player.pos.x-Math.sin(player.yaw)*dist,player.pos.y+6.6+player.pitch*12,player.pos.z-Math.cos(player.yaw)*dist);
  camera.position.lerp(desiredCam,1-Math.exp(-7*dt));const look=new THREE.Vector3(player.pos.x+Math.sin(player.yaw)*lookAhead,player.pos.y+2.6+player.pitch*14,player.pos.z+Math.cos(player.yaw)*lookAhead);camera.lookAt(look);
  const compass=((THREE.MathUtils.radToDeg(player.yaw)+360)%360),dirs=['N','NE','E','SE','S','SW','W','NW'];$('compassDir').textContent=dirs[Math.round(compass/45)%8];$('compassRead').innerHTML=`${dirs[Math.round(compass/45)%8]}&nbsp; ${Math.round(compass)}°`;
}
const mini=$('miniCanvas'),miniCtx=mini.getContext('2d');
function drawMini(){const w=mini.width,h=mini.height,c=miniCtx;c.clearRect(0,0,w,h);c.fillStyle='#28372c';c.fillRect(0,0,w,h);c.save();c.beginPath();c.rect(0,0,w,h);c.clip();
  for(let i=0;i<80;i++){const x=i*67%w,y=i*43%h;c.fillStyle=i%3?'#3a4938':'#4a5740';c.beginPath();c.arc(x,y,3+i%5,0,Math.PI*2);c.fill()}
  c.strokeStyle='rgba(202,204,165,.35)';c.lineWidth=2;c.beginPath();c.moveTo(20,120);c.quadraticCurveTo(100,110,120,75);c.quadraticCurveTo(155,30,220,32);c.stroke();
  const px=w/2,py=h/2;c.save();c.translate(px,py);c.rotate(-player.yaw);c.fillStyle='#fff';c.beginPath();c.arc(0,0,4,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(0,-10);c.lineTo(-4,-2);c.lineTo(4,-2);c.closePath();c.fill();c.restore();
  const scale=.43,tx=px+(objective.x-player.pos.x)*scale,ty=py+(objective.z-player.pos.z)*scale;c.fillStyle='#c0f27a';c.beginPath();c.arc(tx,ty,4,0,Math.PI*2);c.fill();c.strokeStyle='#c0f27a66';c.beginPath();c.arc(tx,ty,8,0,Math.PI*2);c.stroke();
  for(const e of enemies){if(!e.userData.alive)continue;const ex=px+(e.position.x-player.pos.x)*scale,ey=py+(e.position.z-player.pos.z)*scale;c.fillStyle='#f17b63';c.beginPath();c.arc(ex,ey,3.2,0,Math.PI*2);c.fill()}
  c.strokeStyle='rgba(242,246,225,.2)';c.lineWidth=1;c.strokeRect(4,4,w-8,h-8);c.restore();
}
const worldCanvas=$('worldCanvas'),worldCtx=worldCanvas.getContext('2d');
function mapPoint(lon,lat,w,h){return [(lon+180)/360*w,(85-lat)/170*h]}
function drawWorldMap(){
  const rect=worldCanvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(worldCanvas.width!==w||worldCanvas.height!==h){worldCanvas.width=w;worldCanvas.height=h}
  const c=worldCtx;c.clearRect(0,0,w,h);c.fillStyle='#18231d';c.fillRect(0,0,w,h);
  c.strokeStyle='rgba(188,211,183,.10)';c.lineWidth=1*dpr;
  for(let lon=-150;lon<=150;lon+=30){const [x]=mapPoint(lon,0,w,h);c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke()}
  for(let lat=-60;lat<=60;lat+=30){const [,y]=mapPoint(0,lat,w,h);c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}
  const drawRing=ring=>{if(!ring?.length)return;const [x0,y0]=mapPoint(ring[0][0],ring[0][1],w,h);c.beginPath();c.moveTo(x0,y0);for(let i=1;i<ring.length;i++){const [x,y]=mapPoint(ring[i][0],ring[i][1],w,h);c.lineTo(x,y)}c.closePath();c.fill();c.stroke()};
  c.fillStyle='#60735c';c.strokeStyle='rgba(188,207,168,.62)';c.lineWidth=.65*dpr;
  for(const feature of countryFeatures){const g=feature.geometry;if(!g)continue;if(g.type==='Polygon')g.coordinates.forEach(drawRing);else if(g.type==='MultiPolygon')g.coordinates.forEach(poly=>poly.forEach(drawRing))}
  regions.forEach((r,i)=>{const [x,y]=mapPoint(r.lon,r.lat,w,h);c.beginPath();c.arc(x,y,(i===regionIndex?5:3.4)*dpr,0,Math.PI*2);c.fillStyle=i===regionIndex?'#c0f27a':'#d8c696';c.fill();if(i===regionIndex){c.beginPath();c.arc(x,y,9*dpr,0,Math.PI*2);c.strokeStyle='#c0f27a88';c.lineWidth=1.4*dpr;c.stroke()}});
  const active=regions[regionIndex],[px,py]=mapPoint(active.lon,active.lat,w,h);c.fillStyle='#f4f1df';c.font=`${9*dpr}px monospace`;c.fillText(active.country.toUpperCase(),Math.min(w-100*dpr,px+9*dpr),py-9*dpr);
}
async function loadCountries(){try{const response=await fetch('/countries.geo.json');if(!response.ok)throw new Error('Country boundary data unavailable');const data=await response.json();countryFeatures=data.features||[];drawWorldMap();buildZoneList()}catch(error){console.warn('World map boundaries could not be loaded',error);toast('MAP DATA UNAVAILABLE · RETRY LATER');buildZoneList()}}
function buildZoneList(){
  const list=$('zoneList');list.replaceChildren();
  regions.forEach((region,index)=>{
    const card=document.createElement('button');card.type='button';card.className=`zone-card${index===regionIndex?' active':''}`;card.dataset.index=index;
    card.innerHTML=`<span class="zone-status"></span><span class="zone-copy"><span class="zone-name">${region.name}</span><small>${region.country.toUpperCase()} · ACTIVE OPERATION</small></span><span class="zone-arrow">→</span>`;
    card.addEventListener('click',()=>deploy(index));list.append(card);
  });
}
function deploy(index){
  if(index<0||index>=regions.length)return;regionIndex=index;const region=regions[index];
  $('regionLabel').textContent=region.label;objective.set(0,0,104);evac.set(0,0,25);missionStep=0;kills=0;
  player.pos.set(0,terrainHeight(0,25),25);player.vel.set(0,0,0);player.yaw=0;player.pitch=0;health=100;shield=75;ammo=30;reserve=180;reloading=false;
  $('missionTitle').innerHTML='Silent<br />Approach';$('missionCopy').textContent=`A rogue synth squad has jammed the ${region.name} relay. Clear the site and restore the uplink.`;
  $('objectiveText').textContent='Reach the uplink station';$('objectiveCount').textContent='01 / 03';$('objectiveMarker').textContent='◉';$('ammoFill').style.width='100%';$('ammoFill').style.background='';
  makeTerrain();worldGroup.clear();beacon=null;evacMarker=null;buildRelay();placeEnemies();buildPlayer();updateUI();checkObjective();drawWorldMap();buildZoneList();
  $('mapOverlay').classList.add('hidden');gamePaused=false;toast(`DEPLOYED · ${region.name.toUpperCase()}`);
}
function setPaused(value){gamePaused=value;if(value&&document.pointerLockElement)document.exitPointerLock();}
function openMap(){if(gamePaused&&$('settingsOverlay').classList.contains('hidden')===false)return;setPaused(true);$('mapOverlay').classList.remove('hidden');drawWorldMap();}
function closeMap(){ $('mapOverlay').classList.add('hidden');setPaused(false);}
function openSettings(){setPaused(true);$('settingsOverlay').classList.remove('hidden');}
function closeSettings(){ $('settingsOverlay').classList.add('hidden');setPaused(false);}

let touchMove={x:0,y:0},touchSprint=false,lookPointer=null,joyPointer=null,joyOrigin=null,lastTouch=null;
const sensitivity=()=>Number($('sensitivity').value||8)*.0009;
function onKeyDown(event){
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
  keys[event.code]=true;
  if(event.repeat)return;
  if(event.code==='KeyR')startReload();
  if(event.code==='KeyM'){if($('mapOverlay').classList.contains('hidden'))openMap();else closeMap()}
  if(event.code==='Escape'){if(!$('mapOverlay').classList.contains('hidden'))closeMap();else if(!$('settingsOverlay').classList.contains('hidden'))closeSettings();else if(document.pointerLockElement)document.exitPointerLock()}
}
function onKeyUp(event){keys[event.code]=false}
window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',()=>{for(const key of Object.keys(keys))keys[key]=false;isFiring=false;touchMove={x:0,y:0};touchSprint=false});
$('scene').addEventListener('contextmenu',e=>e.preventDefault());
$('scene').addEventListener('pointerdown',event=>{
  if(gamePaused)return;
  if(event.pointerType==='touch'){
    if(event.clientX>innerWidth*.48){lookPointer=event.pointerId;lastTouch={x:event.clientX,y:event.clientY};$('scene').setPointerCapture(event.pointerId)}
    return;
  }
  if(event.button===0){isFiring=true;fire();if(document.pointerLockElement!==sceneCanvas)sceneCanvas.requestPointerLock?.().catch?.(()=>{})}
});
window.addEventListener('pointerup',event=>{if(event.pointerType!=='touch')isFiring=false;if(event.pointerId===lookPointer){lookPointer=null;lastTouch=null}});
window.addEventListener('pointermove',event=>{
  if(gamePaused)return;
  if(document.pointerLockElement===sceneCanvas){player.yaw-=event.movementX*sensitivity();player.pitch=THREE.MathUtils.clamp(player.pitch-event.movementY*sensitivity(),-.5,.48)}
  else if(event.pointerId===lookPointer&&lastTouch){player.yaw-= (event.clientX-lastTouch.x)*.006;player.pitch=THREE.MathUtils.clamp(player.pitch-(event.clientY-lastTouch.y)*.006,-.5,.48);lastTouch={x:event.clientX,y:event.clientY}}
});
$('scene').addEventListener('pointerup',()=>{isFiring=false});
$('scene').addEventListener('click',()=>{if(!gamePaused&&document.pointerLockElement!==sceneCanvas&&matchMedia('(pointer:fine)').matches)sceneCanvas.requestPointerLock?.()});
$('mapBtn').addEventListener('click',openMap);$('closeMap').addEventListener('click',closeMap);$('mapOverlay').addEventListener('click',e=>{if(e.target===$('mapOverlay'))closeMap()});
$('settingsBtn').addEventListener('click',openSettings);$('closeSettings').addEventListener('click',closeSettings);$('resumeBtn').addEventListener('click',closeSettings);
$('settingsOverlay').addEventListener('click',e=>{if(e.target===$('settingsOverlay'))closeSettings()});
$('quality').addEventListener('change',event=>{const scale=event.target.value==='low'?.85:event.target.value==='balanced'?1:1.35;renderer.setPixelRatio(Math.min(devicePixelRatio||1,scale));renderer.setSize(innerWidth,innerHeight);toast(`GRAPHICS · ${event.target.selectedOptions[0].text.toUpperCase()}`)});
$('soundToggle').addEventListener('click',event=>{const button=event.currentTarget;button.classList.toggle('on');button.textContent=button.classList.contains('on')?'ON':'OFF';toast(`AMBIENT SOUND ${button.textContent}`)});
$('touchFire').addEventListener('pointerdown',event=>{event.preventDefault();isFiring=true;fire()});$('touchFire').addEventListener('pointerup',()=>isFiring=false);$('touchFire').addEventListener('pointercancel',()=>isFiring=false);
$('touchSprint').addEventListener('pointerdown',event=>{event.preventDefault();touchSprint=true});$('touchSprint').addEventListener('pointerup',()=>touchSprint=false);$('touchSprint').addEventListener('pointercancel',()=>touchSprint=false);
$('touchReload').addEventListener('click',startReload);$('touchJump').addEventListener('pointerdown',()=>{keys.Space=true});
const joystick=$('joystick'),joyKnob=$('joyKnob');
joystick.addEventListener('pointerdown',event=>{event.preventDefault();joyPointer=event.pointerId;joystick.setPointerCapture(joyPointer);const rect=joystick.getBoundingClientRect();joyOrigin={x:rect.left+rect.width/2,y:rect.top+rect.height/2};updateJoystick(event)});
joystick.addEventListener('pointermove',event=>{if(event.pointerId===joyPointer)updateJoystick(event)});
function updateJoystick(event){if(!joyOrigin)return;const dx=event.clientX-joyOrigin.x,dy=event.clientY-joyOrigin.y,radius=34,len=Math.hypot(dx,dy),factor=Math.min(1,radius/(len||1));touchMove={x:dx*factor/radius,y:dy*factor/radius};joyKnob.style.transform=`translate(${dx*factor}px,${dy*factor}px)`}
function resetJoystick(event){if(event.pointerId!==joyPointer)return;joyPointer=null;joyOrigin=null;touchMove={x:0,y:0};joyKnob.style.transform='translate(0,0)'}
joystick.addEventListener('pointerup',resetJoystick);joystick.addEventListener('pointercancel',resetJoystick);
worldCanvas.addEventListener('click',event=>{const rect=worldCanvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*worldCanvas.width,y=(event.clientY-rect.top)/rect.height*worldCanvas.height;let selected=-1,nearest=Infinity;regions.forEach((region,index)=>{const [rx,ry]=mapPoint(region.lon,region.lat,worldCanvas.width,worldCanvas.height),distance=Math.hypot(rx-x,ry-y);if(distance<nearest){nearest=distance;selected=index}});if(nearest<22*(worldCanvas.width/rect.width)){$(`zoneList`).querySelector(`[data-index="${selected}"]`)?.click()}});

function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  if(!gamePaused){updatePlayer(dt);updateEnemies(dt,t);checkObjective();if(isFiring&&performance.now()-animate.lastShot>155){fire();animate.lastShot=performance.now()}}
  drawMini();renderer.render(scene,camera);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);drawWorldMap()});
makeTerrain();buildRelay();placeEnemies();buildPlayer();updateUI();checkObjective();loadCountries();animate();

