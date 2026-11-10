# hacking4love.it

Sito statico fatto con [Hugo](https://gohugo.io). Il puzzle è JavaScript semplice, senza framework.

## Provarlo in locale

    hugo server

Poi apri http://localhost:1313

## Dove si cambiano le cose

| Cosa | File |
|---|---|
| Testi della home (manifesto, Gesù della Canzone, contatti) | `layouts/index.html` |
| Sigilli del puzzle: domande, articoli-indizio, racconti | `data/puzzle.yaml` |
| Tappe della pagina "Come l'ho risolto" | `data/tappe.yaml` |
| Email, sito personale, Telegram | `hugo.toml` → `[params]` |
| Colori e stile | `assets/css/main.css` |
| Logica del puzzle | `assets/js/puzzle.js` |
| Immagine del puzzle | `static/img/uomo-uroboro.jpg` (3:2, es. 1200×800) |

## Le parole-chiave del puzzle

Nel sito non c'è la parola, solo il suo hash SHA-256. La parola viene normalizzata
(minuscolo, senza accenti, senza spazi ai lati), quindi "Responsabilità" e "responsabilita" valgono uguale.

    echo -n "nuovaparola" | sha256sum

Copia il risultato nel campo `hash` del sigillo in `data/puzzle.yaml`. Per accettare anche un sinonimo
aggiungi il suo hash nella lista `alias` dello stesso sigillo.
Le parole attuali: bellezza, sharing is caring, ridere di te, liberta (una per articolo-indizio).

Nota onesta: un hash di una parola italiana comune si indovina con un dizionario in pochi secondi.
Per un gioco va bene; non usarlo per proteggere niente di serio.

## Pubblicare su hacking4love.it

**GitHub Pages** (già pronto): crea il repository, fai push su `main`, in Settings → Pages scegli
"GitHub Actions". Il file `static/CNAME` dice già a GitHub il dominio. Dal pannello del registrar del dominio:

- record `A` per `hacking4love.it` verso 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
- record `CNAME` per `www` verso `<tuo-utente>.github.io`

In alternativa Netlify o Cloudflare Pages: comando di build `hugo --gc --minify`, cartella `public`.

## Copie archiviate

Copie datate del sito sulla Wayback Machine di Internet Archive, come prova pubblica di autorship e data:

| Data | Versione | Copia |
|---|---|---|
| 10 novembre 2026 | v0.4 | https://web.archive.org/web/20261110093337/https://hacking4love.it/ |

## Licenza

Codice: GNU AGPL v3 (vedi `LICENSE`). Testi: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/deed.it), Lucafero da Fabriano. Foto, video, nome e voce di Luca Ferroni: tutti i diritti riservati.
