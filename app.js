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
// RIOS (Integração com a API do SAISP no Render)
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

async function fetchRios() {
  try {
    // API hospedada no Render
    const url = 'https://api-defesa-civil-1.onrender.com/api/rios';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha na API de Rios');
    const dados = await res.json();

    // Atualiza Rio Tamanduateí (E3-019)
    if (dados.tamanduatei && dados.tamanduatei.nivel_m !== undefined) {
      updateRiver('tamandua', (dados.tamanduatei.nivel_m / RIVER_MAX.tamandua) * 100, RIVER_MAX.tamandua);
      // Força o valor exato no painel para maior precisão
      set('rh-tamandua', `${dados.tamanduatei.nivel_m.toFixed(2)}m`);
    }

    // Atualiza Rio dos Meninos (E3-028)
    if (dados.
