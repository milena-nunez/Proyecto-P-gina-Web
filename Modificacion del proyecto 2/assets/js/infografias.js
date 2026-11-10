/* ==========================================================================
   CTN · Visor de infografías (pantalla completa)
   --------------------------------------------------------------------------
   Cada especialidad puede tener una lista de miniaturas (.infografia-item) y
   una ventana .modal-infografias. La ventana se llena sola a partir de las
   miniaturas que apuntan a ella (data-bs-target="#idDeLaVentana"); cada una
   lleva:
     data-indice  su posición en la lista, empezando en 0
     data-src     la imagen grande
     data-ancho / data-alto  medidas de la imagen grande, en píxeles
   El título sale de .infografia-titulo y el texto alternativo, del alt de la
   miniatura.

   Para agregar una infografía: poner su <li> en la lista con esos datos.
   No hace falta tocar la ventana.

   Controles: flechas laterales, miniaturas del pie, teclado (← → y Z para
   ampliar), deslizar el dedo para cambiar y pellizcar o tocar para ampliar.
   ========================================================================== */
(function () {
  'use strict';

  var sinMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conMouse = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.querySelectorAll('.modal-infografias').forEach(function (ventana) {
    var botones = document.querySelectorAll('[data-bs-target="#' + ventana.id + '"][data-src]');
    if (!botones.length) { return; }
    var items = Array.prototype.map.call(botones, function (b) {
      var mini = b.querySelector('img');
      var nombre = b.querySelector('.infografia-titulo');
      var ancho = +b.getAttribute('data-ancho') || 1024, alto = +b.getAttribute('data-alto') || 1536;
      /* La miniatura sirve de adelanto solo si tiene la misma proporción
         (si es un recorte, se vería estirada). */
      var proporcion = (+mini.getAttribute('width') || 0) / (+mini.getAttribute('height') || 1);
      return {
        src: b.getAttribute('data-src'), alt: mini.alt,
        mini: Math.abs(proporcion - ancho / alto) < 0.05 ? mini.getAttribute('src') : '',
        titulo: nombre ? nombre.textContent.trim() : '',
        ancho: ancho, alto: alto
      };
    });

    var escenario = ventana.querySelector('.visor-escenario');
    var img = ventana.querySelector('.visor-img');
    var titulo = ventana.querySelector('.visor-titulo');
    var contador = ventana.querySelector('.visor-contador');
    var abrir = ventana.querySelector('.visor-abrir');
    var zoomBtn = ventana.querySelector('.visor-zoom');
    var zoomMas = zoomBtn.querySelector('.zoom-mas');
    var pista = ventana.querySelector('.visor-pista');
    var tira = ventana.querySelector('.visor-tira');
    var tituloBase = titulo.textContent;
    var actual = 0, ampliada = false, animando = null, cargaId = 0, pistaTimer;

    ventana.querySelector('.visor-pista-texto').textContent =
      conMouse ? 'Haz clic en la imagen para ampliarla' : 'Toca la imagen para ampliarla';

    /* Miniaturas del pie (en el teléfono se ven como puntos) */
    items.forEach(function (it, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      var im = document.createElement('img');
      b.type = 'button'; b.className = 'visor-mini';
      b.setAttribute('aria-label', (i + 1) + '. ' + it.titulo);
      im.src = botones[i].querySelector('img').getAttribute('src'); im.alt = ''; im.loading = 'lazy';
      b.appendChild(im);
      b.addEventListener('click', function () { mostrar(i, i > actual ? 1 : -1); });
      li.appendChild(b); tira.appendChild(li);
    });
    var minis = tira.querySelectorAll('.visor-mini');

    function precargar(i) { var im = new Image(); im.src = items[(i + items.length) % items.length].src; }

    /* Pone la infografía i: primero la miniatura (ya cargada, así nunca se ve
       vacío) y la grande en cuanto termina de llegar. */
    function poner(i) {
      var it = items[i], id = ++cargaId, grande = new Image();
      img.width = it.ancho; img.height = it.alto; img.alt = it.alt;
      img.src = it.mini || it.src;
      grande.onload = function () { if (id === cargaId) { img.src = it.src; } };
      grande.src = it.src;
      titulo.textContent = it.titulo;
      contador.textContent = (i + 1) + ' / ' + items.length;
      abrir.href = it.src;
      Array.prototype.forEach.call(minis, function (m, j) {
        if (j === i) { m.setAttribute('aria-current', 'true'); } else { m.removeAttribute('aria-current'); }
      });
      precargar(i + 1); precargar(i - 1);
    }

    /* Cambia de infografía con un deslizamiento corto en la dirección dir. */
    function mostrar(i, dir) {
      i = (i + items.length) % items.length;
      if (ampliada) { zoom(false); }
      if (i === actual) { return; }
      actual = i;
      if (sinMovimiento || !dir || !img.animate) { poner(i); return; }
      var d = dir * 24, hecho = false;
      var salida = img.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-d) + 'px)' }],
        { duration: 120, easing: 'ease-in', fill: 'forwards' });
      function entrar() {
        if (hecho || actual !== i) { return; }
        hecho = true; salida.cancel(); poner(i);
        img.animate(
          [{ opacity: 0, transform: 'translateX(' + d + 'px)' }, { opacity: 1, transform: 'none' }],
          { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
      salida.onfinish = entrar;
      setTimeout(entrar, 160);   /* por si la animación no llega a terminar */
    }

    /* Ampliar / reducir. La imagen crece o se achica desde donde está y el
       punto tocado queda bajo el dedo o el cursor. */
    function zoom(si, punto) {
      if (si === ampliada || animando) { return; }
      var it = items[actual];
      var antes = img.getBoundingClientRect();
      var caja = escenario.getBoundingClientRect();
      var fx = punto ? Math.min(Math.max((punto.x - antes.left) / antes.width, 0), 1) : 0.5;
      var fy = punto ? Math.min(Math.max((punto.y - antes.top) / antes.height, 0), 1) : 0.15;

      ampliada = si;
      ventana.classList.toggle('ampliada', si);
      zoomBtn.setAttribute('aria-pressed', String(si));
      zoomBtn.setAttribute('aria-label', si ? 'Reducir' : 'Ampliar');
      zoomBtn.title = si ? 'Reducir (Z)' : 'Ampliar (Z)';
      zoomMas.style.display = si ? 'none' : '';
      ocultarPista();

      if (si) {
        /* Unas 2,5 veces el tamaño ajustado, sin pasar mucho de la resolución real */
        var ancho = Math.min(it.ancho * 1.25, Math.max(antes.width * 2.5, Math.min(it.ancho, caja.width)));
        img.style.width = Math.round(ancho) + 'px';
        var px = punto ? punto.x - caja.left : caja.width / 2;
        var py = punto ? punto.y - caja.top : caja.height * 0.15;
        escenario.scrollLeft = img.offsetLeft + fx * img.offsetWidth - px;
        escenario.scrollTop = img.offsetTop + fy * img.offsetHeight - py;
        escenario.focus({ preventScroll: true });
      } else {
        img.style.width = '';
        escenario.scrollTop = 0; escenario.scrollLeft = 0;
      }

      if (sinMovimiento || !img.animate) { return; }
      var despues = img.getBoundingClientRect();
      var esta = img.animate([
        { transformOrigin: '0 0', transform: 'translate(' + (antes.left - despues.left) + 'px,' + (antes.top - despues.top) + 'px) scale(' + (antes.width / despues.width) + ')' },
        { transformOrigin: '0 0', transform: 'none' }
      ], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
      animando = esta;
      esta.onfinish = esta.oncancel = function () { if (animando === esta) { animando = null; } };
      setTimeout(function () { if (animando === esta) { esta.finish(); } }, 400);
    }

    function reiniciarZoom() {
      if (animando) { animando.cancel(); }
      ampliada = false;
      ventana.classList.remove('ampliada');
      img.style.width = '';
      zoomBtn.setAttribute('aria-pressed', 'false');
      zoomBtn.setAttribute('aria-label', 'Ampliar');
      zoomBtn.title = 'Ampliar (Z)';
      zoomMas.style.display = '';
    }

    /* Pista de zoom: solo la primera vez en la visita */
    function mostrarPista() {
      var vista = false;
      try { vista = sessionStorage.getItem('ctn-visor-pista') === '1'; } catch (e) { /* sin almacenamiento */ }
      if (vista) { return; }
      pista.classList.add('visible');
      pistaTimer = setTimeout(ocultarPista, 4000);
    }
    function ocultarPista() {
      clearTimeout(pistaTimer);
      if (!pista.classList.contains('visible')) { return; }
      pista.classList.remove('visible');
      try { sessionStorage.setItem('ctn-visor-pista', '1'); } catch (e) { /* sin almacenamiento */ }
    }

    /* Abrir y cerrar */
    ventana.addEventListener('show.bs.modal', function (evento) {
      var boton = evento.relatedTarget;
      var i = boton ? parseInt(boton.getAttribute('data-indice'), 10) : 0;
      reiniciarZoom();
      actual = isNaN(i) ? 0 : (i + items.length) % items.length;
      poner(actual);
    });
    ventana.addEventListener('shown.bs.modal', mostrarPista);
    ventana.addEventListener('hide.bs.modal', ocultarPista);
    ventana.addEventListener('hidden.bs.modal', function () { reiniciarZoom(); titulo.textContent = tituloBase; });

    /* Controles */
    var gesto = { x: 0, y: 0, movio: false };
    img.addEventListener('click', function (e) {
      if (gesto.movio) { return; }
      zoom(!ampliada, { x: e.clientX, y: e.clientY });
    });
    zoomBtn.addEventListener('click', function () { zoom(!ampliada); });
    ventana.querySelectorAll('.anterior').forEach(function (b) { b.addEventListener('click', function () { mostrar(actual - 1, -1); }); });
    ventana.querySelectorAll('.siguiente').forEach(function (b) { b.addEventListener('click', function () { mostrar(actual + 1, 1); }); });
    ventana.addEventListener('keydown', function (e) {
      if (e.key === 'z' || e.key === 'Z' || e.key === '+' || e.key === '-') {
        zoom(e.key === '-' ? false : e.key === '+' ? true : !ampliada);
        e.preventDefault(); return;
      }
      if (ampliada) { return; }   /* ampliada: las flechas recorren la imagen */
      if (e.key === 'ArrowLeft') { mostrar(actual - 1, -1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { mostrar(actual + 1, 1); e.preventDefault(); }
    });

    /* Gestos: deslizar para cambiar, pellizcar para ampliar */
    escenario.addEventListener('touchstart', function (e) {
      if (ampliada) { return; }
      if (e.touches.length === 2) {
        var a = e.touches[0], b = e.touches[1];
        zoom(true, { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
        return;
      }
      gesto.x = e.touches[0].clientX; gesto.y = e.touches[0].clientY; gesto.movio = false;
    }, { passive: true });
    escenario.addEventListener('touchend', function (e) {
      if (ampliada || !e.changedTouches.length) { return; }
      var dx = e.changedTouches[0].clientX - gesto.x, dy = e.changedTouches[0].clientY - gesto.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        gesto.movio = true;
        mostrar(actual + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        setTimeout(function () { gesto.movio = false; }, 350);
      }
    });
  });
})();
