const test = require('node:test');
const assert = require('node:assert');

require('../src/noms.js');
const { buscarAlumnes, cognomsPrimer, clauDeNom } = GradeImp.noms;

const alumnes = [
  { id: '1', nom: 'Anna Prova Uno' },
  { id: '2', nom: 'Maria Garcia Puig' },
  { id: '3', nom: 'Maria Garcia Soler' },
  { id: '4', nom: 'Bernat de la Torre Dos' },
];

test('ignora ordre, accents, majúscules i partícules', () => {
  assert.strictEqual(clauDeNom('PROVÁ UNO, Anna'), clauDeNom('Anna Prova Uno'));
  assert.strictEqual(clauDeNom('Bernat Torre Dos'), clauDeNom('Bernat de la Torre Dos'));
});

test('troba un alumne encara que falti un cognom', () => {
  const { candidats, parcial } = buscarAlumnes('Anna Prova', alumnes);
  assert.deepStrictEqual(candidats.map((alumne) => alumne.id), ['1']);
  assert.strictEqual(parcial, true);
});

test('el nom exacte té preferència sobre el parcial', () => {
  const { candidats, parcial } = buscarAlumnes('Soler Maria Garcia', alumnes);
  assert.deepStrictEqual(candidats.map((alumne) => alumne.id), ['3']);
  assert.strictEqual(parcial, false);
});

test('retorna tots els candidats si el nom és ambigu', () => {
  assert.strictEqual(buscarAlumnes('Maria Garcia', alumnes).candidats.length, 2);
});

test('no accepta una sola paraula', () => {
  assert.strictEqual(buscarAlumnes('Anna', alumnes).candidats.length, 0);
});

test('posa els cognoms davant', () => {
  assert.strictEqual(cognomsPrimer('Anna Prova Uno'), 'Prova Uno, Anna');
  assert.strictEqual(cognomsPrimer('Maria Rosa Puig Vidal'), 'Puig Vidal, Maria Rosa');
  assert.strictEqual(cognomsPrimer('Bernat de la Torre Dos'), 'de la Torre Dos, Bernat');
  assert.strictEqual(cognomsPrimer('Anna Puig i Vidal'), 'Puig i Vidal, Anna');
  assert.strictEqual(cognomsPrimer('Zoe'), 'Zoe');
});
