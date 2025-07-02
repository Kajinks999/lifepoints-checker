let CHECK_INTERVAL = 5;
let isChecking = false;
let activeTabId = null;
let verificationCount = 0;
let autoCheckEnabled = true;
let pauseEnabled = true;

// Inicialização
chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);

function initialize() {
  chrome.storage.sync.get(
    ['checkInterval', 'autoCheckEnabled', 'pauseEnabled'],
    (result) => {
      CHECK_INTERVAL = result.checkInterval || 5;
      autoCheckEnabled = result.autoCheckEnabled !== false;
      pauseEnabled = result.pauseEnabled !== false;
      if (autoCheckEnabled) startAlarm();
    }
  );
}

async function checkSurveys(source = 'automatic') {
  if (isChecking || (!autoCheckEnabled && source === 'automatic')) return;
  
  if (pauseEnabled && verificationCount >= 10) {
    console.log("[Pausa] Intervalo de segurança ativado (30 minutos)");
    await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
    verificationCount = 0;
  }
  
  verificationCount++;
  isChecking = true;

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

    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      files: ['scripts/checker.js']
    });

    if (!results || !results[0]?.result) {
      finishVerification({ hasSurveys: false, count: 0 }, source);
    } else {
      finishVerification(results[0].result, source);
    }
  } catch (error) {
    finishVerification({ hasSurveys: false, count: 0 }, source, error.message);
  } finally {
    isChecking = false;
  }
}

function finishVerification(result, source, error = null) {
  if (error) console.error("[LifePoints] Erro:", error);
  
  if (result.hasSurveys && result.surveys?.length > 0) {
    chrome.storage.local.get(['history', 'missedSurveys', 'totalPoints'], (data) => {
      const existingHistory = data.history || [];
      const existingPoints = parseInt(data.totalPoints) || 0;

      // Filtra pesquisas novas não existentes no histórico
      const newSurveys = result.surveys.filter(newSurvey => 
        !existingHistory.some(existing => existing.id === newSurvey.id)
      );

      if (newSurveys.length > 0) {
        const newEntries = newSurveys.map(survey => ({
          id: survey.id,
          points: survey.points,
          timestamp: new Date().toISOString(),
          clicked: false
        }));

        const updatedHistory = [...existingHistory, ...newEntries].slice(-100);
        const missedCount = updatedHistory.filter(x => !x.clicked).length;
        const pointsToAdd = newSurveys.reduce((sum, survey) => sum + parseInt(survey.points || 0), 0);
        const totalPoints = existingPoints + pointsToAdd;

        chrome.storage.local.set({
          history: updatedHistory,
          missedSurveys: missedCount,
          totalPoints: totalPoints
        });

        if (source === 'automatic') {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-alert48.png',
            title: `${newSurveys.length} nova(s) pesquisa(s)!`,
            message: `Total de pontos perdidos: ${totalPoints}`,
            buttons: [{ title: 'Abrir LifePoints' }]
          });
        }
      }
    });
  }

  chrome.runtime.sendMessage({
    type: "verificationResult",
    source: source,
    ...result
  });

  if (activeTabId) {
    chrome.tabs.remove(activeTabId).catch(() => {});
    activeTabId = null;
  }
}

function startAlarm() {
  chrome.alarms.clear('checkSurveys');
  chrome.alarms.create('checkSurveys', {
    delayInMinutes: 1,
    periodInMinutes: CHECK_INTERVAL
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "updateSettings":
      CHECK_INTERVAL = message.interval;
      autoCheckEnabled = message.autoCheckEnabled;
      pauseEnabled = message.pauseEnabled;
      
      chrome.storage.sync.set({
        checkInterval: CHECK_INTERVAL,
        autoCheckEnabled: autoCheckEnabled,
        pauseEnabled: pauseEnabled
      });

      if (autoCheckEnabled) {
        startAlarm();
      } else {
        chrome.alarms.clear('checkSurveys');
      }
      sendResponse({ success: true });
      break;
      
    case "manualCheck":
      checkSurveys('manual');
      sendResponse({ success: true });
      break;
      
    case "getSettings":
      sendResponse({
        interval: CHECK_INTERVAL,
        autoCheckEnabled: autoCheckEnabled,
        pauseEnabled: pauseEnabled
      });
      break;
      
    case "resetIcon":
      chrome.action.setIcon({
        path: {
          "16": "icons/icon16.png",
          "32": "icons/icon32.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        }
      });
      sendResponse({ success: true });
      break;
      
    case "markAsClicked":
      chrome.storage.local.get(['history', 'totalPoints'], (data) => {
        const updatedHistory = (data.history || []).map(item => {
          if (item.id === message.id) {
            return { ...item, clicked: true };
          }
          return item;
        });
        
        const missedCount = updatedHistory.filter(x => !x.clicked).length;
        chrome.storage.local.set({
          history: updatedHistory,
          missedSurveys: missedCount
        });
      });
      sendResponse({ success: true });
      break;
  }
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkSurveys' && autoCheckEnabled) checkSurveys();
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    chrome.tabs.create({ url: 'https://app.lifepointspanel.com/pt-BR/dashboard' });
  }
});
