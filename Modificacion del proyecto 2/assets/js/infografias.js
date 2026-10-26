/* ==========================================================================
   CTN · Visor de infografías (ventana ampliada con flechas)
   --------------------------------------------------------------------------
   Cada especialidad puede tener una lista de miniaturas (.infografia-item) y
   una ventana .modal-infografias con una <figure class="infografia-visor"> por
   infografía. Al tocar una miniatura se abre la ventana en esa imagen; los
   botones Anterior/Siguiente y las flechas del teclado pasan a las demás.

   Para agregar una infografía: poner su <li> en la lista y su <figure> en la
   ventana, en el mismo orden (el número data-indice de la miniatura es su
   posición, empezando en 0).
   ========================================================================== */
(function () {
  'use strict';

  document.querySelectorAll('.modal-infografias').forEach(function (ventana) {
    var figuras = ventana.querySelectorAll('.infografia-visor');
    if (!figuras.length) { return; }
    var cuerpo = ventana.querySelector('.modal-body');
    var titulo = ventana.querySelector('.modal-title');
    var contador = ventana.querySelector('.infografia-contador');
    var enlace = ventana.querySelector('.infografia-abrir');
    var anterior = ventana.querySelector('.infografia-anterior');
    var siguiente = ventana.querySelector('.infografia-siguiente');
    var tituloBase = titulo ? titulo.textContent : '';
    var actual = 0;

    function mostrar(indice) {
      actual = (indice + figuras.length) % figuras.length;
      Array.prototype.forEach.call(figuras, function (f, i) { f.hidden = i !== actual; });
      var imagen = figuras[actual].querySelector('img');
      var pie = figuras[actual].querySelector('figcaption');
      if (contador) { contador.textContent = (actual + 1) + ' de ' + figuras.length; }
      if (enlace) { enlace.href = imagen.getAttribute('src'); }
      if (titulo && pie) { titulo.textContent = pie.textContent.split('. ')[0]; }
      if (cuerpo) { cuerpo.scrollTop = 0; }
    }

    ventana.addEventListener('show.bs.modal', function (evento) {
      var boton = evento.relatedTarget;
      var indice = boton ? parseInt(boton.getAttribute('data-indice'), 10) : 0;
      mostrar(isNaN(indice) ? 0 : indice);
    });
    ventana.addEventListener('hidden.bs.modal', function () { if (titulo) { titulo.textContent = tituloBase; } });

    if (anterior) { anterior.addEventListener('click', function () { mostrar(actual - 1); }); }
    if (siguiente) { siguiente.addEventListener('click', function () { mostrar(actual + 1); }); }
    ventana.addEventListener('keydown', function (evento) {
      if (evento.key === 'ArrowLeft') { mostrar(actual - 1); evento.preventDefault(); }
      if (evento.key === 'ArrowRight') { mostrar(actual + 1); evento.preventDefault(); }
    });
  });
})();
