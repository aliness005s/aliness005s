  function renderHome(){
    const p = state.perfil;
  const hora = p.horas ? (p.meta / p.horas) : 0;
  const parts = brlSplit(hora);
  // Atualiza valor da hora no bloco de perfil
  $('#heroMoney').innerHTML = parts.int + '<small>' + parts.dec + '</small>';
  $('#heroMeta').textContent = brlFmt(p.meta) + '/mês';
  $('#heroHoras').textContent = (p.horas || 0) + 'h';
  const insight = $('#heroInsight');
  if(insight){
    insight.textContent = hora > 0
      ? 'Esse valor entra no custo de cada receita. Assim, seu trabalho também é pago.'
      : 'Preencha sua meta e suas horas para descobrir quanto vale cada hora de trabalho.';
  }
  $('#homeName').textContent = p.nome || 'Minha Confeitaria';

  const av = $('#homeAvatar');
  if(p.logo) av.innerHTML = `<img src="${p.logo}" alt="logo">`;
  else av.textContent = (p.nome || 'B')[0].toUpperCase();

  const wrap = $('#homeProdutosWrap');
  const list = $('#homeProdutos');
  const nextButton = $('#prodNext');
  const prods = state.produtos.slice(-6).reverse();
  if(!prods.length){
    wrap.style.display = 'block';
    list.onscroll = null;
    list.innerHTML = `
      <div class="home-products-empty" onclick="startPrecificar()" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); startPrecificar(); }" role="link" tabindex="0" aria-label="Criar primeiro produto">
        <span class="home-products-empty-mark" aria-hidden="true">+</span>
        <div>
          <strong>Nenhum produto ainda</strong>
          <span>Crie seu primeiro doce para ele aparecer aqui.</span>
        </div>
      </div>`;
    if(nextButton) nextButton.style.display = 'none';
  } else {
    wrap.style.display = 'block';
    list.innerHTML = prods.map(p => `
      <button class="prod-card" onclick="abrirEditarProduto('${p.id}')">
        <span class="pic">${iconSvg(p.icon, 18)}</span>
        <div class="pname">${esc(p.nome)}</div>
        <div class="plabel">Preço por unidade</div>
        <div class="pprice">${brlFmt(p.preco)}</div>
        <div class="plabel">Custo por unidade: ${brlFmt((p.custoTotal || 0) / (p.rendimento || 1))}</div>
      </button>
    `).join('');
    if(nextButton) nextButton.style.display = 'grid';
    list.onscroll = atualizarBotaoProdutos;
    atualizarBotaoProdutos();
  }
}

function avancarProdutos(){
  const list = $('#homeProdutos');
  if(!list) return;
  list.scrollBy({ left: Math.max(220, list.clientWidth * .72), behavior: 'smooth' });
  setTimeout(atualizarBotaoProdutos, 350);
}

function atualizarBotaoProdutos(){
  const list = $('#homeProdutos');
  const button = $('#prodNext');
  if(!list || !button) return;
  button.disabled = list.scrollWidth <= list.clientWidth + 2 || list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
}

/* ═══════════════════════════════════════════════════
   INGREDIENT MANAGEMENT & CRUD
   ═══════════════════════════════════════════════════ */
function renderIngredientes(filtro = ''){
  const f = norm(filtro);
  const list = state.ingredientes.filter(i => norm(i.nome).includes(f));
  const el = $('#listaIngredientes');
  const novoBtn = $('#novoInsumoBtn');
  if(novoBtn) novoBtn.style.display = state.ingredientes.length ? 'inline-flex' : 'none';

  if(!state.ingredientes.length){
    el.innerHTML = `
      <div class="empty">
        <div class="ill">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 10.5h14l-1.3 8.2a2 2 0 0 1-2 1.7H8.3a2 2 0 0 1-2-1.7L5 10.5Z"/>
          </svg>
        </div>
        <div class="etitle">Sua despensa está vazia 💕</div>
        <div class="etext">Cadastre os insumos que você usa nas receitas: ingredientes, embalagens e materiais.</div>
        <button class="btn btn-primary" onclick="openIngredienteForm()">Cadastrar 1º item</button>
      </div>`;
    return;
  }
  if(!list.length){
    el.innerHTML = `<div class="empty"><div class="etext">Nenhum insumo encontrado.</div></div>`;
    return;
  }

  const palette = ['','v2','v3','v4','v5'];
  el.innerHTML = list.map((ing, i) => `
    <div class="item">
      <span class="item-ic ${palette[i % 5]}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 10.5h14l-1.3 8.2a2 2 0 0 1-2 1.7H8.3a2 2 0 0 1-2-1.7L5 10.5Z"/>
        </svg>
      </span>
      <div class="item-body">
        <div class="name">${esc(ing.nome)}</div>
        <div class="meta">Disponível para usar nas receitas</div>
      </div>
      <div class="item-actions">
        <button class="icon-mini" onclick="openIngredienteForm('${ing.id}')" aria-label="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </button>
        <button class="icon-mini danger" onclick="confirmarExcluirIng('${ing.id}')" aria-label="Excluir">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

$('#buscaIng').addEventListener('input', e => renderIngredientes(e.target.value));

let ingUn = 'g';
function openIngredienteForm(id){
  const ing = id ? state.ingredientes.find(x => x.id === id) : null;
  ingUn = ing ? ing.un : 'g';
  openModal(`
    <div class="modal-handle"></div>
    <h3>${ing ? 'Editar insumo' : 'Novo insumo'}</h3>
    <p class="sub">Cadastre apenas o nome. O preço e a quantidade entram dentro de cada receita.</p>

    <div class="field">
      <label>Nome do insumo <span class="req">*</span></label>
      <div class="input-wrap"><input type="text" id="ifNome" value="${ing ? esc(ing.nome) : ''}" maxlength="${INPUT_LIMITS.ingredientName}" placeholder="Ex: Leite condensado, pote ou etiqueta"></div>
      <div class="error">Informe o nome</div>
    </div>

    <div class="btn-row">
      <button class="btn btn-soft" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="confirmarSalvarIng('${ing ? ing.id : ''}')">Salvar</button>
    </div>
  `);

}

function mostrarInfoUnidades(event){
  if(event) event.stopPropagation();
  openModal(`
    <div class="modal-handle"></div>
    <h3>Como informar as medidas</h3>
    <p class="sub">Cadastre como comprou. Na receita, informe somente o que foi usado. O app faz a conversao.</p>
    <div style="overflow-x:auto;margin:0 -4px 14px;">
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;line-height:1.35;min-width:360px;">
        <thead>
          <tr style="text-align:left;border-bottom:2px solid var(--rose-200);color:var(--ink-soft);">
            <th style="padding:8px 6px;">Comprado</th>
            <th style="padding:8px 6px;">Usado</th>
            <th style="padding:8px 6px;">Informe</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--rose-100);"><td style="padding:8px 6px;">1 caixa de creme<br>de leite = 200 g</td><td style="padding:8px 6px;">3 caixas</td><td style="padding:8px 6px;font-weight:800;">600 g</td></tr>
          <tr style="border-bottom:1px solid var(--rose-100);"><td style="padding:8px 6px;">1 lata de leite<br>condensado = 395 g</td><td style="padding:8px 6px;">2 latas</td><td style="padding:8px 6px;font-weight:800;">790 g</td></tr>
          <tr style="border-bottom:1px solid var(--rose-100);"><td style="padding:8px 6px;">1 pacote de chocolate<br>= 1 kg</td><td style="padding:8px 6px;">250 g</td><td style="padding:8px 6px;font-weight:800;">250 g</td></tr>
          <tr style="border-bottom:1px solid var(--rose-100);"><td style="padding:8px 6px;">1 pacote de farinha<br>= 1 kg</td><td style="padding:8px 6px;">300 g</td><td style="padding:8px 6px;font-weight:800;">300 g</td></tr>
          <tr style="border-bottom:1px solid var(--rose-100);"><td style="padding:8px 6px;">1 pacote com<br>100 adesivos</td><td style="padding:8px 6px;">3 adesivos</td><td style="padding:8px 6px;font-weight:800;">3 un</td></tr>
          <tr><td style="padding:8px 6px;">1 pote com colher</td><td style="padding:8px 6px;">1 pote</td><td style="padding:8px 6px;font-weight:800;">1 un</td></tr>
        </tbody>
      </table>
    </div>
    <div style="padding:10px 12px;background:rgba(255,201,218,.3);border-radius:12px;font-size:12px;font-weight:700;color:var(--ink-soft);">
      Exemplo: se cada caixa tem 200 g e voce usa 3, informe 600 g na receita.
    </div>
    <button class="btn btn-primary" onclick="closeModal()" style="margin-top:12px;">Entendi</button>
  `);
}

function mostrarInfoCadastroUnidade(event){
  if(event) event.stopPropagation();
  aviso('Como voce comprou?', 'Aqui informe somente o tamanho ou a quantidade que veio na compra. Nao importa ainda quanto sera usado na receita. Exemplos: 1 caixa de creme de leite = 200 g; 1 pacote = 1 kg; 100 adesivos = 100 un; 1 pote com colher = 1 un.');
}

function mostrarInfoUsoUnidade(event){
  mostrarInfoUnidades(event);
}

function setIngUn(el, u){
  ingUn = u;
  $$('#modalBox .opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  updateIngHint();
}

function updateIngHint(){
  const p = numInput($('#ifPreco')?.value);
  const q = numInput($('#ifQtd')?.value);
  const hint = $('#ifCustoHint');
  if(!hint) return;
  if(p > 0 && q > 0){
    const c = p / q;
    hint.style.display = 'block';
    hint.textContent = `Custo por ${ingUn}: ${brlFmt(c)}`;
  } else {
    hint.style.display = 'none';
  }
}

function confirmarSalvarIng(id){
  const nome = $('#ifNome').value.trim();

  const nF = $('#ifNome').closest('.field');
  nF.classList.remove('invalid');

  if(!nome || nome.length > INPUT_LIMITS.ingredientName){ nF.classList.add('invalid'); toast('Informe um nome de até 100 caracteres'); return; }

  // Check duplicate name
  const duplicate = state.ingredientes.some(i => i.id !== id && norm(i.nome) === norm(nome));
  if(duplicate){
    nF.classList.add('invalid');
    toast('Já existe um ingrediente com esse nome!');
    return;
  }

  confirmar(id ? 'Salvar alterações?' : 'Cadastrar insumo?', nome, () => {
    const ingredientesAnteriores = state.ingredientes.slice();
    if(id){
      const idx = state.ingredientes.findIndex(i => i.id === id);
      if(idx < 0) return;
      state.ingredientes[idx] = { ...state.ingredientes[idx], id, nome };
    } else {
      state.ingredientes.push({ id: uid(), nome });
    }
    if(!saveState()){
      state.ingredientes = ingredientesAnteriores;
      return;
    }
    renderIngredientes($('#buscaIng').value);
    toast(id ? '💕 Ingrediente atualizado' : '✅ Ingrediente cadastrado');
    const voltarParaReceita = ingredienteDepoisDoCadastro;
    ingredienteDepoisDoCadastro = null;
    if(voltarParaReceita) setTimeout(voltarParaReceita, 180);
  }, { okLabel: id ? 'Salvar' : 'Cadastrar' });
}

function confirmarExcluirIng(id){
  const ing = state.ingredientes.find(x => x.id === id);
  if(!ing) return;
  confirmar('Excluir ingrediente?', `"${ing.nome}" será removido do catálogo.`, () => {
    const ingredientesAnteriores = state.ingredientes;
    state.ingredientes = state.ingredientes.filter(x => x.id !== id);
    if(!saveState()){
      state.ingredientes = ingredientesAnteriores;
      return;
    }
    renderIngredientes($('#buscaIng').value);
    toast('🗑️ Ingrediente removido');
  }, { perigo: true, okLabel: 'Excluir' });
}

/* ═══════════════════════════════════════════════════
   PRODUCT CATALOG & CRUD
   ═══════════════════════════════════════════════════ */
