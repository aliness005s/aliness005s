function registerOfflineSupport(){
  if(navigator.storage && navigator.storage.persist){
    navigator.storage.persist().catch(() => {});
  }

  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js?v=4').catch(() => {});
    });
  }

  window.addEventListener('offline', () => toast('Você está offline. O app continua funcionando.'));
  window.addEventListener('online', () => toast('Conexão restaurada.'));
}

registerOfflineSupport();

function init(){
  inicializarBackup();
  if(state.onboarded){
    $('#onboarding').classList.add('hide');
    renderHome();
  } else {
    $('#onboarding').classList.remove('hide');
    $('#obNome').focus();
  }
  const m = numInput($('#obMeta').value) || 0;
  const h = numInput($('#obHoras').value) || 1;
  $('#obHoraPreview').textContent = brlFmt(m / h);
}

init();
