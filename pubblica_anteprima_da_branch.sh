#!/bin/sh
# Pubblica un'anteprima NON indicizzata di un branch in
# https://hacking4love.it/<cartella>/ (sottocartella di gh-pages).
#
# Uso:  ./pubblica_anteprima_da_branch.sh [--prova] [branch] [cartella]
#   --prova  compila e mostra cosa cambierebbe, senza committare né pushare
#   branch   default: il branch corrente (usa solo i commit, non le modifiche non salvate)
#   cartella default: anteprima-1002ce04
#
# Cosa fa: compila il branch con Hugo, aggiunge noindex a tutte le pagine,
# toglie CNAME/robots.txt/CV, sostituisce solo <cartella>/ in gh-pages,
# aggiunge «Disallow: /<cartella>/» al robots.txt principale, committa e pusha gh-pages.
# Il resto del sito pubblico (radice di gh-pages) non viene toccato.
# Nota: ./pubblica.sh ricrea gh-pages da zero e cancella l'anteprima.
set -e
cd "$(dirname "$0")"

PROVA=""
[ "$1" = "--prova" ] && { PROVA=1; shift; }
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
CARTELLA="${2:-anteprima-1002ce04}"
BASE="https://hacking4love.it/$CARTELLA/"

case "$CARTELLA" in ""|*/*|.*) echo "Cartella non valida: $CARTELLA" >&2; exit 1;; esac
git rev-parse -q --verify "refs/heads/$BRANCH" >/dev/null || { echo "Branch inesistente: $BRANCH" >&2; exit 1; }
git rev-parse -q --verify refs/heads/gh-pages >/dev/null || { echo "Manca il branch gh-pages" >&2; exit 1; }

# Hugo installato come snap non può scrivere in /tmp né in cartelle nascoste: si lavora in ~
TMP="$HOME/h4l-anteprima-tmp-$$"
SRC="$TMP/sorgente"; OUT="$TMP/sito"; GHP="$TMP/gh-pages"
pulisci() {
  git worktree remove --force "$SRC" 2>/dev/null || true
  git worktree remove --force "$GHP" 2>/dev/null || true
  rm -rf "$TMP"
}
trap pulisci EXIT INT TERM
mkdir -p "$TMP"

echo "» Compilo $BRANCH ($(git rev-parse --short "$BRANCH")) per $BASE"
git worktree add -q --detach "$SRC" "$BRANCH"
hugo --gc --minify -s "$SRC" -d "$OUT" --baseURL "$BASE"

rm -f "$OUT/CNAME" "$OUT/robots.txt" "$OUT"/documenti/cv-*.pdf
find "$OUT" -name '*.html' -exec sed -i 's|<head>|<head><meta name="robots" content="noindex,nofollow">|' {} +

echo "» Aggiorno gh-pages/$CARTELLA"
git worktree add -q "$GHP" gh-pages
rm -rf "$GHP/$CARTELLA"
cp -r "$OUT" "$GHP/$CARTELLA"
touch "$GHP/robots.txt"
grep -qx "Disallow: /$CARTELLA/" "$GHP/robots.txt" || {
  grep -qx "User-agent: \*" "$GHP/robots.txt" || printf 'User-agent: *\n' >> "$GHP/robots.txt"
  printf 'Disallow: /%s/\n' "$CARTELLA" >> "$GHP/robots.txt"
}

git -C "$GHP" add -A "$CARTELLA" robots.txt
if [ -n "$PROVA" ]; then
  echo "» Prova: ecco cosa cambierebbe in gh-pages (niente commit, niente push)"
  git -C "$GHP" diff --cached --stat | tail -15
elif git -C "$GHP" diff --cached --quiet; then
  echo "» Nessuna modifica: l'anteprima è già aggiornata."
else
  git -C "$GHP" commit -q -m "Anteprima non indicizzata di $BRANCH ($(git rev-parse --short "$BRANCH"))"
  git push origin gh-pages
  echo "» Fatto: $BASE (GitHub Pages ci mette 1-2 minuti)"
fi
