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
    var sinMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tituloBase = titulo ? titulo.textContent : '';
    var actual = 0;

    /* Ampliar / reducir con una transición suave. Por defecto la infografía se ve
       completa (sin zoom); al tocarla crece desde el centro de la ventana y el
       punto tocado se queda bajo el dedo/cursor (como en un mapa); al volver a
       tocarla se reduce de la misma manera. */
    var ampliada = false;
    var enCurso = null;

    function reiniciar() {
      if (enCurso) { enCurso.cancel(); enCurso = null; }
      ampliada = false;
      ventana.classList.remove('ampliada');
      if (cuerpo) { cuerpo.scrollTop = 0; cuerpo.scrollLeft = 0; }
    }

    function alternarZoom(punto) {
      if (enCurso || !cuerpo) { return; }
      var imagen = figuras[actual].querySelector('img');
      var si = !ampliada;
      var caja = cuerpo.getBoundingClientRect();
      var antes = imagen.getBoundingClientRect();
      var topeAntes = cuerpo.scrollTop;

      /* Se mide cómo queda la imagen al final (tamaño y lugar). */
      ampliada = si;
      ventana.classList.toggle('ampliada', si);
      var despues = imagen.getBoundingClientRect();
      var topeDespues = cuerpo.scrollTop;
      if (!si) {
        /* Para animar la reducción se mantiene el modo ampliado hasta terminar. */
        ventana.classList.add('ampliada');
        cuerpo.scrollTop = topeAntes;
      }

      var fx = punto ? Math.min(Math.max((punto.x - antes.left) / antes.width, 0), 1) : 0.5;
      var fy = punto ? Math.min(Math.max((punto.y - antes.top) / antes.height, 0), 1) : 0.5;
      function anclar() {
        if (!punto) { return; }
        var r = imagen.getBoundingClientRect();
        cuerpo.scrollTop += r.top - (punto.y - fy * r.height);
        cuerpo.scrollLeft += r.left - (punto.x - fx * r.width);
      }
      function terminar() {
        enCurso = null;
        if (si) { anclar(); return; }
        ventana.classList.remove('ampliada');
        cuerpo.scrollTop = 0; cuerpo.scrollLeft = 0;
      }

      if (sinMovimiento || !imagen.animate) { terminar(); return; }

      /* El margen superior evita el salto entre la imagen centrada (ajustada) y la
         pegada arriba (ampliada). */
      var margenAntes = si ? antes.top - caja.top + topeAntes : 0;
      var margenDespues = si ? 0 : despues.top - caja.top + topeDespues;
      enCurso = imagen.animate(
        [{ width: antes.width + 'px', maxHeight: antes.height + 'px', marginTop: margenAntes + 'px' },
         { width: despues.width + 'px', maxHeight: despues.height + 'px', marginTop: margenDespues + 'px' }],
        { duration: 280, easing: 'cubic-bezier(.2,.7,.2,1)' }
      );
      var animacion = enCurso;
      animacion.onfinish = terminar;
      animacion.oncancel = function () { enCurso = null; };
      (function cuadro() {
        if (enCurso !== animacion) { return; }
        anclar();
        window.requestAnimationFrame(cuadro);
      })();
    }

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
      reiniciar();
      mostrar(isNaN(indice) ? 0 : indice);
    });
    Array.prototype.forEach.call(ventana.querySelectorAll('.infografia-visor img'), function (img) {
      img.setAttribute('tabindex', '0');
      img.addEventListener('click', function (evento) { alternarZoom({ x: evento.clientX, y: evento.clientY }); });
      img.addEventListener('keydown', function (evento) {
        if (evento.key === 'Enter' || evento.key === ' ') {
          var r = img.getBoundingClientRect();
          alternarZoom({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
          evento.preventDefault();
        }
      });
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
