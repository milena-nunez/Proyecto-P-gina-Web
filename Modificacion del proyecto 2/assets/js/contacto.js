/* ==========================================================================
   CTN · Formulario de contacto
   --------------------------------------------------------------------------
   Valida los campos con las reglas del navegador (required, type="email"...)
   y envía los datos al servidor de contacto. La dirección se toma, en orden, de:
     1. CTN_CONFIG.contactoUrl (assets/js/config.js)  <- la que hay que configurar
     2. el atributo "action" del formulario (por defecto mail/contact_me.php).

   Los mensajes de error de cada campo se escriben en el HTML, en el atributo
   data-mensaje-requerido. El mensaje de "enviado" solo aparece si el servidor
   respondió que todo salió bien.

   Estructura esperada de cada campo:
     <div class="campo form-floating"> <input class="form-control">
       <label></label> <div class="invalid-feedback"></div> </div>
   ========================================================================== */
(function () {
  'use strict';

  var formulario = document.getElementById('contactForm');
  if (!formulario) { return; }

  var respuesta = document.getElementById('respuesta-formulario');
  var botonEnviar = formulario.querySelector('button[type="submit"]');
  var DIRECCION = (window.CTN_CONFIG && window.CTN_CONFIG.contactoUrl) || formulario.getAttribute('action') || 'mail/contact_me.php';
  var TELEFONO = '0961 499450';


  /* ---------- Mensajes ---------- */

  function mostrarRespuesta(tipo, texto) {          // tipo: 'success' | 'danger'
    respuesta.className = 'alert alert-' + tipo;
    respuesta.textContent = texto;
  }

  /** Quita el estado de error (borde rojo y mensaje) de un campo. */
  function limpiarCampo(campo) {
    if (!campo.classList) { return; }
    campo.classList.remove('is-invalid');
    campo.removeAttribute('aria-invalid');
    var grupo = campo.closest('.campo');
    var ayuda = grupo && grupo.querySelector('.invalid-feedback');
    if (ayuda) { ayuda.textContent = ''; }
  }

  function limpiarErrores() {
    respuesta.className = '';
    respuesta.textContent = '';
    Array.prototype.forEach.call(formulario.elements, limpiarCampo);
  }

  function mensajeDeError(campo) {
    if (campo.validity.valueMissing) {
      return campo.getAttribute('data-mensaje-requerido') || 'Este campo es obligatorio.';
    }
    if (campo.validity.typeMismatch) { return 'El formato no es válido.'; }
    return campo.validationMessage;
  }


  /* ---------- Validación ---------- */

  function validar() {
    var primerError = null;
    Array.prototype.forEach.call(formulario.elements, function (campo) {
      if (!campo.willValidate || campo.checkValidity()) { return; }
      var grupo = campo.closest('.campo');
      campo.classList.add('is-invalid');
      campo.setAttribute('aria-invalid', 'true');
      if (grupo) { grupo.querySelector('.invalid-feedback').textContent = mensajeDeError(campo); }
      primerError = primerError || campo;
    });
    if (primerError) { primerError.focus(); }
    return !primerError;
  }


  /* ---------- Envío ---------- */

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    limpiarErrores();
    if (!validar()) { return; }

    botonEnviar.disabled = true;
    fetch(DIRECCION, { method: 'POST', body: new URLSearchParams(new FormData(formulario)) })   // formato que entienden tanto el servidor Node como PHP
      .then(function (r) {
        if (!r.ok) { throw new Error('El servidor respondió ' + r.status); }
        mostrarRespuesta('success', '¡Gracias! Tu mensaje fue enviado. Te responderemos a tu correo lo antes posible.');
        formulario.reset();
      })
      .catch(function () {
        mostrarRespuesta('danger', 'No pudimos enviar tu mensaje en este momento. Inténtalo de nuevo más tarde o llámanos al ' + TELEFONO + '.');
      })
      .then(function () { botonEnviar.disabled = false; });
  });

  // Al empezar a escribir de nuevo, se limpia el aviso anterior
  formulario.addEventListener('input', function (evento) { limpiarCampo(evento.target); });
})();
