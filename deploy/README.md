# Publicar el sitio del CTN en el servidor

El servidor (Arch Linux) sirve el sitio con **Nginx** en `127.0.0.1:8080` y **Tailscale Funnel**
lo expone a internet. Las versiones se guardan en `/srv/ctn/releases/` y Nginx lee siempre
`/srv/ctn/actual` (un enlace a la versión vigente).

## Una sola vez (instalación)

```bash
sudo pacman -S --needed git nginx
sudo mkdir -p /srv/ctn && sudo chown pagctn:pagctn /srv/ctn

# Bajar los dos archivos de esta carpeta
curl -fsSL https://raw.githubusercontent.com/milena-nunez/Proyecto-P-gina-Web/main/deploy/ctn-deploy.sh -o ~/ctn-deploy.sh
curl -fsSL https://raw.githubusercontent.com/milena-nunez/Proyecto-P-gina-Web/main/deploy/nginx.conf   -o ~/nginx.conf

sudo install -m 755 ~/ctn-deploy.sh /usr/local/bin/ctn-deploy
sudo install -m 644 ~/nginx.conf /etc/nginx/nginx.conf

ctn-deploy                                   # primera publicación
sudo nginx -t && sudo systemctl enable --now nginx
sudo systemctl restart nginx
curl -sI http://127.0.0.1:8080/ | head -n 1  # debe decir 200 OK
sudo tailscale funnel --bg --https=8443 http://127.0.0.1:8080
```

## Publicación automática (cada 5 minutos)

Un temporizador de systemd (`ctn-deploy.timer`) corre `ctn-deploy auto` cada 5 minutos: si hay un commit
nuevo en la rama `main` lo publica, y si no hay cambios no hace nada. Todo lo que llegue a `main` sale publicado
solo, en unos minutos.

Instalación (una sola vez, en el servidor):

```bash
curl -fsSL https://raw.githubusercontent.com/milena-nunez/Proyecto-P-gina-Web/main/deploy/ctn-deploy.sh -o ~/ctn-deploy.sh
curl -fsSL https://raw.githubusercontent.com/milena-nunez/Proyecto-P-gina-Web/main/deploy/ctn-deploy.service -o ~/ctn-deploy.service
curl -fsSL https://raw.githubusercontent.com/milena-nunez/Proyecto-P-gina-Web/main/deploy/ctn-deploy.timer -o ~/ctn-deploy.timer
sudo install -m 755 ~/ctn-deploy.sh /usr/local/bin/ctn-deploy
sudo install -m 644 ~/ctn-deploy.service ~/ctn-deploy.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ctn-deploy.timer
```

Para ver que funciona:

```bash
systemctl list-timers ctn-deploy.timer        # muestra cuándo corre la próxima vez
journalctl -u ctn-deploy -n 20 --no-pager     # historial de las últimas corridas
ctn-deploy estado                             # qué versión está publicada
```

Para publicar otra rama (por ejemplo `produccion`), cambiar `CTN_RAMA` en `/etc/systemd/system/ctn-deploy.service`,
y luego `sudo systemctl daemon-reload`.

## Publicar a mano (sin esperar los 5 minutos)

```bash
ssh pagctn@100.107.39.92 ctn-deploy
```

## Si algo sale mal

```bash
ssh pagctn@100.107.39.92 ctn-deploy volver   # vuelve a la versión anterior y PAUSA la publicación automática
ssh pagctn@100.107.39.92 ctn-deploy estado   # qué versión está publicada
```

Después de `volver`, la publicación automática queda **en pausa** (si no, en 5 minutos se volvería a publicar la
versión con el problema). Cuando el problema esté arreglado en GitHub, correr `ctn-deploy` a mano: publica la versión
nueva y reactiva la automática.

## Qué se publica

Solo la carpeta `Modificacion del proyecto 2/` (sin `mail/`). Se guardan las últimas 5 versiones.
Para cambiar qué carpetas se excluyen, editar `EXCLUIR` en `ctn-deploy.sh`.
