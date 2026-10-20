/* ==========================================================================
   CTN · Página "Especialidades"
   --------------------------------------------------------------------------
   Requiere Bootstrap 5. Hace dos cosas:
     1. Permite entrar directo a una especialidad con la dirección
        espe.html#quimica (así enlazan las tarjetas del inicio) y mantiene la
        dirección al cambiar de pestaña.
     2. Dibuja el gráfico de "especialidades más elegidas en el test vocacional"
        (solo si hay un servidor configurado en config.js).

   Los colores de cada especialidad están en espe.css (sección 1) y se aplican
   con el atributo data-especialidad del HTML: aquí no hay colores.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. Pestañas ---------- */
  var botones = document.querySelectorAll('.especialidades-tabs [data-bs-toggle="tab"]');

  function mostrarDesdeDireccion() {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    if (!id || !window.bootstrap) { return; }
    var boton = document.querySelector('.especialidades-tabs [data-bs-target="#' + id + '"]');
    if (boton) { window.bootstrap.Tab.getOrCreateInstance(boton).show(); }
  }

  Array.prototype.forEach.call(botones, function (boton) {
    boton.addEventListener('shown.bs.tab', function () {
      history.replaceState(null, '', boton.getAttribute('data-bs-target'));
    });
  });
  window.addEventListener('hashchange', mostrarDesdeDireccion);
  mostrarDesdeDireccion();


  /* ---------- 3. Gráfico del test vocacional ---------- */
  // Orden fijo de las barras. "clave" es el nombre tal como lo guarda la base
  // de datos, sin tildes y en minúsculas.
  var BARRAS = [
    { clave: 'electronica',            etiqueta: 'Electrónica',          color: '#808080', logo: 'eik_c.png'  },
    { clave: 'electromecanica',        etiqueta: 'Electromecánica',      color: '#0000FF', logo: 'emca_c.png' },
    { clave: 'informatica',            etiqueta: 'Informática',          color: '#AB2A3E', logo: 'info_c.png' },
    { clave: 'quimica',                etiqueta: 'Química',              color: '#03BB85', logo: 'qca_c.png'  },
    { clave: 'construcciones civiles', etiqueta: 'Construcciones Civiles', color: '#b9ae48', logo: 'cc_c.png' },
    { clave: 'mecanica automotriz',    etiqueta: 'Mecánica Automotriz',  color: '#000080', logo: 'auto_c.png' },
    { clave: 'mecanica industrial',    etiqueta: 'Mecánica Industrial',  color: '#008000', logo: 'indu_c.png' },
    { clave: 'electricidad',           etiqueta: 'Electricidad',         color: '#87CEEB', logo: 'edad_c.png' }
  ];
  var CARPETA_LOGOS = 'assets/images/especialidades/';
  var RUTA_CHART_JS = 'assets/js/chart-4.4.7.min.js';

  var canvas = document.getElementById('graficoEspecialidades');
  var API = (window.CTN_CONFIG || {}).apiUrl;

  /** Sin gráfico: se quita su columna y el texto del encabezado queda centrado. */
  function ocultarGrafico() {
    var columna = document.getElementById('columna-grafico');
    if (columna) { columna.remove(); }
    document.getElementById('columna-test').classList.add('mx-auto');
  }

  function sinTildes(texto) {
    return String(texto).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function cargarScript(direccion) {
    return new Promise(function (resolver, rechazar) {
      var s = document.createElement('script');
      s.src = direccion;
      s.onload = resolver;
      s.onerror = rechazar;
      document.head.appendChild(s);
    });
  }

  function dibujarGrafico(puntajesApi) {
    var logos = BARRAS.map(function (b) { var img = new Image(); img.src = CARPETA_LOGOS + b.logo; return img; });

    var puntajes = BARRAS.map(function (b) {
      var fila = puntajesApi.filter(function (d) { return sinTildes(d.especialidad) === b.clave; })[0];
      return fila ? fila.puntaje : 0;
    });
    var total = puntajes.reduce(function (a, b) { return a + b; }, 0);
    var porcentajes = puntajes.map(function (p) { return total > 0 ? +((p / total) * 100).toFixed(1) : 0; });

    var grafico = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: BARRAS.map(function (b) { return b.etiqueta; }),
        datasets: [{ label: 'Porcentaje', data: porcentajes, backgroundColor: BARRAS.map(function (b) { return b.color; }), borderRadius: 10 }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Especialidades con más puntajes (%)', color: '#fff' },
          tooltip: { bodyColor: '#fff', titleColor: '#fff' }
        },
        scales: {
          x: {
            ticks: { color: '#fff', font: { weight: 'bold' } },   // blanco: los colores de las barras se pierden sobre el fondo oscuro
            grid: { color: 'rgba(255,255,255,0.2)' }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: '#fff', callback: function (v) { return v + '%'; } },
            grid: { color: 'rgba(255,255,255,0.2)' }
          }
        }
      },
      // Dibuja el logo de cada especialidad encima de su barra
      plugins: [{
        id: 'logoSobreBarras',
        afterDatasetsDraw: function (g) {
          var ctx = g.ctx, x = g.scales.x, y = g.scales.y;
          g.data.datasets[0].data.forEach(function (valor, i) {
            if (logos[i].complete) { ctx.drawImage(logos[i], x.getPixelForValue(i) - 25, y.getPixelForValue(valor) - 50, 50, 50); }
          });
        }
      }]
    });

    // Los logos pueden terminar de cargar después del primer dibujo: se redibuja al llegar cada uno
    logos.forEach(function (img) { img.onload = function () { grafico.draw(); }; });
  }

  if (!canvas) { return; }
  if (!API) { ocultarGrafico(); return; }

  fetch(API + '/api/puntajes')
    .then(function (r) {
      if (!r.ok) { throw new Error('El servidor respondió ' + r.status); }
      return r.json();
    })
    .then(function (datos) {
      // Chart.js (200 KB) solo se descarga si realmente hay datos para mostrar
      return cargarScript(RUTA_CHART_JS).then(function () { dibujarGrafico(datos); });
    })
    .catch(function (error) {
      console.warn('No se pudo mostrar el gráfico del test vocacional:', error.message);
      ocultarGrafico();
    });

})();
