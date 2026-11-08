// Configurazione di APParecchio.
// Incolla qui sotto i dati del tuo progetto Firebase
// (Console Firebase → Impostazioni progetto → Le tue app → App web → "Configurazione SDK").
// Questi dati non sono segreti: identificano il progetto, la protezione la fanno le regole di Firestore.
export default {
  firebase: {
    apiKey: "INSERISCI_API_KEY",
    authDomain: "INSERISCI.firebaseapp.com",
    projectId: "INSERISCI",
    storageBucket: "INSERISCI.firebasestorage.app",
    messagingSenderId: "INSERISCI",
    appId: "INSERISCI"
  },
  // Ricette proposte con Gemini (Firebase AI Logic). Metti false per nascondere il tasto.
  ricette: true,
  // Modello Gemini usato per le ricette. Se le ricette danno errore, prova un modello più recente
  // tra quelli elencati in Firebase AI Logic.
  modelloGemini: "gemini-3.6-flash"
};
