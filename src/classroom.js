globalThis.GradeImp = globalThis.GradeImp || {};

(() => {
  const { t, idioma } = GradeImp;
  const { clauDeNom } = GradeImp.noms;
  const { formesDeNota } = GradeImp.taula;

  const ESPERA_MAXIMA = 4000;
  const ESPERA_ENTRE_INTENTS = 1500;
  const ESPERA_PRIMER_CAMP = 800;

  const esperar = (ms) => new Promise((resol) => setTimeout(resol, ms));

  const esperarQue = async (condicio, temps = ESPERA_MAXIMA) => {
    const inici = Date.now();
    while (Date.now() - inici < temps) {
      const resultat = condicio();
      if (resultat) return resultat;
      await esperar(80);
    }
    return null;
  };

  const tascaActual = () => location.pathname.match(/\/c\/[^/]+\/a\/[^/]+/)?.[0] ?? null;
  const esPaginaDeEntregues = () => /\/c\/[^/]+\/a\/[^/]+\/submissions\//.test(location.pathname);

  // Classroom pot conservar amagades les files d'altres tasques ja visitades.
  const filesDeLaTasca = () => {
    const tasca = tascaActual();
    if (!tasca) return [];
    return [...document.querySelectorAll('tr[data-student-id]')].filter((fila) =>
      fila.getClientRects().length > 0
      && [...fila.querySelectorAll('a[href]')].some((enllac) => enllac.getAttribute('href').includes(`${tasca}/`)));
  };

  const trobarFila = (id) => filesDeLaTasca().find((fila) => fila.dataset.studentId === id) ?? null;
  const casellaDeNota = (fila) => fila.querySelector('td div[data-submission-id][tabindex]');
  const campDeNota = (id) => trobarFila(id)?.querySelector('td input[type="text"]') ?? null;
  const nomDeLaFila = (fila) =>
    fila.querySelector(`span[id$="-${fila.dataset.studentId}"]`)?.textContent.trim();

  const llegirCasella = (fila) => {
    const text = casellaDeNota(fila)?.textContent.replace(/ /g, ' ') ?? '';
    const trobat = text.match(/(\d+(?:[.,]\d+)?)?\s*\/\s*(\d+(?:[.,]\d+)?)/);
    const numero = (valor) => (valor ? Number(valor.replace(',', '.')) : null);
    return { nota: numero(trobat?.[1]), maxim: numero(trobat?.[2]) };
  };

  const estaRetornada = (fila) => {
    if (llegirCasella(fila).nota === null) return false;

    let anterior = fila.previousElementSibling;
    while (anterior && !anterior.dataset.bucket) anterior = anterior.previousElementSibling;
    if (anterior?.dataset.bucket === 'returned') return true;

    // Sense l'agrupació per estat: un esborrany porta etiqueta i una nota retornada, no.
    const etiqueta = casellaDeNota(fila)?.querySelector('[id$="-cell-label"]')?.lastElementChild;
    return Boolean(etiqueta) && etiqueta.textContent.trim() === '';
  };

  // Una casella buida vol dir que la pàgina encara carrega: sense dades no es pot decidir.
  const tascaTePuntuacio = () => {
    const files = filesDeLaTasca();
    if (files.some((fila) => llegirCasella(fila).maxim !== null)) return true;
    const carregada = files.length > 0 && files.every((fila) => casellaDeNota(fila)?.textContent.trim());
    return carregada ? false : null;
  };

  const tascaSensePuntuacio = async () => {
    await esperarQue(() => tascaTePuntuacio() !== null);
    return tascaTePuntuacio() === false;
  };

  const alumnesVisibles = () => {
    const alumnes = new Map();
    filesDeLaTasca().forEach((fila) => {
      const id = fila.dataset.studentId;
      const nom = nomDeLaFila(fila);
      if (nom && !alumnes.has(id)) {
        alumnes.set(id, { id, nom, ...llegirCasella(fila), retornada: estaRetornada(fila) });
      }
    });
    return [...alumnes.values()];
  };

  const carregarAlumnes = async () => {
    let anteriors = -1;
    for (let intent = 0; intent < 8; intent++) {
      const files = filesDeLaTasca();
      if (files.length === anteriors) break;
      anteriors = files.length;
      files[files.length - 1]?.scrollIntoView({ block: 'end' });
      await esperar(300);
    }
    return alumnesVisibles();
  };

  // Classroom carrega el codi del camp la primera vegada que s'obre,
  // i el que s'hi escriu abans es perd.
  let campPreparat = false;

  const introduirText = (camp, text) => {
    camp.focus();
    camp.select();
    const escrit = text ? document.execCommand('insertText', false, text) : document.execCommand('delete');
    if (escrit && camp.value === text) return;

    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(camp, text);
    camp.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  };

  const premerIntro = (camp) => {
    const tecla = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
    ['keydown', 'keypress', 'keyup'].forEach((tipus) => camp.dispatchEvent(new KeyboardEvent(tipus, tecla)));
  };

  const escriureACasella = async (id, text) => {
    const fila = trobarFila(id);
    if (!fila) throw new Error(t('filaAbsent'));
    fila.scrollIntoView({ block: 'center' });
    if (!campDeNota(id)) casellaDeNota(fila)?.click();

    const camp = await esperarQue(() => campDeNota(id));
    if (!camp) throw new Error(t('campNoObert'));
    if (!campPreparat) {
      await esperar(ESPERA_PRIMER_CAMP);
      campPreparat = true;
    }

    introduirText(camp, text);
    await esperar(30);
    premerIntro(camp);
    await esperar(30);
    if (camp.isConnected) camp.blur();
  };

  const notaConfirmada = (id, nota, temps) =>
    esperarQue(() => {
      const fila = trobarFila(id);
      return fila && !campDeNota(id) && llegirCasella(fila).nota === nota;
    }, temps);

  const escriureNota = async ({ alumne, nota, notaAnterior }) => {
    const { id, nom } = alumne;
    const fila = trobarFila(id);
    if (!fila) throw new Error(t('filaAbsent'));
    if (clauDeNom(nomDeLaFila(fila) ?? '') !== clauDeNom(nom)) throw new Error(t('nomCanviat'));

    // Si la primera escriptura es perd, cal repetir-la abans de provar l'altre separador.
    const formes = formesDeNota(nota, idioma);
    const intents = [formes[0], ...formes];
    for (const [posicio, text] of intents.entries()) {
      await escriureACasella(id, text);
      const esUltim = posicio === intents.length - 1;
      if (await notaConfirmada(id, nota, esUltim ? ESPERA_MAXIMA : ESPERA_ENTRE_INTENTS)) return;
    }

    // Un separador erroni pot deixar un 76 en lloc d'un 7,6: es restaura la casella.
    const original = notaAnterior === null ? '' : formesDeNota(notaAnterior, idioma)[0];
    await escriureACasella(id, original);
    if (await notaConfirmada(id, notaAnterior, ESPERA_ENTRE_INTENTS)) throw new Error(t('restaurada'));

    const final = llegirCasella(trobarFila(id)).nota;
    throw new Error(t('revisaAMa', final === null ? t('sensePuntuar') : final));
  };

  const esborrarNota = async ({ id }) => {
    await escriureACasella(id, '');
    if (!await notaConfirmada(id, null, ESPERA_MAXIMA)) throw new Error(t('noEsborrada'));
  };

  // Intro deixa obert el camp de l'alumne següent.
  const tancarCampObert = () => {
    filesDeLaTasca().forEach((fila) => fila.querySelector('td input[type="text"]')?.blur());
  };

  const notaActual = (id) => {
    const fila = trobarFila(id);
    return fila ? llegirCasella(fila).nota : undefined;
  };

  GradeImp.classroom = {
    esperar,
    tascaActual,
    esPaginaDeEntregues,
    tascaSensePuntuacio,
    alumnesVisibles,
    carregarAlumnes,
    escriureNota,
    esborrarNota,
    tancarCampObert,
    notaActual,
  };
})();
