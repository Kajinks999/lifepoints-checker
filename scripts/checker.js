function checkForSurveys() {
  try {
    const surveyCards = Array.from(document.querySelectorAll('[class*="Card"], section')).filter(card => {
      const text = card.textContent || '';
      return (
        text.match(/participar de pesquisa/i) &&
        text.match(/\d+\s*LIFEPOINTS/i) &&
        card.querySelector('button, a')
      );
    });

    const surveys = surveyCards.map(card => {
      const cardText = card.textContent || '';
      
      // Extrai ID (4-8 caracteres alfanuméricos)
      const surveyId = cardText.match(/[a-f0-9]{4,8}(?=\s|$)/i)?.[0] || 
                     cardText.match(/\b\d{4,8}\b/)?.[0] || 
                     'ID-'+Math.random().toString(36).substr(2, 8);
      
      // Extrai pontos (apenas números)
      const points = cardText.match(/\d+\s*LIFEPOINTS/i)?.[0]?.replace(/\D/g, '') || '0';
      
      // Verifica se é pesquisa em andamento
      const isInProgress = card.querySelector('[class*="Loading"], [class*="Progress"]') !== null;

      return { 
        id: surveyId, 
        points: points,
        inProgress: isInProgress,
        element: card.outerHTML.slice(0, 150) // Para debug
      };
    });

    const availableSurveys = surveys.filter(s => !s.inProgress);

    return {
      hasSurveys: availableSurveys.length > 0,
      count: availableSurveys.length,
      surveys: availableSurveys,
      inProgress: surveys.filter(s => s.inProgress).length
    };
  } catch (error) {
    console.error("Erro na verificação:", error);
    return { 
      hasSurveys: false, 
      count: 0,
      error: error.message
    };
  }
}

// Versão otimizada para execução na página
(() => checkForSurveys())();
