---
title: "Lettere"
sottotitolo: "Ho scritto a tre persone. Ognuna può leggere quello che ho scritto alle altre."
layout: "lettere"
noindex: true
# Niente linguette «Aiuta Uroboro» ai lati in questa pagina
linguette: false
sitemap:
  disable: true
# L'ordine delle lettere nella pagina. Il testo di ognuna sta in assets/lettere/<nome>.md
lettere:
  - nome: "papa"
    a: "Papa Leone XIV"
    # PDF con lettera e analisi, generato da genera_pdf_lettere.sh
    pdf: "lettere/lettera-papa-con-analisi.pdf"
    analisi:
      file: "papa-analisi"
      etichetta: "la poesia e l'algoritmo evangelico"
  - nome: "vasco"
    a: "Vasco Rossi"
    pdf: "lettere/lettera-vasco-con-analisi.pdf"
    # Analisi di una canzone, nascosta dietro un bottone: testo in assets/lettere/<file>.md
    analisi:
      file: "vasco-analisi"
      canzone: "Vivere o Niente"
  - nome: "elisa"
    a: "Elisa"
    pdf: "lettere/lettera-elisa-con-analisi.pdf"
    analisi:
      file: "elisa-analisi"
      canzone: "Qualcosa che non c'è"
---
