#!/usr/bin/env python3
"""Cifra le tappe riservate del percorso con una password.

Le tappe riservate stanno in privato/tappe-riservate.yaml, che NON va in git
(la cartella privato/ ha un suo .gitignore). Questo script le cifra e scrive
data/tappe_cifrate.json, che invece si committa: senza la password è illeggibile.
Nella pagina «Il mio percorso» chi ha la password le apre nel browser.

Uso (dopo ogni modifica alle tappe riservate, o per cambiare password):
    ./cifra_tappe_riservate.py
    git add data/tappe_cifrate.json && git commit -m "Percorso: tappe riservate aggiornate"

La password viene chiesta senza mostrarla e non viene salvata da nessuna parte.
Per prove automatiche si può passare con la variabile TAPPE_PASSWORD.

Cifratura: AES-256-GCM, chiave da PBKDF2-SHA256 con 600000 iterazioni,
salt e IV casuali a ogni esecuzione. Gli stessi parametri li usa
assets/js/main.js (Web Crypto) per decifrare.
Serve Python 3 con i moduli yaml e cryptography (python3-yaml, python3-cryptography).
"""
import base64, getpass, json, os, sys

import yaml
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

QUI = os.path.dirname(os.path.abspath(__file__))
SORGENTE = os.path.join(QUI, "privato", "tappe-riservate.yaml")
DESTINAZIONE = os.path.join(QUI, "data", "tappe_cifrate.json")
ITERAZIONI = 600000


def b64(b):
    return base64.b64encode(b).decode("ascii")


def main():
    if not os.path.exists(SORGENTE):
        sys.exit("Manca " + SORGENTE)
    with open(SORGENTE, encoding="utf-8") as f:
        tappe = yaml.safe_load(f) or []
    campi = ("quando", "titolo", "tipo", "testo", "chiave")
    tappe = [{k: t[k] for k in campi if k in t} for t in tappe]

    password = os.environ.get("TAPPE_PASSWORD")
    if not password:
        password = getpass.getpass("Password per le tappe riservate: ")
        if password != getpass.getpass("Ripeti la password: "):
            sys.exit("Le due password non coincidono.")
    if len(password) < 8:
        sys.exit("Password troppo corta: almeno 8 caratteri (meglio una frase).")

    salt, iv = os.urandom(16), os.urandom(12)
    chiave = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERAZIONI).derive(password.encode("utf-8"))
    dati = AESGCM(chiave).encrypt(iv, json.dumps(tappe, ensure_ascii=False).encode("utf-8"), None)

    with open(DESTINAZIONE, "w", encoding="utf-8") as f:
        json.dump({"salt": b64(salt), "iv": b64(iv), "iter": ITERAZIONI, "dati": b64(dati)}, f, indent=1)
        f.write("\n")
    print("Cifrate %d tappe in %s" % (len(tappe), os.path.relpath(DESTINAZIONE, QUI)))


if __name__ == "__main__":
    main()
