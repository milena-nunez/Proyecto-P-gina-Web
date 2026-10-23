# Servidor del formulario de Contacto (Node.js)

Recibe lo que se escribe en `contact2.html`, lo valida y lo envía por correo a
`MAIL_TO`. Reemplaza a `mail/contact_me.php`: si usan este servidor, esa carpeta
`mail/` ya no se sube al hosting y el sitio queda 100 % estático.

## Qué hace (y qué no)
- Valida nombre, correo, teléfono y mensaje; limita el largo de cada campo.
- Campo trampa (`sitio_web`) contra robots.
- Máximo 5 envíos cada 15 minutos por IP.
- Solo acepta pedidos desde las páginas de `ALLOWED_ORIGINS`.
- Quita saltos de línea de nombre/correo/teléfono (evita inyección de cabeceras).
- La contraseña del correo vive en `.env`, nunca en el código ni en Git.
- No guarda mensajes en ningún lado: solo los reenvía por correo.

## 1. Probarlo en tu computadora (sin enviar correos)
Requiere Node.js 20 o más nuevo (https://nodejs.org).
```
cd servidor-contacto
npm install
npm run prueba
```
Queda escuchando en `http://localhost:3001`. Abre el sitio con Live Server,
envía el formulario y verás en la terminal el correo que se *habría* enviado.
Comprobación rápida: `http://localhost:3001/salud` debe responder `{"ok":true}`.

Para probar con correo real, copia `.env.example` a `.env`, complétalo y usa `npm start`.

## 2. Datos que hay que conseguir antes de publicar
1. **Casilla de envío** en el dominio (por ejemplo `contacto@ctnasuncion.edu.py`) y sus datos SMTP
   (servidor, puerto, usuario y contraseña). Los da quien administra el correo del dominio.
   Alternativa: Gmail con "contraseña de aplicación" (exige verificación en dos pasos).
2. **Dominio o subdominio** para el servidor, por ejemplo `api.ctnasuncion.edu.py`,
   apuntando a la IP del servidor.
3. **Quién lo administra** (actualizaciones, reinicios, renovar certificado).

## 3. Instalarlo en un servidor Linux (Ubuntu/Debian)
```
# Node.js LTS: instalarlo con el método oficial de https://nodejs.org
sudo useradd --system --home /opt/ctn-contacto --shell /usr/sbin/nologin ctn
sudo mkdir -p /opt/ctn-contacto
# copiar aquí server.js, package.json y package-lock.json
cd /opt/ctn-contacto && sudo npm ci --omit=dev
sudo cp .env.example .env && sudo nano .env          # completar los datos
sudo chown -R ctn:ctn /opt/ctn-contacto && sudo chmod 600 /opt/ctn-contacto/.env

sudo cp deploy/ctn-contacto.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ctn-contacto
sudo systemctl status ctn-contacto                   # debe decir "active (running)"

# HTTPS con Nginx
sudo apt install nginx certbot python3-certbot-nginx
sudo cp deploy/nginx-contacto.conf /etc/nginx/sites-available/ctn-contacto
sudo ln -s /etc/nginx/sites-available/ctn-contacto /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.ctnasuncion.edu.py
```
Firewall: abrir solo los puertos 80 y 443 (y el de administración). El puerto 3001 NO se abre.

Servidor Windows: instalar Node.js y ejecutar el servidor como servicio con
NSSM o PM2; el resto (HTTPS y firewall) es igual en concepto.

## 4. Conectar el sitio
En `assets/js/config.js`, poner la dirección pública:
```
contactoUrl: 'https://api.ctnasuncion.edu.py/contacto'
```
(en tu computadora usa `http://localhost:3001/contacto` automáticamente).

## 5. Mantenimiento
- Cada 1 o 2 meses: `npm audit` y `npm update`, y reiniciar con `sudo systemctl restart ctn-contacto`.
- Mantener Node.js en una versión LTS vigente y el sistema operativo actualizado.
- Ver errores: `sudo journalctl -u ctn-contacto -n 50`.
- Si cambian la contraseña del correo, actualizar `.env` y reiniciar el servicio.
- Que haya al menos dos personas con acceso al servidor.
