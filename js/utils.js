
const brlFmt = v => {
  const value = Number(v);
  const n = Number.isFinite(value) ? value : 0;
  return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const brlSplit = v => {
  const value = Number(v);
  const n = Number.isFinite(value) ? value : 0;
  const [whole, cents] = Math.abs(n).toFixed(2).split('.');
  const sign = n < 0 ? '-' : '';
  const intPart = 'R$ ' + sign + whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = ',' + cents;
  return { int: intPart, dec: decPart };
};

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escTextarea = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const norm = s => String(s || '').trim().toLowerCase();
const INPUT_LIMITS = Object.freeze({
  name: 100,
  ingredientName: 100,
  description: 1000,
  itemDescription: 500,
  pix: 254,
  money: 1_000_000_000,
  quantity: 1_000_000,
  hours: 10_000,
});
const isFiniteRange = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;

function formatarDecimal(value){
  const valueAsNumber = Number(value);
  const n = Number.isFinite(valueAsNumber) ? valueAsNumber : 0;
  return n.toFixed(2).replace('.', ',');
}

function formatarPercentual(value){
  const n = Number(value);
  return (Number.isFinite(n) ? n : 0).toFixed(2).replace('.', ',');
}

function numInput(value){
  if(typeof value === 'number') return value;
  const text = String(value == null ? '' : value).trim().replace(/\s/g, '');
  if(!text) return NaN;
  const normalized = text.includes(',')
    ? text.replace(/\./g, '').replace(',', '.')
    : text;
  return Number(normalized);
}

function baseUnit(un){
  return un === 'kg' ? 'g' : un === 'L' ? 'ml' : un;
}

function baseQuantity(qtd, un){
  const value = Number(qtd) || 0;
  return un === 'kg' || un === 'L' ? value * 1000 : value;
}

function insumoBase(ing){
  const un = baseUnit(ing.un);
  const qtd = Number(ing.qtdBase) > 0 ? Number(ing.qtdBase) : baseQuantity(ing.qtd, ing.un);
  return { qtd, un };
}

function formatPhoneInput(value){
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if(digits.length <= 2) return digits ? `(${digits}` : '';
  if(digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.length === 11 ? digits.slice(2, 7) : digits.slice(2, 6)}-${digits.length === 11 ? digits.slice(7) : digits.slice(6)}`;
}

function formatCurrencyInput(value){
  const digits = String(value == null ? '' : value).replace(/\D/g, '');
  if(!digits) return '0,00';
  const cents = digits.padStart(3, '0');
  const integer = cents.slice(0, -2).replace(/^0+(?=\d)/, '') || '0';
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ,${cents.slice(-2)}`.replace(' ,', ',');
}

function formatStoredCurrency(value){
  const n = numInput(value);
  if(!Number.isFinite(n)) return '0,00';
  return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDecimalInput(value, integerOnly = false){
  let text = String(value == null ? '' : value).replace(/\./g, ',').replace(/[^\d,]/g, '');
  if(integerOnly) return text.replace(/,/g, '');
  const parts = text.split(',');
  return parts.shift() + (parts.length ? ',' + parts.join('') : '');
}

function bindInputMask(input){
  if(!input || input.dataset.maskBound) return;
  if(input.type === 'tel'){
    input.dataset.maskBound = 'true';
    input.maxLength = 15;
    input.addEventListener('input', () => { input.value = formatPhoneInput(input.value); });
    input.value = formatPhoneInput(input.value);
    return;
  }
  if(input.type !== 'number') return;
  const id = input.id || '';
  const currency = /meta|emb|out|preco|custo|entrega/i.test(id);
  const integerOnly = input.inputMode === 'numeric' && !currency;
  input.type = 'text';
  input.inputMode = integerOnly ? 'numeric' : 'decimal';
  input.dataset.mask = currency ? 'currency' : integerOnly ? 'integer' : 'decimal';
  input.dataset.maskBound = 'true';
  input.maxLength = input.maxLength > 0 ? input.maxLength : (currency ? 24 : 18);
  input.value = currency ? formatStoredCurrency(input.value) : formatDecimalInput(input.value, integerOnly);
  input.addEventListener('focus', () => input.select());
  if(currency){
    input.addEventListener('input', () => {
      input.value = formatCurrencyInput(input.value);
      input.setSelectionRange(input.value.length, input.value.length);
    });
    input.addEventListener('blur', () => {
      const value = numInput(input.value);
      input.value = Number.isFinite(value) ? formatStoredCurrency(value) : '0,00';
    });
    return;
  }
  input.addEventListener('input', () => {
    input.value = formatDecimalInput(input.value, input.dataset.mask === 'integer');
    input.setSelectionRange(input.value.length, input.value.length);
  });
}

function bindInputMasks(root = document){
  root.querySelectorAll('input[type="number"], input[type="tel"]').forEach(bindInputMask);
}

bindInputMasks();
new MutationObserver(() => bindInputMasks()).observe(document.body, { childList:true, subtree:true });

function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 2600);
}

function getHora(){
  const m = Number(state.perfil.meta) || 0;
  const h = Number(state.perfil.horas) || 1;
  return m / h;
}

function formatDateBR(iso){
  if(!iso) return '';
  const parts = iso.split('-');
  if(parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/* Image Resizer Helper */
function resizeImage(file, maxSize, cb, onError = () => toast('Não foi possível carregar esta imagem.')){
  const fail = message => {
    console.error('Image processing error:', message);
    onError(message);
  };
  if(!file || !/^image\/(jpeg|png|webp|gif)$/i.test(file.type || '')){
    fail('Formato de imagem não suportado');
    return;
  }
  if(file.size <= 0 || file.size > 5 * 1024 * 1024){
    fail('A imagem deve ter até 5 MB');
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => fail('Não foi possível ler o arquivo');
  reader.onabort = () => fail('Leitura da imagem cancelada');
  reader.onload = e => {
    const img = new Image();
    img.onerror = () => fail('O arquivo selecionado não é uma imagem válida');
    img.onload = () => {
      if(!img.naturalWidth || !img.naturalHeight){
        fail('A imagem não possui dimensões válidas');
        return;
      }
      if(img.naturalWidth > 12000 || img.naturalHeight > 12000
          || img.naturalWidth * img.naturalHeight > 40_000_000){
        fail('A imagem tem dimensões grandes demais');
        return;
      }
      let { width:w, height:h } = img;
      if(w > h){ if(w > maxSize){ h = h * maxSize / w; w = maxSize; } }
      else { if(h > maxSize){ w = w * maxSize / h; h = maxSize; } }
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w));
      c.height = Math.max(1, Math.round(h));
      const context = c.getContext('2d');
      if(!context){
        fail('Não foi possível processar a imagem');
        return;
      }
      try{
        context.drawImage(img, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL('image/jpeg', 0.82);
        if(dataUrl.length > 2 * 1024 * 1024){
          fail('A imagem processada ficou grande demais');
          return;
        }
        cb(dataUrl);
      }catch(error){
        fail(error);
      }
    };
    if(typeof e.target.result !== 'string'){
      fail('Não foi possível ler o conteúdo da imagem');
      return;
    }
    img.src = e.target.result;
  };
  try{
    reader.readAsDataURL(file);
  }catch(error){
    fail(error);
  }
}

/* ═══════════════════════════════════════════════════
   CUSTOM MODALS (ZERO BROWSER ALERT / CONFIRM)
   ═══════════════════════════════════════════════════ */
function openModal(html){
  const box = $('#modalBox');
  box.innerHTML = html;
  $('#modalBg').classList.add('show');
}

function closeModal(){
  $('#modalBg').classList.remove('show');
  setTimeout(() => { if(!$('#modalBg').classList.contains('show')) $('#modalBox').innerHTML = ''; }, 300);
}

$('#modalBg').addEventListener('click', e => {
  if(e.target.id === 'modalBg') closeModal();
});

function confirmar(titulo, msg, onConfirm, { perigo = false, okLabel = 'Confirmar' } = {}){
  openModal(`
    <div class="modal-handle"></div>
    <h3>${esc(titulo)}</h3>
    <p class="sub">${esc(msg)}</p>
    <div class="btn-row">
      <button class="btn btn-soft" onclick="closeModal()">Cancelar</button>
      <button class="btn ${perigo ? 'btn-danger' : 'btn-primary'}" id="modalConfirmBtn">${esc(okLabel)}</button>
    </div>
  `);
  $('#modalConfirmBtn').onclick = () => {
    closeModal();
    setTimeout(() => onConfirm && onConfirm(), 120);
  };
}

function aviso(titulo, msg, action = null){
  openModal(`
    <div class="modal-handle"></div>
    <h3>${esc(titulo)}</h3>
    <p class="sub">${esc(msg)}</p>
    ${action ? `<button class="btn btn-primary" id="modalActionBtn" style="margin-bottom:8px;">${esc(action.label)}</button>` : ''}
    <button class="btn btn-primary" onclick="closeModal()">Entendi</button>
  `);
  if(action) $('#modalActionBtn').onclick = () => {
    closeModal();
    setTimeout(() => action.onClick(), 120);
  };
}
/* ═══════════════════════════════════════════════════
   PDF RENDER ENGINE — chic + paginação inteligente
   • Nunca corta conteúdo no meio de uma linha
   • Prefere 1 página; quebra por página só se necessário
   • Espera imagens + fontes antes de rasterizar
   ═══════════════════════════════════════════════════ */
async function renderPDFDoc(htmlContent, filename){
  const container = document.getElementById('pdfPrintContainer');
  if(!container){ toast('Contêiner de PDF não encontrado'); return; }

  const prevStyle = container.getAttribute('style') || '';
  container.setAttribute('style',
    'display:block;position:fixed;left:-20000px;top:0;width:680px;height:auto;' +
    'padding:0;margin:0;background:#ffffff;z-index:-1;overflow:visible;' +
    'opacity:1;visibility:visible;pointer-events:none;'
  );
  container.innerHTML = htmlContent;

  // Aguarda imagens carregarem
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(imgs.map(img => img.complete
    ? Promise.resolve()
    : new Promise(res => { img.onload = img.onerror = () => res(); })
  ));

  // Aguarda fontes
  if(document.fonts && document.fonts.ready){
    try { await document.fonts.ready; } catch(e){}
  }
  // Pequeno settle-time para o layout estabilizar
  await new Promise(r => setTimeout(r, 180));

  const source = container.firstElementChild;
  if(!source){
    container.setAttribute('style', prevStyle);
    container.innerHTML = '';
    toast('Erro ao montar o PDF');
    return;
  }

  try{
    const sourceRect = source.getBoundingClientRect();
    const sourceWidth = Math.ceil(Math.max(sourceRect.width, source.scrollWidth, 1));
    const sourceHeight = Math.ceil(Math.max(sourceRect.height, source.scrollHeight, source.offsetHeight, 400));

    const canvasOptions = {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: sourceWidth,
      windowHeight: sourceHeight,
      width: sourceWidth,
      height: sourceHeight,
      scrollX: 0,
      scrollY: 0,
    };

    let canvas;
    try{
      canvas = await html2canvas(source, canvasOptions);
    } catch(firstError){
      // Alguns navegadores falham ao rasterizar gradientes em tabelas estreitas.
      canvas = await html2canvas(source, {
        ...canvasOptions,
        onclone: clonedDocument => {
          clonedDocument.querySelectorAll('*').forEach(element => {
            element.style.backgroundImage = 'none';
          });
        },
      });
    }

    const { jsPDF } = window.jspdf || {};
    if(!jsPDF) throw new Error('jsPDF não carregado');

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;

    const ratio = maxW / canvas.width;
    const imgW = maxW;
    const totalImgH = canvas.height * ratio;

    if(totalImgH <= maxH){
      // Cabe em uma única página — melhor qualidade, zero cortes
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG',
        margin, margin, imgW, totalImgH, undefined, 'FAST');
    } else {
      // Multi-página: fatia o canvas completo sem descartar o restante do conteúdo.
      const pxPerPage = Math.floor(maxH / ratio);
      const pageCount = Math.ceil(canvas.height / pxPerPage);
      for(let i = 0; i < pageCount; i++){
        if(i > 0) pdf.addPage();
        const sy = i * pxPerPage;
        const sh = Math.min(pxPerPage, canvas.height - sy);
        const pc = document.createElement('canvas');
        pc.width = canvas.width;
        pc.height = sh;
        const ctx = pc.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pc.width, pc.height);
        ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
        pdf.addImage(pc.toDataURL('image/png'), 'PNG',
          margin, margin, imgW, sh * ratio, undefined, 'FAST');
      }
    }

    pdf.save(filename);
    toast('✅ PDF gerado com sucesso!');
  } catch(err){
    console.error('PDF generation error:', err);
    toast('Não foi possível gerar o PDF');
  } finally {
    container.setAttribute('style', prevStyle);
    container.innerHTML = '';
  }
}
