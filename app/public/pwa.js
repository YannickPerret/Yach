if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker enregistré avec succès:', registration);
    }).catch(err => {
      console.error('Échec de l\'enregistrement du Service Worker:', err);
    });
  }
  