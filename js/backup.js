const BACKUP_VERSION = 1;
const BACKUP_MAX_RECORDS = 1000;
const BACKUP_MAX_ITEMS_PER_RECORD = 500;
const BACKUP_REMINDER_START_KEY = 'preco_doce_backup_reminder_start';
const BACKUP_LAST_EXPORT_KEY = 'preco_doce_backup_last_export';
const BACKUP_LAST_REMINDER_KEY = 'preco_doce_backup_last_reminder';
const BACKUP_REMINDER_INTERVAL = 30 * 24 * 60 * 60 * 1000;

function lerRegistroBackup(key){
  try { return localStorage.getItem(key); } catch(e) { return null; }
}

function salvarRegistroBackup(key, value){
  try { localStorage.setItem(key, String(value)); return true; } catch(e) { return false; }
}

function inicializarBackup(){
  try {
    localStorage.removeItem('preco_doce_auto_backup_v1');
    localStorage.removeItem('preco_doce_auto_backup_enabled');
  } catch(e){}
  if(state.onboarded) verificarLembreteBackup();
}

function verificarLembreteBackup(){
  if(!state.onboarded) return;
  const now = Date.now();
  let inicio = Number(lerRegistroBackup(BACKUP_REMINDER_START_KEY)) || 0;
  if(!inicio){
    inicio = now;
    salvarRegistroBackup(BACKUP_REMINDER_START_KEY, inicio);
  }
  const ultimoExport = Number(lerRegistroBackup(BACKUP_LAST_EXPORT_KEY)) || 0;
  const ultimoLembrete = Number(lerRegistroBackup(BACKUP_LAST_REMINDER_KEY)) || 0;
  if(now - Math.max(inicio, ultimoExport, ultimoLembrete) < BACKUP_REMINDER_INTERVAL) return;
  salvarRegistroBackup(BACKUP_LAST_REMINDER_KEY, now);
  setTimeout(() => toast('Já faz 30 dias desde o último lembrete. Baixe um arquivo JSON para guardar fora deste navegador.'), 1200);
}

function baixarBackup(){
  const backup = {
    app: 'AdoceUp',
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    data: state,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const stamp = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19)
    .replace('T', '-');
  const dia = stamp.slice(0, 10);
  const hora = stamp.slice(11, 19).replace('-', 'h');
  link.href = url;
  link.download = `${dia}-PrecoDoce-${hora}.json`;
  link.click();
  URL.revokeObjectURL(url);
  salvarRegistroBackup(BACKUP_LAST_EXPORT_KEY, Date.now());
  toast('Backup salvo. Guarde esse arquivo com carinho.');
}

function abrirCarregarBackup(){
  const input = $('#backupFileInput');
  input.value = '';
  input.click();
}

function isPlainObject(value){
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function backupText(value, maxLength, allowEmpty = true){
  return typeof value === 'string' && value.length <= maxLength && (allowEmpty || Boolean(value.trim()));
}

function backupNumber(value, min, max){
  return typeof value === 'number' && isFiniteRange(value, min, max);
}

function validBackupId(value){
  return typeof value === 'string' && /^[a-z0-9_-]{1,64}$/i.test(value);
}

function validBackupDate(value){
  if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validBackupIngredientUse(item){
  return isPlainObject(item)
    && validBackupId(item.ingredienteId)
    && backupText(item.nome, INPUT_LIMITS.ingredientName, false)
    && backupNumber(item.qtd, 0.01, INPUT_LIMITS.quantity)
    && ['g', 'ml', 'un'].includes(item.un)
    && (item.un !== 'un' || Number.isSafeInteger(item.qtd))
    && backupNumber(item.qtdProduto, 0.01, INPUT_LIMITS.quantity)
    && ['g', 'kg', 'ml', 'L', 'un'].includes(item.unProduto)
    && (item.unProduto !== 'un' || Number.isSafeInteger(item.qtdProduto))
    && backupNumber(item.precoProduto, 0.01, INPUT_LIMITS.money)
    && backupNumber(item.custoUnit, 0, INPUT_LIMITS.money);
}

function validBackupProduct(product){
  return isPlainObject(product)
    && validBackupId(product.id)
    && backupText(product.nome, INPUT_LIMITS.name, false)
    && backupText(product.descricao, INPUT_LIMITS.description)
    && Object.prototype.hasOwnProperty.call(PROD_ICONS, product.icon)
    && Array.isArray(product.ingredientes)
    && product.ingredientes.length <= BACKUP_MAX_ITEMS_PER_RECORD
    && product.ingredientes.every(validBackupIngredientUse)
    && backupNumber(product.tempo, 0.1, INPUT_LIMITS.hours)
    && backupNumber(product.rendimento, 1, INPUT_LIMITS.quantity)
    && Number.isSafeInteger(product.rendimento)
    && backupNumber(product.embalagem, 0, INPUT_LIMITS.money)
    && backupNumber(product.outros, 0, INPUT_LIMITS.money)
    && backupNumber(product.margem, -1_000_000_000_000, 1_000_000_000_000)
    && ['margem', 'manual'].includes(product.modoPreco)
    && backupNumber(product.preco, 0, INPUT_LIMITS.money)
    && backupNumber(product.custoTotal, 0, INPUT_LIMITS.money);
}

function validBackupOrder(order){
  return isPlainObject(order)
    && validBackupId(order.id)
    && backupText(order.cliente, INPUT_LIMITS.name)
    && backupText(order.zap, 30)
    && validBackupDate(order.data)
    && ['retirada', 'entrega'].includes(order.modalidade)
    && backupNumber(order.entrega, 0, INPUT_LIMITS.money)
    && backupNumber(order.desconto, 0, 100)
    && ['sinal', 'antecipado', 'fiado'].includes(order.pagamento)
    && Array.isArray(order.itens)
    && order.itens.length <= BACKUP_MAX_ITEMS_PER_RECORD
    && order.itens.every(item => isPlainObject(item)
      && validBackupId(item.prodId)
      && backupText(item.nome, INPUT_LIMITS.name, false)
      && backupText(item.descricao, INPUT_LIMITS.itemDescription)
      && Object.prototype.hasOwnProperty.call(PROD_ICONS, item.icon)
      && backupNumber(item.qtd, 1, INPUT_LIMITS.quantity)
      && Number.isSafeInteger(item.qtd)
      && backupNumber(item.precoUnit, 0, INPUT_LIMITS.money))
    && backupText(order.salvoEm, 40, false);
}

function estadoDoBackup(backup){
  if(!isPlainObject(backup)) return null;
  const appName = String(backup.app || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if(appName !== 'adoceup' && appName !== 'preco doce') return null;
  if(Number(backup.version) !== BACKUP_VERSION) return null;
  if(!isPlainObject(backup.data)) return null;

  const data = backup.data;
  if(!isPlainObject(data.perfil)) return null;
  if(!Array.isArray(data.ingredientes) || !Array.isArray(data.produtos) || !Array.isArray(data.orcamentos)) return null;
  if(data.ingredientes.length > BACKUP_MAX_RECORDS
      || data.produtos.length > BACKUP_MAX_RECORDS
      || data.orcamentos.length > BACKUP_MAX_RECORDS) return null;
  if(!data.ingredientes.every(ingredient => isPlainObject(ingredient)
      && validBackupId(ingredient.id)
      && backupText(ingredient.nome, INPUT_LIMITS.ingredientName, false))
      || !data.produtos.every(validBackupProduct)
      || !data.orcamentos.every(validBackupOrder)) return null;
  if(typeof data.onboarded !== 'boolean') return null;

  const perfil = data.perfil;
  if(!backupText(perfil.nome, 30) || !backupText(perfil.zap, 30) || !backupText(perfil.pix, INPUT_LIMITS.pix)) return null;
  if(!backupNumber(perfil.meta, 0, INPUT_LIMITS.money) || !backupNumber(perfil.horas, 0, INPUT_LIMITS.hours)) return null;
  if(perfil.logo != null && (typeof perfil.logo !== 'string'
      || perfil.logo.length > 2 * 1024 * 1024
      || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(perfil.logo))) return null;
  if(data.onboarded && (!perfil.nome.trim() || perfil.meta <= 0 || perfil.horas <= 0)) return null;

  return {
    ...JSON.parse(JSON.stringify(defaultState)),
    ...data,
    perfil: { ...JSON.parse(JSON.stringify(defaultState.perfil)), ...perfil },
  };
}

function carregarBackup(file){
  if(!file || !file.name || !file.name.toLowerCase().endsWith('.json')){
    aviso('Arquivo inválido', 'Escolha um arquivo .json gerado pelo AdoceUp.');
    return;
  }
  if(file.size <= 0 || file.size > 10 * 1024 * 1024){
    aviso('Arquivo inválido', 'O arquivo deve ser um backup do app e ter tamanho menor que 10 MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    let backup;
    try { backup = JSON.parse(reader.result); } catch(e) { backup = null; }
    const importedState = estadoDoBackup(backup);
    if(!importedState){
      aviso('Arquivo não reconhecido', 'Escolha um arquivo de backup válido do AdoceUp.');
      return;
    }
    confirmar(
      'Carregar este backup?',
      'Os dados atuais serão trocados pelos dados deste arquivo.',
      () => {
        const stateAnterior = state;
        state = importedState;
        if(!saveState()){
          state = stateAnterior;
          return;
        }
        renderHome();
        toast('Backup carregado com sucesso.');
      },
      { okLabel: 'Carregar' }
    );
  };
  reader.onerror = () => aviso('Não foi possível abrir', 'Tente escolher o arquivo novamente.');
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', () => {
  $('#backupFileInput').addEventListener('change', event => {
    const file = event.target.files[0];
    if(file) carregarBackup(file);
  });
});