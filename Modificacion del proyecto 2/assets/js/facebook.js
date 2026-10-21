/* ==========================================================================
   CTN · Publicaciones de Facebook en el inicio
   --------------------------------------------------------------------------
   El cuadro de Facebook NO se carga solo: primero se muestra una tarjeta que
   explica que Facebook puede usar cookies, y recién cuando la persona pulsa
   "Mostrar publicaciones" se crea el iframe. La elección se recuerda en este
   navegador (localStorage) y se puede retirar con "Dejar de mostrar".

   El HTML necesita #facebook-bloque (con data-src = dirección del plugin),
   #facebook-consentimiento y #facebook-aceptar.
   ========================================================================== */
(function () {
  'use strict';

  var bloque = document.getElementById('facebook-bloque');
  var tarjeta = document.getElementById('facebook-consentimiento');
  var aceptar = document.getElementById('facebook-aceptar');
  if (!bloque || !tarjeta || !aceptar) { return; }

  var CLAVE = 'ctn-facebook';
  var PAGINA = bloque.getAttribute('data-pagina');   // dirección de la página: se cambia solo en index.html
  var vista = null;                                   // contenedor del iframe cuando está activo

  /* localStorage puede fallar (modo privado, datos bloqueados): se envuelve siempre */
  function leer() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardar(v) { try { if (v) { localStorage.setItem(CLAVE, v); } else { localStorage.removeItem(CLAVE); } } catch (e) { /* sin memoria: se pregunta de nuevo la próxima vez */ } }

  function mostrarPublicaciones() {
    vista = document.createElement('div');

    var marco = document.createElement('iframe');
    marco.className = 'facebook-feed';
    marco.title = 'Publicaciones recientes del CTN en Facebook';
    marco.loading = 'lazy';
    marco.allow = 'clipboard-write; encrypted-media; picture-in-picture; web-share';
    marco.src = bloque.getAttribute('data-src');
    vista.appendChild(marco);

    var enlaces = document.createElement('div');
    enlaces.className = 'facebook-enlaces';

    var ver = document.createElement('a');
    ver.className = 'btn-ctn';
    ver.href = PAGINA;
    ver.target = '_blank';
    ver.rel = 'noopener';
    ver.textContent = 'Ver todo en Facebook';
    var oculto = document.createElement('span');
    oculto.className = 'visually-hidden';
    oculto.textContent = ' (se abre en una pestaña nueva)';
    ver.appendChild(oculto);
    enlaces.appendChild(ver);

    var quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'facebook-ocultar';
    quitar.textContent = 'Dejar de mostrar Facebook';
    quitar.addEventListener('click', ocultarPublicaciones);
    enlaces.appendChild(quitar);
    vista.appendChild(enlaces);

    tarjeta.hidden = true;
    bloque.appendChild(vista);
  }

  function ocultarPublicaciones() {
    guardar(null);
    if (vista) { vista.remove(); vista = null; }     // al quitar el iframe se corta la conexión con Facebook
    tarjeta.hidden = false;
    aceptar.focus();
  }

  aceptar.addEventListener('click', function () {
    guardar('si');
    mostrarPublicaciones();
  });

  if (leer() === 'si') { mostrarPublicaciones(); }
})();
