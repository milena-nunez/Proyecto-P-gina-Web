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

## Cada vez que se cambia el sitio

1. Hacer commit y push a `main` en GitHub.
2. Publicar:
   ```bash
   ssh pagctn@100.107.39.92 ctn-deploy
   ```

## Si algo sale mal

```bash
ssh pagctn@100.107.39.92 ctn-deploy volver   # vuelve a la versión anterior
ssh pagctn@100.107.39.92 ctn-deploy estado   # qué versión está publicada
```

## Qué se publica

Solo la carpeta `Modificacion del proyecto 2/` (sin `mail/`). Se guardan las últimas 5 versiones.
Para cambiar qué carpetas se excluyen, editar `EXCLUIR` en `ctn-deploy.sh`.
