(() => {
  const { ID_ARREL, crearPanell } = GradeImp.panell;
  const { esPaginaDeEntregues, tascaActual } = GradeImp.classroom;

  let panell = null;
  let comprovacionsFora = 0;

  // Classroom canvia de pàgina sense recarregar, i el panell no pot conservar
  // les notes de la tasca anterior. Si desapareix la llista, s'espera una comprovació més
  // abans de treure'l perquè Classroom la pot redibuixar un moment.
  setInterval(() => {
    const arrel = document.getElementById(ID_ARREL);
    const altraTasca = arrel?.dataset.tasca !== tascaActual();
    comprovacionsFora = esPaginaDeEntregues() ? 0 : comprovacionsFora + 1;

    if (arrel && (altraTasca || comprovacionsFora >= 2) && !panell?.estaOcupat()) {
      arrel.remove();
      panell = null;
    }
    if (esPaginaDeEntregues() && !document.getElementById(ID_ARREL)) {
      panell = crearPanell();
      document.body.append(panell.arrel);
    }
  }, 1000);
})();
