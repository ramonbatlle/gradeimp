globalThis.GradeImp = globalThis.GradeImp || {};

(() => {
  const { t } = GradeImp;
  const { crear } = GradeImp.dom;
  const { llegirTextEnganxat, lletraDeColumna, proposarRols, rolsInicials } = GradeImp.taula;

  const FILES_MINIMES = 6;
  const COLUMNES_MINIMES = 2;

  const crearGraella = ({ alCanviar, alumnes }) => {
    let files = [];
    let rols = rolsInicials();
    let estats = new Map();
    let bloquejada = false;

    const element = crear('div', 'gi-graella');
    const contenidor = crear('div', 'gi-graella-taula');
    const etiquetaCapcalera = crear('label', 'gi-opcio');
    const casellaCapcalera = crear('input');
    casellaCapcalera.type = 'checkbox';
    etiquetaCapcalera.append(casellaCapcalera, t('filaCapcalera'));
    const pista = crear('div', 'gi-pista', t('pistaGraella'));
    element.append(pista, contenidor, etiquetaCapcalera);

    const estaBuida = () => !files.some((fila) => fila.some(Boolean));

    const actualitzarPista = () => {
      const buida = estaBuida();
      pista.classList.toggle('gi-amagada', !buida);
      const primerCamp = contenidor.querySelector('input[data-fila="0"][data-columna="0"]');
      if (primerCamp) primerCamp.placeholder = buida ? t('enganxaAqui') : '';
    };

    const ajustarMida = () => {
      const columnes = Math.max(COLUMNES_MINIMES, ...files.map((fila) => fila.length));
      files.forEach((fila) => {
        while (fila.length < columnes) fila.push('');
      });
      const ultimaPlena = files.reduce((ultima, fila, posicio) => (fila.some(Boolean) ? posicio : ultima), -1);
      const total = Math.max(FILES_MINIMES, ultimaPlena + 2);
      files = files.slice(0, total);
      while (files.length < total) files.push(Array(columnes).fill(''));
    };

    const enfocar = (fila, columna) => {
      contenidor.querySelector(`input[data-fila="${fila}"][data-columna="${columna}"]`)?.focus();
    };

    const enganxar = (filaInicial, columnaInicial, text) => {
      const estavaBuida = estaBuida();
      llegirTextEnganxat(text).forEach((caselles, despl) => {
        const numeroFila = filaInicial + despl;
        while (files.length <= numeroFila) files.push([]);
        caselles.forEach((valor, desplColumna) => {
          const columna = columnaInicial + desplColumna;
          while (files[numeroFila].length <= columna) files[numeroFila].push('');
          files[numeroFila][columna] = valor;
        });
      });
      ajustarMida();
      if (estavaBuida) rols = proposarRols(files, alumnes());
      alCanviar();
      dibuixar();
    };

    const crearSelectorDeRol = (columna) => {
      const selector = crear('select');
      [['cap', t('rolCap')], ['nom', t('rolNom')], ['nota', t('rolNota')]].forEach(([valor, text]) => {
        const opcio = crear('option', '', `${lletraDeColumna(columna)}: ${text}`);
        opcio.value = valor;
        selector.append(opcio);
      });
      if (rols.columnaNota === columna) selector.value = 'nota';
      else selector.value = rols.columnesNom.has(columna) ? 'nom' : 'cap';

      selector.addEventListener('change', () => {
        rols.columnesNom.delete(columna);
        if (rols.columnaNota === columna) rols.columnaNota = null;
        if (selector.value === 'nom') rols.columnesNom.add(columna);
        if (selector.value === 'nota') rols.columnaNota = columna;
        alCanviar();
        dibuixar();
      });
      return selector;
    };

    const crearCamp = (numeroFila, columna, esCapcalera) => {
      const camp = crear('input', rols.columnesNom.has(columna) ? 'gi-camp gi-camp-nom' : 'gi-camp');
      if (esCapcalera) camp.classList.add('gi-camp-capcalera');
      camp.type = 'text';
      camp.value = files[numeroFila][columna];
      camp.dataset.fila = numeroFila;
      camp.dataset.columna = columna;

      camp.addEventListener('input', () => {
        files[numeroFila][columna] = camp.value;
        actualitzarPista();
        alCanviar();
        if (numeroFila === files.length - 1 && camp.value) {
          dibuixar();
          enfocar(numeroFila, columna);
        }
      });
      camp.addEventListener('paste', (event) => {
        const text = event.clipboardData?.getData('text/plain') ?? '';
        if (!/[\t\n]/.test(text.trim())) return;
        event.preventDefault();
        enganxar(numeroFila, columna, text);
      });
      camp.addEventListener('keydown', (event) => {
        const salt = { Enter: 1, ArrowDown: 1, ArrowUp: -1 }[event.key];
        if (!salt) return;
        event.preventDefault();
        enfocar(numeroFila + salt, columna);
      });
      return camp;
    };

    const dibuixar = () => {
      ajustarMida();
      const totalColumnes = files[0].length;
      const primeraPlena = files.findIndex((fila) => fila.some(Boolean));

      const capcalera = crear('tr');
      for (let columna = 0; columna < totalColumnes; columna++) {
        const cela = crear('th');
        cela.append(crearSelectorDeRol(columna));
        capcalera.append(cela);
      }
      capcalera.append(crear('th', 'gi-columna-estat', t('columnaEstat')));

      const cos = crear('tbody');
      files.forEach((fila, numeroFila) => {
        const filaHtml = crear('tr');
        filaHtml.dataset.fila = numeroFila;
        fila.forEach((_, columna) => {
          const cela = crear('td');
          cela.append(crearCamp(numeroFila, columna, rols.teCapcalera && numeroFila === primeraPlena));
          filaHtml.append(cela);
        });
        filaHtml.append(crear('td', 'gi-estat'));
        cos.append(filaHtml);
      });

      const cap = crear('thead');
      cap.append(capcalera);
      const taula = crear('table');
      taula.append(cap, cos);
      contenidor.replaceChildren(taula);

      casellaCapcalera.checked = rols.teCapcalera;
      actualitzarPista();
      pintarEstats();
      bloquejar(bloquejada);
    };

    const pintarEstats = () => {
      contenidor.querySelectorAll('tbody tr').forEach((fila) => {
        const estat = estats.get(Number(fila.dataset.fila));
        fila.className = estat ? `gi-fila-${estat.tipus}` : '';
        fila.querySelector('.gi-estat').textContent = estat?.text ?? '';
      });
    };

    const mostrarEstats = (nousEstats) => {
      estats = nousEstats;
      pintarEstats();
    };

    const bloquejar = (valor) => {
      bloquejada = valor;
      casellaCapcalera.disabled = valor;
      contenidor.querySelectorAll('input, select').forEach((control) => { control.disabled = valor; });
    };

    const carregar = (novesFiles, nousRols = rolsInicials()) => {
      files = novesFiles;
      rols = nousRols;
      estats = new Map();
      dibuixar();
    };

    casellaCapcalera.addEventListener('change', () => {
      rols.teCapcalera = casellaCapcalera.checked;
      alCanviar();
      dibuixar();
    });

    carregar([]);

    return {
      element,
      carregar,
      bloquejar,
      estaBuida,
      mostrarEstats,
      obtenirFiles: () => files.map((fila) => [...fila]),
      obtenirRols: () => rols,
    };
  };

  GradeImp.graella = { crearGraella };
})();
