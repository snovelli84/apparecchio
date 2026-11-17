// Librerie Firebase usate dall'app, impacchettate in ../../firebase.js (npm install && npm run build)
export { initializeApp } from 'firebase/app';
export { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
export { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, onSnapshot, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
export { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
export { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
export { getMessaging, getToken, deleteToken, isSupported as messagingSupportato } from 'firebase/messaging';
