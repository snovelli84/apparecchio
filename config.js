// Configurazione di APParecchio.
// Incolla qui sotto i dati del tuo progetto Firebase
// (Console Firebase → Impostazioni progetto → Le tue app → App web → "Configurazione SDK").
// Questi dati non sono segreti: identificano il progetto, la protezione la fanno le regole di Firestore.
export default {
  firebase: {
    apiKey: "AIzaSyDo7IIwIyJw-AgB_NWb9T0Q6eVhVy0-ffg",
    authDomain: "apparecchio.firebaseapp.com",
    projectId: "apparecchio",
    storageBucket: "apparecchio.firebasestorage.app",
    messagingSenderId: "394037841689",
    appId: "1:394037841689:web:e51766974d68bff854ff88"
  },
  // Ricette proposte con Gemini (Firebase AI Logic). Metti false per nascondere il tasto.
  ricette: true,
  // Modello Gemini usato per le ricette. Se le ricette danno errore, prova un modello più recente
  // tra quelli elencati in Firebase AI Logic.
  modelloGemini: "gemini-3.8-flash"
};
