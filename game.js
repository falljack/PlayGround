(() => {
  const locations = [
    {name:'Veyra', label:'Outer Gate', subtitle:'Your home country · North coast', type:'THE BEGINNING', glyph:'⌂', x:48.2,y:33.2, threat:'LOW', story:'The border sirens are still singing behind you. Your travel papers were denied before dawn. Ahead: a world that has never asked for permission.', quote:'If the map ends here, then the map is lying.', author:'A note from your mother', reward:'40 crowns', weather:'Saltwind morning', line:'A border drawn in ink is still only a line.'},
    {name:'Marrakesh',label:'The Blue Gate',subtitle:'Morocco · North Africa',type:'FIRST FOOTSTEPS',glyph:'⌘',x:51.1,y:41.5,threat:'LOW',story:'A city of blue doors and rooftop gardens. Nobody asks where you came from; they only ask if you have eaten.',quote:'You crossed a line on a map. The sky didn’t change.',author:'Mira’s field journal',reward:'55 crowns',weather:'Warm desert breeze',line:'Some doors open when you stop knocking.'},
    {name:'Cairo',label:'The City of Dust',subtitle:'Egypt · Nile Delta',type:'SANDS OF MEMORY',glyph:'☼',x:54.3,y:43.1,threat:'GUARDED',story:'Beneath the old city, a guide offers to lead you through the sleeping catacombs. The stones remember every empire that called itself eternal.',quote:'Even the oldest walls have a way through.',author:'A line scratched into limestone',reward:'65 crowns',weather:'Saffron dusk',line:'The desert keeps what the world forgets.'},
    {name:'Kathmandu',label:'Cloud Ladder',subtitle:'Nepal · Himalayan foothills',type:'ABOVE THE CLOUDS',glyph:'△',x:66.2,y:38.2,threat:'HIGH',story:'The mountain pass is thinning under a sudden storm. A shepherd’s lantern winks from a ridge where no trail is marked.',quote:'Courage is just fear that found a direction.',author:'A voice in the snow',reward:'75 crowns',weather:'High mountain mist',line:'The hard way up is still a way.'},
    {name:'Kyoto',label:'Paper Lanterns',subtitle:'Japan · Kansai region',type:'A QUIETER KIND OF BRAVE',glyph:'✿',x:76.8,y:39.5,threat:'LOW',story:'Rain glitters on narrow streets. In a lantern-lit tea house, a cartographer recognizes the seal on your papers—and quietly burns the record.',quote:'A small kindness can redraw a whole country.',author:'The tea house keeper',reward:'85 crowns',weather:'Soft spring rain',line:'Some maps are made of the people you meet.'},
    {name:'Amazonia',label:'The Green Cathedral',subtitle:'Brazil · Amazon basin',type:'THE LIVING WORLD',glyph:'❋',x:29.2,y:58.3,threat:'HIGH',story:'Green climbs over every forgotten road. The river is rising, and a field team needs help getting a village to higher ground before nightfall.',quote:'The world is not a place we pass through. It is a life we share.',author:'Field notes, page 17',reward:'95 crowns',weather:'Rainforest rain',line:'Listen closely: the forest is telling you where to go.'},
    {name:'Patagonia',label:'The Last Blue',subtitle:'Chile & Argentina · Southern reach',type:'EDGE OF THE MAP',glyph:'❄',x:25.6,y:75.5,threat:'HIGH',story:'Wind tears at the tent as the southern ice shelf groans. Your companion spots a stranded survey crew across a field of fractured blue.',quote:'No horizon is worth leaving someone behind.',author:'Your own handwriting',reward:'110 crowns',weather:'Antarctic wind',line:'At the edge of the world, you find each other.'},
    {name:'Lisbon',label:'The Far Shore',subtitle:'Portugal · Atlantic coast',type:'THE LONG WAY HOME',glyph:'≈',x:47.4,y:33.5,threat:'GUARDED',story:'Ships leave at dawn for every corner of the globe. A captain offers you passage—if you can help her crew decode a chart from the age of sail.',quote:'The sea does not know the names of borders.',author:'Captain Inez',reward:'125 crowns',weather:'Atlantic gold',line:'Every departure is a promise to return.'},
    {name:'New York',label:'A Thousand Windows',subtitle:'United States · Atlantic seaboard',type:'A WORLD IN ONE CITY',glyph:'▥',x:29.7,y:33.4,threat:'GUARDED',story:'Every language you have ever heard meets in one crowded station. An old broadcast carries a voice from Veyra, asking the world to look closer.',quote:'Far away is not the same as alone.',author:'A voice across the ocean',reward:'140 crowns',weather:'Electric twilight',line:'You are not the only one who dreamed of elsewhere.'},
    {name:'The Open Sea',label:'A New Beginning',subtitle:'Somewhere beyond the known chart',type:'UNCHARTED',glyph:'✧',x:38.7,y:21.5,threat:'UNKNOWN',story:'The atlas ends in a blank margin. Together, you decide what should be drawn there. The story is yours to continue.',quote:'The world is bigger than the fear that fenced it in.',author:'A new page',reward:'160 crowns',weather:'Clear horizon',line:'The map is yours now.'}
  ];
  const companions = [
    {id:'inez',name:'Inez Sol',role:'SHIP CAPTAIN · PORTUGAL',rarity:5,mark:'≈',desc:'A fearless navigator who can read a storm by its silence.'},
    {id:'tashi',name:'Tashi Dorje',role:'MOUNTAIN GUIDE · NEPAL',rarity:4,mark:'△',desc:'Knows a dozen paths where the maps show none.'},
    {id:'samira',name:'Samira Nassar',role:'ARCHIVIST · EGYPT',rarity:4,mark:'☼',desc:'Collects forgotten stories and the keys that guard them.'},
    {id:'ren',name:'Ren Akiyama',role:'CARTOGRAPHER · JAPAN',rarity:4,mark:'✿',desc:'Draws the places people carry in their hearts.'},
    {id:'luz',name:'Luz Ferreira',role:'FIELD MEDIC · BRAZIL',rarity:3,mark:'❋',desc:'A steady hand and a laugh brighter than the canopy.'},
    {id:'eli',name:'Eli Brooks',role:'RADIO MAKER · NEW YORK',rarity:3,mark:'▥',desc:'Can find a signal in all the noise of the world.'},
    {id:'noor',name:'Noor Haddad',role:'TRAIL COOK · MOROCCO',rarity:3,mark:'⌘',desc:'Makes a home anywhere there is a fire and a pot.'}
  ];
  const relicNames=['Border Pass, Unused','Blue Door Charm','Limestone Listening Stone','Prayer Flag','Folded Paper Crane','River Seed','Glacier Glass','Brass Compass','Station Postcard'];
  const defaults={traveler:'Mira',started:false,escaped:false,current:0,selected:0,stamina:5,crowns:120,seals:1,visited:[0],companions:[],relics:[],journal:[],summons:0};
  let state;
  try { const saved=JSON.parse(localStorage.getItem('wayfarer-save')); state=saved?{...defaults,...saved}: {...defaults}; } catch { state={...defaults}; }
  state.current=Math.min(Math.max(0,state.current||0),locations.length-1);state.selected=state.current;
  let activeView='map';let toastTimer;
  const $=id=>document.getElementById(id);
  const safe=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function save(){localStorage.setItem('wayfarer-save',JSON.stringify(state));}
  function notify(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2500)}
  function travelerName(){return state.traveler==='Noah'?'Noah Reed':'Mira Vale'}
  function render(){
    $('sidebar-name').textContent=travelerName();$('sidebar-avatar').textContent=state.traveler[0];$('stamina-value').textContent=state.stamina;$('coin-value').textContent=state.crowns;$('seal-value').textContent=state.seals;$('roster-count').textContent=String(state.companions.length+1).padStart(2,'0');
    $('weather-name').textContent=locations[state.current].weather;$('top-location').textContent=locations[state.current].name.toUpperCase();
    renderMarkers();renderLocation();if(activeView!=='map')renderPage(activeView);
    if(!state.started)$('intro-modal').classList.remove('hidden');else $('intro-modal').classList.add('hidden');
    save();
  }
  function renderMarkers(){
    const host=$('map-markers');host.innerHTML='';
    locations.forEach((loc,i)=>{
      const visited=state.visited.includes(i),isNext=i===state.current+1&&state.escaped,locked=i>state.current+1||(!state.escaped&&i>0),isCurrent=i===state.current;
      const marker=document.createElement('button');marker.className=`map-marker${isCurrent?' current':''}${isNext?' next':''}${locked?' locked':''}`;marker.style.left=loc.x+'%';marker.style.top=loc.y+'%';marker.setAttribute('aria-label',`${loc.name}, ${visited?'discovered':isNext?'next bearing':'uncharted'}`);
      marker.innerHTML=`<span class="marker-pin"></span><span class="marker-name">${safe(loc.name.toUpperCase())}</span>${isCurrent?'<span class="marker-state">YOU ARE HERE</span>':isNext?'<span class="marker-state">NEXT BEARING</span>':''}`;
      marker.addEventListener('click',()=>{state.selected=i;renderLocation();host.querySelectorAll('.map-marker').forEach(x=>x.classList.remove('selected'));marker.classList.add('selected')});host.append(marker);
    });
    const pts=state.visited.map(i=>`${locations[i].x*10},${locations[i].y*5}`);$('route-path').setAttribute('d',pts.length>1?'M'+pts.join(' L'): '');
  }
  function renderLocation(){
    const i=state.selected,loc=locations[i],visited=state.visited.includes(i),isNext=i===state.current+1&&state.escaped;
    $('location-type').textContent=visited?loc.type:(i===0?'THE BEGINNING':isNext?'NEXT BEARING':'UNCHARTED');$('location-glyph').textContent=loc.glyph;$('location-name').innerHTML=`${safe(loc.name)}<br>${safe(loc.label)}`;$('location-subtitle').textContent=loc.subtitle;
    $('story-copy').textContent=loc.story;$('quote-copy').textContent=loc.quote;$('quote-author').textContent='— '+loc.author;$('discovery-count').innerHTML=`${state.visited.length} <small>/ ${locations.length}</small>`;$('threat-level').innerHTML=`${loc.threat} <i>${loc.threat==='LOW'?'◆◇◇':loc.threat==='GUARDED'?'◆◆◇':loc.threat==='HIGH'?'◆◆◆':'◇◇◇'}</i>`;$('reward-text').innerHTML=visited?'Already in your journal':`${loc.reward} <span>·</span> 1 trail`;$('map-caption-text').textContent=loc.line;
    const button=$('primary-action');
    if(!state.escaped){button.disabled=false;button.innerHTML='<span class="action-icon">➜</span><span><b>Slip past the watch</b><small>Begin your journey beyond Veyra</small></span><i>→</i>';}
    else if(i===state.current){const next=locations[state.current+1];if(next){button.disabled=false;button.innerHTML=`<span class="action-icon">➜</span><span><b>Set out for ${safe(next.name)}</b><small>${state.stamina?`Spend 1 trail · Discover a new region`:'Make camp to restore your trail'}</small></span><i>→</i>`;}else{button.disabled=true;button.innerHTML='<span class="action-icon">✧</span><span><b>The atlas is yours</b><small>You have crossed every horizon</small></span><i>✓</i>';}}
    else if(isNext){button.disabled=false;button.innerHTML=`<span class="action-icon">➜</span><span><b>Travel to ${safe(loc.name)}</b><small>${state.stamina?'Spend 1 trail · Discover this region':'Make camp to restore your trail'}</small></span><i>→</i>`;}
    else if(visited){button.disabled=true;button.innerHTML='<span class="action-icon">✓</span><span><b>Region discovered</b><small>Choose the next bearing to continue</small></span><i>✦</i>';}
    else{button.disabled=true;button.innerHTML='<span class="action-icon">⌖</span><span><b>Beyond the known route</b><small>Follow the next bearing to chart this place</small></span><i>·</i>';}
    button.classList.toggle('disabled',button.disabled);
  }
  function startJourney(){
    state.traveler=document.querySelector('.traveler-option.selected')?.dataset.traveler||state.traveler;state.started=true;state.escaped=true;state.current=0;state.selected=0;
    state.journal=[{index:0,title:'The border is behind you',text:`${travelerName()} slipped through the old tidal passage just before sunrise. The world is waiting.`}];
    $('intro-modal').classList.add('hidden');render();notify('The journey begins. The world is yours to discover.');
  }
  function performAction(){
    if(!state.escaped){startJourney();return;}
    const target=state.selected===state.current?state.current+1:state.selected;
    if(target!==state.current+1||target>=locations.length)return;
    if(state.stamina<1){if(state.crowns<20){notify('Not enough crowns to make camp.');return}state.crowns-=20;state.stamina=5;notify('Camp made. Your trail is restored.');render();return;}
    state.stamina--;state.current=target;state.selected=target;state.visited.push(target);const loc=locations[target];const reward=Number(loc.reward.match(/\d+/)[0]);state.crowns+=reward;
    if(state.visited.length%2===0)state.seals++;
    state.relics.push(relicNames[target]);state.journal.unshift({index:target,title:`${loc.name}: ${loc.label}`,text:loc.story});
    render();notify(`Discovered ${loc.name} · +${reward} crowns${state.visited.length%2===0?' · +1 Wayfarer Seal':''}`);
  }
  function pickCompanion(){
    const roll=Math.random();let pool=roll<.08?companions.filter(c=>c.rarity===5):roll<.38?companions.filter(c=>c.rarity===4):companions.filter(c=>c.rarity===3);const item=pool[Math.floor(Math.random()*pool.length)];const duplicate=state.companions.includes(item.id);if(!duplicate)state.companions.push(item.id);else state.crowns+=35;state.seals--;state.summons++;
    $('gacha-result').classList.remove('hidden');$('gacha-result').innerHTML=`✦ &nbsp; ${duplicate?'A familiar face:':`A new companion joins the road:`} <b>${safe(item.name)}</b> · ${item.rarity}★${duplicate?' &nbsp; <small>(+35 crowns)</small>':''}`;
    $('pull-button').disabled=state.seals===0;$('pull-button').innerHTML=state.seals?'SUMMON ANOTHER WAYFARER <span>✦ 1</span>':'NO SEALS REMAIN';$('gacha-balance').textContent=`${state.seals} WAYFARER SEAL${state.seals===1?'':'S'} AVAILABLE`;render();renderPage('companions');
  }
  function openGacha(){ $('gacha-modal').classList.remove('hidden');$('gacha-result').classList.add('hidden');$('pull-button').disabled=state.seals===0;$('pull-button').innerHTML=state.seals?'SUMMON A WAYFARER <span>✦ 1</span>':'NO SEALS REMAIN';$('gacha-balance').textContent=`${state.seals} WAYFARER SEAL${state.seals===1?'':'S'} AVAILABLE`; }
  function renderPage(view){
    const host=$('view-'+view);if(!host)return;
    const header=(kicker,title,desc)=>`<div class="page-heading"><div class="eyebrow"><span class="live-dot"></span> ${kicker}</div><h1>${title}</h1><p>${desc}</p></div>`;
    if(view==='journal'){
      const entries=state.journal.length?state.journal.map(e=>`<article class="journal-entry"><div class="entry-date">FIELD NOTE · ${String(e.index+1).padStart(2,'0')}</div><div class="entry-body"><h3>${safe(e.title)}</h3><p>${safe(e.text)}</p></div></article>`).join(''):'<div class="empty-note">Your journal is waiting for its first horizon. Begin the journey to fill these pages.</div>';
      host.innerHTML=header('YOUR JOURNEY, IN YOUR WORDS','Field journal','Every crossing leaves a mark. These are the places and people that changed your map.')+`<div class="journal-list">${entries}</div>`;
    } else if(view==='companions'){
      const owned=companions.filter(c=>state.companions.includes(c.id));
      const self={name:travelerName(),role:state.traveler==='Mira'?'THE MAPMAKER · VEYRA':'THE STORYKEEPER · VEYRA',rarity:5,mark:state.traveler[0],desc:'The one who looked beyond the border and chose to go.'};
      host.innerHTML=header('THE PEOPLE WHO MAKE A PLACE','Companions',`${owned.length+1} wayfarer${owned.length===0?'':'s'} in your circle · Summon new friends for the road.`)+`<div class="roster-grid">${[self,...owned].map(c=>`<article class="character-card"><div class="character-art">${c.mark}</div><span class="rarity">${'★'.repeat(c.rarity)}</span><h3>${safe(c.name)}</h3><p>${safe(c.role)}<br>${safe(c.desc)}</p></article>`).join('')}</div>`;
    } else if(view==='relics'){
      const found=state.relics.map((name,i)=>`<article class="relic-card"><div class="relic-mark">${['◇','⌘','☼','△','✿','❋','❄','≈','▥'][i%9]}</div><h3>${safe(name)}</h3><p>Found in ${safe(locations[state.visited[i+1]??i].name)} · A keepsake from the road.</p></article>`).join('');
      host.innerHTML=header('SMALL THINGS, BIG DISTANCES','Keepsakes',`${state.relics.length} of ${locations.length-1} keepsakes gathered. Each one carries a piece of somewhere.`)+`<div class="relic-grid">${found||'<div class="empty-note">The road has many small wonders. Discover new places to find your first keepsake.</div>'}</div>`;
    }
  }
  function setView(view){activeView=view;document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('view-map').classList.toggle('hidden',view!=='map');document.querySelectorAll('.secondary-view').forEach(v=>v.classList.toggle('hidden',v.id!==`view-${view}`));if(view!=='map')renderPage(view);}
  document.querySelectorAll('.nav-link').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.view)));
  document.querySelectorAll('.traveler-option').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.traveler-option').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected')}));
  $('begin-button').addEventListener('click',startJourney);$('intro-close').addEventListener('click',()=>{$('intro-modal').classList.add('hidden')});$('primary-action').addEventListener('click',performAction);
  $('open-gacha').addEventListener('click',openGacha);$('gacha-close').addEventListener('click',()=>$('gacha-modal').classList.add('hidden'));$('pull-button').addEventListener('click',()=>{if(state.seals>0)pickCompanion()});
  $('center-map').addEventListener('click',()=>{state.selected=state.current;renderLocation();notify(`Centered on ${locations[state.current].name}.`)});
  $('map-mode').addEventListener('click',()=>notify('Expedition view · Your route updates as you travel.'));
  $('sound-toggle').addEventListener('click',e=>{const on=e.currentTarget.dataset.on!=='true';e.currentTarget.dataset.on=String(on);e.currentTarget.textContent=on?'♫':'♪';notify(on?'Ambient sound enabled.':'Ambient sound muted.')});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('gacha-modal').classList.add('hidden');$('intro-modal').classList.add('hidden')}});
  if(!state.started){const active=document.querySelector(`.traveler-option[data-traveler="${state.traveler}"]`);if(active){document.querySelectorAll('.traveler-option').forEach(b=>b.classList.remove('selected'));active.classList.add('selected')}}
  render();setView('map');
})();
