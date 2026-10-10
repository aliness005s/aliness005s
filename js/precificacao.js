  function startPrecificar(){
    precFlow = newPrecFlow();
    precFlowSalvo = false;
  showScreen('s-precificar');
  renderPrec();
}

function precBack(){
  if(precFlow.step > 1){
    precFlow.step--;
    renderPrec();
  } else {
    showScreen('s-home');
  }
}

function precNext(){
  precFlow.step++;
  renderPrec();
}

function renderPrecTimeline(){
  const steps = [
    { n:'Produto' },
    { n:'Insumos' },
    { n:'Custos' },
    { n:'Resultado' },
  ];
  const tl = $('#precTimeline');
  tl.innerHTML = steps.map((s, i) => {
    const idx = i + 1;
    const done = idx < precFlow.step;
    const active = idx === precFlow.step;
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

function renderPrec(){
  $('#precCount').textContent = `Passo ${precFlow.step} de 4`;
  renderPrecTimeline();

  const body = $('#precBody');
  const f = precFlow;

  /* Step 1: Name */
  if(f.step === 1){
    body.innerHTML = `
      <div class="flow-hello">Vamos começar pelo produto <em>💕</em></div>
      <div class="flow-sub">Dê um nome para o doce que você quer precificar.</div>

      <div class="field">
        <label>Ícone do produto</label>
        ${renderIconGrid(f.icon, 'setPrecIcon')}
      </div>

      <div class="field">
        <label>Como ele se chama? <span class="req">*</span></label>
        <div class="input-wrap"><input type="text" id="pNome" value="${esc(f.nome)}" maxlength="${INPUT_LIMITS.name}" placeholder="Ex: Bolo de Morango 1kg" autofocus></div>
        <div class="error">Informe o nome do produto</div>
      </div>

      <div class="field">
        <label>Descrição do produto</label>
        <textarea id="pDescricao" rows="3" maxlength="${INPUT_LIMITS.description}" placeholder="Ex: Massa fofinha com recheio de morango.">${esc(f.descricao || '')}</textarea>
      </div>

      <button class="btn btn-primary" style="margin-top:10px;" onclick="precStep1Next()">
        Continuar
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    `;
    $('#pNome').addEventListener('input', () => { precFlow.nome = $('#pNome').value; });
    $('#pDescricao').addEventListener('input', () => { precFlow.descricao = $('#pDescricao').value.trim(); });
    setTimeout(() => $('#pNome')?.focus(), 100);
  }

  /* Step 2: Ingredients */
  else if(f.step === 2){
    ingredienteCtx = {
      list: () => precFlow.ingredientes,
      onChange: () => renderPrec()
    };
    const totalIng = f.ingredientes.reduce((a, i) => a + i.qtd * i.custoUnit, 0);
    body.innerHTML = `
      <div class="flow-hello">Insumos da receita</div>
      <div class="flow-sub">Adicione tudo que entra nessa receita. O app calcula quanto cada produto realmente custa.</div>
      <div class="hint">O custo dos insumos é calculado dentro desta receita. Alterar esses valores não muda outros produtos.</div>

      <div id="precIngList"></div>

      <button class="btn btn-ghost" onclick="abrirSeletorIngrediente()" style="margin-top:8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Adicionar insumo
      </button>

      <div class="danfe">
        <div class="danfe-line cost-total">
          <span>Custo de insumos</span>
          <strong>${brlFmt(totalIng)}</strong>
        </div>
      </div>

      <button class="btn btn-primary" style="margin-top:10px;" onclick="precStep2Next()">
        Continuar
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    `;
    renderPrecIngList();
  }

  /* Step 3: Production Costs & Time */
  else if(f.step === 3){
    const hora = getHora();
    body.innerHTML = `
      <div class="flow-hello">Tempo e outros custos</div>
      <div class="flow-sub">Agora vamos descobrir quanto custa fazer a receita inteira.</div>

      <div class="row-2">
        <div class="field">
          <label class="label-with-info">Quantas unidades rende? <button class="info-btn" type="button" title="O que significa rendimento?" aria-label="O que significa rendimento?" onclick="aviso('Rendimento da receita', 'Informe quantas unidades prontas uma receita completa produz. Por exemplo: 30 brigadeiros ou 1 bolo.')">?</button><span class="req">*</span></label>
          <div class="input-wrap"><input type="number" id="pRendimento" value="${f.rendimento}" min="1" max="${INPUT_LIMITS.quantity}" step="1" inputmode="numeric"></div>
          <div class="error">Informe quantas unidades rende</div>
          <div class="hint">Unidades prontas produzidas por uma receita completa.</div>
        </div>
        <div class="field">
          <label>Quanto tempo você trabalha? <span class="req">*</span></label>
          <div class="input-wrap"><input type="number" id="pTempo" value="${f.tempo}" min="0.1" max="${INPUT_LIMITS.hours}" step="0.25" inputmode="decimal"></div>
          <div class="error">Horas inválidas</div>
          <div class="hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 6.5L20 10l-6.5-1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/></svg>
            Sua hora vale <strong>${brlFmt(hora)}</strong>
          </div>
        </div>
      </div>

      <div class="field">
        <label>Custos extras da receita</label>
        <div class="input-wrap"><span class="pre">R$</span><input type="number" id="pOut" value="${f.outros}" min="0" max="${INPUT_LIMITS.money}" step="0.01" inputmode="decimal"></div>
        <div class="hint">Some embalagem, gás, energia, transporte e taxas desta receita.</div>
      </div>

      <button class="btn btn-primary" style="margin-top:10px;" onclick="precStep3Next()">
        Continuar
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    `;
  }

  /* Step 4: Profit Margin & Result */
  else if(f.step === 4){
    body.innerHTML = `
      <div class="flow-hello">Quanto cobrar? <em>✨</em></div>
      <div class="flow-sub">O app sugere um preço para você lucrar. Você pode aceitar ou escolher outro.</div>

      <div class="field">
        <label>Como definir o preço?</label>
        <div class="segmented">
          <button class="seg ${f.modoPreco !== 'manual' ? 'active' : ''}" onclick="setPrecModo('margem')">Por acréscimo</button>
          <button class="seg ${f.modoPreco === 'manual' ? 'active' : ''}" onclick="setPrecModo('manual')">Preço personalizado</button>
        </div>
        <div class="hint">Acréscimo soma um percentual ao custo; personalizado permite escolher o preço final.</div>
      </div>

      <div class="field" style="display:${f.modoPreco === 'manual' ? 'none' : 'block'};">
        <label>Acréscimo sobre o custo (%)</label>
        <div class="hint">O percentual é aplicado ao custo por unidade.</div>
        <div class="opt-grid">
          ${[30,50,100].map(v => `
            <button class="opt ${f.margem === v ? 'active' : ''}" onclick="setPrecMargem(${v})">${v}%</button>
          `).join('')}
          <button class="opt ${![30,50,100].includes(f.margem) ? 'active' : ''}" onclick="abrirCustomMargem()">Escolher</button>
        </div>
      </div>

      <div class="field" style="display:${f.modoPreco === 'manual' ? 'block' : 'none'};">
        <label>Preço de venda por unidade <span class="req">*</span></label>
        <div class="input-wrap"><span class="pre">R$</span><input type="number" id="pPrecoManual" min="0.01" max="${INPUT_LIMITS.money}" step="0.01" inputmode="decimal" value="${f.precoManual != null ? f.precoManual : ''}" placeholder="0,00" required></div>
        <div class="hint">Escolha quanto cobrar. A margem mostra quanto do preço sobra depois de pagar o custo. Custo sem lucro: <strong>${brlFmt(calcularPrecObj({...f, modoPreco:'margem'}).custoUnitario)}</strong></div>
        <div class="error">Informe um preço de venda maior que zero.</div>
      </div>

      <div class="danfe" id="precResultDanfe"></div>

      <div class="btn-row">
        <button class="btn btn-soft" onclick="precBack()">Voltar</button>
        <button class="btn btn-primary" onclick="confirmarSalvarProduto()">Salvar produto ✨</button>
      </div>
    `;
    $('#pPrecoManual')?.addEventListener('input', e => {
      setTimeout(() => {
        precFlow.precoManual = numInput(e.target.value);
        updatePrecResultDanfe();
      }, 0);
    });
    updatePrecResultDanfe();
  }
}

function setPrecIcon(key){
  precFlow.nome = $('#pNome') ? $('#pNome').value : precFlow.nome;
  precFlow.icon = key;
  renderPrec();
}

function precStep1Next(){
  const nome = $('#pNome').value.trim();
  const f = $('#pNome').closest('.field');
  f.classList.remove('invalid');
  if(!nome || nome.length > INPUT_LIMITS.name){ f.classList.add('invalid'); toast('Informe um nome de até 100 caracteres'); return; }

  // Check duplicate product name
  const duplicate = state.produtos.some(p => p.id !== precFlow.id && norm(p.nome) === norm(nome));
  if(duplicate){
    f.classList.add('invalid');
    toast('Já existe um produto com esse nome no catálogo!');
    return;
  }

  precFlow.nome = nome;
  precNext();
}

function precStep2Next(){
  if(!precFlow.ingredientes.length){ toast('Adicione pelo menos um insumo'); return; }
  precNext();
}

function precStep3Next(){
  const rendimento = numInput($('#pRendimento').value);
  const t = numInput($('#pTempo').value);
  const outText = $('#pOut').value.trim();
  const outValue = numInput(outText);
  const out = outText ? outValue : 0;
  const rF = $('#pRendimento').closest('.field');
  const tF = $('#pTempo').closest('.field');
  [rF, tF].forEach(field => field.classList.remove('invalid'));

  if(!isFiniteRange(rendimento, 1, INPUT_LIMITS.quantity) || !Number.isSafeInteger(rendimento)){ rF.classList.add('invalid'); toast('O rendimento deve ser de 1 a 1.000.000 unidades'); return; }
  if(!isFiniteRange(t, 0.1, INPUT_LIMITS.hours)){ tF.classList.add('invalid'); toast('O tempo deve ser de 0,1 a 10.000 horas'); return; }
  if(!isFiniteRange(out, 0, INPUT_LIMITS.money)){ toast('Os custos extras devem estar entre R$ 0 e R$ 1.000.000.000'); return; }

  precFlow.rendimento = rendimento;
  precFlow.tempo = t;
  precFlow.embalagem = 0;
  precFlow.outros = out;
  precNext();
}

function renderPrecIngList(){
  const el = $('#precIngList');
  if(!precFlow.ingredientes.length){
    el.innerHTML = `
      <div class="empty" style="padding:20px 10px;">
        <div class="etext">Nenhum insumo adicionado ainda.</div>
      </div>`;
    return;
  }
  el.innerHTML = precFlow.ingredientes.map((ing, idx) => `
    <div class="item">
      <span class="item-ic v2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 10.5h14l-1.3 8.2a2 2 0 0 1-2 1.7H8.3a2 2 0 0 1-2-1.7L5 10.5Z"/></svg>
      </span>
      <div class="item-body">
        <div class="name">${esc(ing.nome)}</div>
        <div class="meta">${ing.qtd}${esc(ing.un)} usados • custo ${brlFmt(ing.qtd * ing.custoUnit)}</div>
        ${ing.precoProduto ? `<div class="meta" style="color:var(--ink-soft);opacity:.85;margin-top:3px;">Produto: ${ing.qtdProduto}${esc(ing.unProduto)} por ${brlFmt(ing.precoProduto)}</div>` : ''}
      </div>
      <div class="item-actions">
        <button class="icon-mini danger" onclick="removerIngReceita(${idx})" aria-label="Remover">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function abrirSeletorIngrediente(){
  const list = state.ingredientes.length ? state.ingredientes.map(i => `
    <button class="item item-btn" onclick="escolherIngrediente('${i.id}')">
      <span class="item-ic v2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 10.5h14l-1.3 8.2a2 2 0 0 1-2 1.7H8.3a2 2 0 0 1-2-1.7L5 10.5Z"/></svg>
      </span>
      <div class="item-body">
        <div class="name">${esc(i.nome)}</div>
        <div class="meta">Toque para informar o produto usado</div>
      </div>
    </button>
  `).join('') : '<div class="empty" style="padding:18px 10px;"><div class="etext">Nenhum insumo cadastrado ainda.</div></div>';

  openModal(`
    <div class="modal-handle"></div>
    <h3>Escolher insumo</h3>
    <p class="sub">Escolha o insumo. Depois vamos informar o produto comprado e quanto entrou na receita.</p>
    <div style="max-height:50dvh;overflow-y:auto;margin-bottom:12px;">${list}</div>
    <button class="btn btn-ghost" onclick="abrirCadastroInsumoReceita()" style="margin-bottom:8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      Cadastrar novo insumo
    </button>
    <button class="btn btn-soft" onclick="closeModal()">Fechar</button>
  `);
}

function abrirCadastroInsumoReceita(){
  ingredienteDepoisDoCadastro = abrirSeletorIngrediente;
  closeModal();
  setTimeout(() => openIngredienteForm(), 180);
}

function escolherIngrediente(id){
  const ing = state.ingredientes.find(i => i.id === id);
  if(!ing) return;
  closeModal();
  setTimeout(() => abrirProdutoIngrediente(ing), 180);
}

let receitaIngDraft = null;

function encontrarUltimoUsoIngrediente(ing){
  for(let i = state.produtos.length - 1; i >= 0; i--){
    const uso = (state.produtos[i].ingredientes || []).find(item => item.ingredienteId === ing.id || norm(item.nome) === norm(ing.nome));
    if(uso && uso.qtdProduto && uso.precoProduto) return uso;
  }
  return null;
}

function abrirProdutoIngrediente(ing){
  const rascunho = receitaIngDraft && receitaIngDraft.id === ing.id ? receitaIngDraft : null;
  const ultimoUso = encontrarUltimoUsoIngrediente(ing);
  receitaIngDraft = rascunho || {
    id: ing.id,
    nome: ing.nome,
    qtdProduto: ultimoUso?.qtdProduto || '',
    unProduto: ultimoUso?.unProduto || 'g',
    precoProduto: ultimoUso?.precoProduto || ''
  };
  openModal(`
    <div class="modal-handle"></div>
    <div class="flow-sub" style="margin-bottom:4px;">Etapa 1 de 2</div>
    <h3>Produto comprado</h3>
    <p class="sub"><strong>${esc(ing.nome)}</strong>: informe o tamanho do produto e quanto você pagou.</p>
    ${ultimoUso && !rascunho ? `<div class="suggestion">Usando como sugestão o último valor: ${ultimoUso.qtdProduto}${esc(ultimoUso.unProduto)} por ${brlFmt(ultimoUso.precoProduto)}. Você pode alterar.</div>` : ''}

    <div class="field">
      <div class="field-label-with-help">
        <label for="riQtdProduto">Quantidade do produto <span class="req">*</span></label>
        <button class="info-btn" type="button" title="Como informar as medidas" aria-label="Como informar as medidas" onclick="mostrarInfoUnidades(event)">?</button>
      </div>
      <div class="row-2">
        <div class="input-wrap"><input type="number" id="riQtdProduto" min="0.01" max="${INPUT_LIMITS.quantity}" step="0.01" value="${receitaIngDraft.qtdProduto || ''}" placeholder="Ex.: 395" inputmode="decimal"></div>
        <div class="opt-grid" style="margin:0;grid-template-columns:repeat(5,1fr);">
          ${['g','kg','ml','L','un'].map(u => `<button class="opt ${u === receitaIngDraft.unProduto ? 'active' : ''}" onclick="setReceitaIngUn(this, '${u}')">${u}</button>`).join('')}
        </div>
      </div>
      <div class="hint">Informe o total da embalagem que custou esse valor. Ex.: 1 pacote de 1 kg e o preço pago pelo pacote.</div>
      <div class="error" id="riProdutoError">Informe uma quantidade maior que zero.</div>
    </div>

    <div class="field">
      <label>Preço pago pela embalagem <span class="req">*</span></label>
      <div class="input-wrap"><span class="pre">R$</span><input type="number" id="riPrecoProduto" min="0.01" max="${INPUT_LIMITS.money}" step="0.01" value="${receitaIngDraft.precoProduto || ''}" placeholder="0,00" inputmode="decimal"></div>
      <div class="hint">Digite os centavos primeiro; os números avançam para a esquerda.</div>
      <div class="error" id="riPrecoError">Informe um preço maior que zero.</div>
    </div>

    <div class="btn-row">
      <button class="btn btn-soft" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="confirmarProdutoIngrediente()">Continuar</button>
    </div>
  `);
  ['riQtdProduto', 'riPrecoProduto'].forEach(id => {
    $('#' + id).addEventListener('input', () => $('#' + id).closest('.field').classList.remove('invalid'));
  });
}

function setReceitaIngUn(el, un){
  receitaIngDraft.unProduto = un;
  el.parentElement.querySelectorAll('.opt').forEach(button => button.classList.remove('active'));
  el.classList.add('active');
}

function confirmarProdutoIngrediente(){
  const qtd = numInput($('#riQtdProduto').value);
  const preco = numInput($('#riPrecoProduto').value);
  const quantidadeValida = isFiniteRange(qtd, 0.01, INPUT_LIMITS.quantity) && Number.isFinite(baseQuantity(qtd, receitaIngDraft.unProduto))
    && (receitaIngDraft.unProduto !== 'un' || Number.isInteger(qtd));
  const precoValido = isFiniteRange(preco, 0.01, INPUT_LIMITS.money);
  const quantidadeField = $('#riQtdProduto').closest('.field');
  const precoField = $('#riPrecoProduto').closest('.field');
  quantidadeField.classList.toggle('invalid', !quantidadeValida);
  precoField.classList.toggle('invalid', !precoValido);
  $('#riProdutoError').textContent = receitaIngDraft.unProduto === 'un'
    ? 'Informe uma quantidade inteira maior que zero.'
    : 'Informe uma quantidade maior que zero.';
  if(!quantidadeValida || !precoValido){
    toast('Confira a quantidade e o preço da embalagem');
    return;
  }
  receitaIngDraft.qtdProduto = qtd;
  receitaIngDraft.precoProduto = preco;
  closeModal();
  setTimeout(abrirUsoIngrediente, 180);
}

function abrirUsoIngrediente(){
  const d = receitaIngDraft;
  const unidadeBase = baseUnit(d.unProduto);
  openModal(`
    <div class="modal-handle"></div>
    <div class="flow-sub" style="margin-bottom:4px;">Etapa 2 de 2</div>
    <h3>Quanto entrou na receita?</h3>
    <p class="sub">A embalagem tem <strong>${d.qtdProduto} ${d.unProduto}</strong> e custou <strong>${brlFmt(d.precoProduto)}</strong>.</p>
    <div class="ingredient-use-guidance">Informe a quantidade total usada. Ela pode passar de uma embalagem; nesse caso, calculamos o custo proporcional às embalagens consumidas.</div>
    <div class="field">
      <div class="field-label-with-help">
        <label for="riQtdUsada">Quantidade usada (${unidadeBase}) <span class="req">*</span></label>
        <button class="info-btn" type="button" title="Como informar as medidas" aria-label="Como informar as medidas" onclick="mostrarInfoUnidades(event)">?</button>
      </div>
      <div class="input-wrap"><input type="number" id="riQtdUsada" min="0.01" max="${INPUT_LIMITS.quantity}" step="0.01" placeholder="Ex.: ${unidadeBase === 'un' ? '1' : '150'}" inputmode="decimal"></div>
      <div class="error" id="riUsoError">Informe uma quantidade maior que zero.</div>
      <div id="riUsoHint" class="hint"></div>
    </div>
    <div class="btn-row">
      <button class="btn btn-soft" onclick="abrirProdutoIngrediente(receitaIngDraft)">Voltar</button>
      <button class="btn btn-primary" onclick="confirmarUsoIngrediente()">Adicionar insumo</button>
    </div>
  `);
  $('#riQtdUsada').addEventListener('input', atualizarCustoIngredienteDraft);
}

function atualizarCustoIngredienteDraft(){
  const d = receitaIngDraft;
  const qtd = numInput($('#riQtdUsada').value);
  const quantidadeEmbalagem = baseQuantity(d.qtdProduto, d.unProduto);
  const usoValido = isFiniteRange(qtd, 0.01, INPUT_LIMITS.quantity) && (baseUnit(d.unProduto) !== 'un' || Number.isInteger(qtd));
  const custo = qtd * (d.precoProduto / quantidadeEmbalagem);
  const field = $('#riQtdUsada').closest('.field');
  field.classList.toggle('invalid', !usoValido && $('#riQtdUsada').value !== '');
  if(!usoValido || !Number.isFinite(custo)){
    $('#riUsoHint').textContent = '';
    return;
  }
  const embalagensUsadas = qtd / quantidadeEmbalagem;
  $('#riUsoHint').innerHTML = `${formatarDecimal(qtd)} ${baseUnit(d.unProduto)} = ${formatarDecimal(embalagensUsadas)} embalagem(ns) · custo: <strong>${brlFmt(custo)}</strong>`;
}

function confirmarUsoIngrediente(){
  const d = receitaIngDraft;
  const qtd = numInput($('#riQtdUsada').value);
  const unidade = baseUnit(d.unProduto);
  const qtdProdutoBase = baseQuantity(d.qtdProduto, d.unProduto);
  const quantidadeValida = isFiniteRange(qtd, 0.01, INPUT_LIMITS.quantity) && Number.isFinite(qtdProdutoBase)
    && (unidade !== 'un' || Number.isInteger(qtd));
  const field = $('#riQtdUsada').closest('.field');
  field.classList.toggle('invalid', !quantidadeValida);
  $('#riUsoError').textContent = unidade === 'un'
    ? 'Informe uma quantidade inteira maior que zero.'
    : 'Informe uma quantidade maior que zero.';
  if(!quantidadeValida){ toast('Informe uma quantidade usada válida'); return; }
  const custoUnit = d.precoProduto / qtdProdutoBase;
  const custoUsado = qtd * custoUnit;
  if(!isFiniteRange(custoUnit, 0, INPUT_LIMITS.money) || !isFiniteRange(custoUsado, 0, INPUT_LIMITS.money)){
    toast('O custo calculado excede o limite permitido. Confira quantidade e preço.');
    return;
  }
  closeModal();
  setTimeout(() => {
    ingredienteCtx.list().push({ ingredienteId: d.id, nome: d.nome, qtd, un: unidade, qtdProduto: d.qtdProduto, unProduto: d.unProduto, precoProduto: d.precoProduto, custoUnit });
    ingredienteCtx.onChange();
    receitaIngDraft = null;
    toast('✅ Ingrediente adicionado');
  }, 180);
}

function removerIngReceita(idx){
  const list = ingredienteCtx.list();
  const ing = list[idx];
  if(!ing) return;
  confirmar('Remover ingrediente?', `"${ing.nome}" sairá desta receita.`, () => {
    list.splice(idx, 1);
    ingredienteCtx.onChange();
  }, { perigo: true, okLabel: 'Remover' });
}

function setPrecMargem(v){
  precFlow.margem = v;
  renderPrec();
}

function setPrecModo(modo){
  if(modo === 'manual') precFlow.precoManual = null;
  precFlow.modoPreco = modo;
  renderPrec();
}

function abrirCustomMargem(){
  openModal(`
    <div class="modal-handle"></div>
    <h3>Acréscimo Personalizado</h3>
    <p class="sub">Informe quanto acrescentar ao custo (0 a 500%).</p>
    <div class="field">
      <label>Acréscimo (%) <span class="req">*</span></label>
      <div class="input-wrap"><input type="number" id="customMargem" min="0" max="500" step="1" value="${precFlow.margem}" inputmode="numeric"></div>
      <div class="error">Valor entre 0 e 500</div>
    </div>
    <div class="btn-row">
      <button class="btn btn-soft" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarCustomMargem()">Aplicar</button>
    </div>
  `);
  setTimeout(() => $('#customMargem')?.focus(), 100);
}

function salvarCustomMargem(){
  const v = numInput($('#customMargem').value);
  const f = $('#customMargem').closest('.field');
  f.classList.remove('invalid');
  if(!isFiniteRange(v, 0, 500)){ f.classList.add('invalid'); toast('Acréscimo inválido'); return; }
  precFlow.margem = v;
  closeModal();
  setTimeout(() => renderPrec(), 180);
}

function calcularPrecObj(f){
  const hora = getHora();
  const custoIng = f.ingredientes.reduce((a, i) => a + i.qtd * i.custoUnit, 0);
  const mao = f.tempo * hora;
  const custoTotal = custoIng + (f.embalagem || 0) + (f.outros || 0) + mao;
  const rendimento = Number(f.rendimento) >= 1 ? Number(f.rendimento) : 1;
  const custoUnitario = custoTotal / rendimento;
  const precoSugerido = custoUnitario + custoUnitario * (f.margem / 100);
  const preco = f.modoPreco === 'manual' && Number.isFinite(f.precoManual)
    ? f.precoManual
    : precoSugerido;
  const lucro = preco - custoUnitario;
  const margemReal = preco ? (lucro / preco) * 100 : 0;
  const acrescimoReal = custoUnitario ? (lucro / custoUnitario) * 100 : 0;
  const precoReceita = preco * rendimento;
  return { rendimento, custoIng, mao, custoTotal, custoUnitario, lucro, lucroReceita: precoReceita - custoTotal, preco, precoReceita, precoSugerido, margemReal, acrescimoReal };
}

function calcularPrec(){
  return calcularPrecObj(precFlow);
}

function updatePrecResultDanfe(){
  const c = calcularPrec();
  const el = $('#precResultDanfe');
  if(!el) return;
  const lucroLabel = precFlow.modoPreco === 'manual'
    ? `Sobra após custos: ${formatarDecimal(c.margemReal)}% do preço final`
    : `Acréscimo de ${formatarDecimal(precFlow.margem)}% sobre o custo`;
  const ingredientesHtml = precFlow.ingredientes.length
    ? precFlow.ingredientes.map(ing => `
        <div class="danfe-line danfe-detail">
          <span>${esc(ing.nome)} <small>${ing.qtd}${esc(ing.un)}</small></span>
          <strong>${brlFmt(ing.qtd * ing.custoUnit)}</strong>
        </div>
      `).join('')
    : '<div class="danfe-detail-empty">Nenhum insumo informado</div>';
  el.innerHTML = `
    <div class="prec-result-primary">
      <span class="prec-result-eyebrow">${precFlow.modoPreco === 'manual' ? 'Preço definido por você' : 'Preço sugerido'}</span>
      <strong class="prec-result-price">${brlFmt(c.preco)}</strong>
      <span class="prec-result-unit">por unidade · ${c.rendimento} un por receita</span>
    </div>
    <div class="prec-result-stats">
      <div class="prec-result-stat"><span title="Custo total da receita dividido pelo número de unidades produzidas.">Custo por unidade</span><strong>${brlFmt(c.custoUnitario)}</strong></div>
      <div class="prec-result-stat"><span>Lucro por unidade</span><strong class="${c.lucro < 0 ? 'danfe-loss' : ''}">${c.lucro < 0 ? '−' : ''}${brlFmt(Math.abs(c.lucro))}</strong><small>${lucroLabel}</small></div>
      <div class="prec-result-stat"><span>Venda da receita</span><strong>${brlFmt(c.precoReceita)}</strong></div>
      <div class="prec-result-stat"><span>Lucro na receita</span><strong class="${c.lucroReceita < 0 ? 'danfe-loss' : ''}">${c.lucroReceita < 0 ? '−' : ''}${brlFmt(Math.abs(c.lucroReceita))}</strong></div>
    </div>
    ${c.lucro < 0 ? '<div class="danfe-warning">Atenção: este preço está abaixo do custo. Você terá prejuízo e não ganhará nada com este produto.</div>' : ''}
    <details class="prec-result-details">
      <summary><span>Ver composição dos custos</span><span class="prec-result-details-icon" aria-hidden="true"></span></summary>
      <div class="prec-result-breakdown">
        <div class="danfe-detail-title">Custos dos insumos</div>
        ${ingredientesHtml}
        <div class="danfe-line expense"><span>Total de insumos</span><strong>${brlFmt(c.custoIng)}</strong></div>
        <div class="danfe-line expense"><span>Mão de obra (${precFlow.tempo}h)</span><strong>${brlFmt(c.mao)}</strong></div>
        <div class="danfe-line expense"><span>Custos extras da receita</span><strong>${brlFmt((precFlow.embalagem || 0) + (precFlow.outros || 0))}</strong></div>
        <div class="danfe-line cost"><span>Custo da receita (${c.rendimento} un)</span><strong>${brlFmt(c.custoTotal)}</strong></div>
        <div class="danfe-line profit"><span>Lucro total da receita</span><strong class="${c.lucroReceita < 0 ? 'danfe-loss' : ''}">${c.lucroReceita < 0 ? '−' : '+'} ${brlFmt(Math.abs(c.lucroReceita))}</strong></div>
        <div class="danfe-explanation">Fazer esta receita custa <strong>${brlFmt(c.custoTotal)}</strong>. Vendendo tudo pelo preço indicado, seu lucro estimado é <strong>${brlFmt(c.lucroReceita)}</strong>.</div>
        <div class="danfe-note">Este preço e estes custos valem somente para esta receita. O mesmo insumo pode ter outro custo em outro produto.</div>
      </div>
    </details>
  `;
}

function confirmarSalvarProduto(){
  if(precFlow.modoPreco === 'manual'){
    const precoManual = numInput($('#pPrecoManual')?.value);
    const field = $('#pPrecoManual')?.closest('.field');
    field?.classList.remove('invalid');
    if(!isFiniteRange(precoManual, 0.01, INPUT_LIMITS.money)){
      field?.classList.add('invalid');
      toast('Informe um preço de venda maior que zero');
      $('#pPrecoManual')?.focus();
      return;
    }
    precFlow.precoManual = precoManual;
  }

  const c = calcularPrec();
  if(!isFiniteRange(c.custoTotal, 0, INPUT_LIMITS.money) || !isFiniteRange(c.preco, 0.01, INPUT_LIMITS.money)){
    toast('O resultado excede o limite permitido para custos ou preço.');
    return;
  }
  const existe = state.produtos.find(p => p.id === precFlow.id);
  confirmar(
    existe ? 'Salvar alterações?' : 'Salvar produto?',
    `"${precFlow.nome}" por ${brlFmt(c.preco)}/un`,
    () => {
      const produto = {
        id: precFlow.id || uid(),
        nome: precFlow.nome,
        descricao: precFlow.descricao || '',
        icon: precFlow.icon || 'bolo',
        ingredientes: JSON.parse(JSON.stringify(precFlow.ingredientes)),
        tempo: precFlow.tempo,
        rendimento: c.rendimento,
        embalagem: precFlow.embalagem,
        outros: precFlow.outros,
        margem: precFlow.modoPreco === 'manual' ? c.acrescimoReal : precFlow.margem,
        modoPreco: precFlow.modoPreco,
        preco: c.preco,
        custoTotal: c.custoTotal,
      };
      const produtosAnteriores = state.produtos.slice();
      if(existe){
        const idx = state.produtos.findIndex(p => p.id === precFlow.id);
        state.produtos[idx] = produto;
      } else {
        state.produtos.push(produto);
      }
      if(!saveState()){
        state.produtos = produtosAnteriores;
        return;
      }
      precFlowSalvo = true;
      toast(existe ? '💕 Produto atualizado' : '✅ Produto salvo no catálogo');
      showScreen('s-produtos');
    },
    { okLabel: 'Salvar' }
  );
}

/* ═══════════════════════════════════════════════════
   BUDGET STEP-BY-STEP FLOW (WIZARD)
   ═══════════════════════════════════════════════════ */
