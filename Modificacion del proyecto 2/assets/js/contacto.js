/* ==========================================================================
   CTN · Formulario de contacto
   --------------------------------------------------------------------------
   Valida los campos con las reglas del navegador (required, type="email"...)
   y envía los datos a la dirección indicada en el atributo "action" del
   formulario (por defecto mail/contact_me.php).

   Los mensajes de error de cada campo se escriben en el HTML, en el atributo
   data-mensaje-requerido. El mensaje de "enviado" solo aparece si el servidor
   respondió que todo salió bien.
   ========================================================================== */
(function () {
  'use strict';

  var formulario = document.getElementById('contactForm');
  if (!formulario) { return; }

  var respuesta = document.getElementById('respuesta-formulario');
  var botonEnviar = formulario.querySelector('button[type="submit"]');
  var DIRECCION = formulario.getAttribute('action') || 'mail/contact_me.php';
  var TELEFONO = '(021) 608 663';


  /* ---------- Mensajes ---------- */

  function mostrarRespuesta(tipo, texto) {          // tipo: 'success' | 'danger'
    respuesta.className = 'alert alert-' + tipo;
    respuesta.textContent = texto;
  }

  function limpiarErrores() {
    respuesta.className = '';
    respuesta.textContent = '';
    Array.prototype.forEach.call(formulario.elements, function (campo) {
      limpiarCampo(campo);
      campo.removeAttribute('aria-invalid');
    });
  }

  /** Quita el estado de error (borde rojo y mensaje) del grupo al que pertenece el campo. */
  function limpiarCampo(campo) {
    var grupo = campo.closest && campo.closest('.form-group');
    if (!grupo) { return; }
    grupo.classList.remove('has-error');
    var ayuda = grupo.querySelector('.help-block');
    if (ayuda) { ayuda.textContent = ''; }
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
      var grupo = campo.closest('.form-group');
      grupo.classList.add('has-error');
      grupo.querySelector('.help-block').textContent = mensajeDeError(campo);
      campo.setAttribute('aria-invalid', 'true');
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
    fetch(DIRECCION, { method: 'POST', body: new FormData(formulario) })
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
  formulario.addEventListener('input', function (evento) {
    limpiarCampo(evento.target);
  });
})();
