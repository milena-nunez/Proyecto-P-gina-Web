/* ==========================================================================
   CTN · Noticias del inicio
   --------------------------------------------------------------------------
   Pide las publicaciones al servidor (config.js → apiUrl) y las dibuja dentro
   de #contenedor-noticias. Requiere Bootstrap 5 (ventana y carrusel de la
   noticia completa).

   SEGURIDAD: los textos que vienen del servidor se insertan con textContent
   (nunca como HTML). Así una noticia no puede colar código en la página.

   Cada publicación trae: titulo, descripcion, imagen_url (una o varias
   direcciones separadas por coma), fecha_publicacion, fuente (tipo de letra)
   y tipo ("principal" o "secundaria").
   ========================================================================== */
(function () {
  'use strict';

  var API = (window.CTN_CONFIG || {}).apiUrl;
  var contenedor = document.getElementById('contenedor-noticias');

  // Sin servidor configurado: se deja el aviso fijo que está escrito en el HTML.
  if (!API || !contenedor || !window.bootstrap) { return; }


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

  /** Párrafo con la fecha (usa <time>) o null si no hay fecha válida. */
  function lineaDeFecha(valor) {
    var texto = fechaLegible(valor);
    if (!texto) { return null; }
    var linea = crear('p', 'noticia-fecha');
    var etiqueta = crear('time', '', texto);
    etiqueta.setAttribute('datetime', new Date(valor).toISOString().slice(0, 10));
    linea.appendChild(etiqueta);
    return linea;
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
      foto.alt = '';                       // decorativa: el título ya está al lado
      foto.loading = 'lazy';
      tarjeta.appendChild(foto);
    }

    var cuerpo = crear('div', 'noticia-cuerpo');
    var titulo = crear(esPrincipal ? 'h3' : 'h4');
    titulo.appendChild(crear('b', '', pub.titulo));
    cuerpo.appendChild(titulo);

    var fecha = lineaDeFecha(pub.fecha_publicacion);
    if (fecha) { cuerpo.appendChild(fecha); }

    cuerpo.appendChild(crear('p', 'noticia-resumen', pub.descripcion));

    var boton = crear('button', 'btn-ctn', 'Ver más');
    boton.type = 'button';
    boton.setAttribute('aria-label', 'Ver más: ' + (pub.titulo || 'noticia'));
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

    var indicadores = crear('div', 'carousel-indicators');
    var diapositivas = crear('div', 'carousel-inner');
    imagenes.forEach(function (url, i) {
      var punto = crear('button');
      punto.type = 'button';
      punto.setAttribute('data-bs-target', '#carruselNoticia');
      punto.setAttribute('data-bs-slide-to', String(i));
      punto.setAttribute('aria-label', 'Foto ' + (i + 1));
      if (i === 0) { punto.className = 'active'; punto.setAttribute('aria-current', 'true'); }
      indicadores.appendChild(punto);

      var item = crear('div', 'carousel-item' + (i === 0 ? ' active' : ''));
      var foto = crear('img');
      foto.src = url;
      foto.alt = titulo + ' (foto ' + (i + 1) + ' de ' + imagenes.length + ')';
      item.appendChild(foto);
      diapositivas.appendChild(item);
    });
    carrusel.appendChild(indicadores);
    carrusel.appendChild(diapositivas);

    [['prev', 'Foto anterior'], ['next', 'Foto siguiente']].forEach(function (c) {
      var flecha = crear('button', 'carousel-control-' + c[0]);
      flecha.type = 'button';
      flecha.setAttribute('data-bs-target', '#carruselNoticia');
      flecha.setAttribute('data-bs-slide', c[0]);
      flecha.appendChild(crear('span', 'carousel-control-' + c[0] + '-icon')).setAttribute('aria-hidden', 'true');
      flecha.appendChild(crear('span', 'visually-hidden', c[1]));
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
      var carrusel = crearCarrusel(imagenes, titulo);
      cuerpo.appendChild(carrusel);
      window.bootstrap.Carousel.getOrCreateInstance(carrusel, { interval: 5000, ride: 'carousel' });
    } else if (imagenes.length === 1) {
      var foto = crear('img', 'img-fluid');
      foto.src = imagenes[0];
      foto.alt = titulo;
      cuerpo.appendChild(foto);
    }

    var fecha = lineaDeFecha(pub.fecha_publicacion);
    if (fecha) { cuerpo.appendChild(fecha); }

    var texto = crear('p', '', pub.descripcion);
    var fuente = fuenteSegura(pub.fuente);
    if (fuente) { texto.style.fontFamily = fuente; }
    cuerpo.appendChild(texto);

    window.bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNoticia')).show();
  }

  // Al cerrar la ventana se vacía, para que el carrusel no siga corriendo en segundo plano
  document.getElementById('modalNoticia').addEventListener('hidden.bs.modal', function () {
    document.getElementById('modalNoticiaBody').textContent = '';
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

})();
