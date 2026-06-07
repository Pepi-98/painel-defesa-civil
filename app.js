// ═══════════════════════════════════════════════
// CACHE DO DOM
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
// CONFIGURAÇÕES
// ═══════════════════════════════════════════════
const LAT = -23.6228, LON = -46.5614, CITY = 'São Caetano do Sul';
const REFRESH = 5 * 60 * 1000;
// SUBSTITUA A URL ABAIXO PELA URL DO SEU RENDER
const SAISP_API_URL = 'https://api-defesa-civil-1.onrender.com/api/rios'; 

// ═══════════════════════════════════════════════
// FUNÇÃO DE RIOS (INTEGRAÇÃO COM RENDER)
// ═══════════════════════════════════════════════
async function fetchRios() {
  try {
    const res = await fetch(SAISP_API_URL);
    if (!res.ok) throw new Error('Falha na API');
    const dados = await res.json();

    // Atualiza Tamanduateí (E3-019)
    updateRiver('tamandua', (dados.tamanduatei.nivel_m / 3.5) * 100, dados.tamanduatei.nivel_m);
    
    // Atualiza Ribeirão dos Meninos (E3-028)
    updateRiver('meninos', (dados.meninos.nivel_m / 2.2) * 100, dados.meninos.nivel_m);
    
  } catch (e) {
    console.error('Erro nos rios:', e);
  }
}

function updateRiver(prefix, pct, val) {
  const fill = document.getElementById(`rf-${prefix}`);
  const pctEl = document.getElementById(`rp-${prefix}`);
  const ht = document.getElementById(`rh-${prefix}`);
  const stat = document.getElementById(`rs-${prefix}`);
  
  if (fill) fill.style.height = `${Math.min(pct, 100)}%`;
  if (pctEl) pctEl.textContent = `${Math.round(pct)}%`;
  if (ht) ht.textContent = `${val.toFixed(2)}m`;
  
  if (pct >= 70) { fill.style.background = 'var(--vermelho)'; if(stat) {stat.textContent='● ALERTA'; stat.style.color='var(--vermelho)';} }
  else if (pct >= 40) { fill.style.background = 'var(--amarelo)'; if(stat) {stat.textContent='● ATENÇÃO'; stat.style.color='var(--amarelo)';} }
  else { fill.style.background = 'var(--verde)'; if(stat) {stat.textContent='● NORMAL'; stat.style.color='var(--verde)';} }
}

// ═══════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════
(async function init(){
  // Carrega tudo
  renderCameras();
  
  // Função que roda tudo
  async function updateAll() {
    await fetchWeather(); // (Sua função de clima que já estava no código)
    await fetchAQ();      // (Sua função de ar)
    await fetchRios();    // (Nossa nova função que puxa do Render)
  }
  
  updateAll();
  setInterval(updateAll, REFRESH);
})();
