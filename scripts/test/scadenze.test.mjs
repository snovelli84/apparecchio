import { test } from 'node:test';
import assert from 'node:assert/strict';
import { oggiRoma, prossimaScadenza, livello, analizzaDispositivo, testoRiepilogo } from '../lib/scadenze.mjs';

const OGGI = '2026-11-17';
const art = (id, extra) => ({ id, nome: id, presente: true, ...extra });

test('data di Roma', () => {
  assert.equal(oggiRoma(new Date('2026-11-17T23:30:00Z')), '2026-11-18');
  assert.equal(oggiRoma(new Date('2026-07-01T21:59:00Z')), '2026-07-01');
});

test('prossima scadenza: la più vicina tra scadenza e controllo', () => {
  assert.deepEqual(prossimaScadenza(art('a', { scadenza: '2027-01-31' }), OGGI), { data: '2027-01-31', tipo: 'scadenza' });
  assert.deepEqual(prossimaScadenza(art('b', { ricorrenza_giorni: 90, ultimo_controllo: '2026-10-01' }), OGGI), { data: '2026-12-30', tipo: 'controllo' });
  assert.deepEqual(prossimaScadenza(art('c', { scadenza: '2026-12-01', ricorrenza_giorni: 90, ultimo_controllo: '2026-10-01' }), OGGI).data, '2026-12-01');
  assert.equal(prossimaScadenza(art('d', {}), OGGI).data, null);
  assert.equal(prossimaScadenza(art('e', { ricorrenza_giorni: 180 }), OGGI).data, OGGI, 'controllo mai fatto: da fare oggi');
});

test('livelli e soglie', () => {
  const s = [30, 7];
  assert.equal(livello(art('a', { scadenza: '2026-11-16' }), OGGI, s), 'scaduto');
  assert.equal(livello(art('a', { scadenza: '2026-11-17' }), OGGI, s), 's7');
  assert.equal(livello(art('a', { scadenza: '2026-11-24' }), OGGI, s), 's7');
  assert.equal(livello(art('a', { scadenza: '2026-11-25' }), OGGI, s), 's30');
  assert.equal(livello(art('a', { scadenza: '2026-12-17' }), OGGI, s), 's30');
  assert.equal(livello(art('a', { scadenza: '2026-12-18' }), OGGI, s), null);
  assert.equal(livello(art('a', { scadenza: '2026-11-01', presente: false }), OGGI, s), null, 'da comprare: niente avvisi');
});

test('niente doppioni nei giorni successivi, nuova notifica al cambio di soglia', () => {
  const articoli = [art('pile', { scadenza: '2026-12-10' }), art('tonno', { scadenza: '2026-11-10' })];
  let dev = { token: 'x', preferenze: { soglie: [30, 7] } };
  let r = analizzaDispositivo(articoli, dev, OGGI);
  assert.deepEqual(r.nuovi.map(x => x.id).sort(), ['pile', 'tonno']);
  dev = { ...dev, notificati: r.notificati };
  r = analizzaDispositivo(articoli, dev, '2026-11-18');
  assert.equal(r.nuovi.length, 0, 'il giorno dopo non si ripete');
  r = analizzaDispositivo(articoli, dev, '2026-12-03');
  assert.deepEqual(r.nuovi.map(x => [x.id, x.livello]), [['pile', 's7']], 'entra nella soglia dei 7 giorni');
  dev = { ...dev, notificati: r.notificati };
  r = analizzaDispositivo(articoli, dev, '2026-12-11');
  assert.deepEqual(r.nuovi.map(x => [x.id, x.livello]), [['pile', 'scaduto']]);
});

test('articolo sostituito: si dimentica e potrà essere segnalato di nuovo', () => {
  const dev = { notificati: { tonno: 'scaduto' } };
  const r = analizzaDispositivo([art('tonno', { scadenza: '2028-03-31' })], dev, OGGI);
  assert.deepEqual(r.notificati, {});
  assert.equal(r.cambiato, true);
  assert.equal(r.nuovi.length, 0);
});

test('soglie personalizzate e non valide', () => {
  const a = [art('a', { scadenza: '2026-11-20' })];
  assert.equal(analizzaDispositivo(a, { preferenze: { soglie: [60, 3] } }, OGGI).notificati.a, 's3');
  assert.equal(analizzaDispositivo([art('b', { scadenza: '2026-12-20' })], { preferenze: { soglie: [60, 3] } }, OGGI).notificati.b, 's60');
  assert.equal(analizzaDispositivo(a, { preferenze: { soglie: ['x', -1] } }, OGGI).notificati.a, 's7', 'torna alle soglie predefinite');
});

test('testo del riepilogo', () => {
  const t = testoRiepilogo([
    { nome: 'Tonno', livello: 'scaduto', giorni: -3 },
    { nome: 'Pile AA', livello: 's30', giorni: 20 },
    { nome: 'Powerbank', livello: 's7', giorni: 5 },
    { nome: 'Powerbank', livello: 's7', giorni: 5 },
    { nome: 'Gallette', livello: 's30', giorni: 25 },
  ]);
  assert.equal(t.title, 'Kit emergenza');
  assert.equal(t.body, '1 scaduto, 4 in scadenza: Tonno, Powerbank, Pile AA…');
});
