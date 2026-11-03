globalThis.GradeImp = globalThis.GradeImp || {};

(() => {
  const PARTICULES = new Set(['de', 'del', 'dels', 'la', 'les', 'el', 'els', 'i', 'y', 'd', 'l']);

  const paraules = (text) =>
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[,.;'’`\-]/g, ' ')
      .split(/\s+/)
      .filter((paraula) => paraula && !PARTICULES.has(paraula));

  const clauDeNom = (nom) => paraules(nom).sort().join(' ');

  const buscarAlumnes = (nom, alumnes) => {
    const clau = clauDeNom(nom);
    const exactes = alumnes.filter((alumne) => clauDeNom(alumne.nom) === clau);
    if (exactes.length) return { candidats: exactes, parcial: false };

    const buscades = paraules(nom);
    if (buscades.length < 2) return { candidats: [], parcial: false };

    const candidats = alumnes.filter((alumne) => {
      const delAlumne = paraules(alumne.nom);
      return buscades.every((paraula) => delAlumne.includes(paraula))
        || delAlumne.every((paraula) => buscades.includes(paraula));
    });
    return { candidats, parcial: true };
  };

  // Classroom només dona el nom complet: suposem fins a dos cognoms al final.
  const cognomsPrimer = (nom) => {
    const parts = nom.trim().split(/\s+/);
    if (parts.length < 2) return nom.trim();

    const esParticula = (part) => PARTICULES.has(part.toLowerCase().replace(/[’']$/, ''));
    let inici = parts.length;
    for (let cognom = 0; cognom < 2 && inici > 1; cognom++) {
      inici -= 1;
      while (inici > 1 && esParticula(parts[inici - 1])) inici -= 1;
    }
    return `${parts.slice(inici).join(' ')}, ${parts.slice(0, inici).join(' ')}`;
  };

  GradeImp.noms = { paraules, clauDeNom, buscarAlumnes, cognomsPrimer };
})();
