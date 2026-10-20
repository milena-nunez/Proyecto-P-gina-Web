/* ==========================================================================
   CTN · Noticias del inicio
   --------------------------------------------------------------------------
   Pide las publicaciones al servidor (config.js → apiUrl) y las dibuja dentro
   de #contenedor-noticias. Requiere jQuery y Bootstrap (para la ventana y el
   carrusel de la noticia completa).

   SEGURIDAD: los textos que vienen del servidor se insertan con textContent
   (nunca como HTML). Así una noticia no puede colar código en la página.

   Cada publicación trae: titulo, descripcion, imagen_url (una o varias
   direcciones separadas por coma), fecha_publicacion, fuente (tipo de letra)
   y tipo ("principal" o "secundaria").
   ========================================================================== */
(function ($) {
  'use strict';

  var API = (window.CTN_CONFIG || {}).apiUrl;
  var contenedor = document.getElementById('contenedor-noticias');

  // Sin servidor configurado: se deja el aviso fijo que está escrito en el HTML.
  if (!API || !contenedor) { return; }


  /* ---------- Funciones auxiliares ---------- */

  /** Crea un elemento: crear('p', 'clase', 'texto') */
  function crear(etiqueta, clase, texto) {
    var el = document.createElement(etiqueta);
    if (clase) { el.className = clase; }
    if (texto !== undefined && texto !== null) { el.textContent = texto; }
    return el;
  }

  /** Fecha en español: "8 de octubre de 2026" */
  function fechaLegible(valor) {
    var fecha = new Date(valor);
    if (isNaN(fecha.getTime())) { return ''; }
    return fecha.toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /** Acepta direcciones http(s) o rutas relativas. Rechaza javascript:, data:, etc. */
  function direccionSegura(url) {
    url = String(url || '').trim();
    if (/^(https?:)?\/\//i.test(url)) { return url; }
    if (/^[\w\-./%]+$/.test(url) && !/^(javascript|data|vbscript):/i.test(url)) { return url; }
    return '';
  }

  /** Tipo de letra elegido en el editor. Solo letras, números, espacios, comas y comillas. */
  function fuenteSegura(fuente) {
    return /^[\w\s,'"\-]{1,80}$/.test(fuente || '') ? fuente : '';
  }

  /** "a.jpg, b.jpg" → ['a.jpg', 'b.jpg'] (solo direcciones válidas) */
  function listaDeImagenes(imagenUrl) {
    return String(imagenUrl || '').split(',').map(direccionSegura).filter(Boolean);
  }


  /* ---------- Tarjetas de la lista ---------- */

  function crearTarjeta(pub, esPrincipal) {
    var tarjeta = crear('article', 'noticia');
    var fuente = fuenteSegura(pub.fuente);
    if (fuente) { tarjeta.style.fontFamily = fuente; }

    var imagenes = listaDeImagenes(pub.imagen_url);
    if (imagenes.length) {
      var foto = crear('img');
      foto.src = imagenes[0];
      foto.alt = pub.titulo || 'Noticia del CTN';
      foto.loading = 'lazy';
      tarjeta.appendChild(foto);
    }

    var cuerpo = crear('div', 'noticia-cuerpo');
    var titulo = crear(esPrincipal ? 'h2' : 'h4');
    titulo.appendChild(crear('b', '', pub.titulo));
    cuerpo.appendChild(titulo);

    var fecha = fechaLegible(pub.fecha_publicacion);
    if (fecha) {
      var linea = crear('p', 'noticia-fecha');
      linea.appendChild(crear('i', 'fa fa-calendar'));
      linea.appendChild(document.createTextNode(' ' + fecha));
      cuerpo.appendChild(linea);
    }

    cuerpo.appendChild(crear('p', 'noticia-resumen', pub.descripcion));

    var boton = crear('button', 'btn-ctn btn-ctn-marron', 'Ver más');
    boton.type = 'button';
    boton.addEventListener('click', function () { abrirNoticia(pub); });
    cuerpo.appendChild(boton);

    tarjeta.appendChild(cuerpo);
    return tarjeta;
  }

  function mostrarNoticias(publicaciones) {
    var principal = publicaciones.filter(function (p) { return p.tipo === 'principal'; })[0];
    var secundarias = publicaciones.filter(function (p) { return p.tipo === 'secundaria'; });
    if (!principal && !secundarias.length) { return; }   // nada que mostrar: queda el aviso fijo

    contenedor.textContent = '';                          // quita el aviso fijo
    contenedor.classList.add('noticias-lista');

    if (principal) {
      var columnaPrincipal = crear('div', 'noticia-principal');
      columnaPrincipal.appendChild(crearTarjeta(principal, true));
      contenedor.appendChild(columnaPrincipal);
    }
    if (secundarias.length) {
      var columnaLateral = crear('div', 'noticias-laterales');
      secundarias.forEach(function (pub) { columnaLateral.appendChild(crearTarjeta(pub, false)); });
      contenedor.appendChild(columnaLateral);
    }
  }


  /* ---------- Ventana con la noticia completa ---------- */

  function crearCarrusel(imagenes, titulo) {
    var carrusel = crear('div', 'carousel slide');
    carrusel.id = 'carruselNoticia';

    var indicadores = crear('ol', 'carousel-indicators');
    var diapositivas = crear('div', 'carousel-inner');
    imagenes.forEach(function (url, i) {
      var punto = crear('li', i === 0 ? 'active' : '');
      punto.setAttribute('data-target', '#carruselNoticia');
      punto.setAttribute('data-slide-to', String(i));
      indicadores.appendChild(punto);

      var item = crear('div', 'item' + (i === 0 ? ' active' : ''));
      var foto = crear('img');
      foto.src = url;
      foto.alt = titulo + ' (foto ' + (i + 1) + ' de ' + imagenes.length + ')';
      item.appendChild(foto);
      diapositivas.appendChild(item);
    });
    carrusel.appendChild(indicadores);
    carrusel.appendChild(diapositivas);

    [['left', 'prev', '❮', 'Foto anterior'], ['right', 'next', '❯', 'Foto siguiente']].forEach(function (c) {
      var flecha = crear('a', c[0] + ' carousel-control');
      flecha.href = '#carruselNoticia';
      flecha.setAttribute('data-slide', c[1]);
      flecha.setAttribute('role', 'button');
      flecha.setAttribute('aria-label', c[3]);
      flecha.appendChild(crear('span', '', c[2]));
      carrusel.appendChild(flecha);
    });
    return carrusel;
  }

  function abrirNoticia(pub) {
    var titulo = pub.titulo || 'Noticia del CTN';
    document.getElementById('modalNoticiaLabel').textContent = titulo;

    var cuerpo = document.getElementById('modalNoticiaBody');
    cuerpo.textContent = '';

    var imagenes = listaDeImagenes(pub.imagen_url);
    if (imagenes.length > 1) {
      cuerpo.appendChild(crearCarrusel(imagenes, titulo));
      $('#carruselNoticia').carousel({ interval: 5000 });   // los carruseles creados por JS hay que iniciarlos a mano
    } else if (imagenes.length === 1) {
      var foto = crear('img', 'img-responsive');
      foto.src = imagenes[0];
      foto.alt = titulo;
      cuerpo.appendChild(foto);
    }

    var fecha = fechaLegible(pub.fecha_publicacion);
    if (fecha) {
      var linea = crear('p', 'noticia-fecha');
      linea.appendChild(crear('i', 'fa fa-calendar'));
      linea.appendChild(document.createTextNode(' ' + fecha));
      cuerpo.appendChild(linea);
    }

    var texto = crear('p', '', pub.descripcion);
    var fuente = fuenteSegura(pub.fuente);
    if (fuente) { texto.style.fontFamily = fuente; }
    cuerpo.appendChild(texto);

    $('#modalNoticia').modal('show');
  }

  // Al cerrar la ventana se vacía, para que el carrusel no siga corriendo en segundo plano
  $('#modalNoticia').on('hidden.bs.modal', function () {
    $('#modalNoticiaBody').empty();
  });


  /* ---------- Pedir las noticias al servidor ---------- */

  var cortarEspera = new AbortController();
  var temporizador = setTimeout(function () { cortarEspera.abort(); }, 8000);   // si el servidor no responde en 8 s, se deja el aviso fijo

  fetch(API + '/api/publicaciones', { signal: cortarEspera.signal })
    .then(function (respuesta) {
      if (!respuesta.ok) { throw new Error('El servidor respondió ' + respuesta.status); }
      return respuesta.json();
    })
    .then(function (datos) {
      if (Array.isArray(datos)) { mostrarNoticias(datos); }
    })
    .catch(function (error) {
      console.warn('No se pudieron cargar las noticias:', error.message);
    })
    .then(function () { clearTimeout(temporizador); });

})(jQuery);
