<?php
/* ==========================================================================
   CTN · Recibe el formulario de Contacto y lo envía por correo al colegio
   --------------------------------------------------------------------------
   Lo llama assets/js/contacto.js (POST con name, email, phone y message).
   Responde 200 si el correo salió y un código de error (400, 405, 500) si no:
   la página solo muestra "enviado" cuando recibe 200.

   Qué cambiar:
     DESTINO    correo del colegio que recibe los mensajes
     REMITENTE  dirección DESDE la que sale el correo. Debe ser una cuenta
                del mismo dominio del hosting (si no, muchos servidores lo
                rechazan o lo mandan a spam). La persona que escribió queda
                como "Responder a", así que basta con pulsar Responder.
   Requiere PHP con la función mail() activa (lo normal en cPanel).
   ========================================================================== */
declare(strict_types=1);

const DESTINO   = 'ctnasuncion1980@gmail.com';
const REMITENTE = 'no-responder@ctnasuncion.edu.py';
const ASUNTO    = 'Mensaje desde la página web del CTN';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function responder(int $codigo, bool $ok, string $mensaje): never
{
    http_response_code($codigo);
    echo json_encode(['ok' => $ok, 'mensaje' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Texto de un campo del formulario: sin caracteres de control y con largo máximo. */
function campo(string $clave, int $maximo): string
{
    $valor = $_POST[$clave] ?? '';
    if (!is_string($valor)) { return ''; }
    $valor = preg_replace('/[^\P{C}\n\r\t]+/u', '', $valor) ?? '';
    return mb_substr(trim($valor), 0, $maximo);
}

/** Para datos que van en una sola línea (nombre, correo, teléfono): quita los saltos de línea. */
function enUnaLinea(string $texto): string
{
    return trim(preg_replace('/\s+/u', ' ', $texto) ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder(405, false, 'Método no permitido.');
}

// Campo trampa que las personas no ven: si viene con algo, es un robot. Se le responde "ok" y no se envía nada.
if (campo('sitio_web', 200) !== '') {
    responder(200, true, 'Enviado.');
}

$nombre   = enUnaLinea(campo('name', 100));
$email    = enUnaLinea(campo('email', 150));
$telefono = enUnaLinea(campo('phone', 40));
$mensaje  = campo('message', 3000);

if ($nombre === '' || $telefono === '' || $mensaje === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(400, false, 'Faltan datos o el correo no es válido.');
}

$cuerpo = "Nombre: $nombre\nCorreo: $email\nTeléfono: $telefono\n\nMensaje:\n$mensaje\n";
$asunto = '=?UTF-8?B?' . base64_encode(ASUNTO . ' - ' . $nombre) . '?=';
$cabeceras = implode("\r\n", [
    'From: =?UTF-8?B?' . base64_encode('Página web CTN') . '?= <' . REMITENTE . '>',
    'Reply-To: ' . $email,              // ya validado y sin saltos de línea
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
]);

if (!mail(DESTINO, $asunto, chunk_split(base64_encode($cuerpo)), $cabeceras, '-f' . REMITENTE)) {
    error_log('CTN contacto: mail() devolvió false');
    responder(500, false, 'No se pudo enviar el mensaje.');
}

responder(200, true, 'Enviado.');
