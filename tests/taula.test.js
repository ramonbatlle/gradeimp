const test = require('node:test');
const assert = require('node:assert');

require('../src/noms.js');
require('../src/taula.js');
const { llegirNota, llegirTextEnganxat, proposarRols, extreureEntrades, formesDeNota } = GradeImp.taula;

const alumnes = [{ nom: 'Anna Prova Uno' }, { nom: 'Bernat Torre Dos' }];

test('llegeix notes amb coma o punt', () => {
  assert.strictEqual(llegirNota('7,5'), 7.5);
  assert.strictEqual(llegirNota('7.5'), 7.5);
  assert.strictEqual(llegirNota('10'), 10);
  assert.strictEqual(llegirNota('Absent'), null);
  assert.strictEqual(llegirNota('7,555'), null);
});

test('separa el text enganxat en files i columnes', () => {
  assert.deepStrictEqual(llegirTextEnganxat('a\tb\r\nc\t d \r\n'), [['a', 'b'], ['c', 'd']]);
});

test('detecta capçalera i columnes en qualsevol ordre', () => {
  const taula = [
    ['Grup', 'Cognoms', 'Nom', 'Test 1', 'Test 2'],
    ['2A', 'Prova Uno', 'Anna', '9', '7,5'],
    ['2A', 'Torre Dos', 'Bernat', '4', '6'],
  ];
  const rols = proposarRols(taula, alumnes);
  assert.strictEqual(rols.teCapcalera, true);
  assert.deepStrictEqual([...rols.columnesNom], [1, 2]);
  assert.strictEqual(rols.columnaNota, 4);
});

test('una primera fila amb un alumne no és una capçalera', () => {
  const taula = [['Anna Prova Uno', 'Absent'], ['Bernat Torre Dos', '6']];
  assert.strictEqual(proposarRols(taula, alumnes).teCapcalera, false);
});

test('troba la nota encara que hi hagi caselles buides', () => {
  const rols = proposarRols([['Anna Prova', '9'], ['Bernat Torre', '']], alumnes);
  assert.strictEqual(rols.columnaNota, 1);
});

test('les entrades recorden la seva fila i salten la capçalera', () => {
  const rols = { columnesNom: new Set([0]), columnaNota: 1, teCapcalera: true };
  const entrades = extreureEntrades([['Nom', 'Nota'], ['', ''], ['Anna', '7,5']], rols);
  assert.deepStrictEqual(entrades, [{ numeroFila: 2, nom: 'Anna', notaEscrita: '7,5', nota: 7.5 }]);
});

test('escriu primer el separador de l\'idioma', () => {
  assert.deepStrictEqual(formesDeNota(7.6, 'ca'), ['7,6', '7.6']);
  assert.deepStrictEqual(formesDeNota(7.6, 'en'), ['7.6', '7,6']);
  assert.deepStrictEqual(formesDeNota(8, 'ca'), ['8']);
});
