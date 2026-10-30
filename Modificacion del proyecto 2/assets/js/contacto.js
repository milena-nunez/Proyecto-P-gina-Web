/* ==========================================================================
   CTN · Formulario de contacto (por WhatsApp)
   --------------------------------------------------------------------------
   Valida los campos con las reglas del navegador (required, maxlength...) y, si
   todo está bien, abre WhatsApp con el mensaje ya escrito hacia el número del
   colegio. La persona solo tiene que tocar «Enviar» en WhatsApp. No hay servidor
   ni correo de por medio.

   El número se escribe en assets/js/config.js (CTN_CONFIG.whatsapp), con código
   de país y sin «+» ni espacios.

   Los mensajes de error de cada campo se escriben en el HTML, en el atributo
   data-mensaje-requerido.

   Estructura esperada de cada campo:
     <div class="campo form-floating"> <input class="form-control">
       <label></label> <div class="invalid-feedback"></div> </div>
   ========================================================================== */
(function () {
  'use strict';

  var formulario = document.getElementById('contactForm');
  if (!formulario) { return; }

  var respuesta = document.getElementById('respuesta-formulario');
  var NUMERO = ((window.CTN_CONFIG && window.CTN_CONFIG.whatsapp) || '595961499450').replace(/\D/g, '');


  /* ---------- Mensajes ---------- */

  function mostrarRespuesta(tipo, texto) {          // tipo: 'success' | 'danger'
    respuesta.className = 'alert alert-' + tipo;
    respuesta.textContent = texto;
  }

  /** Aviso de «se abrió WhatsApp», con un enlace por si el navegador bloqueó la ventana. */
  function mostrarAvisoWhatsapp(direccion) {
    respuesta.className = 'alert alert-success';
    respuesta.textContent = 'Se abrió WhatsApp con su mensaje. Toque «Enviar» allí para que nos llegue. ¿No se abrió? ';
    var enlace = document.createElement('a');
    enlace.href = direccion;
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    enlace.textContent = 'Abrir WhatsApp';
    respuesta.appendChild(enlace);
    respuesta.appendChild(document.createTextNode('.'));
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

  /** Arma el texto que llega al WhatsApp del colegio. */
  function armarTexto() {
    var nombre = formulario.elements.name.value.trim();
    var mensaje = formulario.elements.message.value.trim();
    return 'Hola, soy ' + nombre + '.\n\n' + mensaje + '\n\n(Mensaje enviado desde el sitio web del CTN)';
  }

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    limpiarErrores();
    if (!validar()) { return; }

    var direccion = 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(armarTexto());
    var ventana = window.open(direccion, '_blank');   // (con 'noopener' el navegador siempre devuelve null)
    if (ventana) { ventana.opener = null; }
    mostrarAvisoWhatsapp(direccion);
    if (!ventana) { /* ventana bloqueada: queda el enlace del aviso */ return; }
    formulario.reset();
  });

  // Al empezar a escribir de nuevo, se limpia el aviso anterior
  formulario.addEventListener('input', function (evento) { limpiarCampo(evento.target); });
})();
