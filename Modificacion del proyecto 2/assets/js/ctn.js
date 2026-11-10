/* ==========================================================================
   CTN · Comportamiento común a todas las páginas
   --------------------------------------------------------------------------
   No necesita jQuery. Hace cinco cosas:
     1. Activa las animaciones de aparición (clase "wow") al hacer scroll.
     2. Carga el video de fondo de la portada, solo si conviene.
     3. Abre las fotos de la galería en una ventana ampliada.
     4. Desvanece el contenido al cambiar de página (transición suave).
     5. Carruseles: botón de pausa, movimiento reducido y precarga de fotos.

   El menú, las pestañas, los carruseles y las ventanas emergentes los maneja
   Bootstrap 5 (bootstrap.bundle.min.js).
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* Ventanas (modales): justo antes de abrir una se mide el ancho de la barra
     de scroll, para que el menú fijo no se corra cuando la barra se oculta
     (CSS: .modal-open .ctn-nav). */
  document.addEventListener('show.bs.modal', function () {
    if (document.body.classList.contains('modal-open')) { return; }
    var raiz = document.documentElement;
    raiz.style.setProperty('--ctn-barra', Math.max(0, window.innerWidth - raiz.clientWidth) + 'px');
  });

  /* ---- 4. Transición al cambiar de página ---------------------------------
     Al hacer clic en un enlace interno, el contenido se desvanece (CSS: html.saliendo)
     y recién entonces se carga la otra página, que aparece con su propio fundido. */
  (function () {
    var raiz = document.documentElement;
    var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Al volver con el botón "atrás" el navegador puede restaurar la página ya desvanecida.
    window.addEventListener('pageshow', function () { raiz.classList.remove('saliendo'); });
    if (reducido) { return; }

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) { return; }
      if (a.classList.contains('disabled') || a.getAttribute('aria-disabled') === 'true') { return; }
      var destino = a.href;
      if (!/^(https?|file):/.test(destino)) { return; }                 // mailto:, tel:, etc.
      if (a.origin !== location.origin || a.pathname === location.pathname) { return; }  // externo o ancla de la misma página
      if (/\.(pdf|zip|docx?|xlsx?|pptx?|mp4)$/i.test(a.pathname)) { return; }   // descargas
      e.preventDefault();
      raiz.classList.add('saliendo');
      setTimeout(function () { location.href = destino; }, 180);
    });
  })();


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
    }, { threshold: 0.12 });

    Array.prototype.forEach.call(elementos, function (el) { observador.observe(el); });
  }


  /* ---- 2. Video de fondo de la portada -----------------------------------
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


  /* ---- 5. Carruseles de fotos ----------------------------------------------
     Para cada carrusel (los de la página y el de las noticias):
       · agrega un botón de pausa / reproducción (pautas de accesibilidad: lo que
         se mueve solo tiene que poder detenerse);
       · si el sistema pide reducir el movimiento, empieza en pausa;
       · precarga la foto siguiente antes de que le toque, así nunca aparece un
         hueco en blanco durante la transición.
     noticias.js usa window.ctnCarrusel(elemento, opciones) para el suyo. */
  var reducirMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ICONOS_PAUSA =
    '<svg class="icono-pausa" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>' +
    '<svg class="icono-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';

  function precargarSiguiente(carrusel) {
    var items = carrusel.querySelectorAll('.carousel-item');
    var activo = carrusel.querySelector('.carousel-item.active');
    var i = Array.prototype.indexOf.call(items, activo);
    [i + 1, i - 1].forEach(function (j) {
      var img = items[(j + items.length) % items.length].querySelector('img');
      if (img && img.loading === 'lazy') { img.loading = 'eager'; }
    });
  }

  function prepararCarrusel(carrusel, opciones) {
    if (!window.bootstrap || carrusel.hasAttribute('data-ctn-listo')) { return; }
    carrusel.setAttribute('data-ctn-listo', '');
    var automatico = !reducirMovimiento;
    var instancia = window.bootstrap.Carousel.getOrCreateInstance(carrusel,
      Object.assign({}, opciones, { ride: automatico ? 'carousel' : false }));
    if (!automatico) { instancia.pause(); }

    var items = carrusel.querySelectorAll('.carousel-item');
    if (items.length > 1) {
      /* Las flechas pasan dentro de .carousel-inner: así quedan sobre la foto y
         no sobre la barra de abajo. */
      var interior = carrusel.querySelector('.carousel-inner');
      carrusel.querySelectorAll('.carousel-control-prev, .carousel-control-next').forEach(function (f) { interior.appendChild(f); });

      /* Barra de abajo: texto de la foto + puntos + pausa */
      var pie = document.createElement('div');
      pie.className = 'carrusel-pie';
      var texto = document.createElement('p');
      texto.className = 'carrusel-texto';
      var controles = document.createElement('div');
      controles.className = 'carrusel-controles';
      var puntos = carrusel.querySelector('.carousel-indicators');
      if (puntos) { controles.appendChild(puntos); }
      pie.appendChild(texto); pie.appendChild(controles);
      carrusel.appendChild(pie);

      /* El texto sale de data-texto de la foto o de su descripción (alt). Si la
         descripción es genérica («foto 2 de 4») o se repite en varias fotos,
         muestra solo la posición. */
      var textos = Array.prototype.map.call(items, function (it) {
        var img = it.querySelector('img');
        return img ? (img.getAttribute('data-texto') || img.alt || '').trim() : '';
      });
      var mostrarTexto = function (i) {
        var propio = textos[i];
        var generico = !propio || /foto\s*\d+\s*de\s*\d+/i.test(propio) ||
          textos.indexOf(propio) !== textos.lastIndexOf(propio);
        texto.textContent = generico ? 'Foto ' + (i + 1) + ' de ' + items.length : propio;
        texto.classList.toggle('es-contador', generico);
      };
      mostrarTexto(Math.max(0, Array.prototype.indexOf.call(items, carrusel.querySelector('.carousel-item.active'))));
      carrusel.addEventListener('slide.bs.carousel', function (e) { mostrarTexto(e.to); });

      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'carrusel-pausa';
      boton.innerHTML = ICONOS_PAUSA;
      var actualizar = function () {
        boton.setAttribute('data-pausado', String(!automatico));
        boton.setAttribute('aria-label', automatico ? 'Pausar las fotos' : 'Pasar las fotos automáticamente');
        boton.title = automatico ? 'Pausar' : 'Reproducir';
      };
      boton.addEventListener('click', function () {
        automatico = !automatico;
        instancia._config.ride = automatico ? 'carousel' : false;   /* así Bootstrap no lo reactiva al sacar el mouse */
        if (automatico) { instancia.cycle(); } else { instancia.pause(); }
        actualizar();
      });
      actualizar();
      controles.appendChild(boton);
    }

    carrusel.addEventListener('slid.bs.carousel', function () { precargarSiguiente(carrusel); });
    /* La primera precarga, recién cuando el carrusel se ve (los de las pestañas
       ocultas no descargan nada hasta que se abren). */
    if ('IntersectionObserver' in window) {
      var observador = new IntersectionObserver(function (entradas) {
        if (entradas[0].isIntersecting) { precargarSiguiente(carrusel); observador.disconnect(); }
      }, { rootMargin: '200px' });
      observador.observe(carrusel);
    } else {
      precargarSiguiente(carrusel);
    }
  }
  window.ctnCarrusel = prepararCarrusel;
  document.querySelectorAll('.carousel[data-bs-ride]').forEach(function (c) { prepararCarrusel(c); });


  /* ---- 3. Galería ---------------------------------------------------------
     Cada botón .galeria-item trae la foto grande en data-grande y su texto en
     data-titulo. Se muestran en la ventana #modalGaleria. */
  function iniciarGaleria() {
    var ventana = document.getElementById('modalGaleria');
    if (!ventana || !window.bootstrap) { return; }
    var contenedor = ventana.querySelector('.modal-imagen');
    var pie = ventana.querySelector('.modal-pie');

    document.addEventListener('click', function (evento) {
      var boton = evento.target.closest('.galeria-item');
      if (!boton) { return; }
      var imagen = document.createElement('img');       // la foto se crea al abrir (así no se descarga antes)
      imagen.src = boton.getAttribute('data-grande');
      imagen.alt = boton.getAttribute('data-titulo') || '';
      contenedor.textContent = '';
      contenedor.appendChild(imagen);
      pie.textContent = boton.getAttribute('data-titulo') || '';
      window.bootstrap.Modal.getOrCreateInstance(ventana).show();
    });
    ventana.addEventListener('hidden.bs.modal', function () { contenedor.textContent = ''; });
  }


  animarAlHacerScroll();
  iniciarVideoDeFondo();
  iniciarGaleria();
})();
