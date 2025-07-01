let CHECK_INTERVAL = 5;
let isChecking = false;
let activeTabId = null;

// Inicialização
chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);

function initialize() {
  chrome.storage.sync.get(['checkInterval'], (result) => {
    CHECK_INTERVAL = result.checkInterval || 5;
    startAlarm();
  });
}

// Verificação inteligente com timeout
async function checkSurveys(source = 'automatic') {
  if (isChecking) return;
  isChecking = true;

  const verificationTimeout = setTimeout(() => {
    finishVerification(false, source, "Timeout na verificação");
  }, 15000); // 15 segundos de timeout

  try {
    const [existingTab] = await chrome.tabs.query({
      url: "https://app.lifepointspanel.com/pt-BR/dashboard*"
    });

    if (existingTab) {
      activeTabId = existingTab.id;
      await chrome.tabs.reload(activeTabId);
    } else {
      const tab = await chrome.tabs.create({
        url: "https://app.lifepointspanel.com/pt-BR/dashboard",
        active: false
      });
      activeTabId = tab.id;
    }

    await chrome.scripting.executeScript({
      target: {tabId: activeTabId},
      func: (src) => { window.verificationSource = src; },
      args: [source]
    });

    const results = await chrome.scripting.executeScript({
      target: {tabId: activeTabId},
      files: ['scripts/checker.js']
    });

    if (!results || !results[0]?.result) {
      finishVerification(false, source, "Script não retornou resultados");
    }
  } catch (error) {
    finishVerification(false, source, `Erro: ${error.message}`);
  } finally {
    clearTimeout(verificationTimeout);
  }
}

function finishVerification(hasSurveys, source, logMessage = "") {
  if (logMessage) console.log(logMessage);
  
  chrome.runtime.sendMessage({
    hasSurveys: hasSurveys,
    source: source
  });

  if (activeTabId) {
    chrome.tabs.remove(activeTabId).catch(() => {});
    activeTabId = null;
  }
  isChecking = false;
}

function startAlarm() {
  chrome.alarms.clear('checkSurveys');
  chrome.alarms.create('checkSurveys', {
    delayInMinutes: 1,
    periodInMinutes: CHECK_INTERVAL
  });
}

function updateAlarmInterval(newInterval) {
  CHECK_INTERVAL = newInterval;
  startAlarm();
}

// Comunicação
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "updateInterval":
      updateAlarmInterval(message.interval);
      sendResponse({ success: true });
      break;
      
    case "manualCheck":
      checkSurveys('manual');
      sendResponse({ success: true });
      break;
      
    case "getInterval":
      sendResponse({ interval: CHECK_INTERVAL });
      break;
      
    case "statusUpdate":
      if (message.hasSurveys !== undefined) {
        updateIcon(message.hasSurveys);
        sendNotification(message.hasSurveys, message.source);
      }
      sendResponse({ success: true });
      break;
  }
  return true;
});

function updateIcon(hasSurveys) {
  const iconPath = hasSurveys ? {
    "16": "icons/icon-alert16.png",
    "32": "icons/icon-alert32.png",
    "48": "icons/icon-alert48.png",
    "128": "icons/icon-alert128.png"
  } : {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  };
  
  chrome.action.setIcon({ path: iconPath });
}

function sendNotification(hasSurveys, source) {
  if (source === 'manual') {
    chrome.action.setBadgeText({
      text: hasSurveys ? "SIM" : "NÃO"
    });
    setTimeout(() => chrome.action.setBadgeText({text: ""}), 3000);
  }
}

// Alarmes
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkSurveys') checkSurveys();
});