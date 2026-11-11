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

    /* Pone la infografía i. Al cambiar src, el navegador sigue mostrando la
       imagen anterior hasta que llega la nueva, así que:
       · si hay una miniatura con la misma proporción, se muestra ya y la
         grande la reemplaza cuando llega;
       · si no, la anterior se oculta, aparece un indicador de carga y la nueva
         se pone recién cuando terminó de descargarse.
       listo() se llama cuando ya se ve la imagen correcta. */
    function poner(i, listo) {
      var it = items[i], id = ++cargaId, grande = new Image();
      function mostrarGrande() {
        if (id !== cargaId) { return; }          /* ya se pidió otra: esta se descarta */
        img.width = it.ancho; img.height = it.alto; img.alt = it.alt;
        img.src = it.src;
        img.style.visibility = '';
        escenario.classList.remove('cargando');
        if (listo) { listo(); listo = null; }
      }
      grande.onload = grande.onerror = mostrarGrande;
      grande.src = it.src;
      if (grande.complete && grande.naturalWidth) {
        mostrarGrande();
      } else if (it.mini) {
        img.width = it.ancho; img.height = it.alto; img.alt = it.alt;
        img.src = it.mini; img.style.visibility = '';
        if (listo) { listo(); listo = null; }
      } else {
        img.style.visibility = 'hidden';
        escenario.classList.add('cargando');
      }
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
      if (pz.s > 1) { reiniciarPellizco(); }
      if (i === actual) { return; }
      actual = i;
      /* Si quedó a medias una transición anterior (cambios rápidos), se corta */
      if (img.getAnimations) { img.getAnimations().forEach(function (a) { if (a !== animando) { a.cancel(); } }); }
      if (sinMovimiento || !dir || !img.animate) { poner(i); return; }
      var d = dir * 24, hecho = false;
      var salida = img.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-d) + 'px)' }],
        { duration: 120, easing: 'ease-in', fill: 'forwards' });
      function entrar() {
        if (hecho || actual !== i) { return; }
        hecho = true;
        poner(i, function () {
          salida.cancel();
          img.animate(
            [{ opacity: 0, transform: 'translateX(' + d + 'px)' }, { opacity: 1, transform: 'none' }],
            { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' });
        });
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
      /* Por si el navegador no avisa el final (pestaña en segundo plano): a los
         400 ms se da por terminada igual y el zoom queda libre. */
      setTimeout(function () { if (animando === esta) { esta.finish(); animando = null; } }, 400);
    }

    function reiniciarZoom() {
      if (animando) { animando.cancel(); }
      reiniciarPellizco();
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

    /* ---- Zoom con los dedos (pantallas táctiles) ------------------------
       Pellizcar amplía y reduce entre los dedos, un dedo arrastra la imagen
       ampliada (sin salirse de los bordes), un toque amplía en ese punto y
       otro toque la vuelve a su tamaño. Deslizar hacia los costados cambia de
       infografía solo cuando no está ampliada. Se hace con transform (escala
       y desplazamiento) y no cambia el modo de la computadora. */
    var tactil = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    var ESCALA_MAX = 4, ESCALA_TOQUE = 2.5;
    var pz = { s: 1, x: 0, y: 0 };
    var punteros = {};
    var gesto = null, ultimoToque = 0;

    function centroEscenario() {
      var r = escenario.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    function acotar() {
      pz.s = Math.min(ESCALA_MAX, Math.max(1, pz.s));
      var mx = Math.max(0, (img.offsetWidth * pz.s - escenario.clientWidth) / 2);
      var my = Math.max(0, (img.offsetHeight * pz.s - escenario.clientHeight) / 2);
      pz.x = Math.min(mx, Math.max(-mx, pz.x));
      pz.y = Math.min(my, Math.max(-my, pz.y));
    }
    function pintar(animar) {
      img.style.transition = animar && !sinMovimiento ? 'transform .28s cubic-bezier(.2,.7,.2,1)' : 'none';
      img.style.transform = pz.s === 1 ? '' : 'translate(' + pz.x + 'px,' + pz.y + 'px) scale(' + pz.s + ')';
      var si = pz.s > 1;
      ventana.classList.toggle('pellizcada', si);
      zoomBtn.setAttribute('aria-pressed', String(si));
      zoomBtn.setAttribute('aria-label', si ? 'Reducir' : 'Ampliar');
      zoomMas.style.display = si ? 'none' : '';
    }
    /* Cambia la escala a s dejando quieto el punto de la pantalla (px, py) */
    function escalarEn(s, px, py, animar) {
      var c = centroEscenario();
      var lx = (px - c.x - pz.x) / pz.s, ly = (py - c.y - pz.y) / pz.s;
      pz.s = Math.min(ESCALA_MAX, Math.max(1, s));
      pz.x = px - c.x - pz.s * lx; pz.y = py - c.y - pz.s * ly;
      acotar(); pintar(animar);
      if (pz.s > 1) { ocultarPista(); }
    }
    function reiniciarPellizco() {
      pz = { s: 1, x: 0, y: 0 }; punteros = {}; gesto = null;
      pintar(false);
    }
    function alternarPellizco(px, py) {
      if (pz.s > 1) { pz = { s: 1, x: 0, y: 0 }; pintar(true); return; }
      var c = centroEscenario();
      escalarEn(ESCALA_TOQUE, px === undefined ? c.x : px, py === undefined ? c.y : py, true);
    }
    function dedos() { return Object.keys(punteros).map(function (k) { return punteros[k]; }); }
    function empezarGesto(movioAntes) {
      var ps = dedos();
      if (ps.length >= 2) {
        var a = ps[0], b = ps[1], c = centroEscenario();
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        gesto = { tipo: 'dos', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: pz.s,
          lx: (mx - c.x - pz.x) / pz.s, ly: (my - c.y - pz.y) / pz.s, movio: true };
      } else if (ps.length === 1) {
        gesto = { tipo: 'uno', x0: ps[0].x, y0: ps[0].y, px: pz.x, py: pz.y, t: Date.now(), movio: !!movioAntes };
      } else {
        gesto = null;
      }
    }

    escenario.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch' || e.target.closest('button')) { return; }
      ultimoToque = Date.now();
      punteros[e.pointerId] = { x: e.clientX, y: e.clientY };
      empezarGesto(gesto && gesto.movio && dedos().length > 1);
    });
    escenario.addEventListener('pointermove', function (e) {
      if (!punteros[e.pointerId] || !gesto) { return; }
      punteros[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ps = dedos();
      if (gesto.tipo === 'dos' && ps.length >= 2) {
        var a = ps[0], b = ps[1], c = centroEscenario();
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        pz.s = Math.min(ESCALA_MAX, Math.max(1, gesto.s0 * Math.hypot(a.x - b.x, a.y - b.y) / gesto.d0));
        pz.x = mx - c.x - pz.s * gesto.lx; pz.y = my - c.y - pz.s * gesto.ly;
        acotar(); pintar(false); ocultarPista();
      } else if (gesto.tipo === 'uno') {
        var dx = e.clientX - gesto.x0, dy = e.clientY - gesto.y0;
        if (Math.abs(dx) + Math.abs(dy) > 8) { gesto.movio = true; }
        if (pz.s > 1) { pz.x = gesto.px + dx; pz.y = gesto.py + dy; acotar(); pintar(false); }
      }
    });
    function soltar(e) {
      if (!punteros[e.pointerId]) { return; }
      var g = gesto;
      delete punteros[e.pointerId];
      ultimoToque = Date.now();
      if (dedos().length) { empezarGesto(true); return; }   /* queda un dedo: sigue arrastrando */
      gesto = null;
      if (!g || e.type === 'pointercancel') { return; }
      if (g.tipo === 'uno' && !g.movio && Date.now() - g.t < 350) { alternarPellizco(e.clientX, e.clientY); return; }
      if (g.tipo === 'uno' && pz.s === 1) {
        var dx = e.clientX - g.x0, dy = e.clientY - g.y0;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { mostrar(actual + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); }
      }
    }
    escenario.addEventListener('pointerup', soltar);
    escenario.addEventListener('pointercancel', soltar);
    window.addEventListener('resize', function () { if (pz.s > 1) { acotar(); pintar(false); } });

    /* Controles */
    img.addEventListener('click', function (e) {
      if (Date.now() - ultimoToque < 700) { return; }   /* un toque ya lo manejan los gestos */
      zoom(!ampliada, { x: e.clientX, y: e.clientY });
    });
    zoomBtn.addEventListener('click', function () {
      if (tactil) { alternarPellizco(); } else { zoom(!ampliada); }
    });
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

  });
})();
