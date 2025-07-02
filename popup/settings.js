document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const autoCheckToggle = document.getElementById('auto-check-toggle');
  const pauseToggle = document.getElementById('pause-toggle');
  const saveBtn = document.getElementById('save-btn');
  const statusMessage = document.getElementById('status-message');

  // Carrega configurações salvas
  chrome.runtime.sendMessage({ action: "getSettings" }, (response) => {
    intervalInput.value = response.interval;
    autoCheckToggle.checked = response.autoCheckEnabled;
    pauseToggle.checked = response.pauseEnabled;
  });

  // Salva configurações
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

    chrome.runtime.sendMessage({
      action: "updateSettings",
      interval: interval,
      autoCheckEnabled: autoCheckToggle.checked,
      pauseEnabled: pauseToggle.checked
    }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        showStatus("Erro ao salvar configurações", "error");
      } else {
        showStatus("Configurações salvas com sucesso!", "success");
        setTimeout(() => window.close(), 1500);
      }
    });
  });

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type;
    statusMessage.style.display = 'block';
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }

  // Fecha com Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.close();
  });
});
