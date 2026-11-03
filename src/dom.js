globalThis.GradeImp = globalThis.GradeImp || {};

(() => {
  const crear = (etiqueta, classe = '', text = '') => {
    const element = document.createElement(etiqueta);
    if (classe) element.className = classe;
    if (text) element.textContent = text;
    return element;
  };

  const crearLogo = (mida) => {
    const espai = 'http://www.w3.org/2000/svg';
    const logo = document.createElementNS(espai, 'svg');
    logo.setAttribute('viewBox', '0 0 128 128');
    logo.setAttribute('width', mida);
    logo.setAttribute('height', mida);
    logo.setAttribute('aria-hidden', 'true');

    [
      ['rect', { width: 128, height: 128, rx: 28, fill: '#174EA6' }],
      ['rect', { x: 50, y: 22, width: 60, height: 84, rx: 8, fill: '#fff' }],
      ['rect', { x: 50, y: 50, width: 60, height: 28, fill: '#F9AB00' }],
      ['path', { d: 'M50 50H110M50 78H110M80 22V50M80 78V106', stroke: '#174EA6', 'stroke-width': 5 }],
      ['path', { d: 'M12 64H38', stroke: '#fff', 'stroke-width': 14, 'stroke-linecap': 'round' }],
      ['path', { d: 'M32 42L58 64L32 86Z', fill: '#fff' }],
    ].forEach(([etiqueta, atributs]) => {
      const forma = document.createElementNS(espai, etiqueta);
      Object.entries(atributs).forEach(([nom, valor]) => forma.setAttribute(nom, valor));
      logo.append(forma);
    });
    return logo;
  };

  GradeImp.dom = { crear, crearLogo };
})();
