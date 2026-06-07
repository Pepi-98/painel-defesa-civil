// ═══════════════════════════════════════════════
// CACHE DO DOM - OTIMIZAÇÃO DE PERFORMANCE
// ═══════════════════════════════════════════════
const DOM = {
  clock: document.getElementById('clock'),
  cdate: document.getElementById('cdate'),
  camClock: document.getElementById('cam-clock'),
  connStatus: document.getElementById('conn-status'),
  wIcon: document.getElementById('w-icon'),
  temp: document.getElementById('temp'),
  wDesc: document.getElementById('w-desc'),
  hum: document.getElementById('hum'),
  humSub: document.getElementById('hum-sub'),
  r1h: document.getElementById('r1h'),
  r1hSub: document.getElementById('r1h-sub'),
  wind: document.getElementById('wind'),
  gust: document.getElementById('gust'),
  felt: document.getElementById('felt'),
  pres: document.getElementById('pres'),
  cloud: document.getElementById('cloud'),
  wdir: document.getElementById('wdir'),
  upd: document.getElementById('upd'),
  alertPanel: document.getElementById('alertPanel'),
  alertName: document.getElementById('alertName'),
  alertDesc: document.getElementById('alertDesc'),
  alertTs: document.getElementById('alertTs'),
  alertsList: document.getElementById('alertsList'),
  tickerTxt: document.getElementById('tickerTxt'),
  camsGrid: document.getElementById('camsGrid')
};

// ═══════════════════════════════════════════════
// CÂMERAS — WebRTC
// ═══════════════════════════════════════════════
const BASE = 'https://streamingcamspmscs.saocaetanodosul.sp.gov.br:5443/WebRTCApp/play.html';
const CAMERAS = [
  { id: 'cam1', name: 'Av. dos Estados × R. Pamplona',     stream: 'LWTtSxiAeAV41676642467947' },
  { id: 'cam2', name: 'Av. dos Estados × Av. Matarazzo',   stream: 'uggch0FSbH4K1702643193972' },
  { id: 'cam3', name: 'Av. Guido Aliberti × Lions Clube',  stream: 'isHZsSHqnPpO1702643158345' },
  { id: 'cam4', name: 'Av. Guido Aliberti × J. Paixão',    stream: 'qLOTftbVH1tn1676645623939' },
  { id: 'cam5', name: 'Piscinão Jaboticabal',              stream: 'OioeeeSHs2Vt1779370064948' }
];

function camUrl(stream) {
  return `${BASE}?name=${stream}&mute=true&autoplay=true&playOrder=webrtc,hls`;
}

let camerasInitialized = false;

function renderCameras() {
  if (!camerasInitialized) {
    // Primeira renderização: cria o HTML
    DOM.camsGrid.innerHTML = CAMERAS.map((cam, i) => `
      <div class="cam-slot" id="${cam.id}">
        <div class="cam-feed">
          <iframe id="iframe-${cam.id}" src="${camUrl(cam.stream)}" allow="autoplay; fullscreen" allowfullscreen scrolling="no" loading="lazy" title="${cam.name}"></iframe>
        </div>
        <div class="cam-label">
          <span class="cam-num">CAM ${String(i+1).padStart(2,'0')}</span>
          <span class="cam-name">${cam.name}</span>
          <span class="cam-dot"></span>
        </div>
      </div>
    `).join('');
    camerasInitialized = true;
  } else {
    // Atualização: apenas recarrega o src para evitar piscar na tela
    CAMERAS.forEach(cam => {
      const iframe = document.getElementById(`iframe-${cam.id}`);
      if (iframe) iframe.src = camUrl(cam.stream);
    });
  }
}

setInterval(renderCameras, 15 * 60 * 1000);

// ═══════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════
const LAT = -23.6228, LON = -46.5614, CITY = 'São Caetano do Sul';
const REFRESH = 5 * 60 * 1000;
let rainChart = null;

const DAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const pad = n => String(n).padStart(2,'0');

function tickClock() {
  const n = new Date();
  const t = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
  DOM.clock.innerHTML = `${t} <span>|</span>`;
  DOM.cdate.textContent = `${DAYS[n.getDay()]}, ${n.getDate()} de ${MONTHS[n.getMonth()]} de ${n.getFullYear()}`;
  if (DOM.camClock) DOM.camClock.textContent = t;
}
setInterval(tickClock, 1000); tickClock();

// ═══════════════════════════════════════════════
// STATUS DE CONEXÃO
// ═══════════════════════════════════════════════
function updateConnectionStatus(isOnline) {
  if (isOnline) {
    DOM.connStatus.innerHTML = '<span class="dot"></span>AO VIVO';
    DOM.connStatus.style.color = 'var(--txt2)';
    DOM.upd.classList.remove('error-text');
  } else {
    DOM.connStatus.innerHTML = '<span class="dot offline"></span>FALHA DE COMUNICAÇÃO';
    DOM.connStatus.style.color = 'var(--vermelho)';
    DOM.upd.classList.add('error-text');
    DOM.upd.textContent = 'ERRO: DADOS DESATUALIZADOS';
  }
}

// ═══════════════════════════════════════════════
// WMO + HELPERS
// ═══════════════════════════════════════════════
function wmoInfo(code) {
  const m = {
    0:['☀️','Céu Limpo'],1:['🌤️','Predom. Claro'],2:['⛅','Parc. Nublado'],3:['☁️','Encoberto'],
    45:['🌫️','Nevoeiro'],48:['🌫️','Nevoeiro'],
    51:['🌦️','Garoa Fraca'],53:['🌦️','Garoa Mod.'],55:['🌧️','Garoa Densa'],
    61:['🌧️','Chuva Fraca'],63:['🌧️','Chuva Moderada'],65:['🌧️','Chuva Forte'],
    71:['🌨️','Neve'],73:['🌨️','Neve Mod.'],75:['🌨️','Neve Intensa'],77:['🌨️','Granizo'],
    80:['🌦️','Pancadas Fracas'],81:['🌧️','Pancadas Mod.'],82:['⛈️','Pancadas Fortes'],
    95:['⛈️','Trovoada'],96:['⛈️','Trovoada+Granizo'],99:['⛈️','Trovoada Intensa'],
  };
  return m[code] || ['🌡️','Desconhecida'];
}
const windDir = d => ['N','NE','L','SE','S','SO','O','NO'][Math.round(d/45)%8];
const uvLabel  = v => v<=2?'Baixo':v<=5?'Moderado':v<=7?'Alto':v<=10?'Muito Alto':'Extremo';
const humLabel = h => h<30?'Seco':h<60?'Normal':h<80?'Úmido':'Muito Úmido';
const rainLabel= r => r===0?'Sem Pluviosidade':r<1?'Traços':r<5?'Leve':r<15?'Moderada':'Intensa';

function set(id, val, html=false) {
  const el = DOM[id] || document.getElementById(id);
  if (!el) return;
  if (html) el.innerHTML = val; else el.textContent = val;
  el.classList.remove('loading');
}

function colorPrecip(id,v,w,c) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'pi-v';
  if (v>=c) el.classList.add('ex');
  else if (v>=w) el.classList.add('hi');
}

// ═══════════════════════════════════════════════
// COBRADE
// ═══════════════════════════════════════════════
const alertMeta = {
  verde:   { name:'VERDE',   desc:'Situação de Normalidade · Sem Risco' },
  amarelo: { name:'AMARELO', desc:'Situação de Observação · Atenção' },
  laranja: { name:'LARANJA', desc:'Situação de Alerta · Risco Moderado' },
  vermelho:{ name:'VERMELHO',desc:'Alerta Máximo · Risco Elevado' },
};

function getAlertLevel(p24,p72,wcode) {
  const storm=[95,96,99].includes(wcode), heavy=[65,82].includes(wcode);
  if(p24>80||p72>120||(storm&&p24>40)) return 'vermelho';
  if(p24>50||p72>80||(storm&&p24>15))  return 'laranja';
  if(p24>20||p72>50||storm||heavy)     return 'amarelo';
  return 'verde';
}

function applyAlert(level) {
  DOM.alertPanel.className = `alert-panel ${level}`;
  set('alertName', alertMeta[level].name);
  set('alertDesc', alertMeta[level].desc);
  const order = ['verde','amarelo','laranja','vermelho'];
  [['verde','sv'],['amarelo','sa'],['laranja','sl'],['vermelho','sr']].forEach(([l,id],i) => {
    const el = document.getElementById(id);
    if(el) el.className = `seg s${l[0]} ${order.indexOf(level)>=i?'on':''}`;
  });
  const n = new Date();
  set('alertTs', `Atualizado: ${pad(n.getHours())}:${pad(n.getMinutes())}`);
}

// ═══════════════════════════════════════════════
// RIOS
// ═══════════════════════════════════════════════
const RIVER_MAX = { tamandua:3.5, meninos:2.2 };

function updateRiver(prefix, level, maxH) {
  const pct = Math.min(97, Math.max(5, level));
  const h_m = (pct/100*maxH).toFixed(2);
  const fill = document.getElementById(`rf-${prefix}`);
  const pctEl = document.getElementById(`rp-${prefix}`);
  const stat = document.getElementById(`rs-${prefix}`);
  const ht = document.getElementById(`rh-${prefix}`);
  if (!fill) return;
  fill.style.height = `${pct}%`;
  if(pctEl) pctEl.textContent = `${Math.round(pct)}%`;
  if(ht){ ht.textContent = `${h_m}m`; ht.classList.remove('loading'); }
  if(stat) stat.classList.remove('loading');
  if(pct>=70){ 
    fill.style.background='var(--vermelho)'; 
    if(stat){stat.textContent='● ALERTA'; stat.style.color='var(--vermelho)';} 
  }
  else if(pct>=40){ 
    fill.style.background='var(--amarelo)'; 
    if(stat){stat.textContent='● ATENÇÃO'; stat.style.color='var(--amarelo)';} 
  }
  else{ 
    fill.style.background='var(--verde)'; 
    if(stat){stat.textContent='● NORMAL'; stat.style.color='var(--verde)';} 
  }
}

function calcRiverLevels(p1h,p12h,p24h) {
  updateRiver('tamandua', 25+(p1h*2.4)+(p12h*0.35)+(p24h*0.12), RIVER_MAX.tamandua);
  updateRiver('meninos',  20+(p1h*3.2)+(p12h*0.55)+(p24h*0.18), RIVER_MAX.meninos);
}

// ═══════════════════════════════════════════════
// CHART
// ═══════════════════════════════════════════════
function drawChart(labels,vals) {
  const ctx = document.getElementById('rainChart');
  if(!ctx) return;
  if(rainChart) rainChart.destroy();
  rainChart = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ data:vals,
      backgroundColor:vals.map(v=>v>10?'rgba(239,68,68,0.75)':v>3?'rgba(249,115,22,0.75)':'rgba(96,200,160,0.6)'),
      borderRadius:2,borderWidth:0 }] },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.y.toFixed(1)} mm`}}},
      scales:{
        x:{ticks:{color:'rgba(120,155,130,0.8)',font:{family:'Share Tech Mono',size:8},maxRotation:0},grid:{color:'rgba(255,255,255,0.03)'}},
        y:{ticks:{color:'rgba(120,155,130,0.8)',font:{family:'Share Tech Mono',size:8}},grid:{color:'rgba(255,255,255,0.03)'},beginAtZero:true}
      }
    }
  });
}

// ═══════════════════════════════════════════════
// ALERTAS + TICKER
// ═══════════════════════════════════════════════
function renderAlerts(level,p24,wcode) {
  const n = new Date(), ts = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
  const storm = [95,96,99].includes(wcode);
  let rows = [];
  if(level==='verde'){
    rows.push({t:'ok',  tp:'Normal', txt:`Nenhum alerta ativo para ${CITY}`});
    rows.push({t:'info',tp:'Info',   txt:'Sistema operacional · Monitoramento ativo 24h'});
  } else if(level==='amarelo'){
    rows.push({t:'warn',tp:'Aviso',  txt:`Pluviosidade acumulada: ${p24.toFixed(1)} mm/24h — monitorar`});
    rows.push({t:'info',tp:'Info',   txt:'Verificar pontos de alagamento conhecidos'});
  } else if(level==='laranja'){
    rows.push({t:'warn',  tp:'Alerta', txt:`Chuva intensa · ${p24.toFixed(1)} mm/24h`});
    rows.push({t:'warn',  tp:'Alerta', txt:'Acionar equipes de campo · Verificar drenagem'});
    rows.push({t:'info',  tp:'Info',   txt:'Monitorar áreas de risco geológico'});
  } else {
    rows.push({t:'danger',tp:'Crítico',txt:`ALERTA MÁXIMO · ${p24.toFixed(1)} mm/24h`});
    rows.push({t:'danger',tp:'Crítico',txt:'Acionar protocolo de emergência imediatamente'});
    rows.push({t:'danger',tp:'Crítico',txt:'Alertar população via SIGA e SMS · Defesa Civil 199'});
    rows.push({t:'warn',  tp:'Ação',   txt:'Coordenar Bombeiros 193 e SAMU 192'});
  }
  if(storm) rows.push({t:'warn',tp:'Aviso',txt:'Trovoada detectada — risco de raios e vendaval'});
  
  DOM.alertsList.innerHTML = rows.map(r=>`
    <div class="ai ${r.t}">
      <div class="ai-dot"></div>
      <div class="ai-body"><div class="ai-type">${r.tp}</div><div class="ai-txt">${r.txt}</div></div>
      <div class="ai-time">${ts}</div>
    </div>`).join('');
}

function updateTicker(level,p24,cur) {
  const [,desc] = wmoInfo(cur.weather_code);
  const msgs = [
    `${CITY} · ${desc} · ${Math.round(cur.temperature_2m)}°C · Umidade ${cur.relative_humidity_2m}%`,
    `Vento: ${Math.round(cur.wind_speed_10m)} km/h ${windDir(cur.wind_direction_10m)} · Rajada: ${Math.round(cur.wind_gusts_10m)} km/h`,
    `Pluviosidade acumulada 24h: ${p24.toFixed(1)} mm`,
    `Grau de Perigo COBRADE: ${alertMeta[level].name} · ${alertMeta[level].desc}`,
    `Defesa Civil SCS · Emergências: 199 · Bombeiros: 193 · SAMU: 192 · Polícia: 190`,
  ];
  if(level !== 'verde') msgs.unshift(`⚠️ ALERTA ${alertMeta[level].name} ATIVO — ${alertMeta[level].desc} ⚠️`);
  DOM.tickerTxt.textContent = msgs.join('   ·   ') + '   ·   ';
}

// ═══════════════════════════════════════════════
// FETCH WEATHER
// ═══════════════════════════════════════════════
async function fetchWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&hourly=precipitation&daily=weather_code,uv_index_max,wind_speed_10m_max,sunrise,sunset&timezone=America%2FSao_Paulo&forecast_days=2&past_days=3`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('API request failed');
    const d = await response.json();
    const c = d.current, h = d.hourly, daily = d.daily;
    if(!c) throw new Error('No current data');
    
    updateConnectionStatus(true);
    
    const [icon,desc] = wmoInfo(c.weather_code);
    DOM.wIcon.textContent = icon;
    set('temp', `${Math.round(c.temperature_2m)}°C`);
    set('wDesc', desc);
    set('hum', `${c.relative_humidity_2m}%`);
    set('humSub', humLabel(c.relative_humidity_2m));
    set('r1h', `${(c.rain||0).toFixed(1)} mm/h`);
    set('r1hSub', rainLabel(c.rain||0));
    set('wind', `${Math.round(c.wind_speed_10m)} km/h`);
    set('gust', `${Math.round(c.wind_gusts_10m)} km/h`);
    set('felt', `${Math.round(c.apparent_temperature)}°C`);
    set('pres', `${Math.round(c.surface_pressure)} hPa`);
    set('cloud', `${c.cloud_cover}%`);
    set('wdir', windDir(c.wind_direction_10m));

    const nowH = new Date().toISOString().slice(0,13);
    let idx = h.time.findIndex(t=>t.startsWith(nowH));
    if(idx<0) idx = h.time.length-1;
    const sum = (a,s,e) => a.slice(Math.max(0,s),e+1).reduce((x,y) => x+(y||0),0);
    const p1 = h.precipitation[idx]||0;
    const p12 = sum(h.precipitation,idx-11,idx);
    const p24 = sum(h.precipitation,idx-23,idx);
    const p72 = sum(h.precipitation,idx-71,idx);
    
    set('p1', p1.toFixed(1)); set('p12', p12.toFixed(1));
    set('p24', p24.toFixed(1)); set('p72', p72.toFixed(1));
    colorPrecip('p1',p1,5,15); colorPrecip('p12',p12,10,30);
    colorPrecip('p24',p24,25,60); colorPrecip('p72',p72,50,100);

    calcRiverLevels(c.rain||0,p12,p24);
    const level = getAlertLevel(p24,p72,c.weather_code);
    applyAlert(level);
    renderAlerts(level,p24,c.weather_code);
    updateTicker(level,p24,c);

    const fH = h.time.slice(idx,idx+25), fP = h.precipitation.slice(idx,idx+25);
    drawChart(fH.filter((_,i)=>i%2===0).map(t=>t.slice(11,16)), fP.filter((_,i)=>i%2===0));

    const todayStr = new Date().toISOString().slice(0,10);
    const di = daily.time.indexOf(todayStr), dii = di>=0?di:0;
    const uvV = daily.uv_index_max?daily.uv_index_max[dii]:null;
    if(uvV!=null){set('uv', uvV.toFixed(1)); document.getElementById('uv-desc').textContent = uvLabel(uvV);}
    const wmV = daily.wind_speed_10m_max?daily.wind_speed_10m_max[dii]:null;
    if(wmV!=null) set('wmax', Math.round(wmV));
    if(daily.sunrise) set('sunrise', (daily.sunrise[dii]||'').slice(11,16)||'--:--');
    if(daily.sunset)  set('sunset', (daily.sunset[dii]||'').slice(11,16)||'--:--');
    const n = new Date();
    set('upd', `Última atualização: ${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`);
  } catch(e) {
    console.error('Weather Fetch Error:', e);
    updateConnectionStatus(false);
  }
}

async function fetchAQ() {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}&current=pm10,pm2_5,uv_index&timezone=America%2FSao_Paulo`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('AQ API failed');
    const d = await response.json();
    if(d.current){
      if(d.current.pm2_5!=null) set('pm25', Math.round(d.current.pm2_5));
      if(d.current.pm10!=null)  set('pm10', Math.round(d.current.pm10));
    }
  } catch(e) {
    set('pm25','N/D'); set('pm10','N/D');
  }
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
(async function init(){
  renderCameras();
  await fetchWeather();
  await fetchAQ();
  setInterval(async () => {
    await fetchWeather();
    await fetchAQ();
  }, REFRESH);
})();
