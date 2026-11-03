(() => {
  const { ID_ARREL, crearPanell } = GradeImp.panell;
  const { esPaginaDeEntregues, tascaActual } = GradeImp.classroom;

  let panell = null;

  // Classroom canvia de pàgina sense recarregar, i el panell no pot conservar
  // les notes de la tasca anterior.
  setInterval(() => {
    const arrel = document.getElementById(ID_ARREL);
    const fora = !esPaginaDeEntregues() || arrel?.dataset.tasca !== tascaActual();

    if (arrel && fora && !panell?.estaOcupat()) {
      arrel.remove();
      panell = null;
    }
    if (esPaginaDeEntregues() && !document.getElementById(ID_ARREL)) {
      panell = crearPanell();
      document.body.append(panell.arrel);
    }
  }, 1000);
})();
