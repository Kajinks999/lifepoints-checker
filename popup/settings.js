document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const saveBtn = document.getElementById('save-btn');
  const statusMessage = document.getElementById('status-message');

  // Carrega o valor salvo
  chrome.storage.sync.get(['checkInterval'], (result) => {
    intervalInput.value = result.checkInterval || 5;
  });

  // Salva as configurações
  saveBtn.addEventListener('click', () => {
    const interval = parseInt(intervalInput.value);
    
    if (isNaN(interval)) {
      showStatus("Por favor, insira um número válido", "error");
      return;
    }

    if (interval < 1 || interval > 120) {
      showStatus("O intervalo deve ser entre 1 e 120 minutos", "error");
      return;
    }

    chrome.storage.sync.set({ checkInterval: interval }, () => {
      chrome.runtime.sendMessage({
        action: "updateInterval",
        interval: interval
      }, (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          showStatus("Erro ao salvar configurações", "error");
        } else {
          showStatus("Configurações salvas com sucesso!", "success");
          setTimeout(() => window.close(), 1500);
        }
      });
    });
  });

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type;
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }

  // Fecha ao pressionar Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.close();
  });
});
