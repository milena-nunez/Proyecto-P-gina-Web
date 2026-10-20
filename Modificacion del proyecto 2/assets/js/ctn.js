/* ==========================================================================
   CTN · Comportamiento común a todas las páginas
   --------------------------------------------------------------------------
   No necesita jQuery. Hace tres cosas:
     1. Activa las animaciones de aparición (clase "wow") al hacer scroll.
     2. Carga el video de fondo del encabezado, solo si conviene.
     3. Marca el documento con la clase "js" (los estilos la usan).

   El menú desplegable y las ventanas emergentes los maneja Bootstrap.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');


  /* ---- 1. Animaciones de aparición ---------------------------------------
     Los elementos con clase "wow" (más "fadeIn", "fadeInUp" o "fadeInDown")
     reciben la clase "visible" cuando entran en pantalla. */
  function animarAlHacerScroll() {
    var elementos = document.querySelectorAll('.wow');
    if (!elementos.length) { return; }

    if (!('IntersectionObserver' in window)) {   // navegadores muy viejos: mostrar todo
      Array.prototype.forEach.call(elementos, function (el) { el.classList.add('visible'); });
      return;
    }
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visible');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15 });

    Array.prototype.forEach.call(elementos, function (el) { observador.observe(el); });
  }


  /* ---- 2. Video de fondo del encabezado ----------------------------------
     En el HTML el video solo tiene la ruta en "data-src". Aquí se decide si se
     descarga. No se carga en:
       - celulares / pantallas angostas (ahorra datos y batería),
       - conexiones lentas o con "ahorro de datos" activado,
       - personas que pidieron "reducir movimiento" en su dispositivo.
     En esos casos (o si el archivo no existe) se ve la foto de fondo. */
  function iniciarVideoDeFondo() {
    var video = document.querySelector('video.bgvideo[data-src]');
    if (!video) { return; }

    var conexion = navigator.connection || {};
    var conexionLenta = conexion.saveData === true || /(^|-)2g$/.test(conexion.effectiveType || '');
    var menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pantallaAngosta = window.matchMedia('(max-width: 767px)').matches;
    if (conexionLenta || menosMovimiento || pantallaAngosta) { return; }

    var fuente = document.createElement('source');
    fuente.src = video.getAttribute('data-src');
    fuente.type = 'video/mp4';
    video.appendChild(fuente);

    // Cuando el video realmente empieza, aparece con un fundido suave
    video.addEventListener('playing', function () { video.classList.add('is-playing'); });

    video.load();
    var promesa = video.play();
    if (promesa && promesa.catch) { promesa.catch(function () { /* el navegador bloqueó el autoplay: se queda la foto */ }); }
  }


  animarAlHacerScroll();
  iniciarVideoDeFondo();
})();
