/* ==========================================================================
   CTN · Pie de página de todo el sitio
   --------------------------------------------------------------------------
   Este es el ÚNICO lugar donde se edita el pie. Cada página tiene solo el
   lugar vacío:

       <footer class="pie pie-nuevo" id="pie">…</footer>
       <script src="assets/js/pie.js"></script>

   y este archivo le pone el contenido. Funciona en el sitio publicado, con un
   servidor local y también abriendo los archivos directamente.

   Al editar el HTML de abajo: va entre comillas invertidas (`), así que se
   puede escribir normal, con comillas simples y dobles. Solo no hay que usar
   comillas invertidas ni ${ dentro del texto.
   ========================================================================== */
(function () {
  'use strict';
  var pie = document.getElementById('pie');
  if (!pie) { return; }

  pie.innerHTML = `
<div class="container">
  <div class="row g-4 g-xl-5 justify-content-xl-between">
    <div class="col-md-12 col-lg-4 col-xl-auto">
      <a class="pie-marca" href="index.html" aria-label="Colegio Técnico Nacional de Asunción - Inicio">
        <img src="assets/images/logo.png" alt="" width="166" height="226" loading="lazy">
        <span class="pie-nombre" aria-hidden="true"><img src="assets/images/themelogo/logo-texto.png" alt="" width="485" height="34" loading="lazy"><span>de Asunción</span></span>
      </a>
      <p class="pie-lema">Formación técnica en 8 especialidades.</p>
    </div>
    <div class="col-md-5 col-lg-4 col-xl-auto">
      <h2>Explorar</h2>
      <ul class="pie-enlaces">
        <li><a href="espe.html">Especialidades</a></li>
        <li><a href="admision.html">Admisión</a></li>
        <li><a href="Formularios.html">Formularios</a></li>
        <li><a href="escuela-empresa.html">Escuela Empresa</a></li>
        <li><a href="TEST/TEST/index.html">Quiz de intereses</a></li>
        <li><a href="direccion.html">Dirección General</a></li>
        <li><a href="cetna.html">CETNA</a></li>
        <li><a href="acerca.html">Acerca de</a></li>
        <li><a href="contact2.html">Contacto</a></li>
      </ul>
    </div>
    <div class="col-md-7 col-lg-4 col-xl-auto">
      <h2>Contacto</h2>
      <ul class="pie-contacto">
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>R.I. 3 Corrales c/ Dr. Hassler, Campos Cervera, Asunción · <a href="https://www.google.com/maps/search/?api=1&amp;query=Colegio+T%C3%A9cnico+Nacional+de+Asunci%C3%B3n" rel="noopener" target="_blank">Cómo llegar<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a></span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg><span><a href="https://wa.me/595961499450" rel="noopener" target="_blank">WhatsApp 0961&nbsp;499450<span class="visually-hidden"> (se abre en una pestaña nueva)</span></a> <span class="pie-nota">(solo mensajes)</span></span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg><span><a href="mailto:ctn@mec.edu.py">ctn@mec.edu.py</a></span></li>
        <li><svg class="ico-relleno" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.9.3-1.6 1.6-1.6h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H8v3h2.5V21h3z"/></svg><span><a href="https://www.facebook.com/p/Colegio-T%C3%A9cnico-Nacional-de-Asunci%C3%B3n-61551405140707/" rel="noopener" target="_blank">Facebook<span class="visually-hidden"> del CTN (se abre en una pestaña nueva)</span></a></span></li>
      </ul>
    </div>
  </div>
  <p class="derechos">&copy; <span class="anio-actual">2026</span> Colegio Técnico Nacional de Asunción · Sitio desarrollado por la especialidad de Informática.</p>
</div>
`;

  /* Año actual en «© 2026 …» */
  var anio = pie.querySelector('.anio-actual');
  if (anio) { anio.textContent = String(new Date().getFullYear()); }
})();
