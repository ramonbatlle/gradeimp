const test = require('node:test');
const assert = require('node:assert');

require('../src/noms.js');
require('../src/taula.js');
GradeImp.idioma = 'ca';
GradeImp.t = (clau, ...valors) => [clau, ...valors].join(':');
require('../src/pla.js');
const { crearPla } = GradeImp.pla;

const alumne = (id, nom, nota = null, retornada = false) => ({ id, nom, nota, maxim: 10, retornada });
const entrada = (nom, notaEscrita) => ({
  nom,
  notaEscrita,
  numeroFila: 0,
  nota: GradeImp.taula.llegirNota(notaEscrita),
});
const estat = (nom, nota, alumnes, sobreescriure = false) =>
  crearPla([entrada(nom, nota)], alumnes, sobreescriure).elements[0];

test('una nota vàlida queda a punt', () => {
  assert.strictEqual(estat('Anna Prova', '7,5', [alumne('1', 'Anna Prova')]).estat, 'ok');
});

test('no sobreescriu sense permís', () => {
  assert.strictEqual(estat('Anna Prova', '7', [alumne('1', 'Anna Prova', 5)]).estat, 'omesa');
  assert.strictEqual(estat('Anna Prova', '7', [alumne('1', 'Anna Prova', 5)], true).estat, 'ok');
});

test('marca les notes retornades que canviaran', () => {
  assert.strictEqual(estat('Anna Prova', '7', [alumne('1', 'Anna Prova', 5, true)], true).retornada, true);
});

test('rebutja notes per sobre del màxim, alumnes desconeguts i ambigüitats', () => {
  const alumnes = [alumne('1', 'Maria Garcia Puig'), alumne('2', 'Maria Garcia Soler')];
  assert.strictEqual(estat('Maria Garcia Puig', '11', alumnes).estat, 'error');
  assert.strictEqual(estat('Cap Alumne', '5', alumnes).estat, 'error');
  assert.strictEqual(estat('Maria Garcia', '5', alumnes).estat, 'error');
});

test('dues línies no poden apuntar al mateix alumne', () => {
  const { elements } = crearPla(
    [entrada('Anna Prova', '5'), entrada('Prova Anna', '6')],
    [alumne('1', 'Anna Prova')],
    false,
  );
  assert.ok(elements.every((element) => element.estat === 'error'));
});

test('llista els alumnes que no surten al full', () => {
  const { absents } = crearPla([entrada('Anna Prova', '5')], [alumne('1', 'Anna Prova'), alumne('2', 'Bernat Dos')], false);
  assert.deepStrictEqual(absents.map(({ id }) => id), ['2']);
});
