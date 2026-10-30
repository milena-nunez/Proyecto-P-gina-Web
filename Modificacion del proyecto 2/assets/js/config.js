/* ==========================================================================
   CTN · Configuración del sitio
   --------------------------------------------------------------------------
   Único lugar donde se escribe la dirección del servidor (backend).
   Cargar ANTES de noticias.js y espe.js.
   ========================================================================== */
window.CTN_CONFIG = {

  /* Dirección del servidor (Node/Express) que entrega las noticias del inicio
     y los puntajes del test vocacional.

     • En tu computadora (localhost) se usa solo el servidor local: http://localhost:3000
     • Al PUBLICAR el sitio, escribe aquí la dirección pública del servidor,
       por ejemplo:  'https://api.ctn.edu.py'
       (si el sitio usa https://, esta dirección también debe usar https://).
     • Si queda vacío (''), esas secciones no intentan conectarse: en el inicio se
       muestra el aviso fijo y en Especialidades se oculta el gráfico. */
  apiUrl: (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:')
    ? 'http://localhost:3000'
    : '',

  /* Número de WhatsApp que recibe los mensajes del formulario de Contacto.
     Va con el código de país y SIN "+", espacios ni guiones.
     Ejemplo: 0961 499450 (Paraguay) -> '595961499450' */
  whatsapp: '595961499450'
};
