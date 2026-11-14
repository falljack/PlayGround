(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const mini = document.querySelector('#minimap');
  const mctx = mini.getContext('2d');
  const ui = Object.fromEntries(['mission-title','mission-copy','progress-fill','progress-text','reward-copy','status-copy','prompt','toast','dialogue','dialogue-avatar','dialogue-name','dialogue-text','dialogue-action','dialogue-close','finish-card','finish-time','finish-kindness','keep-exploring','start-screen','start-btn','pause-overlay','resume-btn','touch-interact','touch-run','sound-btn','clock','district-label'].map(id=>[id,document.getElementById(id)]));
  const W=2240,H=1580, player={x:572,y:497,dir:0,speed:0}, camera={x:0,y:0};
  const keys=new Set(); let started=false,paused=false,dialogueOpen=false,completed=false,kindness=0,elapsed=0,lastTime=0,toastTimer=0,soundOn=true,audioCtx=null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=(seed)=>{let x=Math.sin(seed*127.1+311.7)*43758.5453;return x-Math.floor(x)};
  const buildings=[
    {x:265,y:253,w:250,h:156,name:"JUNE'S COFFEE",color:'#d8a378',roof:'#b97755',door:[455,409],kind:'cafe'},
    {x:700,y:196,w:252,h:180,name:'THE POST OFFICE',color:'#d9c8a9',roof:'#ac9a7f'},
    {x:1310,y:205,w:255,h:172,name:'MILLER HOUSE',color:'#c7aa86',roof:'#846d5c'},
    {x:1730,y:270,w:258,h:180,name:'PARKER HOUSE',color:'#dfbd9e',roof:'#9f786a'},
    {x:260,y:826,w:270,h:190,name:'PETAL & STEM',color:'#d4b8a0',roof:'#ad7b70'},
    {x:750,y:850,w:257,h:172,name:'CORNER BOOKS',color:'#b8c5a5',roof:'#718b76'},
    {x:1320,y:1170,w:300,h:190,name:'THE LAUNDRY',color:'#c9bea6',roof:'#8a8e7c'},
    {x:1770,y:1090,w:245,h:178,name:'SUNDAY MARKET',color:'#e4c69e',roof:'#c58b60'},
    {x:1000,y:285,w:185,h:137,name:'',color:'#d7d1b8',roof:'#b5aa91'},
    {x:990,y:1190,w:230,h:158,name:'',color:'#c9c4aa',roof:'#aaa284'}
  ];
  const npcData=[
    {x:1515,y:462,name:'MRS. MILLER',initial:'M',color:'#ccaa79',look:'#665448',line:'Oh, how thoughtful! This is exactly what I needed to get my morning started. Thank you, dear.',done:'One happy neighbor. The morning is looking up.'},
    {x:1588,y:958,name:'LEO PARKER',initial:'L',color:'#b9c9b0',look:'#4e665c',line:'Coffee delivery? You are officially my favorite person on this block. Come by anytime!',done:'Leo says you made his whole week. Two down!'},
    {x:600,y:1195,name:'MAYA REED',initial:'M',color:'#d4a0a0',look:'#514b59',line:'You remembered my order! This little neighborhood is lucky to have you.',done:'Three smiles delivered. You brought this block a little closer.'}
  ];
  const npcs=npcData.map((n,i)=>({...n,delivered:false,phase:i*2.2}));
  const trees=[];
  for(let i=0;i<60;i++){
    const x=75+rand(i+1)*2090,y=70+rand(i+99)*1440;
    if(buildings.some(b=>x>b.x-35&&x<b.x+b.w+35&&y>b.y-35&&y<b.y+b.h+35))continue;
    if(Math.abs(x-1120)<140||Math.abs(y-710)<130)continue;
    if(Math.abs(x-572)<100&&Math.abs(y-497)<100)continue;
    trees.push({x,y,r:15+rand(i+30)*10,hue:Math.floor(rand(i+10)*3)});
  }
  const props=[{x:1130,y:730,type:'fountain'},{x:620,y:735,type:'bench'},{x:1645,y:735,type:'bench'},{x:1090,y:530,type:'flower'},{x:1150,y:990,type:'flower'}];
  const colors=['#dd986e','#779886','#d0b782','#a7b3a0','#b98172'];
  function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
  addEventListener('resize',resize);resize();
  function roundedRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r)}
  function drawBuilding(b){
    ctx.save();ctx.fillStyle='#33463c22';roundedRect(ctx,b.x+9,b.y+12,b.w,b.h,7);ctx.fill();
    ctx.fillStyle='#92846c';roundedRect(ctx,b.x,b.y+12,b.w,b.h,5);ctx.fill();
    ctx.fillStyle=b.color;roundedRect(ctx,b.x,b.y,b.w,b.h,5);ctx.fill();
    // roof inset and warm architectural trim
    ctx.fillStyle=b.roof;roundedRect(ctx,b.x+8,b.y+8,b.w-16,b.h-24,4);ctx.fill();
    ctx.fillStyle='#ffffff1c';ctx.fillRect(b.x+12,b.y+12,b.w-24,4);
    // roof panels
    ctx.strokeStyle='#ffffff24';ctx.lineWidth=1;
    for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(b.x+15,b.y+20+i*(b.h-50)/4);ctx.lineTo(b.x+b.w-15,b.y+20+i*(b.h-50)/4);ctx.stroke()}
    // windows
    const windowColor='#f4d5a5';
    for(let col=0;col<Math.floor(b.w/65);col++)for(let row=0;row<Math.max(1,Math.floor(b.h/75));row++){
      const wx=b.x+27+col*63,wy=b.y+b.h-44-row*59;
      if(wx>b.x+b.w-30)continue;
      ctx.fillStyle='#4b6158';roundedRect(ctx,wx,wy,22,22,3);ctx.fill();ctx.fillStyle=windowColor;ctx.fillRect(wx+3,wy+3,7,16);ctx.fillStyle='#ffffff55';ctx.fillRect(wx+11,wy+3,2,16);
    }
    const [dx,dy]=b.door||[b.x+b.w*.52,b.y+b.h];
    ctx.fillStyle='#5e5346';roundedRect(ctx,dx-10,dy-27,20,27,5);ctx.fill();ctx.fillStyle='#e7c187';ctx.beginPath();ctx.arc(dx+5,dy-13,1.3,0,7);ctx.fill();
    if(b.name){ctx.fillStyle='#f2e5c7';roundedRect(ctx,b.x+b.w/2-57,b.y+b.h-32,114,17,3);ctx.fill();ctx.fillStyle='#47534b';ctx.font='700 7px DM Sans,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.name,b.x+b.w/2,b.y+b.h-23)}
    ctx.restore();
  }
  function drawTree(t){
    ctx.save();ctx.fillStyle='#273a3020';ctx.beginPath();ctx.ellipse(t.x+5,t.y+7,t.r*1.1,t.r*.72,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#705d45';ctx.fillRect(t.x-2,t.y-2,5,14);
    const palette=[['#708b69','#829c76','#9bac7c'],['#79927c','#92a58a','#a7b18b'],['#718a78','#849a6c','#a0a77a']][t.hue];
    ctx.fillStyle=palette[0];ctx.beginPath();ctx.arc(t.x,t.y-5,t.r,0,Math.PI*2);ctx.fill();ctx.fillStyle=palette[1];ctx.beginPath();ctx.arc(t.x-6,t.y-10,t.r*.65,0,Math.PI*2);ctx.fill();ctx.fillStyle=palette[2];ctx.beginPath();ctx.arc(t.x+7,t.y-11,t.r*.5,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawRoads(){
    // base neighborhood lawns and tiled pavements
    ctx.fillStyle='#c9c9a9';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#c4c6a4';ctx.fillRect(0,0,W,H);
    // green pockets
    ctx.fillStyle='#aeb99a';ctx.fillRect(1020,475,190,115);ctx.fillRect(570,1060,155,200);ctx.fillRect(1640,480,105,130);
    // roadbeds
    ctx.fillStyle='#b9b6a4';ctx.fillRect(0,627,W,190);ctx.fillRect(1026,0,188,H);
    ctx.fillStyle='#d5d0ba';ctx.fillRect(0,642,W,12);ctx.fillRect(0,790,W,11);ctx.fillRect(1041,0,11,H);ctx.fillRect(1199,0,13,H);
    // pavement slabs in roadside strips
    ctx.strokeStyle='#b7b6a2';ctx.lineWidth=1;
    for(let x=0;x<W;x+=42){ctx.beginPath();ctx.moveTo(x,655);ctx.lineTo(x,700);ctx.moveTo(x,755);ctx.lineTo(x,790);ctx.stroke()}
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(1052,y);ctx.lineTo(1199,y);ctx.stroke()}
    // road highlights, center stripes
    ctx.strokeStyle='#e7dfc3';ctx.lineWidth=2;ctx.setLineDash([22,19]);ctx.beginPath();ctx.moveTo(0,721);ctx.lineTo(W,721);ctx.moveTo(1120,0);ctx.lineTo(1120,H);ctx.stroke();ctx.setLineDash([]);
    // crossing markings
    for(let i=0;i<6;i++){ctx.fillStyle='#eee6d0';ctx.fillRect(1022+i*15,646,9,38);ctx.fillRect(1030+i*15,754,9,36);ctx.fillRect(1032,646+i*16,39,9);ctx.fillRect(1168,646+i*16,41,9)}
    // lane edge and discreet road texture specks
    ctx.fillStyle='#ffffff18';for(let i=0;i<35;i++){let x=rand(i+5)*W,y=662+rand(i+108)*108;ctx.beginPath();ctx.arc(x,y,1,0,7);ctx.fill()}
    // little paths joining blocks
    ctx.fillStyle='#d3cdb5';ctx.fillRect(548,415,22,212);ctx.fillRect(1555,377,22,250);ctx.fillRect(510,815,23,70);ctx.fillRect(1570,815,20,155);ctx.fillRect(600,1016,20,44);ctx.fillRect(1580,970,20,120);
  }
  function drawProps(t){
    props.forEach(p=>{ctx.save();if(p.type==='fountain'){
      ctx.fillStyle='#263a3422';ctx.beginPath();ctx.ellipse(p.x+5,p.y+9,50,33,0,0,7);ctx.fill();ctx.fillStyle='#c9ba99';ctx.beginPath();ctx.ellipse(p.x,p.y,49,32,0,0,7);ctx.fill();ctx.fillStyle='#789a9b';ctx.beginPath();ctx.ellipse(p.x,p.y-2,39,23,0,0,7);ctx.fill();ctx.fillStyle='#bdcab4';ctx.beginPath();ctx.ellipse(p.x,p.y-5,28,14,0,0,7);ctx.fill();ctx.fillStyle='#d9b786';ctx.beginPath();ctx.arc(p.x,p.y-18+Math.sin(t*2)*2,6,0,7);ctx.fill();
    }else if(p.type==='bench'){
      ctx.fillStyle='#554f40';ctx.fillRect(p.x-25,p.y-4,50,5);ctx.fillRect(p.x-21,p.y+2,4,10);ctx.fillRect(p.x+17,p.y+2,4,10);ctx.fillStyle='#a47b58';ctx.fillRect(p.x-27,p.y-12,54,9);ctx.fillStyle='#c29b6d';ctx.fillRect(p.x-27,p.y-12,54,2);
    }else{for(let i=0;i<5;i++){ctx.fillStyle=['#e6a079','#f0c579','#b98688'][i%3];ctx.beginPath();ctx.arc(p.x+(i-2)*7,p.y+Math.sin(i)*4,4,0,7);ctx.fill()}ctx.fillStyle='#657f61';ctx.fillRect(p.x-1,p.y,2,12)}ctx.restore()});
  }
  function drawNPC(n,t){
    const bob=Math.sin(t*2+n.phase)*1.6;ctx.save();ctx.fillStyle='#1f2c2828';ctx.beginPath();ctx.ellipse(n.x,n.y+13,12,5,0,0,7);ctx.fill();
    ctx.fillStyle=n.color;ctx.beginPath();ctx.ellipse(n.x,n.y+4+bob,9,12,0,0,7);ctx.fill();ctx.fillStyle=n.look;ctx.beginPath();ctx.arc(n.x,n.y-8+bob,7,0,7);ctx.fill();ctx.fillStyle='#fff7e9';ctx.fillRect(n.x-5,n.y-10+bob,3,2);ctx.fillRect(n.x+2,n.y-10+bob,3,2);ctx.fillStyle='#4b544d';ctx.fillRect(n.x-4,n.y+14,3,4);ctx.fillRect(n.x+2,n.y+14,3,4);
    if(!n.delivered&&kindness>0){ctx.fillStyle='#f1d29e';ctx.beginPath();ctx.arc(n.x,n.y-30+bob,11,0,7);ctx.fill();ctx.fillStyle='#564e3e';ctx.font='700 11px DM Sans';ctx.textAlign='center';ctx.fillText('♥',n.x,n.y-26+bob)}
    ctx.restore();
  }
  function drawPlayer(t){
    ctx.save();const x=player.x,y=player.y,bob=player.speed>0?Math.sin(t*13)*2:Math.sin(t*2)*.7;
    ctx.fillStyle='#1d2b292a';ctx.beginPath();ctx.ellipse(x,y+15,13,6,0,0,7);ctx.fill();
    ctx.fillStyle='#e8a16f';ctx.beginPath();ctx.ellipse(x,y+3+bob,10,12,0,0,7);ctx.fill();
    ctx.fillStyle='#d8b287';ctx.beginPath();ctx.arc(x,y-9+bob,7,0,7);ctx.fill();
    ctx.fillStyle='#735c49';ctx.beginPath();ctx.arc(x,y-12+bob,7,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(x-7,y-12+bob,3,5);
    ctx.fillStyle='#fff7e9';ctx.fillRect(x+2,y-10+bob,2,2);
    ctx.fillStyle='#f4e3bf';ctx.fillRect(x-5,y+12,4,6);ctx.fillRect(x+2,y+12,4,6);
    // carried coffee after pickup
    if(kindness>=0&&kindness<3&&started){ctx.fillStyle='#f5ead2';roundedRect(ctx,x+9,y-1+bob,7,9,2);ctx.fill();ctx.fillStyle='#9a6246';ctx.fillRect(x+10,y+2+bob,5,2);ctx.fillStyle='#fff';ctx.fillRect(x+11,y-3+bob,3,2)}
    ctx.restore();
  }
  function drawWorld(t){
    ctx.save();ctx.translate(-camera.x,-camera.y);drawRoads();
    // speckled garden texture
    for(let i=0;i<500;i++){let x=rand(i+501)*W,y=rand(i+900)*H;if((y>620&&y<820)||(x>1020&&x<1220))continue;ctx.fillStyle=i%3===0?'#697d4a12':'#fff8d212';ctx.fillRect(x,y,2,2)}
    trees.forEach(drawTree);drawProps(t);buildings.forEach(drawBuilding);
    // small warm awning at cafe
    ctx.fillStyle='#a95946';ctx.beginPath();ctx.moveTo(414,409);ctx.lineTo(490,409);ctx.lineTo(482,422);ctx.lineTo(422,422);ctx.closePath();ctx.fill();for(let x=421;x<485;x+=15){ctx.fillStyle='#f1dfbf';ctx.fillRect(x,411,7,9)}
    npcs.forEach(n=>drawNPC(n,t));drawPlayer(t);
    // interaction ring and small objective shimmer
    let nearest=getNearest();if(nearest&&started&&!dialogueOpen){ctx.strokeStyle='#fff2c7a8';ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.beginPath();ctx.arc(nearest.x,nearest.y,24+Math.sin(t*3)*2,0,7);ctx.stroke();ctx.setLineDash([])}
    ctx.restore();
  }
  function getNearest(){const targets=[];if(kindness===0)targets.push({x:572,y:465,type:'cafe',name:"June's Coffee",dist:0});else{npcs.forEach(n=>{if(!n.delivered)targets.push({...n,type:'npc',dist:0})})}let best=null;for(const o of targets){o.dist=Math.hypot(player.x-o.x,player.y-o.y);if(o.dist<82&&(!best||o.dist<best.dist))best=o}return best}
  function blocked(x,y){if(x<22||y<28||x>W-22||y>H-25)return true;for(const b of buildings){if(x>b.x-12&&x<b.x+b.w+12&&y>b.y-12&&y<b.y+b.h+8)return true}return false}
  function showToast(text){ui.toast.textContent=text;ui.toast.classList.add('visible');toastTimer=2.8}
  function updateMission(){ui['progress-fill'].style.width=(kindness/3*100)+'%';ui['progress-text'].textContent=`${kindness} / 3`;if(kindness===0){ui['mission-title'].textContent='A little pick-me-up';ui['mission-copy'].innerHTML='Good mornings start at <b>June\'s Coffee</b>. Pick up a neighbor\'s order.';ui['reward-copy'].textContent='A warmer neighborhood';ui['status-copy'].textContent='A fresh day is waiting'}else if(kindness<3){const n=npcs.find(x=>!x.delivered);ui['mission-title'].textContent=`For ${n.name.split(' ')[0]}'s morning`;ui['mission-copy'].innerHTML=`Take June's fresh coffee to <b>${n.name.split(' ').map(s=>s[0]+s.slice(1).toLowerCase()).join(' ')}</b>. They should be nearby.`;ui['reward-copy'].textContent=`${3-kindness} more little kindness${kindness===2?'':'es'}`;ui['status-copy'].textContent=`Coffee in hand · ${3-kindness} neighbor${kindness===2?'':'s'} to go`}else{ui['mission-title'].textContent='The whole block, smiling';ui['mission-copy'].innerHTML='You made three mornings brighter. Take a moment and enjoy <b>your neighborhood</b>.';ui['reward-copy'].textContent='Neighborhood regular';ui['status-copy'].textContent='A little kindness goes a long way';ui['progress-text'].textContent='3 / 3';ui['finish-time'].textContent=formatTime(elapsed);ui['finish-kindness'].textContent='03';ui['finish-card'].classList.remove('hidden')}}
  function formatTime(s){let m=Math.floor(s/60),sec=Math.floor(s%60);return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0')}
  function openDialogue(target){dialogueOpen=true;ui.dialogue.classList.remove('hidden');if(target.type==='cafe'){
    ui['dialogue-avatar'].textContent='J';ui['dialogue-name'].textContent='JUNE · THE BARISTA';ui['dialogue-text'].textContent='Three regulars are waiting on their morning coffee. Could you help me get these out? The neighborhood is just waking up.';ui['dialogue-action'].innerHTML='I’m on it <span>↗</span>';ui['dialogue-action'].onclick=()=>{kindness=1;dialogueOpen=false;ui.dialogue.classList.add('hidden');updateMission();showToast('Fresh coffee picked up · find the glowing neighbor');beep(540)};
  }else{const n=target;ui['dialogue-avatar'].textContent=n.initial;ui['dialogue-avatar'].style.background=n.color;ui['dialogue-name'].textContent=n.name;ui['dialogue-text'].textContent=n.line;ui['dialogue-action'].innerHTML='Happy to help <span>↗</span>';ui['dialogue-action'].onclick=()=>{n.delivered=true;kindness++;dialogueOpen=false;ui.dialogue.classList.add('hidden');updateMission();showToast(n.done);beep(660);if(kindness===3){completed=true;ui['finish-time'].textContent=formatTime(elapsed)}}}
  }
  function interact(){if(!started||paused)return;if(dialogueOpen){ui.dialogue.classList.add('hidden');dialogueOpen=false;return}const target=getNearest();if(target)openDialogue(target);else if(kindness===0)showToast("June's Coffee is just a little west of here.");else if(kindness<3)showToast('Follow the little heart to the next neighbor.')}
  function beep(freq=520){if(!soundOn)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.055,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.18);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.18)}catch(e){}}
  function drawMini(){const w=mini.width,h=mini.height;mctx.clearRect(0,0,w,h);mctx.fillStyle='#c7c7a8';mctx.fillRect(0,0,w,h);mctx.fillStyle='#aaa995';mctx.fillRect(0,h*.4,w,h*.16);mctx.fillRect(w*.47,0,w*.1,h);mctx.fillStyle='#d7b58b';buildings.forEach(b=>mctx.fillRect(b.x/W*w,b.y/H*h,b.w/W*w,b.h/H*h));mctx.fillStyle='#829477';trees.forEach(t=>{mctx.beginPath();mctx.arc(t.x/W*w,t.y/H*h,1,0,7);mctx.fill()});if(kindness===0){mctx.fillStyle='#de895e';mctx.beginPath();mctx.arc(572/W*w,465/H*h,3,0,7);mctx.fill()}else npcs.filter(n=>!n.delivered).forEach(n=>{mctx.fillStyle='#df8e67';mctx.beginPath();mctx.arc(n.x/W*w,n.y/H*h,3,0,7);mctx.fill()});mctx.fillStyle='#fff';mctx.beginPath();mctx.arc(player.x/W*w,player.y/H*h,3.5,0,7);mctx.fill();mctx.strokeStyle='#405246';mctx.lineWidth=1;mctx.stroke()}
  function frame(ts){requestAnimationFrame(frame);const now=ts/1000,dt=Math.min(.04,lastTime?now-lastTime:0);lastTime=now;if(started&&!paused){elapsed+=dt;if(!dialogueOpen){let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;let run=keys.has('shift')||keys.has('run');let speed=run?225:145;player.speed=(dx||dy)?speed:0;player.dir=Math.atan2(dy,dx);if(dx&&!blocked(player.x+dx*speed*dt,player.y))player.x+=dx*speed*dt;if(dy&&!blocked(player.x,player.y+dy*speed*dt))player.y+=dy*speed*dt;
      const tx=clamp(player.x-innerWidth*.5,0,W-innerWidth),ty=clamp(player.y-innerHeight*.53,0,H-innerHeight);camera.x+=(tx-camera.x)*Math.min(1,dt*4);camera.y+=(ty-camera.y)*Math.min(1,dt*4);
      const target=getNearest();if(target){ui.prompt.innerHTML=`<span class="key">E</span> ${target.type==='cafe'?'Pick up the coffee':'Deliver coffee to '+target.name.split(' ')[0]}`;ui.prompt.classList.add('visible')}else ui.prompt.classList.remove('visible');
      if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)ui.toast.classList.remove('visible')}
      const total=9*60+41+elapsed*2;const hour=Math.floor(total/3600)%12||12,mins=Math.floor(total/60)%60;ui.clock.textContent=`${String(hour).padStart(2,'0')}:${String(mins).padStart(2,'0')} ${total%43200<12*3600?'AM':'PM'}`;
    }}
    ctx.clearRect(0,0,innerWidth,innerHeight);drawWorld(now);drawMini();
  }
  requestAnimationFrame(frame);
  function begin(){started=true;ui['start-screen'].classList.add('gone');showToast('Welcome to Old Town · take your time');beep(460)}
  ui['start-btn'].addEventListener('click',begin);ui['dialogue-close'].addEventListener('click',()=>{dialogueOpen=false;ui.dialogue.classList.add('hidden')});ui['touch-interact'].addEventListener('pointerdown',e=>{e.preventDefault();interact()});ui['touch-run'].addEventListener('pointerdown',e=>{e.preventDefault();keys.add('run')});for(const ev of ['pointerup','pointercancel','pointerleave'])ui['touch-run'].addEventListener(ev,()=>keys.delete('run'));
  document.querySelectorAll('[data-dir]').forEach(btn=>{const dir=btn.dataset.dir,key={up:'w',down:'s',left:'a',right:'d'}[dir];btn.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(key);btn.setPointerCapture(e.pointerId)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(ev,()=>keys.delete(key))});
  ui['keep-exploring'].addEventListener('click',()=>ui['finish-card'].classList.add('hidden'));ui['resume-btn'].addEventListener('click',()=>{paused=false;ui['pause-overlay'].classList.add('hidden')});ui['sound-btn'].addEventListener('click',()=>{soundOn=!soundOn;ui['sound-btn'].textContent=soundOn?'♫':'♪';ui['sound-btn'].title=soundOn?'Sound on':'Sound off'});
  addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape'&&started&&!dialogueOpen){paused=!paused;ui['pause-overlay'].classList.toggle('hidden',!paused)}if(k==='enter'&&!started){begin();return}if(k==='e'||k===' '){if(!e.repeat)interact();return}keys.add(k)});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
})();
