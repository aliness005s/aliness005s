function finishOnboarding(){
  const nome = $('#obNome').value.trim();
  const meta = numInput($('#obMeta').value);
  const horas = numInput($('#obHoras').value);

  const nF = $('#obNome').closest('.field');
  const mF = $('#obMeta').closest('.field');
  const hF = $('#obHoras').closest('.field');
  [nF, mF, hF].forEach(f => f.classList.remove('invalid'));

  if(!nome){ nF.classList.add('invalid'); toast('Informe o nome da confeitaria'); return; }
  if(nome.length > 30){ nF.classList.add('invalid'); toast('O nome deve ter no máximo 30 caracteres'); return; }
  if(!isFiniteRange(meta, 1, INPUT_LIMITS.money)){ mF.classList.add('invalid'); toast('A meta deve ser de até R$ 1.000.000.000'); return; }
  if(!isFiniteRange(horas, 1, INPUT_LIMITS.hours)){ hF.classList.add('invalid'); toast('Informe horas válidas (máximo 10.000)'); return; }

  const zap = $('#obZap').value.trim();
  const pix = $('#obPix').value.trim();
  if(pix.length > INPUT_LIMITS.pix){ toast('A chave Pix deve ter até 254 caracteres'); return; }
  const previousPerfil = state.perfil;

  state.perfil = {
    nome,
    zap,
    pix,
    meta,
    horas,
    logo: obLogoData,
  };
  state.onboarded = true;
  if(!saveState()){
    state.perfil = previousPerfil;
    state.onboarded = false;
    return;
  }
  inicializarBackup();
  $('#onboarding').classList.add('hide');
  renderHome();
  toast('✨ Bem-vinda, ' + nome.split(' ')[0] + '!');
}

/* ═══════════════════════════════════════════════════
   PERFIL — EDIÇÃO
   ═══════════════════════════════════════════════════ */
let editLogoData = null;

function openProfileEdit(){
  editLogoData = state.perfil.logo;
  const p = state.perfil;
  openModal(`
    <div class="modal-handle"></div>
    <h3>Perfil da Confeitaria</h3>
    <p class="sub">Atualize os dados e sua logo para exibição nos orçamentos.</p>

    <div class="field">
      <label>Nome da confeitaria <span class="req">*</span></label>
      <div class="input-wrap"><input type="text" id="epNome" value="${esc(p.nome)}" maxlength="30"></div>
      <div class="error">Informe o nome</div>
    </div>

    <div class="field">
      <label>WhatsApp</label>
      <div class="input-wrap"><input type="tel" id="epZap" value="${esc(p.zap)}" inputmode="tel"></div>
    </div>

    <div class="field">
      <label>Chave Pix</label>
      <div class="input-wrap"><input type="text" id="epPix" value="${esc(p.pix)}" maxlength="${INPUT_LIMITS.pix}"></div>
    </div>

    <div class="row-2">
      <div class="field">
        <label>Meta mensal <span class="req">*</span></label>
        <div class="input-wrap"><span class="pre">R$</span><input type="number" id="epMeta" value="${p.meta}" min="1" max="${INPUT_LIMITS.money}" step="50" inputmode="decimal"></div>
        <div class="error">Valor inválido</div>
      </div>
      <div class="field">
        <label>Horas / mês <span class="req">*</span></label>
        <div class="input-wrap"><input type="number" id="epHoras" value="${p.horas}" min="1" max="${INPUT_LIMITS.hours}" step="1" inputmode="numeric"></div>
        <div class="error">Valor inválido</div>
      </div>
    </div>

    <div class="field">
      <label>Logo da confeitaria</label>
      <label class="logo-upload">
        <div class="logo-preview" id="epLogoPreview">
          ${editLogoData ? `<img src="${editLogoData}" alt="logo">` : `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 16l4-4 3 3 5-5 4 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1Z"/><circle cx="9" cy="8" r="1.5"/>
            </svg>`}
        </div>
        <div style="flex:1;">
          <strong style="display:block;font-family:'Outfit';font-size:13.5px;font-weight:700;">${editLogoData ? 'Trocar imagem' : 'Escolher foto/logo'}</strong>
          <span style="font-size:11px;font-weight:600;color:var(--ink-soft);">Toque para selecionar</span>
        </div>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" id="epLogoInput" style="display:none;">
      </label>
      ${editLogoData ? `<button class="btn btn-ghost" style="margin-top:8px;padding:8px;font-size:12px;" onclick="removerLogo()">Remover logo atual</button>` : ''}
    </div>

    <div class="btn-row" style="margin-top:12px;">
      <button class="btn btn-soft" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="confirmarSalvarPerfil()">Salvar perfil</button>
    </div>
  `);

  $('#epLogoInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if(!file) return;
    resizeImage(file, 350, dataUrl => {
      editLogoData = dataUrl;
      $('#epLogoPreview').innerHTML = `<img src="${dataUrl}" alt="logo">`;
    }, () => toast('Logo inválida. Escolha uma imagem JPG, PNG, WebP ou GIF de até 5 MB.'));
    e.target.value = '';
  });
}

function removerLogo(){
  editLogoData = null;
  $('#epLogoPreview').innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 16l4-4 3 3 5-5 4 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1Z"/><circle cx="9" cy="8" r="1.5"/>
    </svg>`;
  toast('Logo removida');
}

function confirmarSalvarPerfil(){
  const nome = $('#epNome').value.trim();
  const zap = $('#epZap').value.trim();
  const pix = $('#epPix').value.trim();
  const meta = numInput($('#epMeta').value);
  const horas = numInput($('#epHoras').value);

  const nF = $('#epNome').closest('.field');
  const mF = $('#epMeta').closest('.field');
  const hF = $('#epHoras').closest('.field');
  [nF, mF, hF].forEach(f => f.classList.remove('invalid'));

  if(!nome){ nF.classList.add('invalid'); toast('Informe o nome'); return; }
  if(nome.length > 30){ nF.classList.add('invalid'); toast('O nome deve ter no máximo 30 caracteres'); return; }
  if(!isFiniteRange(meta, 1, INPUT_LIMITS.money)){ mF.classList.add('invalid'); toast('A meta deve ser de até R$ 1.000.000.000'); return; }
  if(!isFiniteRange(horas, 1, INPUT_LIMITS.hours)){ hF.classList.add('invalid'); toast('Informe horas válidas (máximo 10.000)'); return; }
  if(pix.length > INPUT_LIMITS.pix){ toast('A chave Pix deve ter até 254 caracteres'); return; }

  confirmar('Salvar alterações?', 'Seus dados de perfil serão atualizados.', () => {
    const previousPerfil = state.perfil;
    state.perfil = {
      nome,
      zap,
      pix,
      meta,
      horas,
      logo: editLogoData,
    };
    if(!saveState()){
      state.perfil = previousPerfil;
      return;
    }
    renderHome();
    toast('💕 Perfil atualizado');
  }, { okLabel: 'Salvar' });
}

/* ═══════════════════════════════════════════════════
   PAINEL EXPANSÍVEL DO PERFIL
   • Abre/fecha dentro do próprio card
   • Frases rotativas ao lado do nome
   • Ao expandir: dados ocultos substituem as frases
   ═══════════════════════════════════════════════════ */
function toggleProfilePanel(e){
  if(e) e.stopPropagation();
  const user = document.getElementById('hhUser');
  const toggle = document.getElementById('hhToggle');
  if(!user || !toggle) return;

  const willOpen = !user.classList.contains('expanded');
  user.classList.toggle('expanded', willOpen);
  toggle.classList.toggle('open', willOpen);
  toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
}

/* Fecha o painel ao clicar fora */
document.addEventListener('click', e => {
  const user = document.getElementById('hhUser');
  const toggle = document.getElementById('hhToggle');
  if(!user || !toggle) return;
  if(!user.classList.contains('expanded')) return;
  if(user.contains(e.target)) return;

  user.classList.remove('expanded');
  toggle.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
});

/* ═══════════════════════════════════════════════════
   ROTAÇÃO DAS FRASES AO LADO DO NOME
   ═══════════════════════════════════════════════════ */
(function initProfilePhrases(){
  const wrap = document.getElementById('hhSwapPhrase');
  if(!wrap) return;
  const phrases = wrap.querySelectorAll('.hh-phrase');
  if(phrases.length < 2) return;

  let idx = 0;
  setInterval(() => {
    phrases[idx].classList.remove('active');
    idx = (idx + 1) % phrases.length;
    phrases[idx].classList.add('active');
  }, 4500);
})();