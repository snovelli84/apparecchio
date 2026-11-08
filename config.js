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
  // Chiave del sito reCAPTCHA v3 per App Check (serve alle ricette se App Check è "Applicata" per AI Logic).
  // La crei su https://www.google.com/recaptcha/admin con il dominio snovelli84.github.io. Non è segreta.
  appCheckRecaptcha: "",
  // Ricette proposte con Gemini (Firebase AI Logic). Metti false per nascondere il tasto.
  ricette: true,
  // Modelli Gemini per le ricette, in ordine di preferenza: se il primo è occupato si prova il successivo.
  // I nomi disponibili sono nella pagina AI Logic della console Firebase.
  modelliGemini: ["gemini-3.5-flash-lite", "gemini-3.8-flash"]
};
