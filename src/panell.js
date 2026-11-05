globalThis.GradeImp = globalThis.GradeImp || {};

(() => {
  const { t, idioma } = GradeImp;
  const { crear, crearLogo } = GradeImp.dom;
  const { cognomsPrimer } = GradeImp.noms;
  const { extreureEntrades, notaAmbFormat } = GradeImp.taula;
  const { crearPla } = GradeImp.pla;
  const { crearGraella } = GradeImp.graella;
  const {
    esperar, tascaActual, alumnesVisibles, carregarAlumnes,
    escriureNota, esborrarNota, tancarCampObert, notaActual, tascaSensePuntuacio,
  } = GradeImp.classroom;

  const ID_ARREL = 'gradeimp';
  const ERRORS_SEGUITS_MAXIMS = 3;
  const PAUSA_ENTRE_NOTES = 60;
  const WEB = 'https://www.ramonbatlle.com';

  const crearBoto = (text, classe = 'gi-boto') => {
    const boto = crear('button', classe, text);
    boto.type = 'button';
    return boto;
  };

  const crearCasella = (text) => {
    const etiqueta = crear('label', 'gi-opcio');
    const casella = crear('input');
    casella.type = 'checkbox';
    etiqueta.append(casella, text);
    return { etiqueta, casella };
  };

  const ordenarPerCognoms = (alumnes) =>
    alumnes
      .map((alumne) => ({ ...alumne, nomOrdenat: cognomsPrimer(alumne.nom) }))
      .sort((a, b) => a.nomOrdenat.localeCompare(b.nomOrdenat, idioma));

  const crearPanell = () => {
    let pla = [];
    let tascaDelPla = null;
    let absents = [];
    let enRevisio = false;
    let ocupat = false;
    let sensePuntuacio = false;

    const arrel = crear('div');
    arrel.id = ID_ARREL;
    arrel.dataset.tasca = tascaActual();

    const pestanya = crearBoto(t('obrir'), 'gi-pestanya');
    const panell = crear('div', 'gi-panell');

    const titol = crear('div', 'gi-titol');
    titol.append(crearLogo(28), crear('span', '', t('titol')));
    const botoTancar = crearBoto('×', 'gi-tancar');
    botoTancar.title = t('tancar');
    botoTancar.setAttribute('aria-label', t('tancar'));
    const capcalera = crear('div', 'gi-capcalera');
    capcalera.append(titol, botoTancar);

    const avisPuntuacio = crear('div', 'gi-avis', t('tascaSensePuntuacio'));
    const missatge = crear('div', 'gi-missatge');
    const llistaAbsents = crear('div', 'gi-absents');

    const netejarResultats = () => {
      pla = [];
      absents = [];
      enRevisio = false;
      missatge.textContent = '';
      llistaAbsents.replaceChildren();
      graella.mostrarEstats(new Map());
      actualitzarBotons();
    };

    const graella = crearGraella({ alCanviar: netejarResultats, alumnes: alumnesVisibles });
    const sobreescriure = crearCasella(t('sobreescriure'));

    const botoImportar = crearBoto(t('importar'), 'gi-boto gi-boto-principal');
    const botoMostrar = crearBoto(t('mostrarNotes'));
    const botoCopiar = crearBoto(t('menuCopiar'));
    const copiarTot = crearBoto(t('copiarTot'), 'gi-menu-opcio');
    const copiarNotes = crearBoto(t('copiarNotes'), 'gi-menu-opcio');
    const menuCopiar = crear('div', 'gi-menu');
    menuCopiar.append(copiarTot, copiarNotes);
    const grupCopiar = crear('div', 'gi-grup-copiar');
    grupCopiar.append(botoCopiar, menuCopiar);
    const botoBuidar = crearBoto(t('esborrarTaula'));
    const botoEsborrar = crearBoto(t('esborrarClassroom'), 'gi-boto gi-boto-perill');
    const accions = crear('div', 'gi-accions');
    accions.append(botoImportar, botoMostrar, grupCopiar, botoBuidar, botoEsborrar);

    const peu = crear('div', 'gi-peu', `${t('credit')} · `);
    const enllac = crear('a', '', 'www.ramonbatlle.com');
    enllac.href = WEB;
    enllac.target = '_blank';
    enllac.rel = 'noopener noreferrer';
    peu.append(enllac);

    panell.append(
      capcalera, avisPuntuacio, graella.element, sobreescriure.etiqueta,
      accions, missatge, llistaAbsents, peu,
    );
    arrel.append(panell, pestanya);

    function actualitzarBotons() {
      botoImportar.textContent = enRevisio ? t('continuar') : t('importar');
    }

    const marcarOcupat = (valor) => {
      ocupat = valor;
      const bloquejat = valor || sensePuntuacio;
      graella.bloquejar(bloquejat);
      sobreescriure.casella.disabled = bloquejat;
      [botoImportar, botoMostrar, botoCopiar, botoBuidar, botoEsborrar].forEach((boto) => { boto.disabled = bloquejat; });
    };

    const revisarPuntuacio = async () => {
      sensePuntuacio = await tascaSensePuntuacio();
      avisPuntuacio.classList.toggle('gi-visible', sensePuntuacio);
      panell.classList.toggle('gi-sense-puntuacio', sensePuntuacio);
      if (!ocupat) marcarOcupat(false);
      return sensePuntuacio;
    };

    const mostrarPla = () => {
      const estats = new Map(pla.map((element) => {
        const parcial = element.parcial ? `→ ${cognomsPrimer(element.alumne.nom)}: ` : '';
        const perRevisar = element.estat === 'ok' && (element.retornada ? 'avis' : element.parcial && 'parcial');
        const tipus = perRevisar || element.estat;
        return [element.numeroFila, { tipus, text: `${parcial}${element.detall}` }];
      }));
      graella.mostrarEstats(estats);

      llistaAbsents.replaceChildren();
      if (absents.length) {
        llistaAbsents.append(
          crear('strong', '', `${t('absents')} `),
          absents.map((alumne) => cognomsPrimer(alumne.nom)).join(' · '),
        );
      }
    };

    // Un error en una nota no atura la resta, però diversos de seguits indiquen un problema general.
    const processarCua = async (cua, accio, textFet, textProgres) => {
      let fetes = 0;
      let errors = 0;
      let seguits = 0;

      for (const element of cua) {
        missatge.textContent = textProgres(fetes + errors + 1, cua.length);
        try {
          await accio(element);
          Object.assign(element, { estat: 'feta', detall: textFet });
          fetes += 1;
          seguits = 0;
        } catch (error) {
          Object.assign(element, { estat: 'error', detall: error.message });
          errors += 1;
          seguits += 1;
        }
        mostrarPla();
        if (seguits >= ERRORS_SEGUITS_MAXIMS) break;
        await esperar(PAUSA_ENTRE_NOTES);
      }
      tancarCampObert();
      return { fetes, errors, aturat: seguits >= ERRORS_SEGUITS_MAXIMS };
    };

    const comprovar = async () => {
      marcarOcupat(true);
      missatge.textContent = t('comprovant');
      const alumnes = await carregarAlumnes();
      const entrades = extreureEntrades(graella.obtenirFiles(), graella.obtenirRols());
      const resultat = crearPla(entrades, alumnes, sobreescriure.casella.checked);
      pla = resultat.elements;
      absents = resultat.absents;
      tascaDelPla = tascaActual();
      mostrarPla();

      const compta = (estat) => pla.filter((element) => element.estat === estat).length;
      missatge.textContent = t('resum', alumnes.length, compta('ok'), compta('omesa'), compta('error'));
      marcarOcupat(false);
    };

    const escriurePla = async () => {
      const cua = pla.filter((element) => element.estat === 'ok');
      if (!cua.length) return;

      marcarOcupat(true);
      const { fetes, errors, aturat } = await processarCua(
        cua,
        escriureNota,
        t('escrita'),
        (actual, total) => t('important', actual, total),
      );

      // Comprovació final: una nota pot desaparèixer després de confirmar-se.
      await esperar(400);
      let perdudes = 0;
      cua.filter((element) => element.estat === 'feta').forEach((element) => {
        if (notaActual(element.alumne.id) !== element.nota) {
          Object.assign(element, { estat: 'error', detall: t('noMantinguda') });
          perdudes += 1;
        }
      });
      mostrarPla();

      const escrites = fetes - perdudes;
      const totalErrors = pla.filter((element) => element.estat === 'error').length;
      const pendents = cua.filter((element) => element.estat === 'ok').length;
      if (aturat) missatge.textContent = t('aturat', ERRORS_SEGUITS_MAXIMS, escrites, errors + perdudes, pendents);
      else missatge.textContent = t(totalErrors ? 'fetAmbErrors' : 'fet', escrites, totalErrors);
      marcarOcupat(false);
    };

    const textDeRevisio = () => {
      const llestos = pla.filter((element) => element.estat === 'ok');
      const parcials = llestos.filter((element) => element.parcial).length;
      const retornades = llestos.filter((element) => element.retornada).length;
      return [
        parcials && t('revisioParcials', parcials),
        retornades && t('revisioRetornades', retornades),
        t('revisioFinal'),
      ].filter(Boolean).join(' ');
    };

    const importar = async () => {
      if (await revisarPuntuacio()) return;

      if (enRevisio && tascaActual() === tascaDelPla) {
        enRevisio = false;
        actualitzarBotons();
        await escriurePla();
        return;
      }
      enRevisio = false;
      actualitzarBotons();

      if (graella.estaBuida()) {
        missatge.textContent = t('taulaBuida');
        return;
      }
      const rols = graella.obtenirRols();
      if (!rols.columnesNom.size || rols.columnaNota === null) {
        missatge.textContent = t('triaColumnes');
        return;
      }

      await comprovar();
      const llestos = pla.filter((element) => element.estat === 'ok');
      if (!llestos.length) return;

      if (llestos.some((element) => element.parcial || element.retornada)) {
        enRevisio = true;
        missatge.textContent = textDeRevisio();
        actualitzarBotons();
        return;
      }
      await escriurePla();
    };

    const mostrarNotes = async () => {
      if (!graella.estaBuida() && !window.confirm(t('confirmarSubstitucio'))) return;

      marcarOcupat(true);
      const alumnes = await carregarAlumnes();
      marcarOcupat(false);
      if (!alumnes.length) {
        missatge.textContent = t('capAlumne');
        return;
      }
      graella.carregar(ordenarPerCognoms(alumnes).map(({ nomOrdenat, nota }) => [nomOrdenat, notaAmbFormat(nota, idioma)]));
      netejarResultats();
    };

    const escriurePortaretalls = async (text, textFet) => {
      try {
        await navigator.clipboard.writeText(text);
        missatge.textContent = textFet;
      } catch (error) {
        missatge.textContent = t('errorCopiant');
      }
    };

    const copiarTaula = () => {
      const plenes = graella.obtenirFiles().filter((fila) => fila.some(Boolean));
      if (!plenes.length) {
        missatge.textContent = t('taulaBuida');
        return;
      }
      escriurePortaretalls(plenes.map((fila) => fila.join('\t')).join('\n'), t('taulaCopiada', plenes.length));
    };

    // Les notes buides es conserven perquè no es desquadrin les files en enganxar.
    const copiarColumnaDeNotes = () => {
      const rols = graella.obtenirRols();
      if (rols.columnaNota === null) {
        missatge.textContent = t('triaColumnes');
        return;
      }
      const entrades = extreureEntrades(graella.obtenirFiles(), rols);
      if (!entrades.length) {
        missatge.textContent = t('taulaBuida');
        return;
      }
      escriurePortaretalls(entrades.map((entrada) => entrada.notaEscrita).join('\n'), t('notesCopiades', entrades.length));
    };

    const esborrarDeClassroom = async () => {
      marcarOcupat(true);
      missatge.textContent = t('comprovant');
      const alumnes = await carregarAlumnes();
      marcarOcupat(false);
      missatge.textContent = enRevisio ? textDeRevisio() : '';

      const ambNota = ordenarPerCognoms(alumnes.filter((alumne) => alumne.nota !== null));
      if (!ambNota.length) {
        missatge.textContent = t('senseNotesPerEsborrar');
        return;
      }
      const retornades = ambNota.filter((alumne) => alumne.retornada).length;
      const pregunta = retornades
        ? t('confirmarEsborratRetornades', ambNota.length, retornades)
        : t('confirmarEsborrat', ambNota.length);
      if (!window.confirm(pregunta)) return;

      // Les notes queden a la taula: es poden copiar o tornar a importar.
      graella.carregar(ambNota.map(({ nomOrdenat, nota }) => [nomOrdenat, notaAmbFormat(nota, idioma)]));
      netejarResultats();
      pla = ambNota.map((alumne, numeroFila) => ({ alumne, numeroFila, estat: 'omesa', detall: '' }));
      mostrarPla();

      marcarOcupat(true);
      const { fetes, errors, aturat } = await processarCua(
        pla,
        ({ alumne }) => esborrarNota(alumne),
        t('esborrada'),
        (actual, total) => t('esborrant', actual, total),
      );
      if (aturat) missatge.textContent = t('esborratAturat', ERRORS_SEGUITS_MAXIMS, fetes, errors);
      else missatge.textContent = t(errors ? 'esborratAmbErrors' : 'esborratFet', fetes, errors);
      marcarOcupat(false);
    };

    const tancarMenu = () => menuCopiar.classList.remove('gi-visible');

    pestanya.addEventListener('click', () => {
      if (panell.classList.toggle('gi-visible')) revisarPuntuacio();
    });
    botoTancar.addEventListener('click', () => panell.classList.remove('gi-visible'));
    botoImportar.addEventListener('click', importar);
    botoMostrar.addEventListener('click', mostrarNotes);
    botoCopiar.addEventListener('click', () => menuCopiar.classList.toggle('gi-visible'));
    copiarTot.addEventListener('click', () => { tancarMenu(); copiarTaula(); });
    copiarNotes.addEventListener('click', () => { tancarMenu(); copiarColumnaDeNotes(); });
    panell.addEventListener('click', (event) => {
      if (!grupCopiar.contains(event.target)) tancarMenu();
    });
    botoBuidar.addEventListener('click', () => {
      graella.carregar([]);
      netejarResultats();
    });
    botoEsborrar.addEventListener('click', esborrarDeClassroom);
    sobreescriure.casella.addEventListener('change', netejarResultats);

    return { arrel, estaOcupat: () => ocupat };
  };

  GradeImp.panell = { ID_ARREL, crearPanell };
})();
