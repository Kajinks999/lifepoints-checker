document.addEventListener('DOMContentLoaded', () => {
  const checkBtn = document.getElementById('check-btn');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const lastCheck = document.getElementById('last-check');
  const resultMessage = document.getElementById('result-message');
  const settingsBtn = document.getElementById('settings-btn');
  const intervalDisplay = document.getElementById('interval-display');

  let isChecking = false;

  // Estado inicial
  statusIndicator.className = 'status-indicator status-default';

  // Atualiza o intervalo exibido
  function updateIntervalDisplay() {
    chrome.storage.sync.get(['checkInterval'], (result) => {
      const interval = result.checkInterval || 5;
      intervalDisplay.textContent = `Verificando a cada: ${interval} min`;
    });
  }

  // Atualiza última verificação
  function updateLastCheck() {
    const now = new Date();
    lastCheck.textContent = `Última verificação: ${now.toLocaleTimeString()}`;
  }

  // Verificação manual
  checkBtn.addEventListener('click', () => {
    if (isChecking) return;
    
    isChecking = true;
    checkBtn.classList.add('btn-disabled');
    statusIndicator.className = 'status-indicator status-active';
    statusIndicator.textContent = '🔄';
    statusText.textContent = 'Verificando...';
    resultMessage.style.display = 'none';
    
    chrome.runtime.sendMessage({action: 'manualCheck'}, (response) => {
      if (chrome.runtime.lastError) {
        resetVerificationState();
        showResult(false, "Erro ao iniciar verificação");
      }
    });
  });

  // Listener para resultados
  chrome.runtime.onMessage.addListener((message) => {
    if (message.hasSurveys !== undefined && message.source === 'manual') {
      resetVerificationState();
      showResult(message.hasSurveys);
      updateLastCheck();
    }
    return true;
  });

  function resetVerificationState() {
    isChecking = false;
    checkBtn.classList.remove('btn-disabled');
  }

  // Mostra resultado
  function showResult(hasSurveys, customMessage) {
    statusIndicator.className = `status-indicator ${hasSurveys ? 'status-success' : 'status-error'}`;
    statusIndicator.textContent = hasSurveys ? '✓' : '✗';
    statusText.textContent = hasSurveys ? 'Pesquisas encontradas!' : 'Nada encontrado';
    
    resultMessage.textContent = customMessage || 
      (hasSurveys ? '✅ Novas pesquisas disponíveis!' : '❌ Nenhuma pesquisa encontrada');
    resultMessage.className = `result-message ${hasSurveys ? 'result-success' : 'result-error'}`;
    resultMessage.style.display = 'block';
    
    setTimeout(() => {
      resultMessage.style.display = 'none';
    }, 3000);
  }

  // Configurações
  settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/settings.html') });
  });

  // Atualizações iniciais
  updateIntervalDisplay();
  updateLastCheck();
});
