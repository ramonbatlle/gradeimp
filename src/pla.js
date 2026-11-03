globalThis.GradeImp = globalThis.GradeImp || {};

(() => {
  const { buscarAlumnes } = GradeImp.noms;
  const { notaAmbFormat } = GradeImp.taula;

  const crearElement = (entrada, cerca, repeticions, sobreescriure) => {
    const { t, idioma } = GradeImp;
    const { candidats, parcial } = cerca;
    const element = { ...entrada, alumne: null, estat: 'error', detall: '' };
    const omet = (detall) => ({ ...element, estat: 'omesa', detall });
    const errada = (detall) => ({ ...element, detall });

    if (!entrada.nom) return errada(t('senseNom'));
    if (!entrada.notaEscrita) return omet(t('senseNota'));
    if (entrada.nota === null) return errada(t('notaNoValida', entrada.notaEscrita));
    if (!candidats.length) return errada(t('noTrobat'));
    if (candidats.length > 1) return errada(t('ambigu', candidats.map((alumne) => alumne.nom).join(', ')));

    const alumne = candidats[0];
    if (repeticions.get(alumne.id) > 1) return errada(t('duplicat', alumne.nom));

    Object.assign(element, { alumne, notaAnterior: alumne.nota, parcial });
    const anterior = notaAmbFormat(alumne.nota, idioma);

    if (alumne.maxim === null) return errada(t('senseMaxim'));
    if (entrada.nota > alumne.maxim) return errada(t('superaMaxim', alumne.maxim));
    if (alumne.nota === entrada.nota) return omet(t('mateixaNota'));
    if (alumne.nota !== null && !sobreescriure) {
      return omet(t(alumne.retornada ? 'retornadaOmesa' : 'jaTeNota', anterior));
    }

    element.estat = 'ok';
    element.retornada = alumne.retornada;
    if (alumne.retornada) element.detall = t('retornadaSubstitueix', anterior);
    else element.detall = alumne.nota === null ? t('aPunt') : t('substitueix', anterior);
    return element;
  };

  const crearPla = (entrades, alumnes, sobreescriure) => {
    const cerques = entrades.map((entrada) => buscarAlumnes(entrada.nom, alumnes));

    const repeticions = new Map();
    cerques.forEach(({ candidats }) => {
      if (candidats.length === 1) {
        const { id } = candidats[0];
        repeticions.set(id, (repeticions.get(id) || 0) + 1);
      }
    });

    return {
      elements: entrades.map((entrada, posicio) =>
        crearElement(entrada, cerques[posicio], repeticions, sobreescriure)),
      absents: alumnes.filter((alumne) => !repeticions.has(alumne.id)),
    };
  };

  GradeImp.pla = { crearPla };
})();
