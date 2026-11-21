#!/bin/sh
# Genera i PDF «Scarica il PDF» delle lettere: lettera + analisi, dalle stesse
# assets/lettere/*.md del sito (pagine di stampa /lettere/stampa/<nome>/).
# Scrive static/lettere/lettera-<nome>-con-analisi.pdf; non tocca gli altri PDF.
# Uso: ./genera_pdf_lettere.sh   (poi controlla i PDF e fai il commit)
set -e
cd "$(dirname "$0")"

# Hugo: il binario dentro lo snap funziona anche dove «snap run» è bloccato
HUGO=$([ -x /snap/hugo/current/bin/hugo ] && echo /snap/hugo/current/bin/hugo || command -v hugo)
# Chrome/Chromium: $CHROME se impostato, altrimenti quello di Playwright (non snap), altrimenti quello di sistema
PW_CHROME=$(ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux*/chrome 2>/dev/null | tail -n 1)
CHROME=${CHROME:-$(command -v google-chrome || echo "${PW_CHROME:-$(command -v chromium || command -v chromium-browser)}")}
PORTA=${PORTA:-18391}
NOMI=$(sed -n 's/^  - nome: "\(.*\)"$/\1/p' content/lettere.md)

BUILD=$(mktemp -d)
trap 'kill $SERVER 2>/dev/null; rm -rf "$BUILD"' EXIT INT TERM

"$HUGO" --quiet --minify -d "$BUILD" --baseURL "http://127.0.0.1:$PORTA/"
python3 -m http.server "$PORTA" --bind 127.0.0.1 -d "$BUILD" >/dev/null 2>&1 &
SERVER=$!
sleep 1

for nome in $NOMI; do
  out="static/lettere/lettera-$nome-con-analisi.pdf"
  # chromium snap scrive solo nella home: il PDF va direttamente nel repository
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw \
    --virtual-time-budget=5000 --print-to-pdf="$PWD/$out" "http://127.0.0.1:$PORTA/lettere/stampa/$nome/" 2>/dev/null
  echo "$out"
done
