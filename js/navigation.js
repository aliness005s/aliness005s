let saídaDaPrecificacaoConfirmada = false;

function showScreen(id){
  const currentScreen = document.querySelector('.screen.active')?.id;
  const fluxoEmEdicao = ['s-precificar', 's-orcamento'].includes(currentScreen);
  const continuaNoMesmoFluxo = id === currentScreen;
  const fluxoNaoSalvo = currentScreen === 's-precificar'
    ? !precFlowSalvo
    : currentScreen === 's-orcamento' && !orcamentoAtualEstaSalvo();
  if(fluxoEmEdicao && !continuaNoMesmoFluxo && fluxoNaoSalvo && !saídaDaPrecificacaoConfirmada){
    confirmar(
      currentScreen === 's-orcamento' ? 'Sair do orçamento?' : 'Sair da precificação?',
      'O que você preencheu ainda não foi salvo. Quer sair mesmo?',
      () => {
        saídaDaPrecificacaoConfirmada = true;
        showScreen(id);
        saídaDaPrecificacaoConfirmada = false;
      },
      { perigo: true, okLabel: 'Sair' }
    );
    return;
  }

  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
  const scroll = $('#scroll');
  scroll.scrollTop = 0;
  scroll.scrollLeft = 0;
  window.scrollTo(0, 0);

  $('#nav').classList.remove('hidden');
  $('#fabWrap').classList.remove('hidden');

  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === id));

  if(id === 's-home') { closeFab(); renderHome(); }
  if(id === 's-ingredientes') renderIngredientes();
  if(id === 's-produtos') renderProdutos();
  if(id === 's-orcamentos') renderOrcamentos();
  if(id === 's-fechamento') renderFechamento();

  // Renderizações podem reajustar a altura do container e recuperar a posição anterior.
  requestAnimationFrame(() => {
    scroll.scrollTop = 0;
    scroll.scrollLeft = 0;
    window.scrollTo(0, 0);
  });
}

/* ═══════════════════════════════════════════════════
   FAB TOGGLE
   ═══════════════════════════════════════════════════ */
function toggleFab(){
  const m = $('#fabMenu');
  const f = $('#fab');
  const open = !m.classList.contains('show');
  m.classList.toggle('show', open);
  f.classList.toggle('rotated', open);
}
function closeFab(){
  $('#fabMenu').classList.remove('show');
  $('#fab').classList.remove('rotated');
}
document.addEventListener('click', e => {
  const wrap = $('#fabWrap');
  if(!wrap.contains(e.target) && $('#fabMenu').classList.contains('show')){
    closeFab();
  }
});

/* ═══════════════════════════════════════════════════
   ONBOARDING
   ═══════════════════════════════════════════════════ */
let obLogoData = null;

$('#obLogoInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  resizeImage(file, 350, dataUrl => {
    obLogoData = dataUrl;
    $('#obLogoPreview').innerHTML = `<img src="${dataUrl}" alt="logo">`;
  }, () => toast('Logo inválida. Escolha uma imagem JPG, PNG, WebP ou GIF de até 5 MB.'));
  e.target.value = '';
});

['obMeta','obHoras'].forEach(id => {
  $('#'+id).addEventListener('input', () => {
    const m = numInput($('#obMeta').value) || 0;
    const h = numInput($('#obHoras').value) || 1;
    $('#obHoraPreview').textContent = brlFmt(m / h);
  });
});
