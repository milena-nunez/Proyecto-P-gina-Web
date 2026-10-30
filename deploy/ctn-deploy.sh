#!/usr/bin/env bash
# ==========================================================================
# CTN · Publicar el sitio en el servidor
# --------------------------------------------------------------------------
#   ctn-deploy            publica la última versión del repo (y reactiva la
#                         publicación automática si estaba en pausa)
#   ctn-deploy auto       lo que corre el temporizador cada 5 minutos: publica
#                         solo si hay cambios nuevos, y no hace nada si la
#                         publicación automática está en pausa
#   ctn-deploy volver     vuelve a la versión anterior y PAUSA la publicación
#                         automática (si no, en 5 minutos se volvería a publicar
#                         la versión nueva)
#   ctn-deploy estado     muestra qué versión está publicada y cuáles hay
#
# Cómo funciona: guarda cada publicación en su propia carpeta
# (/srv/ctn/releases/FECHA-COMMIT) y Nginx lee siempre /srv/ctn/actual, que es
# un enlace a la versión vigente. El cambio de versión es instantáneo y el
# sitio nunca queda a medias.
# ==========================================================================
set -euo pipefail

REPO_URL="${CTN_REPO:-https://github.com/milena-nunez/Proyecto-P-gina-Web.git}"
RAMA="${CTN_RAMA:-main}"                     # rama que se publica
CARPETA_SITIO="Modificacion del proyecto 2"
BASE="${CTN_BASE:-/srv/ctn}"
MANTENER=5                                   # cuántas versiones se guardan
EXCLUIR=(mail)                               # carpetas del sitio que NO se publican

ACTUAL="$BASE/actual"
PAUSA="$BASE/PAUSADO"                        # si existe, el modo auto no publica
MODO="${1:-manual}"

publicar() {                                 # publicar CARPETA_DE_LA_VERSION
  ln -sfn "$1" "$BASE/.actual.tmp"
  mv -T -f "$BASE/.actual.tmp" "$ACTUAL"     # cambio atómico del enlace
}

if [ "$MODO" = "estado" ]; then
  echo "Publicada: $(readlink -f "$ACTUAL" 2>/dev/null || echo 'ninguna')"
  [ -e "$PAUSA" ] && echo "Publicación automática: EN PAUSA (corre «ctn-deploy» para reactivarla)" || echo "Publicación automática: activa"
  echo "Versiones guardadas (la más nueva primero):"
  ls -1dt "$BASE"/releases/* 2>/dev/null | sed 's/^/  /'
  exit 0
fi

mkdir -p "$BASE/releases"
exec 9>"$BASE/.lock"
flock -n 9 || { echo "Ya hay una publicación en curso."; exit 0; }   # evita dos a la vez

if [ "$MODO" = "volver" ]; then
  VIGENTE="$(readlink -f "$ACTUAL")"
  ANTERIOR="$(ls -1dt "$BASE"/releases/* | grep -A1 -Fx "$VIGENTE" | tail -n1)"
  if [ -z "$ANTERIOR" ] || [ "$ANTERIOR" = "$VIGENTE" ]; then
    echo "No hay una versión anterior guardada." >&2; exit 1
  fi
  publicar "$ANTERIOR"
  touch "$PAUSA"
  echo "Listo: se volvió a $(basename "$ANTERIOR")."
  echo "La publicación automática quedó EN PAUSA. Cuando el problema esté arreglado en GitHub, corre «ctn-deploy» para publicar y reactivarla."
  exit 0
fi

if [ "$MODO" = "auto" ] && [ -e "$PAUSA" ]; then exit 0; fi

# 1) Traer SOLO la carpeta del sitio (sin el historial pesado del repo)
if [ ! -d "$BASE/repo/.git" ]; then
  git clone --quiet --depth 1 --filter=blob:none --sparse --branch "$RAMA" "$REPO_URL" "$BASE/repo"
  git -C "$BASE/repo" sparse-checkout set "$CARPETA_SITIO"
else
  git -C "$BASE/repo" fetch --quiet --depth 1 origin "$RAMA"
  git -C "$BASE/repo" reset --quiet --hard FETCH_HEAD
fi
COMMIT="$(git -C "$BASE/repo" rev-parse --short HEAD)"

# 2) En modo auto, si esa versión ya está publicada no hay nada que hacer
if [ "$MODO" = "auto" ] && [ -e "$ACTUAL" ]; then
  PUBLICADO="$(basename "$(readlink -f "$ACTUAL")")"
  if [ "${PUBLICADO##*-}" = "$COMMIT" ]; then exit 0; fi
fi

# 3) Armar la versión nueva
NUEVA="$BASE/releases/$(date +%Y%m%d-%H%M%S)-$COMMIT"
mkdir -p "$NUEVA"
cp -a "$BASE/repo/$CARPETA_SITIO/." "$NUEVA/"
for carpeta in "${EXCLUIR[@]}"; do rm -rf "${NUEVA:?}/$carpeta"; done
if [ ! -f "$NUEVA/index.html" ]; then
  echo "ERROR: la versión nueva no tiene index.html; no se publica." >&2
  rm -rf "$NUEVA"; exit 1
fi
chmod -R a+rX "$NUEVA"

# 4) Publicarla, reactivar el modo auto y limpiar versiones viejas
publicar "$NUEVA"
rm -f "$PAUSA"
ls -1dt "$BASE"/releases/* | tail -n +"$((MANTENER + 1))" | xargs -r rm -rf
echo "Listo: publicada la versión $COMMIT ($(basename "$NUEVA"))."
