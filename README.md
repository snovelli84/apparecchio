# APParecchio

Il menù settimanale di famiglia: all'apertura mostra cosa preparare adesso, la settimana pasto per pasto
e la lista della spesa per i giorni che scegli, con le spunte condivise in famiglia.

Sito statico pubblicato con **GitHub Pages**; i dati condivisi stanno su **Firebase** (piano gratuito Spark).
Per entrare serve solo il **codice di famiglia**, nessun account.

## File

| File | Cosa contiene |
|---|---|
| `index.html` | l'app |
| `config.js` | i dati del tuo progetto Firebase (da compilare) |
| `firebase.js` | le librerie Firebase (database, accesso anonimo, Gemini), già pronte |
| `firestore.rules` | le regole di sicurezza da copiare nella console Firebase |
| `manifest.webmanifest`, `sw.js`, `icone/` | icona, installazione sulla schermata Home e notifiche push (`sw.js`) |
| `scripts/notifiche-emergenza.mjs`, `scripts/lib/` | invio giornaliero delle notifiche del kit di emergenza (firebase-admin) |
| `.github/workflows/notifiche-emergenza.yml` | il workflow che esegue lo script ogni giorno alle 17:00 UTC |
| `scripts/build-firebase/` | per rigenerare `firebase.js` (`npm ci && npm run build`) |

## Configurazione (una volta sola)

### 1. Progetto Firebase
1. Vai su <https://console.firebase.google.com> con il tuo account Google personale e crea un progetto (es. `apparecchio`). Google Analytics non serve.
2. **Authentication** → *Inizia* → *Metodo di accesso* → attiva **Anonimo**.
3. **Firestore Database** → *Crea database* → posizione `europe-west` (es. `eur3` o `europe-west8` Milano) → modalità produzione.
4. In Firestore apri la scheda **Regole**, sostituisci tutto con il contenuto di `firestore.rules` e premi *Pubblica*.
5. **Impostazioni progetto** (ingranaggio) → *Le tue app* → icona web `</>` → nome `APParecchio` (Hosting non serve) → copia l'oggetto `firebaseConfig` dentro `config.js`.
6. Per le ricette proposte: **AI Logic** (menu *Crea* o *Build*) → *Inizia* → scegli **Gemini Developer API** (gratuita, senza carta).
   Se preferisci non usarle, in `config.js` metti `ricette: false`.

### 2. Dominio autorizzato
In **Authentication → Impostazioni → Domini autorizzati** aggiungi `TUONOME.github.io`.

### 3. GitHub Pages
Nel repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
branch `main`, cartella `/ (root)` → *Save*. Dopo un minuto l'app è su `https://TUONOME.github.io/apparecchio/`.

## Primo accesso
1. Apri l'indirizzo, scegli un **codice di famiglia** (almeno 12 caratteri, difficile da indovinare) ed entra.
2. Se hai un backup (`apparecchio-backup-….json`), premi *Carica un backup*. Altrimenti incolla la dieta nella sezione **Dieta**.
3. Dai il codice a chi deve usare l'app con te: lo inserisce al primo accesso. Lo trovi in fondo alla sezione Dieta.

## Sul telefono
- **iPhone (Safari)**: Condividi → *Aggiungi alla schermata Home*.
- **Android (Chrome)**: menu ⋮ → *Installa app* (o *Aggiungi a schermata Home*).

## Sicurezza, in breve
I dati di ogni famiglia stanno sotto `famiglie/<codice>`: chi non conosce il codice non può leggerli né elencarli.
Chi conosce il codice entra, quindi non pubblicarlo. Per cambiarlo: crea un backup, esci, entra con un codice nuovo e carica il backup.
I dati in `config.js` non sono segreti (identificano solo il progetto).

## Da ricordare: App Check entro il 21 gennaio 2027
Per far funzionare le ricette, App Check di **Firebase AI Logic** è impostato su *Non applicata (solo monitoraggio)*.
Firebase avvisa che **dal 21 gennaio 2027** lo rimetterà su *Applicata* da solo: da quel giorno le ricette daranno errore 401.
Il codice supporta già App Check con reCAPTCHA v3 (`appCheckRecaptcha` in `config.js`). Prima di quella data va presa una decisione:
configurare App Check, oppure spegnere le ricette (`ricette: false`). Il resto dell'app (dieta, spesa, spunte) non dipende da App Check.

## Kit di emergenza e notifiche

La sezione **Emergenza** tiene l'elenco del kit (zaini, scorta in casa, auto): cosa c'è, dove, cosa scade e cosa va controllato.
I dati stanno in `famiglie/<codice>/emergenza_articoli`, i telefoni registrati per le notifiche in `famiglie/<codice>/emergenza_dispositivi`,
le voci "Da comprare in più" della Spesa in `famiglie/<codice>/spesa_extra`. Le regole di Firestore esistenti le coprono già: nessuna modifica.

Come arrivano le notifiche, tutto sul piano gratuito Spark:

```
Telefono (app) ──token FCM──▶ Firestore: emergenza_dispositivi
GitHub Actions, ogni giorno 17:00 UTC ──▶ scripts/notifiche-emergenza.mjs (firebase-admin)
                                       └─▶ FCM HTTP v1, messaggi di soli dati ──▶ sw.js mostra la notifica
```

Lo script manda **un solo riepilogo per telefono**, e solo quando un articolo entra in una soglia nuova
(scaduto, oppure N giorni prima secondo le preferenze del telefono, di base 30 e 7). Il giorno dopo non ripete.
I telefoni con token non più valido vengono rimossi. Nel log non compaiono mai token, codici di famiglia o credenziali.

### Configurazione delle notifiche (una volta sola)

**1. Chiave Web Push (VAPID)**
1. Console Firebase → ⚙️ **Impostazioni progetto** → scheda **Cloud Messaging**.
2. Controlla che **API Firebase Cloud Messaging (V1)** risulti *Attivata*. Se è disattivata: menu ⋮ accanto → *Gestisci API in Google Cloud Console* → **Abilita**.
3. In fondo, **Configurazione web → Certificati push web** → **Genera coppia di chiavi**. Copia la **chiave pubblica** (inizia di solito con `B…`).
4. Su GitHub apri `config.js` → matita ✏️ → incolla la chiave tra le virgolette di `vapidKey: ""` → **Commit changes**.
   La chiave pubblica non è segreta; quella privata non serve e resta in Firebase.

**2. Account di servizio dedicato (solo i permessi necessari)**
1. Apri <https://console.cloud.google.com/iam-admin/serviceaccounts?project=apparecchio> con lo stesso account Google di Firebase.
2. **+ Crea account di servizio** → nome `notifiche-emergenza` → **Crea e continua**.
3. Ruoli: aggiungi **Utente Cloud Datastore** (*Cloud Datastore User*) e **Amministratore Firebase Cloud Messaging** (*Firebase Cloud Messaging Admin*) → **Continua** → **Fine**.
4. Apri l'account appena creato → scheda **Chiavi** → **Aggiungi chiave** → **Crea nuova chiave** → **JSON** → **Crea**. Si scarica un file `.json`.

Non usare la chiave di "Firebase Admin SDK" da *Impostazioni progetto → Account di servizio*: funziona, ma dà accesso a tutto il progetto.

**3. Secret su GitHub**
1. <https://github.com/snovelli84/apparecchio/settings/secrets/actions> → **New repository secret**.
2. Nome: `FIREBASE_SERVICE_ACCOUNT`. Valore: apri il file `.json` scaricato e incolla **tutto** il contenuto → **Add secret**.
3. **Cancella il file `.json`** dal computer (e svuota il cestino). Non metterlo mai nel repository: `.gitignore` lo esclude, ma meglio non averlo in giro.

**4. Regole di Firestore**
Non serve cambiarle: le nuove raccolte stanno sotto `famiglie/{codice}/`, già coperte dalla regola esistente (`firestore.rules`).
Controlla solo che in Firestore → **Regole** ci sia lo stesso testo di `firestore.rules`.

**5. App Check**
In Firebase → **App Check** → scheda **API**, *Cloud Firestore* non deve essere su "Applicata" (oggi non lo è: l'app salva già i dati senza App Check).
La registrazione dei telefoni per le notifiche (`getToken`) non è soggetta ad App Check.

**6. Su ogni telefono**
1. iPhone: serve iOS 16.4 o successivo. In Safari apri l'app → **Condividi** → **Aggiungi alla schermata Home** → apri APParecchio **dall'icona**.
   Android: va bene Chrome (meglio ancora con *Installa app*).
2. Sezione **Emergenza** → in fondo, riquadro **Notifiche**: scrivi il tuo nome, scegli gli avvisi → **Attiva notifiche** → **Consenti**.
3. **Invia notifica di prova**: deve comparire subito una notifica sul telefono.

**7. Prova del workflow**
1. GitHub → **Actions** → **notifiche-emergenza** → **Run workflow** → spunta *Invia comunque una notifica di prova* → **Run workflow**.
2. Dopo circa un minuto apri l'esecuzione: nel passaggio *Invia le notifiche* trovi una riga per telefono (`inviata — …`), e la notifica arriva sui telefoni.
3. Da lì in poi parte da solo ogni giorno alle 17:00 UTC (le 18 in inverno, le 19 con l'ora legale; GitHub può ritardare di qualche decina di minuti).

### Se qualcosa non va

| Sintomo | Causa probabile |
|---|---|
| "Firebase ha rifiutato la registrazione del telefono" | chiave VAPID sbagliata in `config.js`, oppure la chiave API del browser è limitata: Google Cloud → *API e servizi → Credenziali* → *Browser key (auto created by Firebase)* → nelle restrizioni API aggiungi *Firebase Cloud Messaging API*, *FCM Registration API* e *Firebase Installations API* |
| Workflow con l'avviso "Manca il secret" | il secret `FIREBASE_SERVICE_ACCOUNT` non è stato creato o ha un altro nome |
| Workflow con `PERMISSION_DENIED` | all'account di servizio manca uno dei due ruoli del passo 2 |
| La notifica di prova locale funziona, quella del workflow no | su iPhone l'app deve essere aperta dall'icona sulla Home; controlla anche che il telefono sia in `emergenza_dispositivi` |
| Nessuna notifica per giorni | è normale se nessun articolo è entrato in una nuova soglia: lo script avvisa solo delle novità |

### Il limite dei 60 giorni
Nei repository pubblici GitHub sospende i workflow programmati dopo 60 giorni senza commit.
Il workflow si riattiva da solo il 1° di ogni mese, mentre è ancora attivo, così il conteggio riparte sempre.
