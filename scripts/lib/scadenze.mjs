// Calcolo delle scadenze del kit di emergenza: lo stesso dell'app (index.html → prossimaEm/statoEm).
// Le date sono stringhe "AAAA-MM-GG"; "oggi" è la data di Roma.

export const SOGLIE_DEFAULT = [30, 7];

export function oggiRoma(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
const ms = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
export const diffGiorni = (a, b) => Math.round((ms(a) - ms(b)) / 864e5);
export const addGiorni = (s, n) => new Date(ms(s) + n * 864e5).toISOString().slice(0, 10);
const eData = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Prossima scadenza effettiva: data di scadenza o prossimo controllo periodico, la più vicina. */
export function prossimaScadenza(a, oggi) {
  const c = [];
  if (eData(a.scadenza)) c.push({ data: a.scadenza, tipo: 'scadenza' });
  if (a.ricorrenza_giorni > 0) c.push({ data: eData(a.ultimo_controllo) ? addGiorni(a.ultimo_controllo, a.ricorrenza_giorni) : oggi, tipo: 'controllo' });
  c.sort((x, y) => (x.data < y.data ? -1 : x.data > y.data ? 1 : 0));
  return c[0] || { data: null, tipo: null };
}

export function soglieValide(dev) {
  const s = dev && dev.preferenze && Array.isArray(dev.preferenze.soglie) ? dev.preferenze.soglie : SOGLIE_DEFAULT;
  const v = [...new Set(s.map(Number).filter(n => Number.isInteger(n) && n > 0 && n <= 365))].sort((a, b) => b - a);
  return v.length ? v : SOGLIE_DEFAULT;
}

/** Soglia in cui si trova l'articolo: "scaduto", "s7", "s30"… oppure null. */
export function livello(a, oggi, soglie) {
  if (a.presente === false) return null;
  const p = prossimaScadenza(a, oggi);
  if (!p.data) return null;
  const g = diffGiorni(p.data, oggi);
  if (g < 0) return 'scaduto';
  const s = [...soglie].sort((x, y) => x - y).find(x => g <= x);
  return s != null ? 's' + s : null;
}
const rango = l => (l === 'scaduto' ? -1 : +String(l).slice(1));

/**
 * Confronta lo stato di oggi con l'ultima soglia già notificata a quel dispositivo.
 * Un articolo è "nuovo" solo quando entra in una soglia più urgente di quella già segnalata.
 * Gli articoli usciti da ogni soglia (sostituiti, controllati) vengono dimenticati, così potranno essere segnalati di nuovo.
 */
export function analizzaDispositivo(articoli, dev, oggi) {
  const soglie = soglieValide(dev);
  const prima = (dev && dev.notificati) || {};
  const dopo = {}, nuovi = [];
  let scaduti = 0, inScadenza = 0;
  for (const a of articoli) {
    const l = livello(a, oggi, soglie);
    if (!l) continue;
    if (l === 'scaduto') scaduti++; else inScadenza++;
    dopo[a.id] = l;
    const p = prima[a.id];
    if (!p || rango(l) < rango(p)) {
      const ps = prossimaScadenza(a, oggi);
      nuovi.push({ id: a.id, nome: a.nome, livello: l, giorni: diffGiorni(ps.data, oggi), tipo: ps.tipo });
    }
  }
  const ordina = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
  return { nuovi, notificati: dopo, cambiato: ordina(prima) !== ordina(dopo), scaduti, inScadenza };
}

/** Testo dell'unica notifica di riepilogo, es. "2 scaduti, 3 in scadenza: pile AA, tonno…". */
export function testoRiepilogo(nuovi) {
  const scad = nuovi.filter(x => x.livello === 'scaduto');
  const pross = nuovi.filter(x => x.livello !== 'scaduto').sort((a, b) => a.giorni - b.giorni);
  const parti = [];
  if (scad.length) parti.push(`${scad.length} ${scad.length === 1 ? 'scaduto' : 'scaduti'}`);
  if (pross.length) parti.push(`${pross.length} in scadenza`);
  const nomi = [...new Set([...scad, ...pross].map(x => x.nome))];
  const elenco = nomi.slice(0, 3).join(', ') + (nomi.length > 3 ? '…' : '');
  let body = `${parti.join(', ')}: ${elenco}`;
  if (body.length > 180) body = body.slice(0, 177) + '…';
  return { title: 'Kit emergenza', body };
}
