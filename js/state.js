/* ═══════════════════════════════════════════════════
   STATE & LOCALSTORAGE MANAGEMENT
   ═══════════════════════════════════════════════════ */
const STORAGE_KEY = 'preco_doce_v3';

const defaultState = {
  perfil: {
    nome: '',
    zap: '',
    pix: '',
    meta: 0,
    horas: 0,
    logo: null,
  },
  ingredientes: [],
  produtos: [],
  orcamentos: [],
  onboarded: false,
};

let state = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return JSON.parse(JSON.stringify(defaultState));
    const parsed = JSON.parse(raw);
    return { ...JSON.parse(JSON.stringify(defaultState)), ...parsed };
  }catch(e){
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  }catch(error){
    console.error('State persistence error:', error);
    toast('Não foi possível salvar neste navegador. Exporte um backup e libere espaço.');
    return false;
  }
}

/* Dynamic State for Flow WZards */
let precFlow = newPrecFlow();
let precFlowSalvo = false;
let orcFlow = newOrcFlow();
let fechState = { periodo: 'Hoje', periodoCustom: '', itens: [] };

/* Generic context used by the ingredient add/remove helpers so they can
   operate on either the pricing wizard's list or the quick product-edit
   modal's list, depending on which is currently active. */
let ingredienteCtx = {
  list: () => precFlow.ingredientes,
  onChange: () => renderPrec()
};

let ingredienteDepoisDoCadastro = null;

function newPrecFlow(){
  return {
    step: 1,
    id: null,
    nome: '',
    descricao: '',
    icon: 'bolo',
    ingredientes: [],
    tempo: 2,
    rendimento: 1,
    embalagem: 0,
    outros: 0,
    margem: 50,
    modoPreco: 'margem',
    precoManual: null,
  };
}

function newOrcFlow(){
  return {
    step: 1,
    id: null,
    cliente: '',
    zap: '',
    data: '',
    modalidade: 'retirada',
    entrega: 0,
    desconto: 0,
    pagamento: 'sinal',
    itens: [],
  };
}

/* ═══════════════════════════════════════════════════
   ÍCONES DE PRODUTOS (pré-disponibilizados)
   ═══════════════════════════════════════════════════ */
const PROD_ICONS = {
  bolo: { label:'Bolo', path:'<path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7"/><path d="M4 21h16"/><path d="M8 12V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/><path d="M12 6V3"/><circle cx="12" cy="2" r=".6" fill="currentColor" stroke="none"/>' },
  cupcake: { label:'Cupcake', path:'<path d="M6 10c-1 0-1.6-1-1-2 .5-1 2-1 2.4 0M18 10c1 0 1.6-1 1-2-.5-1-2-1-2.4 0"/><path d="M6 10h12l-1.3 8.2a2 2 0 0 1-2 1.8H9.3a2 2 0 0 1-2-1.8L6 10Z"/><path d="M9 10c0-2 1.4-4 3-4s3 2 3 4"/>' },
  cookie: { label:'Cookie', path:'<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="9.5" cy="15" r="1" fill="currentColor" stroke="none"/>' },
  torta: { label:'Torta', path:'<path d="M3 12a9 9 0 0 1 18 0"/><path d="M3 12h18"/><path d="M3 12l1 7h16l1-7"/>' },
  brigadeiro: { label:'Docinho', path:'<circle cx="12" cy="13" r="7"/><path d="M12 6V4M9 5l1 1.5M15 5l-1 1.5"/>' },
  chocolate: { label:'Chocolate', path:'<rect x="4" y="7" width="16" height="10" rx="2"/><path d="M12 7v10M4 12h16M8 7v10M16 7v10"/>' },
  donut: { label:'Donut', path:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>' },
  sorvete: { label:'Sorvete', path:'<path d="M8 10a4 4 0 0 1 8 0v1H8v-1Z"/><path d="M9 11l3 9 3-9"/>' },
  pao: { label:'Pão', path:'<path d="M4 13c0-4 3-7 8-7s8 3 8 7-3 5-8 5-8-1-8-5Z"/>' },
  coracao: { label:'Doce', path:'<path d="M12 20s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z"/>' },
};

function iconSvg(key, size){
  size = size || 18;
  const ic = PROD_ICONS[key] || PROD_ICONS.bolo;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ic.path}</svg>`;
}

function renderIconGrid(selected, onclickFn){
  return `<div class="icon-grid">` + Object.keys(PROD_ICONS).map(k => `
    <button type="button" class="icon-opt ${k === selected ? 'active' : ''}" onclick="${onclickFn}('${k}')">
      ${iconSvg(k, 20)}
      <span>${PROD_ICONS[k].label}</span>
    </button>
  `).join('') + `</div>`;
}

/* ═══════════════════════════════════════════════════
   UTILITY & FORMATTING FUNCTIONS
   ═══════════════════════════════════════════════════ */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);