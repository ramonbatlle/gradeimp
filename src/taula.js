globalThis.GradeImp = globalThis.GradeImp || {};

(() => {
  const { paraules } = GradeImp.noms;

  const llegirNota = (text) => {
    const net = text.trim().replace(',', '.');
    return /^\d+(\.\d{1,2})?$/.test(net) ? Number(net) : null;
  };

  // Excel i Sheets copien les columnes separades per tabuladors.
  const llegirTextEnganxat = (text) =>
    text
      .replace(/^﻿/, '')
      .replace(/\r/g, '')
      .replace(/\n+$/, '')
      .split('\n')
      .map((linia) => linia.split('\t').map((casella) => casella.trim()));

  const lletraDeColumna = (posicio) => {
    let lletra = '';
    for (let n = posicio + 1; n > 0; n = Math.floor((n - 1) / 26)) {
      lletra = String.fromCharCode(65 + (n - 1) % 26) + lletra;
    }
    return lletra;
  };

  const rolsInicials = () => ({ columnesNom: new Set([0]), columnaNota: 1, teCapcalera: false });

  const proposarRols = (taula, alumnes) => {
    const files = taula.filter((fila) => fila.some(Boolean));
    if (!files.length) return rolsInicials();

    const totalColumnes = Math.max(...files.map((fila) => fila.length));
    const columnes = [...Array(totalColumnes).keys()];
    const conegudes = new Set(alumnes.flatMap((alumne) => paraules(alumne.nom)));
    const coincidencies = (casella) =>
      paraules(casella || '').filter((paraula) => conegudes.has(paraula)).length;

    const proporcio = (columna, llista, condicio) => {
      const plenes = llista.filter((fila) => fila[columna]);
      return plenes.length ? plenes.filter((fila) => condicio(fila[columna])).length / plenes.length : 0;
    };
    const esNumero = (casella) => llegirNota(casella) !== null;
    const columnesDeNotes = (llista) => columnes.filter((columna) => proporcio(columna, llista, esNumero) >= 0.5);

    // La primera fila pot ser una capçalera: mirem primer les de sota.
    let ambNotes = files.length > 1 ? columnesDeNotes(files.slice(1)) : [];
    if (!ambNotes.length) ambNotes = columnesDeNotes(files);

    const teCapcalera = files.length > 1 && ambNotes.length > 0
      && ambNotes.every((columna) => files[0][columna] && !esNumero(files[0][columna]))
      && !files[0].some((casella) => coincidencies(casella) >= 2);
    const dades = teCapcalera ? files.slice(1) : files;

    const senseNotes = columnes.filter((columna) => !ambNotes.includes(columna));
    let columnesNom = senseNotes.filter(
      (columna) => proporcio(columna, dades, (casella) => coincidencies(casella) >= 1) >= 0.5,
    );
    if (!columnesNom.length) {
      columnesNom = senseNotes.filter((columna) => dades.some((fila) => fila[columna])).slice(0, 1);
    }

    return {
      teCapcalera,
      columnesNom: new Set(columnesNom),
      columnaNota: ambNotes.length ? ambNotes[ambNotes.length - 1] : null,
    };
  };

  const extreureEntrades = (taula, rols) => {
    const primeraPlena = taula.findIndex((fila) => fila.some(Boolean));
    const columnesNom = [...rols.columnesNom].sort((a, b) => a - b);
    const entrades = [];

    taula.forEach((fila, numeroFila) => {
      if (!fila.some(Boolean) || (rols.teCapcalera && numeroFila === primeraPlena)) return;
      const notaEscrita = fila[rols.columnaNota] || '';
      entrades.push({
        numeroFila,
        nom: columnesNom.map((columna) => fila[columna] || '').filter(Boolean).join(' '),
        notaEscrita,
        nota: llegirNota(notaEscrita),
      });
    });
    return entrades;
  };

  // Primer, el separador de l'idioma de Classroom: en català, «7.6» pot acabar sent 76.
  const formesDeNota = (nota, idioma) => {
    const ambPunt = String(nota);
    if (!ambPunt.includes('.')) return [ambPunt];
    const ambComa = ambPunt.replace('.', ',');
    let usaComa = false;
    try {
      usaComa = new Intl.NumberFormat(idioma).format(1.5).includes(',');
    } catch (error) {
      // Idioma desconegut: es queda el punt.
    }
    return usaComa ? [ambComa, ambPunt] : [ambPunt, ambComa];
  };

  const notaAmbFormat = (nota, idioma) => (nota === null ? '' : formesDeNota(nota, idioma)[0]);

  GradeImp.taula = {
    llegirNota,
    llegirTextEnganxat,
    lletraDeColumna,
    rolsInicials,
    proposarRols,
    extreureEntrades,
    formesDeNota,
    notaAmbFormat,
  };
})();
