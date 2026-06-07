// ═══════════════════════════════════════════════
// CACHE DO DOM
// ═══════════════════════════════════════════════
const DOM = {
  clock: document.getElementById('clock'),
  cdate: document.getElementById('cdate'),
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
  tickerTxt: document.getElementById('tickerTxt')
};

// ═══════════════════════════════════════════════
// CONFIGURAÇÕES
// ═══════════════════════════════════════════════
const LAT = -23.6228, LON = -46.5614;
const REFRESH = 5 * 60 * 1000;
const SAISP_API_URL = 'https://api-defesa-civil-1.onrender.com/api/rios';

// ═══════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════
const pad = n => String(n).padStart(2,'0');

function set(id, val, html=false) {
  const el = DOM[id] || document.getElementById(id);
  if (!el) return;
  if (html) el.innerHTML = val; else el.textContent = val;
  el.classList.remove('loading');
}

// ═══════════════════════════════════════════════
// INTEGRACÃO RIOS (RENDER API)
// ═══════════════════════════════════════════════
async function fetchRios() {
  try {
    const res = await fetch(SAISP_API_URL);
    if (!res.ok) throw new Error('API offline');
    const dados = await res.json();
    
    // Atualiza Tamanduateí
    const pctT = Math.min(100, (dados.tamanduatei.nivel_m / 3.5) * 100);
    document.getElementById('rf-tamandua').style.height = `${pctT}%`;
    set('rp-tamandua', `${Math.round(pctT)}%`);
    set('rh-tamandua', `${dados.tamanduatei.nivel_m.toFixed(2)}m`);
    
    // Atualiza Meninos
    const pctM = Math.min(100, (dados.meninos.nivel_m / 2.2) * 100);
    document.getElementById('rf-meninos').style.height = `${pctM}%`;
    set('rp-meninos', `${Math.round(pctM)}%`);
    set('rh-meninos', `${dados.meninos.nivel_m.toFixed(2)}m`);
    
  } catch (e) {
    console.error('Erro Rios:', e);
  }
}

// ═══════════════════════════════════════════════
// CLIMA (OPEN-METEO)
// ═══════════════════════════════════════════════
async function fetchWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&daily=weather_code,uv_index_max,wind_speed_10m_max,sunrise,sunset&timezone=America%2FSao_Paulo&forecast_days=1&past_days=1`;
    const d = await(await fetch(url)).json();
    const c = d.current;
    
    // Atualiza DOM clima...
    set('temp', `${Math.round(c.temperature_2m)}°C`);
    set('hum', `${c.relative_humidity_2m}%`);
    set('r1h', `${(c.rain||0).toFixed(1)} mm/h`);
    set('wind', `${Math.round(c.wind_speed_10m)} km/h`);
    set('gust', `${Math.round(c.wind_gusts_10m)} km/h`);
    set('felt', `${Math.round(c.apparent_temperature)}°C`);
    set('pres', `${Math.round(c.surface_pressure)} hPa`);
    set('cloud', `${c.cloud_cover}%`);
    
  } catch (e) {
    console.error('Erro Clima:', e);
  }
}

// ═══════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════
(async function init(){
  await fetchWeather();
  await fetchRios();
  setInterval(async () => {
    await fetchWeather();
    await fetchRios();
  }, REFRESH);
})();
