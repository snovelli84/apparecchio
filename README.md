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
| `manifest.webmanifest`, `sw.js`, `icone/` | icona e installazione sulla schermata Home |

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
