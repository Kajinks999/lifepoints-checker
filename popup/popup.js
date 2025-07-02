document.addEventListener('DOMContentLoaded', () => {
  const checkBtn = document.getElementById('check-btn');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const surveyCount = document.getElementById('survey-count');
  const lastCheck = document.getElementById('last-check');
  const resultMessage = document.getElementById('result-message');
  const settingsBtn = document.getElementById('settings-btn');
  const intervalDisplay = document.getElementById('interval-display');
  const missedCount = document.getElementById('missed-count');
  const totalPoints = document.getElementById('total-points');
  const historyList = document.getElementById('history-list');

  let isChecking = false;

  // Estado inicial
  statusIndicator.className = 'status-indicator status-default';
  loadHistory();
  updateSettingsDisplay();
  chrome.runtime.sendMessage({ action: "resetIcon" });

  function updateSettingsDisplay() {
    chrome.runtime.sendMessage({ action: "getSettings" }, (response) => {
      intervalDisplay.textContent = `Verificando a cada: ${response.interval} min`;
    });
  }

  function loadHistory() {
    chrome.storage.local.get(['history', 'missedSurveys', 'totalPoints'], (data) => {
      missedCount.textContent = `${data.missedSurveys || 0} pesquisas`;
      totalPoints.textContent = `${data.totalPoints || 0} pontos`;
      
      if (data.history?.length > 0) {
        const unclickedItems = data.history.filter(item => !item.clicked).reverse();
        
        historyList.innerHTML = unclickedItems.map(item => `
          <div class="history-item" data-id="${item.id}">
            <span class="history-id">${item.id}</span>
            <span class="history-points">${item.points} pts</span>
            <span class="history-time">${formatTime(item.timestamp)}</span>
            <button class="history-mark">✓</button>
          </div>
        `).join('');
        
        // Adiciona eventos aos botões
        document.querySelectorAll('.history-mark').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const item = e.target.closest('.history-item');
            const id = item.dataset.id;
            chrome.runtime.sendMessage({ action: "markAsClicked", id: id }, () => {
              loadHistory(); // Recarrega após marcar
            });
          });
        });
      } else {
        historyList.innerHTML = '<p class="empty-history">Nenhuma pesquisa perdida</p>';
      }
    });
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function updateLastCheck() {
    const now = new Date();
    lastCheck.textContent = `Última verificação: ${now.toLocaleTimeString()}`;
  }

  checkBtn.addEventListener('click', () => {
    if (isChecking) return;
    
    isChecking = true;
    checkBtn.classList.add('btn-disabled');
    statusIndicator.className = 'status-indicator status-active';
    statusIndicator.textContent = '🔄';
    statusText.textContent = 'Verificando...';
    resultMessage.style.display = 'none';
    surveyCount.style.display = 'none';
    
    chrome.runtime.sendMessage({ action: 'manualCheck' });
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "verificationResult") {
      isChecking = false;
      checkBtn.classList.remove('btn-disabled');
      showResult(message.hasSurveys, message.count);
      updateLastCheck();
      loadHistory(); // Atualiza histórico após verificação
    }
  });

  function showResult(hasSurveys, count) {
    statusIndicator.className = `status-indicator ${hasSurveys ? 'status-success' : 'status-error'}`;
    statusIndicator.textContent = hasSurveys ? '✓' : '✗';
    statusText.textContent = hasSurveys ? 'Pesquisas encontradas!' : 'Nada encontrado';
    
    if (hasSurveys && count > 0) {
      surveyCount.textContent = `Pesquisas disponíveis: ${count}`;
      surveyCount.style.display = 'block';
    }

    resultMessage.textContent = hasSurveys 
      ? '✅ Novas pesquisas disponíveis!' 
      : '❌ Nenhuma pesquisa encontrada';
    resultMessage.className = `result-message ${hasSurveys ? 'result-success' : 'result-error'}`;
    resultMessage.style.display = 'block';
    
    setTimeout(() => {
      resultMessage.style.display = 'none';
    }, 3000);
  }

  settingsBtn.addEventListener('click', () => {
    chrome.windows.create({
      url: chrome.runtime.getURL('popup/settings.html'),
      type: 'popup',
      width: 400,
      height: 450
    });
  });

  // Atualizações iniciais
  updateLastCheck();
  chrome.storage.onChanged.addListener(() => {
    loadHistory();
    updateSettingsDisplay();
  });
});
