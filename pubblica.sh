#!/bin/sh
# Pubblica il sito senza GitHub Actions: compila con Hugo in locale
# e mette il risultato (public/) sul branch gh-pages, senza toccare
# il working tree. In GitHub: Settings → Pages → "Deploy from a branch",
# branch gh-pages, cartella / (root).
set -e
cd "$(dirname "$0")"

rm -rf public
hugo --gc --minify
touch public/.nojekyll

export GIT_INDEX_FILE="$(mktemp -u)"
git add -f public
tree=$(git write-tree --prefix=public/)
rm -f "$GIT_INDEX_FILE"

parent=$(git rev-parse -q --verify refs/heads/gh-pages || true)
msg="Sito compilato da $(git rev-parse --short HEAD)"
commit=$(git commit-tree "$tree" ${parent:+-p "$parent"} -m "$msg")
git update-ref refs/heads/gh-pages "$commit"
git push origin gh-pages
