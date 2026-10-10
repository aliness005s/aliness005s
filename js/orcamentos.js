const escapeTextAreaValue = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function startOrcamento(){
    orcFlow = newOrcFlow();
  showScreen('s-orcamento');
  renderOrc();
}

function editarOrcamento(id){
  const salvo = state.orcamentos.find(o => o.id === id);
  if(!salvo) return;
  orcFlow = JSON.parse(JSON.stringify(salvo));
  orcFlow.step = 1;
  showScreen('s-orcamento');
  renderOrc();
}

function duplicarOrcamento(id){
  const original = state.orcamentos.find(o => o.id === id);
  if(!original) return;
  const copia = JSON.parse(JSON.stringify(original));
  copia.id = uid();
  copia.salvoEm = new Date().toISOString();
  state.orcamentos.unshift(copia);
  if(!saveState()){
    state.orcamentos.shift();
    return;
  }
  renderOrcamentos();
  toast('✅ Orçamento duplicado');
}

function excluirOrcamento(id){
  const orcamento = state.orcamentos.find(o => o.id === id);
  if(!orcamento) return;
  confirmar('Excluir orçamento?', `O orçamento de "${orcamento.cliente || 'Cliente'}" será apagado.`, () => {
    const orcamentosAnteriores = state.orcamentos;
    state.orcamentos = state.orcamentos.filter(o => o.id !== id);
    if(!saveState()){
      state.orcamentos = orcamentosAnteriores;
      return;
    }
    renderOrcamentos();
    toast('Orçamento excluído');
  }, { perigo: true, okLabel: 'Excluir' });
}

function orcBack(){
  if(orcFlow.step > 1){
    orcFlow.step--;
    renderOrc();
  } else {
    showScreen('s-home');
  }
}

function orcNext(){
  orcFlow.step++;
  if(orcFlow.step === 5){
    if(!salvarOrcamentoAtual()){
      orcFlow.step--;
      return;
    }
    toast('✅ Orçamento salvo');
  }
  renderOrc();
}

function salvarOrcamentoAtual(){
  if(!orcFlow.itens.length) return false;
  if(!Array.isArray(state.orcamentos)) state.orcamentos = [];
  const orcamentosAnteriores = state.orcamentos.slice();
  const idAnterior = orcFlow.id;
  const salvo = JSON.parse(JSON.stringify(orcFlow));
  salvo.step = 5;
  salvo.id = salvo.id || uid();
  salvo.salvoEm = new Date().toISOString();
  const idx = state.orcamentos.findIndex(o => o.id === salvo.id);
  if(idx >= 0) state.orcamentos[idx] = salvo;
  else state.orcamentos.unshift(salvo);
  orcFlow.id = salvo.id;
  if(!saveState()){
    state.orcamentos = orcamentosAnteriores;
    orcFlow.id = idAnterior;
    return false;
  }
  return true;
}

function orcamentoAtualEstaSalvo(){
  if(!orcFlow.id) return false;
  const salvo = state.orcamentos.find(orcamento => orcamento.id === orcFlow.id);
  if(!salvo) return false;
  const dadosSemMetadados = orcamento => {
    const dados = { ...orcamento };
    delete dados.step;
    delete dados.salvoEm;
    return JSON.stringify(dados);
  };
  return dadosSemMetadados(salvo) === dadosSemMetadados(orcFlow);
}

function salvarOrcamentoFinal(){
  if(salvarOrcamentoAtual()) toast('✅ Orçamento salvo');
}

function renderOrcTimeline(){
  const steps = [
    { n:'Produtos' },
    { n:'Cliente' },
    { n:'Data' },
    { n:'Entrega' },
    { n:'Revisão' },
  ];
  const tl = $('#orcTimeline');
  tl.innerHTML = steps.map((s, i) => {
    const idx = i + 1;
    const done = idx < orcFlow.step;
    const active = idx === orcFlow.step;
    return `
      <div class="tl-step ${done?'done':''} ${active?'active':''}">
        <div class="tl-dot">
          ${done ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg>' : idx}
        </div>
        <div class="tl-label">${esc(s.n)}</div>
        <div class="tl-line"></div>
      </div>
    `;
  }).join('');
}

function renderOrc(){
  $('#orcCount').textContent = `Passo ${orcFlow.step} de 5`;
  renderOrcTimeline();

  const body = $('#orcBody');
  const f = orcFlow;

  /* Step 1: Products */
  if(f.step === 1){
    const sub = f.itens.reduce((a, i) => a + i.qtd * i.precoUnit, 0);
    body.innerHTML = `
      <div class="flow-hello">Itens do orçamento</div>
      <div class="flow-sub">Escolha os doces, confira as quantidades e veja a produção necessária por item.</div>

      <div id="orcItemList"></div>

      <button class="btn btn-ghost" onclick="abrirSeletorProdutoOrc()" style="margin-top:8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Adicionar produto do catálogo
      </button>

      <div id="orcProductionPreview" style="margin-top:12px;"></div>

      <div class="danfe">
        <div class="danfe-line total">
          <span>Subtotal dos produtos</span>
          <strong>${brlFmt(sub)}</strong>
        </div>
      </div>

      <button class="btn btn-primary" style="margin-top:10px;" onclick="orcStep1Next()">
        Continuar
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    `;
    renderOrcItens();
    renderOrcProductionPreview();
  }

  /* Step 2: Client */
  else if(f.step === 2){
    body.innerHTML = `
      <div class="flow-hello">Dados da cliente <em>💌</em></div>
      <div class="flow-sub">Quem receberá o orçamento?</div>

      <div class="field">
        <label>Nome da cliente <span class="req">*</span></label>
        <div class="input-wrap"><input type="text" id="oNome" value="${esc(f.cliente)}" maxlength="${INPUT_LIMITS.name}" placeholder="Ex: Maria Eduarda" autofocus></div>
        <div class="error">Informe o nome</div>
      </div>

      <div class="field">
        <label>WhatsApp (opcional)</label>
        <div class="input-wrap"><input type="tel" id="oZap" value="${esc(f.zap)}" placeholder="(00) 00000-0000" inputmode="tel"></div>
      </div>

      <button class="btn btn-primary" style="margin-top:10px;" onclick="orcStep2Next()">
        Continuar
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    `;
    setTimeout(() => $('#oNome')?.focus(), 100);
  }

  /* Step 3: Date */
  else if(f.step === 3){
    body.innerHTML = `
      <div class="flow-hello">Quando entregar?</div>
      <div class="flow-sub">Para quando é a encomenda?</div>

      <div class="field">
        <label>Data prevista <span class="req">*</span></label>
        <div class="input-wrap"><input type="date" id="oData" value="${esc(f.data)}" autofocus></div>
        <div class="error">Informe a data</div>
      </div>

      <button class="btn btn-primary" style="margin-top:10px;" onclick="orcStep3Next()">
        Continuar
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    `;
  }

  /* Step 4: Delivery & Discount */
  else if(f.step === 4){
    body.innerHTML = `
      <div class="flow-hello">Entrega e descontos</div>
      <div class="flow-sub">Escolha como a cliente receberá o pedido e se haverá algum desconto.</div>

      <div class="field">
        <label>Modalidade</label>
        <div class="segmented">
          <button class="seg ${f.modalidade === 'retirada' ? 'active' : ''}" onclick="setOrcModal('retirada')">🏠 Retirada</button>
          <button class="seg ${f.modalidade === 'entrega' ? 'active' : ''}" onclick="setOrcModal('entrega')">🚚 Entrega</button>
        </div>
      </div>

      <div class="field" id="entregaField" style="display:${f.modalidade === 'entrega' ? 'block' : 'none'};">
        <label>Taxa de entrega</label>
        <div class="input-wrap"><span class="pre">R$</span><input type="number" id="oEntrega" value="${f.entrega}" min="0" max="${INPUT_LIMITS.money}" step="0.01" inputmode="decimal"></div>
        <div class="hint">Digite 0 para marcar como <strong>Gratuito</strong></div>
      </div>

      <div class="field">
        <label>Desconto sobre os produtos (%)</label>
        <div class="input-wrap"><input type="number" id="oDesc" value="${f.desconto}" min="0" max="100" step="0.01" inputmode="decimal"></div>
        <div class="hint">A taxa de entrega é somada depois e não recebe desconto.</div>
        <div class="error">Valor entre 0 e 100</div>
      </div>

      <button class="btn btn-primary" style="margin-top:10px;" onclick="orcStep4Next()">
        Continuar
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    `;
  }

  /* Step 5: Payment & Final Review */
  else if(f.step === 5){
    body.innerHTML = `
      <div class="flow-hello">Revise e envie</div>
      <div class="flow-sub">Como a cliente efetuará o pagamento?</div>

      <div class="segmented vertical" style="margin-bottom:16px;">
        <button class="seg ${f.pagamento === 'sinal' ? 'active' : ''}" onclick="setOrcPag('sinal')">50% de sinal + 50% na entrega</button>
        <button class="seg ${f.pagamento === 'antecipado' ? 'active' : ''}" onclick="setOrcPag('antecipado')">100% antecipado</button>
        <button class="seg ${f.pagamento === 'fiado' ? 'active' : ''}" onclick="setOrcPag('fiado')">Pagamento no ato da entrega</button>
      </div>

      <div class="sec-title" style="font-size:17px;margin-bottom:4px;">Veja como a cliente receberá</div>
      <div class="sec-sub">Confira a proposta antes de enviar pelo WhatsApp ou gerar o PDF:</div>

      <div id="orcReview"></div>

      <div class="btn-row" style="margin-top:10px;">
        <button class="btn btn-soft" onclick="compartilharOrcamento()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          Enviar pelo WhatsApp
        </button>
        <button class="btn btn-soft" onclick="gerarPDFOrcamento()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Gerar PDF
        </button>
      </div>

      <div class="btn-row" style="margin-top:8px;">
        <button class="btn btn-soft" onclick="salvarOrcamentoFinal()">Salvar orçamento</button>
        <button class="btn btn-primary" onclick="showScreen('s-home')">Fechar</button>
      </div>
    `;
    renderOrcReview();
  }
}

function formatarQuantidade(qtd){
  const n = Number(qtd) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
}

function formatarQuantidadeComUnidade(qtd, unidade){
  const n = Number(qtd) || 0;
  if(n >= 1000 && unidade === 'g') return `${formatarQuantidade(n / 1000)} kg`;
  if(n >= 1000 && unidade === 'ml') return `${formatarQuantidade(n / 1000)} L`;
  return `${formatarQuantidade(n)} ${unidade}`;
}

function calcularProducaoProduto(item){
  const produto = state.produtos.find(p => p.id === item.prodId);
  if(!produto) return null;

  const rendimento = Number(produto.rendimento) >= 1 ? Number(produto.rendimento) : 1;
  const receitas = Math.ceil(item.qtd / rendimento);
  const ingredientes = (produto.ingredientes || []).map(ing => {
    const qtdBase = Number(ing.qtd) || 0;
    const qtdTotal = qtdBase * receitas;
    const unidade = baseUnit(ing.un);
    const total = baseUnit(ing.un) === 'g' || baseUnit(ing.un) === 'ml'
      ? baseQuantity(qtdTotal, unidade)
      : qtdTotal;
    return {
      nome: ing.nome,
      qtdOriginal: qtdBase,
      unidadeOriginal: ing.un,
      unidade,
      total,
    };
  });

  return { produto, rendimento, receitas, ingredientes };
}

function renderOrcProductionPreview(targetId = 'orcProductionPreview', title = 'Produção por produto'){
  const el = $(`#${targetId}`);
  if(!el) return;
  if(!orcFlow.itens.length){
    el.innerHTML = ''; return;
  }

  const html = orcFlow.itens.map((item) => {
    const info = calcularProducaoProduto(item);
    if(!info) return '';

    const ingredientesHtml = info.ingredientes.map(ing => `
      <div class="danfe-line danfe-detail">
        <span>${esc(ing.nome)}<small style="display:block;color:var(--ink-soft);font-size:11px;line-height:1.35;">${formatarQuantidadeComUnidade(ing.qtdOriginal, ing.unidadeOriginal)} × ${info.receitas} receita${info.receitas === 1 ? '' : 's'}</small></span>
        <strong>${formatarQuantidadeComUnidade(ing.total, ing.unidade)}</strong>
      </div>
    `).join('');

    return `
      <details class="orc-production-card">
        <summary>
          <span class="orc-production-name">
            <strong>${esc(info.produto.nome)}</strong>
            <small>${item.qtd} un no pedido · ${info.receitas} receita${info.receitas === 1 ? '' : 's'} necessária${info.receitas === 1 ? '' : 's'}</small>
          </span>
          <span class="orc-production-toggle">Ver detalhes</span>
        </summary>
        <div class="orc-production-body">
          <div class="orc-production-stats">
            <div><strong>${info.rendimento} un</strong><small>rendimento de uma receita</small></div>
            <div><strong>${info.receitas}</strong><small>receita${info.receitas === 1 ? '' : 's'} para este pedido</small></div>
          </div>
          <div class="orc-production-ingredients-title">Ingredientes necessários</div>
          ${ingredientesHtml}
        </div>
      </details>
    `;
  }).join('');

  el.innerHTML = `
    <div class="flow-sub" style="margin-bottom:8px;">${title}</div>
    <div class="hint" style="margin:0 0 10px;">Aqui você vê quantas receitas e quanto de cada ingrediente serão necessários para fazer cada produto do pedido.</div>
    ${html}
  `;
}

function renderOrcItens(){
  const el = $('#orcItemList');
  if(!orcFlow.itens.length){
    el.innerHTML = `<div class="empty" style="padding:20px 10px;"><div class="etext">Nenhum produto adicionado ainda.</div></div>`;
    return;
  }
  el.innerHTML = orcFlow.itens.map((it, idx) => {
    const produto = state.produtos.find(p => p.id === it.prodId);
    const rendimento = produto && Number(produto.rendimento) >= 1 ? Number(produto.rendimento) : 0;
    const receitas = rendimento ? Math.ceil(it.qtd / rendimento) : 0;
    return `
    <div class="item" style="flex-wrap:wrap;">
      <span class="item-ic">${iconSvg(it.icon, 18)}</span>
      <div class="item-body">
        <div class="name">${esc(it.nome)}</div>
        <div class="meta">${it.qtd} un × ${brlFmt(it.precoUnit)}/un</div>
        ${receitas ? `<div class="meta order-scale-inline">${receitas} receita${receitas === 1 ? '' : 's'} para produzir este pedido</div>` : ''}
      </div>
      <div class="item-price">${brlFmt(it.qtd * it.precoUnit)}</div>

      <div style="width:100%;display:flex;gap:8px;margin-top:8px;align-items:center;">
        <div style="display:flex;gap:4px;align-items:center;">
          <button class="icon-mini" onclick="orcQtd(${idx}, -1)" aria-label="Diminuir">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>
          </button>
          <span style="font-family:'Outfit';font-size:13px;font-weight:800;padding:0 8px;color:var(--rose-400);">${it.qtd}</span>
          <button class="icon-mini" onclick="orcQtd(${idx}, 1)" aria-label="Aumentar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
        <button class="icon-mini danger" onclick="orcRemover(${idx})" aria-label="Remover">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  `;
  }).join('');
}

function orcQtd(idx, delta){
  const it = orcFlow.itens[idx];
  if(!it) return;
  const nv = it.qtd + delta;
  if(nv < 1){ toast('Quantidade mínima é 1'); return; }
  if(nv > INPUT_LIMITS.quantity || !isFiniteRange(nv * it.precoUnit, 0, INPUT_LIMITS.money)){
    toast('A quantidade ou o total excede o limite permitido');
    return;
  }
  const subtotalOutros = orcFlow.itens.reduce((sum, item, itemIdx) => sum + (itemIdx === idx ? 0 : item.qtd * item.precoUnit), 0);
  if(!isFiniteRange(subtotalOutros + nv * it.precoUnit, 0, INPUT_LIMITS.money)){
    toast('O subtotal do orçamento excede o limite permitido');
    return;
  }
  if(nv > INPUT_LIMITS.quantity){ toast('O limite é 1.000.000 unidades por item'); return; }
  if(!isFiniteRange(nv * it.precoUnit, 0, INPUT_LIMITS.money)){ toast('O total do item excederia o limite permitido'); return; }
  it.qtd = nv;
  renderOrc();
}

function orcRemover(idx){
  const it = orcFlow.itens[idx];
  if(!it) return;
  confirmar('Remover produto?', `"${it.nome}" sairá deste orçamento.`, () => {
    orcFlow.itens.splice(idx, 1);
    renderOrc();
  }, { perigo: true, okLabel: 'Remover' });
}

function abrirSeletorProdutoOrc(){
  if(!state.produtos.length){
    aviso('Sem produtos', 'Precifique um produto no seu catálogo antes de adicionar ao orçamento.');
    return;
  }
  const list = state.produtos.map(p => `
    <button class="item item-btn" onclick="escolherProdutoOrc('${p.id}')">
      <span class="item-ic">${iconSvg(p.icon, 18)}</span>
      <div class="item-body">
        <div class="name">${esc(p.nome)}</div>
        <div class="meta">${p.ingredientes.length} itens • Rende ${p.rendimento || 1} un • ${p.tempo}h</div>
      </div>
      <span class="item-price">${brlFmt(p.preco)}<small>por unidade</small></span>
    </button>
  `).join('');

  openModal(`
    <div class="modal-handle"></div>
    <h3>Adicionar Produto</h3>
    <p class="sub">Escolha o produto para o orçamento.</p>
    <div style="max-height:50dvh;overflow-y:auto;margin-bottom:12px;">${list}</div>
    <button class="btn btn-soft" onclick="closeModal()">Fechar</button>
  `);
}

function escolherProdutoOrc(id){
  const p = state.produtos.find(x => x.id === id);
  if(!p) return;
  closeModal();
  setTimeout(() => abrirQtdProduto(p), 180);
}

function abrirQtdProduto(p){
  openModal(`
    <div class="modal-handle"></div>
    <h3>Quantidade de Unidades</h3>
    <p class="sub"><strong>${esc(p.nome)}</strong> por ${brlFmt(p.preco)} por unidade. A receita rende ${p.rendimento || 1} unidade(s).</p>

    <div class="field">
      <label>Quantidade de unidades <span class="req">*</span></label>
      <div class="stepper" style="margin-bottom:10px;">
        <button onclick="stepQtdProd(-1)">−</button>
        <input type="number" id="qtdProd" min="1" max="${INPUT_LIMITS.quantity}" step="1" value="1" inputmode="numeric">
        <button onclick="stepQtdProd(1)">+</button>
      </div>
      <div class="error" id="qtdProdError">Quantidade inválida</div>
      <div class="order-scale" id="orderScaleHint">Informe a quantidade para calcular quantas receitas serão necessárias.</div>
    </div>

    <div class="btn-row">
      <button class="btn btn-soft" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="confirmarAddProdOrc('${p.id}')">Adicionar</button>
    </div>
  `);
  const input = $('#qtdProd');
  input.addEventListener('input', () => atualizarEscalaPedido(p));
  atualizarEscalaPedido(p);
}

function atualizarEscalaPedido(p){
  const qtd = numInput($('#qtdProd')?.value);
  const rendimento = Number(p.rendimento) >= 1 ? Number(p.rendimento) : 1;
  const receitas = qtd > 0 ? Math.ceil(qtd / rendimento) : 0;
  const sobra = receitas && qtd ? receitas * rendimento - qtd : 0;
  const hint = $('#orderScaleHint');
  if(!hint) return;
  hint.innerHTML = receitas
    ? `<strong>${receitas} receita${receitas === 1 ? '' : 's'}</strong> para fazer ${qtd} unidade${qtd === 1 ? '' : 's'}${sobra ? ` · sobra planejada: ${sobra}` : ''}.`
    : 'Informe a quantidade para calcular quantas receitas serão necessárias.';
}

function stepQtdProd(d){
  const inp = $('#qtdProd');
  let v = numInput(inp.value) || 1;
  v = Math.min(INPUT_LIMITS.quantity, Math.max(1, v + d));
  inp.value = v;
  inp.dispatchEvent(new Event('input', { bubbles: true }));
}

function confirmarAddProdOrc(id){
  const p = state.produtos.find(x => x.id === id);
  if(!p) return;
  const v = numInput($('#qtdProd').value);
  if(!isFiniteRange(v, 1, INPUT_LIMITS.quantity) || !Number.isSafeInteger(v)){ $('#qtdProdError').style.display='block'; toast('Quantidade deve ser um número inteiro de 1 a 1.000.000'); return; }
  const itemExistente = orcFlow.itens.find(item => item.prodId === p.id);
  const quantidadeFinal = (itemExistente ? itemExistente.qtd : 0) + v;
  const valorAdicionado = v * p.preco;
  const subtotalAtual = orcFlow.itens.reduce((sum, item) => sum + item.qtd * item.precoUnit, 0);
  if(quantidadeFinal > INPUT_LIMITS.quantity || !isFiniteRange(valorAdicionado, 0, INPUT_LIMITS.money)
      || !isFiniteRange(subtotalAtual + valorAdicionado, 0, INPUT_LIMITS.money)){
    toast('O orçamento excederia o limite permitido. Reduza a quantidade.');
    return;
  }

  closeModal();
  setTimeout(() => {
    const itemExistente = orcFlow.itens.find(item => item.prodId === p.id);
    if(itemExistente){
      itemExistente.qtd += v;
    } else {
      orcFlow.itens.push({ prodId: p.id, nome: p.nome, descricao: p.descricao || '', icon: p.icon, qtd: v, precoUnit: p.preco });
    }
    renderOrc();
    toast(itemExistente ? '✅ Quantidade atualizada no orçamento' : '✅ Produto adicionado ao orçamento');
  }, 180);
}

function orcStep1Next(){
  if(!orcFlow.itens.length){ toast('Adicione pelo menos um produto'); return; }
  orcNext();
}

function orcStep2Next(){
  const n = $('#oNome').value.trim();
  const f = $('#oNome').closest('.field');
  f.classList.remove('invalid');
  if(!n || n.length > INPUT_LIMITS.name){ f.classList.add('invalid'); toast('Informe um nome de até 100 caracteres'); return; }
  orcFlow.cliente = n;
  orcFlow.zap = $('#oZap').value.trim();
  orcNext();
}

function orcStep3Next(){
  const d = $('#oData').value;
  const f = $('#oData').closest('.field');
  f.classList.remove('invalid');
  if(!d || !/^\d{4}-\d{2}-\d{2}$/.test(d) || !Number.isFinite(Date.parse(`${d}T00:00:00`))){ f.classList.add('invalid'); toast('Informe uma data válida para a encomenda'); return; }
  orcFlow.data = d;
  orcNext();
}

function orcStep4Next(){
  const descontoText = $('#oDesc').value.trim();
  const entregaText = $('#oEntrega')?.value.trim() || '';
  const descontoInput = numInput(descontoText);
  const entregaInput = numInput(entregaText);
  const desc = descontoText ? descontoInput : 0;
  const ent = entregaText ? entregaInput : 0;
  const dF = $('#oDesc').closest('.field');
  dF.classList.remove('invalid');
  if(!isFiniteRange(desc, 0, 100)){ dF.classList.add('invalid'); toast('Desconto deve ser entre 0 e 100%'); return; }
  if(!isFiniteRange(ent, 0, INPUT_LIMITS.money)){ toast('A taxa deve estar entre R$ 0 e R$ 1.000.000.000'); return; }
  const sub = orcFlow.itens.reduce((sum, item) => sum + item.qtd * item.precoUnit, 0);
  const total = sub - sub * (desc / 100) + ent;
  if(!isFiniteRange(total, 0, INPUT_LIMITS.money)){ toast('O total do orçamento excede o limite permitido'); return; }

  orcFlow.desconto = desc;
  orcFlow.entrega = ent;
  orcNext();
}

function setOrcModal(m){
  orcFlow.modalidade = m;
  renderOrc();
}

function setOrcPag(p){
  const pagamentoAnterior = orcFlow.pagamento;
  orcFlow.pagamento = p;
  if(!salvarOrcamentoAtual()){
    orcFlow.pagamento = pagamentoAnterior;
    return;
  }
  renderOrc();
}

function calcOrcObj(o){
  const sub = (o.itens || []).reduce((a, i) => a + i.qtd * i.precoUnit, 0);
  const entrega = o.modalidade === 'entrega' ? (o.entrega || 0) : 0;
  const desconto = sub * ((o.desconto || 0) / 100);
  const total = sub - desconto + entrega;
  return { sub, entrega, desconto, total };
}

function calcOrc(){
  return calcOrcObj(orcFlow);
}

function formatarDescricaoOrc(idx){
  const item = orcFlow.itens[idx];
  const area = document.querySelector(`.orc-item-desc[data-index="${idx}"]`);
  if(!item || !area) return;
  const linhas = area.value.split(/\r?\n/).map(linha => linha.trim()).filter(Boolean);
  area.value = linhas.length
    ? linhas.map(linha => `• ${linha.replace(/^(?:[•*-]|\d+[.)])\s*/, '')}`).join('\n')
    : '• ';
  item.descricao = area.value;
  area.focus();
  area.setSelectionRange(area.value.length, area.value.length);
}

function renderOrcReview(){
  const c = calcOrc();
  const custoProdutos = orcFlow.itens.reduce((total, item) => {
    const produto = state.produtos.find(p => p.id === item.prodId);
    const custoUnit = produto ? (produto.custoTotal || 0) / (produto.rendimento || 1) : 0;
    return total + item.qtd * custoUnit;
  }, 0);
  const lucroEstimado = c.total - custoProdutos;
  const cliente = orcFlow.cliente || 'Cliente';
  const dataFmt = orcFlow.data ? formatDateBR(orcFlow.data) : '';
  const entregaLabel = orcFlow.modalidade === 'entrega'
    ? (c.entrega > 0 ? brlFmt(c.entrega) : 'Gratuito')
    : 'Retirada no local';
  const pagLabel = orcFlow.pagamento === 'sinal' ? '50% de sinal + 50% na entrega'
    : orcFlow.pagamento === 'antecipado' ? '100% antecipado'
    : 'Pagamento na entrega';

  const itemsHtml = orcFlow.itens.map((it, idx) => `
      <div class="rt-row" style="align-items:flex-start;gap:12px;">
        <div class="rt-desc" style="flex:1;min-width:0;">
          <strong class="rt-name">${esc(it.nome)}</strong>
          <span class="rt-meta">${it.qtd} unidades × ${brlFmt(it.precoUnit)} por unidade</span>
          <textarea
            class="orc-item-desc"
            data-index="${idx}"
            rows="2"
            maxlength="${INPUT_LIMITS.itemDescription}"
            placeholder="Descreva detalhes do item..."
            style="width:100%;margin-top:8px;min-height:54px;max-height:120px;padding:10px 12px;border:1px solid #F0B9D0;border-radius:10px;background:#fffdfd;color:#422033;font:inherit;resize:vertical;overflow-y:auto;box-sizing:border-box;"
          >${escapeTextAreaValue(it.descricao || '')}</textarea>
          <button type="button" class="desc-format-btn" onclick="formatarDescricaoOrc(${idx})">• Tópicos</button>
        </div>
        <div class="rt-price">${brlFmt(it.qtd * it.precoUnit)}</div>
      </div>
  `).join('');

  $('#orcReview').innerHTML = `
    <div class="orc-internal-summary">
      <div class="orc-internal-title">Resumo só para você</div>
      <div class="orc-internal-line"><span>Quanto custa produzir</span><strong>${brlFmt(custoProdutos)}</strong></div>
      <div class="orc-internal-line"><span>Quanto sobra neste orçamento</span><strong class="${lucroEstimado < 0 ? 'danfe-loss' : ''}">${brlFmt(lucroEstimado)}</strong></div>
      <div class="orc-internal-note">Esse resumo não aparece no PDF nem na mensagem enviada para a cliente.</div>
    </div>
    <div class="receipt">
      <div class="receipt-logo">
        ${state.perfil.logo
          ? `<img src="${state.perfil.logo}" alt="logo">`
          : `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v3M8 6h8l-1 4H9L8 6Z"/><path d="M6 10h12l-1.2 9.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 10Z"/></svg>`}
      </div>
      <h3>${esc(state.perfil.nome || 'Minha Confeitaria')}</h3>
      <div class="r-period">Orçamento para ${esc(cliente)}${dataFmt ? ' • ' + dataFmt : ''}</div>

      <div class="receipt-table">
        <div class="rt-head">
          <span>Item / Qtd x Valor Unidade</span>
          <span>Valor Total</span>
        </div>
        ${itemsHtml}
      </div>

      <div class="r-divider"></div>

      <div>
        <div class="danfe-line"><span>Subtotal</span><strong>${brlFmt(c.sub)}</strong></div>
        ${c.desconto > 0 ? `<div class="danfe-line profit"><span>Desconto (${formatarPercentual(orcFlow.desconto)}%)</span><strong>− ${brlFmt(c.desconto)}</strong></div>` : ''}
        <div class="danfe-line"><span>Entrega</span><strong>${entregaLabel}</strong></div>
      </div>

      <div class="r-divider"></div>

      <div class="r-total">${brlFmt(c.total)}</div>
      <div class="r-sub">Valor Total do Orçamento</div>

      <div class="r-divider"></div>

      <div class="r-grid">
        <div class="r-stat">
          <div class="lbl">Condição</div>
          <div class="val" style="font-size:11.5px;">${pagLabel}</div>
        </div>
        <div class="r-stat">
          <div class="lbl">Modalidade</div>
          <div class="val" style="font-size:11.5px;">${orcFlow.modalidade === 'entrega' ? 'Entrega' : 'Retirada'}</div>
        </div>
      </div>

      ${state.perfil.pix ? `<div class="r-thanks" style="font-size:12px;margin-top:12px;">Chave Pix: <strong>${esc(state.perfil.pix)}</strong></div>` : ''}
    </div>
    <div id="orcProductionReview" class="orc-production-review">
      <div class="orc-internal-title">Produção para preparar (só para você)</div>
      <div class="orc-internal-note">Esta parte é interna e não aparece no PDF nem na mensagem enviada para a cliente.</div>
    </div>
  `;

  renderOrcProductionPreview('orcProductionReview', 'Produção para preparar (só para você)');

  document.querySelectorAll('.orc-item-desc').forEach(el => {
    el.addEventListener('input', e => {
      const idx = Number(e.target.dataset.index);
      if (!Number.isInteger(idx) || !orcFlow.itens[idx]) return;
      orcFlow.itens[idx].descricao = e.target.value;
      salvarOrcamentoAtual();
    });
  });
}

/* ═══════════════════════════════════════════════════
   BUDGETS LIST, SHARE & PDF GENERATION
   ═══════════════════════════════════════════════════ */
