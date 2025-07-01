function checkForSurveys() {
  return new Promise((resolve) => {
    // Verificação 1: Mensagem explícita de "sem pesquisas"
    const noSurveysMsg = document.body.innerText.includes("Você não tem pesquisas disponíveis");
    
    // Verificação 2: Elementos com # (IDs de pesquisa)
    const elementsWithHash = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent || el.innerText || '';
      return text.includes("#") && text.length < 100;
    });

    // Resultado final
    const hasSurveys = elementsWithHash.length > 0 && !noSurveysMsg;
    resolve(hasSurveys);
  });
}

// Execução principal
(async () => {
  try {
    const hasSurveys = await checkForSurveys();
    chrome.runtime.sendMessage({
      hasSurveys: hasSurveys,
      source: window.verificationSource || 'automatic'
    });
  } catch (error) {
    chrome.runtime.sendMessage({
      hasSurveys: false,
      source: window.verificationSource || 'automatic'
    });
  }
})();
