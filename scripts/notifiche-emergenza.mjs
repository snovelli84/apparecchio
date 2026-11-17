// Invia le notifiche del kit di emergenza (eseguito ogni giorno da GitHub Actions).
// Legge Firestore con firebase-admin e invia via FCM HTTP v1 messaggi di SOLI DATI:
// è sw.js a mostrare la notifica. Non stampa mai token, codici di famiglia o credenziali.
//
// Variabili d'ambiente:
//   FIREBASE_SERVICE_ACCOUNT  JSON dell'account di servizio (secret di GitHub)
//   PROVA=1                   invia comunque una notifica di prova a tutti i dispositivi
//   DRY_RUN=1                 calcola e stampa senza inviare né scrivere nulla
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { oggiRoma, analizzaDispositivo, testoRiepilogo } from './lib/scadenze.mjs';

const PROVA = ['1', 'true'].includes(String(process.env.PROVA || '').toLowerCase());
const DRY = process.env.DRY_RUN === '1';

const grezzo = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!grezzo) { console.error('Manca il secret FIREBASE_SERVICE_ACCOUNT.'); process.exit(1); }
let account;
try { account = JSON.parse(grezzo); } catch { console.error('FIREBASE_SERVICE_ACCOUNT non contiene un JSON valido.'); process.exit(1); }

initializeApp({ credential: cert(account), projectId: account.project_id });
const db = getFirestore();
const fcm = getMessaging();
const oggi = oggiRoma();
const TOKEN_NON_VALIDI = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'];

console.log(`Notifiche kit di emergenza · ${oggi}${PROVA ? ' · PROVA' : ''}${DRY ? ' · senza inviare' : ''}`);
const totale = { famiglie: 0, dispositivi: 0, inviate: 0, nessunaNovita: 0, rimossi: 0, errori: 0 };
const famiglie = await db.collection('famiglie').listDocuments();

for (const [i, famiglia] of famiglie.entries()) {
  const dispositivi = await famiglia.collection('emergenza_dispositivi').get();
  if (dispositivi.empty) continue;
  const articoli = (await famiglia.collection('emergenza_articoli').get()).docs.map(d => ({ id: d.id, ...d.data() }));
  totale.famiglie++;
  console.log(`Famiglia ${i + 1}: ${articoli.length} articoli, ${dispositivi.size} dispositivi`);

  for (const doc of dispositivi.docs) {
    totale.dispositivi++;
    const dev = doc.data();
    const nome = `${dev.dispositivo || 'dispositivo'}${dev.utente ? ' di ' + dev.utente : ''}`;
    if (!dev.token) { console.log(`  · ${nome}: senza token, salto`); continue; }

    const r = analizzaDispositivo(articoli, dev, oggi);
    let msg = null;
    if (PROVA) {
      const stato = r.scaduti || r.inScadenza ? `Ora: ${r.scaduti} ${r.scaduti === 1 ? 'scaduto' : 'scaduti'}, ${r.inScadenza} in scadenza.` : 'Nessun articolo in scadenza.';
      msg = { title: 'Kit emergenza · prova', body: `Notifica di prova dal controllo automatico. ${stato}` };
    } else if (r.nuovi.length) {
      msg = testoRiepilogo(r.nuovi);
    }

    if (!msg) {
      totale.nessunaNovita++;
      console.log(`  · ${nome}: nessuna novità`);
      if (r.cambiato && !DRY) await doc.ref.update({ notificati: r.notificati });
      continue;
    }
    if (DRY) { console.log(`  · ${nome}: invierei "${msg.title} — ${msg.body}"`); continue; }

    try {
      await fcm.send({
        token: dev.token,
        data: { title: msg.title, body: msg.body, url: './#emergenza', tag: PROVA ? 'kit-emergenza-prova' : 'kit-emergenza' },
        webpush: { headers: { Urgency: 'high', TTL: '86400' } }
      });
      totale.inviate++;
      // La notifica di prova non cambia la memoria delle soglie: quella vera arriverà comunque.
      await doc.ref.update(PROVA ? { ultimo_invio: new Date().toISOString() } : { notificati: r.notificati, ultimo_invio: new Date().toISOString() });
      console.log(`  · ${nome}: inviata — ${msg.body}`);
    } catch (e) {
      const codice = (e && (e.errorInfo?.code || e.code)) || '';
      const tokenSbagliato = TOKEN_NON_VALIDI.includes(codice) || (codice === 'messaging/invalid-argument' && /token/i.test(String(e && e.message)));
      if (tokenSbagliato) {
        await doc.ref.delete();
        totale.rimossi++;
        console.log(`  · ${nome}: token non più valido, dispositivo rimosso`);
      } else {
        totale.errori++;
        console.log(`  · ${nome}: invio non riuscito (${codice || 'errore sconosciuto'})`);
      }
    }
  }
}

console.log(`Fatto: ${totale.famiglie} famiglie, ${totale.dispositivi} dispositivi, ${totale.inviate} notifiche inviate, ${totale.nessunaNovita} senza novità, ${totale.rimossi} dispositivi rimossi, ${totale.errori} errori.`);
if (totale.errori) process.exitCode = 1;
