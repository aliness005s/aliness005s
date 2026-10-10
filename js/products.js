  function renderProdutos(filtro = ''){
    const f = norm(filtro);
  const list = state.produtos.filter(p => norm(p.nome).includes(f) || norm(p.descricao || '').includes(f));
  const el = $('#listaProdutos');
    const novoBtn = $('#novoProdutoBtn');
    if(novoBtn) novoBtn.style.display = state.produtos.length ? 'inline-flex' : 'none';

  if(!state.produtos.length){
    el.innerHTML = `
      <div class="empty">
        <div class="ill">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v3M8 6h8l-1 4H9L8 6Z"/>
            <path d="M6 10h12l-1.2 9.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 10Z"/>
          </svg>
        </div>
        <div class="etitle">Nenhum produto cadastrado 🍰</div>
        <div class="etext">Precifique seu primeiro doce para montar orçamentos rápidos.</div>
        <button class="btn btn-primary" onclick="startPrecificar()">Precificar 1º produto</button>
      </div>`;
    return;
  }
  if(!list.length){
    el.innerHTML = `<div class="empty"><div class="etext">Nenhum produto encontrado.</div></div>`;
    return;
  }

  const palette = ['','v2','v3','v4','v5'];
  el.innerHTML = list.map((p, i) => `
    <div class="item">
      <span class="item-ic ${palette[i % 5]}">${iconSvg(p.icon, 18)}</span>
      <div class="item-body">
        <div class="name">${esc(p.nome)}</div>
        <div class="meta" title="${p.modoPreco === 'manual' ? 'Sobra do preço final após pagar o custo.' : 'Percentual somado ao custo para sugerir o preço.'}">${(p.ingredientes || []).length} itens • Rende ${p.rendimento || 1} un • ${p.tempo}h • ${p.modoPreco === 'manual' ? `Sobra do preço ${formatarDecimal(p.preco ? ((p.preco - ((p.custoTotal || 0) / (p.rendimento || 1))) / p.preco) * 100 : 0)}%` : `Acréscimo sobre custo ${formatarDecimal(p.margem)}%`}</div>
        ${p.descricao ? `<div class="meta" style="color:var(--ink-soft); opacity:.85; margin-top:4px;">${esc(p.descricao)}</div>` : ''}
      </div>
      <div class="item-price">
        ${brlFmt(p.preco)}
        <small>por unidade</small>
        <small>Custo un.: ${brlFmt((p.custoTotal || 0) / (p.rendimento || 1))}</small>
      </div>
      <div class="item-actions">
        <button class="icon-mini" onclick="duplicarProduto('${p.id}')" aria-label="Duplicar" title="Duplicar produto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>
          </svg>
        </button>
        <button class="icon-mini" onclick="abrirEditarProduto('${p.id}')" aria-label="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </button>
        <button class="icon-mini danger" onclick="confirmarExcluirProd('${p.id}')" aria-label="Excluir">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

$('#buscaProd').addEventListener('input', e => renderProdutos(e.target.value));

function duplicarProduto(id){
  const original = state.produtos.find(p => p.id === id);
  if(!original) return;

  const baseNome = String(original.nome || 'Produto')
    .replace(/\s+\(cópia(?:\s+\d+)?\)$/i, '')
    .trim();
  let sufixo = '(cópia)';
  let nome = `${baseNome.slice(0, INPUT_LIMITS.name - sufixo.length - 1)} ${sufixo}`;
  let numero = 2;
  while(state.produtos.some(p => norm(p.nome) === norm(nome))){
    sufixo = `(cópia ${numero})`;
    nome = `${baseNome.slice(0, INPUT_LIMITS.name - sufixo.length - 1)} ${sufixo}`;
    numero++;
  }

  const copia = {
    ...original,
    id: uid(),
    nome,
    descricao: original.descricao || '',
    ingredientes: JSON.parse(JSON.stringify(original.ingredientes || [])),
  };
  state.produtos.push(copia);
  if(!saveState()){
    state.produtos.pop();
    return;
  }
  renderProdutos($('#buscaProd').value);
  renderHome();
  toast(`✅ ${nome} criado`);
  setTimeout(() => abrirEditarProduto(copia.id), 180);
}

/* ═══════════════════════════════════════════════════
   QUICK PRODUCT EDIT MODAL (mesma lógica dos ingredientes)
   ═══════════════════════════════════════════════════ */
let prodEdit = null;

function abrirEditarProduto(id){
  const p = state.produtos.find(x => x.id === id);
  if(!p) return;

  prodEdit = {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao || '',
    icon: p.icon || 'bolo',
    ingredientes: JSON.parse(JSON.stringify(p.ingredientes)),
    rendimento: Number(p.rendimento) >= 1 ? Number(p.rendimento) : 1,
    tempo: p.tempo,
    embalagem: p.embalagem,
    outros: p.outros,
    margem: p.margem,
    modoPreco: p.modoPreco === 'manual' ? 'manual' : 'margem',
    precoManual: p.modoPreco === 'manual' ? p.preco : null,
  };

  ingredienteCtx = {
    list: () => prodEdit.ingredientes,
    onChange: () => renderProdEditModal()
  };

  renderProdEditModal();
}

function renderProdEditModal(){
  const f = prodEdit;
  if(!f) return;

  const nomeAtual = $('#peNome') ? $('#peNome').value : f.nome;
  f.nome = nomeAtual;

  openModal(`
    <div class="modal-handle"></div>
    <h3>Editar Produto</h3>
    <p class="sub">Atualize os dados deste doce no seu catálogo.</p>

    <div class="field">
      <label>Ícone do produto</label>
      ${renderIconGrid(f.icon, 'setProdEditIcon')}
    </div>

    <div class="field">
      <label>Nome do produto <span class="req">*</span></label>
      <div class="input-wrap"><input type="text" id="peNome" value="${esc(f.nome)}" maxlength="${INPUT_LIMITS.name}"></div>
      <div class="error">Informe o nome</div>
    </div>

    <div class="field">
      <label>Descrição do produto</label>
      <textarea id="peDescricao" rows="3" maxlength="${INPUT_LIMITS.description}" placeholder="Ex: Massa fofinha com recheio de morango.">${esc(f.descricao || '')}</textarea>
    </div>

    <div class="field">
      <label>Insumos da receita</label>
      <div class="hint">Os custos dos insumos são definidos nesta receita. Alterar esses valores não muda outros produtos.</div>
      <div id="peIngList"></div>
      <button class="btn btn-ghost" onclick="abrirSeletorIngrediente()" style="margin-top:6px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Adicionar insumo
      </button>
    </div>

    <div class="row-2">
      <div class="field">
        <label>Rendimento (unidades) <span class="req">*</span></label>
        <div class="input-wrap"><input type="number" id="peRendimento" value="${f.rendimento}" min="1" max="${INPUT_LIMITS.quantity}" step="1" inputmode="numeric"></div>
        <div class="error">Rendimento inválido</div>
        <div class="hint">Quantas unidades prontas uma receita completa produz.</div>
      </div>
      <div class="field">
        <label>Tempo (horas) <span class="req">*</span></label>
        <div class="input-wrap"><input type="number" id="peTempo" value="${f.tempo}" min="0.1" max="${INPUT_LIMITS.hours}" step="0.25" inputmode="decimal"></div>
        <div class="error">Horas inválidas</div>
      </div>
    </div>

    <div class="field">
      <label>Embalagem</label>
      <div class="input-wrap"><span class="pre">R$</span><input type="number" id="peEmb" value="${f.embalagem}" min="0" max="${INPUT_LIMITS.money}" step="0.01" inputmode="decimal"></div>
    </div>

    <div class="field">
      <label>Outros custos</label>
      <div class="input-wrap"><span class="pre">R$</span><input type="number" id="peOut" value="${f.outros}" min="0" max="${INPUT_LIMITS.money}" step="0.01" inputmode="decimal"></div>
    </div>

    <div class="field">
      <label>Como definir o preço?</label>
      <div class="segmented">
        <button class="seg ${f.modoPreco !== 'manual' ? 'active' : ''}" onclick="setProdEditModo('margem')">Por acréscimo</button>
        <button class="seg ${f.modoPreco === 'manual' ? 'active' : ''}" onclick="setProdEditModo('manual')">Preço personalizado</button>
      </div>
    </div>

    <div class="field" style="display:${f.modoPreco === 'manual' ? 'none' : 'block'};">
      <label>Acréscimo sobre o custo (%)</label>
      <div class="hint">O percentual é aplicado ao custo por unidade.</div>
      <div class="opt-grid">
        ${[30,50,100].map(v => `<button class="opt ${f.margem === v ? 'active' : ''}" onclick="setProdEditMargem(${v})">${v}%</button>`).join('')}
        <button class="opt ${![30,50,100].includes(f.margem) ? 'active' : ''}" onclick="abrirCustomMargemProdEdit()">Escolher</button>
      </div>
    </div>

    <div class="field" style="display:${f.modoPreco === 'manual' ? 'block' : 'none'};">
      <label>Preço de venda por unidade <span class="req">*</span></label>
      <div class="input-wrap"><span class="pre">R$</span><input type="number" id="pePrecoManual" min="0.01" max="${INPUT_LIMITS.money}" step="0.01" inputmode="decimal" value="${f.precoManual != null ? f.precoManual : ''}" placeholder="0,00"></div>
      <div class="hint">A margem é a parte do preço final que sobra após pagar o custo. Custo sem lucro: <strong>${brlFmt(calcularPrecObj({...f, modoPreco:'margem'}).custoUnitario)}</strong></div>
    </div>

    <div class="danfe" id="peDanfe"></div>

    <div class="btn-row">
      <button class="btn btn-soft" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="confirmarSalvarProdEdit()">Salvar</button>
    </div>
  `);

  $('#peNome').addEventListener('input', () => { prodEdit.nome = $('#peNome').value; });
  $('#peDescricao').addEventListener('input', () => { prodEdit.descricao = $('#peDescricao').value.trim(); });
  $('#pePrecoManual')?.addEventListener('input', e => {
    prodEdit.precoManual = numInput(e.target.value);
    updateProdEditDanfe();
  });
  ['peRendimento','peTempo','peEmb','peOut'].forEach(id => {
    $('#'+id).addEventListener('input', () => {
      prodEdit.tempo = numInput($('#peTempo').value) || 0;
      prodEdit.rendimento = numInput($('#peRendimento').value) || 1;
      prodEdit.embalagem = numInput($('#peEmb').value) || 0;
      prodEdit.outros = numInput($('#peOut').value) || 0;
      updateProdEditDanfe();
    });
  });

  renderProdEditIngList();
  updateProdEditDanfe();
}

function setProdEditIcon(key){
  prodEdit.nome = $('#peNome') ? $('#peNome').value : prodEdit.nome;
  prodEdit.icon = key;
  renderProdEditModal();
}

function renderProdEditIngList(){
  const el = $('#peIngList');
  if(!el || !prodEdit) return;
  if(!prodEdit.ingredientes.length){
    el.innerHTML = `<div class="empty" style="padding:14px 10px;"><div class="etext">Nenhum insumo nesta receita.</div></div>`;
    return;
  }
  el.innerHTML = prodEdit.ingredientes.map((ing, idx) => `
    <div class="item">
      <span class="item-ic v2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 10.5h14l-1.3 8.2a2 2 0 0 1-2 1.7H8.3a2 2 0 0 1-2-1.7L5 10.5Z"/></svg>
      </span>
      <div class="item-body">
        <div class="name">${esc(ing.nome)}</div>
        <div class="meta">${ing.qtd}${esc(ing.un)} • ${brlFmt(ing.qtd * ing.custoUnit)}</div>
      </div>
      <div class="item-actions">
        <button class="icon-mini danger" onclick="removerIngReceita(${idx})" aria-label="Remover">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function setProdEditMargem(v){
  prodEdit.nome = $('#peNome') ? $('#peNome').value : prodEdit.nome;
  prodEdit.margem = v;
  renderProdEditModal();
}

function setProdEditModo(modo){
  prodEdit.nome = $('#peNome') ? $('#peNome').value : prodEdit.nome;
  if(modo === 'manual' && !Number.isFinite(prodEdit.precoManual)){
    prodEdit.precoManual = calcularPrecObj({...prodEdit, modoPreco: 'margem'}).preco;
  }
  prodEdit.modoPreco = modo;
  renderProdEditModal();
}

function abrirCustomMargemProdEdit(){
  openModal(`
    <div class="modal-handle"></div>
    <h3>Acréscimo Personalizado</h3>
    <p class="sub">Informe quanto acrescentar ao custo (0 a 500%).</p>
    <div class="field">
      <label>Acréscimo (%) <span class="req">*</span></label>
      <div class="input-wrap"><input type="number" id="customMargemPE" min="0" max="500" step="1" value="${prodEdit.margem}" inputmode="numeric"></div>
      <div class="error">Valor entre 0 e 500</div>
    </div>
    <div class="btn-row">
      <button class="btn btn-soft" onclick="renderProdEditModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarCustomMargemProdEdit()">Aplicar</button>
    </div>
  `);
  setTimeout(() => $('#customMargemPE')?.focus(), 100);
}

function salvarCustomMargemProdEdit(){
  const v = numInput($('#customMargemPE').value);
  const f = $('#customMargemPE').closest('.field');
  f.classList.remove('invalid');
  if(isNaN(v) || v < 0 || v > 500){ f.classList.add('invalid'); toast('Acréscimo inválido'); return; }
  prodEdit.margem = v;
  renderProdEditModal();
}

function updateProdEditDanfe(){
  const el = $('#peDanfe');
  if(!el || !prodEdit) return;
  const c = calcularPrecObj(prodEdit);
  el.innerHTML = `
    <div class="danfe-line expense"><span>Custo de insumos</span><strong>${brlFmt(c.custoIng)}</strong></div>
    <div class="danfe-line expense"><span>Mão de obra</span><strong>${brlFmt(c.mao)}</strong></div>
    <div class="danfe-line expense"><span>Embalagem + outros</span><strong>${brlFmt((prodEdit.embalagem || 0) + (prodEdit.outros || 0))}</strong></div>
    <div class="danfe-line cost"><span>Custo da receita (${c.rendimento} un)</span><strong>${brlFmt(c.custoTotal)}</strong></div>
    <div class="danfe-line cost"><span>Custo por unidade</span><strong>${brlFmt(c.custoUnitario)}</strong></div>
    <div class="danfe-line profit"><span>Lucro por unidade (${prodEdit.modoPreco === 'manual' ? `margem de ${formatarDecimal(c.margemReal)}% sobre a venda` : `acréscimo de ${formatarDecimal(prodEdit.margem)}% sobre o custo`})</span><strong class="${c.lucro < 0 ? 'danfe-loss' : ''}">${c.lucro < 0 ? '−' : '+'} ${brlFmt(Math.abs(c.lucro))}</strong></div>
    <div class="danfe-line profit"><span>Lucro total da receita (${c.rendimento} un)</span><strong class="${c.lucroReceita < 0 ? 'danfe-loss' : ''}">${c.lucroReceita < 0 ? '−' : '+'} ${brlFmt(Math.abs(c.lucroReceita))}</strong></div>
    ${c.lucro < 0 ? '<div class="danfe-warning">Atenção: este preço está abaixo do custo. Você terá prejuízo e não ganhará nada com este produto.</div>' : ''}
    <div class="danfe-line total"><span>${prodEdit.modoPreco === 'manual' ? 'Preço de Venda por Unidade' : 'Preço Sugerido por Unidade'}</span><strong>${brlFmt(c.preco)}</strong></div>
    <div class="danfe-line total"><span>${prodEdit.modoPreco === 'manual' ? 'Preço de venda da receita' : 'Preço sugerido da receita'} (${c.rendimento} un)</span><strong>${brlFmt(c.precoReceita)}</strong></div>
    <div class="danfe-explanation">Fazer esta receita custa <strong>${brlFmt(c.custoTotal)}</strong>. Vendendo tudo pelo preço indicado, seu lucro estimado é <strong>${brlFmt(c.lucroReceita)}</strong>.</div>
    <div class="danfe-note">Este preço fica salvo somente nesta receita. Outra receita pode usar outro preço para o mesmo insumo.</div>
  `;
}

function confirmarSalvarProdEdit(){
  const nome = $('#peNome').value.trim();
  const descricao = $('#peDescricao') ? $('#peDescricao').value.trim() : '';
  const tempo = numInput($('#peTempo').value);
  const rendimento = numInput($('#peRendimento').value);
  const embText = $('#peEmb').value.trim();
  const outText = $('#peOut').value.trim();
  const embValue = numInput(embText);
  const outValue = numInput(outText);
  const emb = embText ? embValue : 0;
  const out = outText ? outValue : 0;

  const nF = $('#peNome').closest('.field');
  const tF = $('#peTempo').closest('.field');
  const rF = $('#peRendimento').closest('.field');
  [nF, tF, rF].forEach(f => f.classList.remove('invalid'));

  if(!nome || nome.length > INPUT_LIMITS.name){ nF.classList.add('invalid'); toast('Informe um nome de até 100 caracteres'); return; }
  const duplicate = state.produtos.some(p => p.id !== prodEdit.id && norm(p.nome) === norm(nome));
  if(duplicate){ nF.classList.add('invalid'); toast('Já existe um produto com esse nome!'); return; }
  if(!isFiniteRange(tempo, 0.1, INPUT_LIMITS.hours)){ tF.classList.add('invalid'); toast('O tempo deve ser de 0,1 a 10.000 horas'); return; }
  if(!isFiniteRange(rendimento, 1, INPUT_LIMITS.quantity) || !Number.isSafeInteger(rendimento)){ rF.classList.add('invalid'); toast('O rendimento deve ser de 1 a 1.000.000 unidades'); return; }
  if(!isFiniteRange(emb, 0, INPUT_LIMITS.money) || !isFiniteRange(out, 0, INPUT_LIMITS.money)){ toast('Custos devem estar entre R$ 0 e R$ 1.000.000.000'); return; }
  if(!prodEdit.ingredientes.length){ toast('Adicione pelo menos um insumo'); return; }

  prodEdit.nome = nome;
  prodEdit.descricao = descricao;
  prodEdit.tempo = tempo;
  prodEdit.rendimento = rendimento;
  prodEdit.embalagem = emb;
  prodEdit.outros = out;

  if(prodEdit.modoPreco === 'manual'){
    const precoManual = numInput($('#pePrecoManual')?.value);
    const precoF = $('#pePrecoManual')?.closest('.field');
    precoF?.classList.remove('invalid');
    if(!isFiniteRange(precoManual, 0.01, INPUT_LIMITS.money)){
      precoF?.classList.add('invalid');
      toast('Preço de venda inválido');
      return;
    }
    prodEdit.precoManual = precoManual;
  }

  const c = calcularPrecObj(prodEdit);
  if(!isFiniteRange(c.custoTotal, 0, INPUT_LIMITS.money) || !isFiniteRange(c.preco, 0.01, INPUT_LIMITS.money)){
    toast('O resultado excede o limite permitido para custos ou preço.');
    return;
  }

  confirmar('Salvar alterações?', `"${nome}" por ${brlFmt(c.preco)}/un`, () => {
    const idx = state.produtos.findIndex(p => p.id === prodEdit.id);
    if(idx > -1){
      const produtoAnterior = state.produtos[idx];
      state.produtos[idx] = {
        id: prodEdit.id,
        nome: prodEdit.nome,
        descricao: prodEdit.descricao || '',
        icon: prodEdit.icon,
        ingredientes: JSON.parse(JSON.stringify(prodEdit.ingredientes)),
        tempo: prodEdit.tempo,
        rendimento: c.rendimento,
        embalagem: prodEdit.embalagem,
        outros: prodEdit.outros,
        margem: prodEdit.modoPreco === 'manual' ? c.acrescimoReal : prodEdit.margem,
        modoPreco: prodEdit.modoPreco,
        preco: c.preco,
        custoTotal: c.custoTotal,
      };
      if(!saveState()){
        state.produtos[idx] = produtoAnterior;
        return;
      }
      renderProdutos($('#buscaProd').value);
      renderHome();
      toast('💕 Produto atualizado');
    }
  }, { okLabel: 'Salvar' });
}

function confirmarExcluirProd(id){
  const p = state.produtos.find(x => x.id === id);
  if(!p) return;
  confirmar('Excluir produto?', `"${p.nome}" será removido do catálogo.`, () => {
    const produtosAnteriores = state.produtos;
    state.produtos = state.produtos.filter(x => x.id !== id);
    if(!saveState()){
      state.produtos = produtosAnteriores;
      return;
    }
    renderProdutos($('#buscaProd').value);
    renderHome();
    toast('🗑️ Produto removido');
  }, { perigo: true, okLabel: 'Excluir' });
}

/* ═══════════════════════════════════════════════════
   PRICING STEP-BY-STEP FLOW (WIZARD) — usado para criar produtos novos
   ═══════════════════════════════════════════════════ */
