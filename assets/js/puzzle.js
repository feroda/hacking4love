/* Hacking 4 Love · il puzzle dell'UOMO. JavaScript semplice, nessuna dipendenza. */
(function () {
  var CHIAVE_SALVA = 'h4l-puzzle-v1';
  var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function normalizza(s) {
    return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
  }
  function sha256(testo) {
    if (!(window.crypto && crypto.subtle)) return Promise.reject(new Error('nocrypto'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(testo)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function mescola(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function aspetta(ms) { return new Promise(function (r) { setTimeout(r, ridotto ? Math.min(ms, 60) : ms); }); }
  function leggi() { try { return JSON.parse(localStorage.getItem(CHIAVE_SALVA)) || null; } catch (e) { return null; } }
  function scrivi(v) { try { localStorage.setItem(CHIAVE_SALVA, JSON.stringify(v)); } catch (e) {} }

  // Sposta un elemento con animazione FLIP
  function sposta(el, dest, prima) {
    var a = el.getBoundingClientRect();
    if (prima) dest.insertBefore(el, prima); else dest.appendChild(el);
    if (ridotto) return;
    var b = el.getBoundingClientRect();
    var dx = a.left - b.left, dy = a.top - b.top, sx = a.width / (b.width || 1), sy = a.height / (b.height || 1);
    if (!dx && !dy) return;
    el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', transformOrigin: '0 0' },
                { transform: 'none', transformOrigin: '0 0' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }

  function Puzzle(root) {
    var cfg = JSON.parse(root.querySelector('.puzzle-cfg').textContent);
    var C = cfg.colonne, R = cfg.righe, N = C * R;
    var modo = root.dataset.mode;
    var tavola = root.querySelector('.tavola'), vassoio = root.querySelector('.vassoio');
    var vuoto = root.querySelector('.vassoio-vuoto'), contatore = root.querySelector('.contatore');
    var testoVuoto = vuoto.textContent, caselle = [], tessere = [], aperti = {}, scelta = null, risolto = false;

    // Caselle
    for (var i = 0; i < N; i++) {
      var cs = document.createElement('div');
      cs.className = 'casella'; cs.dataset.i = i;
      if (Math.floor(i / C) === 1) cs.dataset.lettera = cfg.sigilli[i % C] ? cfg.sigilli[i % C].lettera : '';
      cs.addEventListener('click', clicCasella);
      tavola.appendChild(cs); caselle.push(cs);
    }
    // Tessere: la colonna c appartiene al sigillo c (U · O · M · O)
    for (var k = 0; k < N; k++) {
      var r = Math.floor(k / C), c = k % C, t = document.createElement('button');
      t.type = 'button'; t.className = 'tessera'; t.dataset.id = k; t.dataset.sigillo = c;
      t.setAttribute('aria-label', 'Pezzo ' + (k + 1) + ', sigillo ' + cfg.sigilli[c].lettera);
      t.style.backgroundImage = 'url("' + cfg.immagine + '")';
      t.style.backgroundSize = (C * 100) + '% ' + (R * 100) + '%';
      t.style.backgroundPosition = (C > 1 ? c / (C - 1) * 100 : 0) + '% ' + (R > 1 ? r / (R - 1) * 100 : 0) + '%';
      t.addEventListener('click', clicTessera);
      tessere.push(t);
    }
    vassoio.addEventListener('click', function (e) { if (e.target === vassoio && scelta && scelta.parentNode !== vassoio) { sposta(scelta, vassoio); deseleziona(); dopoMossa(); } });

    function seleziona(t) { deseleziona(); scelta = t; t.classList.add('scelta'); root.classList.add('selezione'); }
    function deseleziona() { if (scelta) scelta.classList.remove('scelta'); scelta = null; root.classList.remove('selezione'); }

    function clicTessera(e) {
      e.stopPropagation();
      if (risolto || modo === 'replay') return;
      var t = e.currentTarget;
      if (scelta === t) return deseleziona();
      if (!scelta) return seleziona(t);
      // c'è già un pezzo scelto
      if (t.parentNode.classList.contains('casella')) { scambia(scelta, t); deseleziona(); dopoMossa(); }
      else seleziona(t);
    }
    function clicCasella(e) {
      if (risolto || modo === 'replay' || !scelta) return;
      var cs = e.currentTarget;
      if (cs.firstChild) return;
      sposta(scelta, cs); deseleziona(); dopoMossa();
    }
    function scambia(a, b) {
      var pa = a.parentNode, pb = b.parentNode, segnaposto = document.createElement('span');
      pa.insertBefore(segnaposto, a);
      sposta(a, pb, b); sposta(b, pa, segnaposto); pa.removeChild(segnaposto);
    }
    function aggiornaVassoio() {
      var n = vassoio.querySelectorAll('.tessera').length;
      vuoto.style.display = n ? 'none' : '';
      var liberati = tessere.filter(function (t) { return aperti[t.dataset.sigillo]; }).length;
      var posti = caselle.filter(function (cs) { return cs.firstChild && +cs.firstChild.dataset.id === +cs.dataset.i; }).length;
      contatore.textContent = posti + ' / ' + N + (liberati < N ? ' · ' + liberati + ' liberati' : '');
    }
    function dopoMossa() {
      caselle.forEach(function (cs) { var t = cs.firstChild; if (t) t.classList.toggle('giusta', +t.dataset.id === +cs.dataset.i); });
      tessere.forEach(function (t) { if (t.parentNode === vassoio) t.classList.remove('giusta'); });
      aggiornaVassoio();
      if (modo === 'gioca') salva();
      if (caselle.every(function (cs) { return cs.firstChild && +cs.firstChild.dataset.id === +cs.dataset.i; })) vittoria();
    }
    function salva() {
      var pos = {}; caselle.forEach(function (cs) { if (cs.firstChild) pos[cs.firstChild.dataset.id] = +cs.dataset.i; });
      scrivi({ aperti: Object.keys(aperti), pos: pos });
    }

    function apriSigillo(s, silenzioso) {
      if (aperti[s]) return;
      aperti[s] = true;
      var card = root.querySelector('[data-sigillo="' + s + '"]');
      card.classList.add('aperto'); card.classList.remove('errore');
      card.querySelector('.sigillo-stato').textContent = 'Aperto. I pezzi della ' + cfg.sigilli[s].lettera + ' sono liberi.';
      var nuove = tessere.filter(function (t) { return +t.dataset.sigillo === s; });
      nuove.forEach(function (t) {
        var esistenti = vassoio.querySelectorAll('.tessera');
        var dove = esistenti[Math.floor(Math.random() * (esistenti.length + 1))] || null;
        vassoio.insertBefore(t, dove);
        if (!silenzioso) { t.classList.remove('nuova'); void t.offsetWidth; t.classList.add('nuova'); }
      });
      aggiornaVassoio();
    }

    function vittoria() {
      if (risolto) return;
      risolto = true; deseleziona();
      root.classList.add('risolto');
      vuoto.textContent = 'Tutti i pezzi sono al loro posto. Il cerchio è chiuso.';
      if (modo === 'gioca') scrivi({ aperti: Object.keys(aperti), pos: {}, risolto: true });
      if (ridotto) return;
      setTimeout(function () {
        var r = tavola.getBoundingClientRect();
        for (var i = 0; i < 46; i++) scintilla(r.left + r.width / 2, r.top + r.height / 2);
      }, 2000);
    }
    function scintilla(x, y) {
      var s = document.createElement('span'); s.className = 'scintilla';
      s.style.left = x + 'px'; s.style.top = y + 'px'; document.body.appendChild(s);
      var ang = Math.random() * 6.283, d = 120 + Math.random() * 260;
      s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + Math.cos(ang) * d + 'px,' + Math.sin(ang) * d + 'px) scale(0)', opacity: 0 }],
        { duration: 1200 + Math.random() * 900, easing: 'cubic-bezier(.1,.8,.3,1)' }).onfinish = function () { s.remove(); };
    }

    function azzera() {
      risolto = false; root.classList.remove('risolto'); vuoto.textContent = testoVuoto; aperti = {}; deseleziona();
      tessere.forEach(function (t) { if (t.parentNode) t.parentNode.removeChild(t); t.classList.remove('giusta', 'nuova'); });
      root.querySelectorAll('.sigillo').forEach(function (card) {
        card.classList.remove('aperto', 'errore'); card.querySelector('.sigillo-stato').textContent = '';
        var inp = card.querySelector('input'); if (inp) inp.value = '';
        var f = card.querySelector('.finto-input'); if (f) f.textContent = '';
      });
      aggiornaVassoio();
    }

    // ---------- modalità gioco ----------
    if (modo === 'gioca') {
      root.querySelectorAll('.sigillo').forEach(function (card) {
        var s = +card.dataset.sigillo, form = card.querySelector('form'), stato = card.querySelector('.sigillo-stato');
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = normalizza(form.chiave.value);
          if (!v) return;
          sha256(v).then(function (h) {
            if (h === cfg.sigilli[s].hash) { apriSigillo(s); salva(); }
            else {
              card.classList.remove('errore'); void card.offsetWidth; card.classList.add('errore');
              stato.textContent = 'Non è questa. Rileggi l\'articolo.';
            }
          }, function () { stato.textContent = 'Il tuo browser non può verificare la chiave qui. Apri il sito in https.'; });
        });
      });
      root.querySelector('.puzzle-reset').addEventListener('click', function () { scrivi(null); azzera(); });

      // Ripristina i progressi
      var st = leggi();
      if (st && st.aperti) {
        st.aperti.forEach(function (s) { apriSigillo(+s, true); });
        if (st.risolto) {
          tessere.forEach(function (t) { if (aperti[t.dataset.sigillo]) caselle[+t.dataset.id].appendChild(t); });
          dopoMossa();
        } else if (st.pos) {
          Object.keys(st.pos).forEach(function (id) { var t = tessere[+id], cs = caselle[st.pos[id]]; if (t && cs && !cs.firstChild && aperti[t.dataset.sigillo]) cs.appendChild(t); });
          dopoMossa();
        }
      }
      aggiornaVassoio();
    }

    // ---------- modalità replay: "come l'ho risolto" ----------
    if (modo === 'replay') {
      var play = root.querySelector('.replay-play'), did = root.querySelector('.replay-didascalia'), inCorso = false;
      function racconta(txt) { did.style.opacity = 0; return aspetta(250).then(function () { did.textContent = txt; did.style.opacity = 1; did.style.transition = 'opacity .4s'; }); }
      function scrivePunti(card) {
        var f = card.querySelector('.finto-input'), n = 6 + Math.floor(Math.random() * 3), p = Promise.resolve();
        for (var i = 0; i < n; i++) p = p.then(function () { f.textContent += '•'; return aspetta(110); });
        return p;
      }
      function cammina() {
        var p = racconta('Quattro sigilli chiusi. Il primo passo è leggere.');
        p = p.then(function () { return aspetta(1400); });
        cfg.sigilli.forEach(function (s, idx) {
          var card = root.querySelector('[data-sigillo="' + idx + '"]');
          p = p.then(function () { card.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'nearest' }); return racconta(s.lettera + ' · ' + s.racconto); })
            .then(function () { return aspetta(900); })
            .then(function () { return scrivePunti(card); })
            .then(function () { apriSigillo(idx); return aspetta(1500); })
            .then(function () {
              var q = Promise.resolve();
              mescola(tessere.filter(function (t) { return +t.dataset.sigillo === idx; })).forEach(function (t) {
                q = q.then(function () { t.classList.add('scelta'); return aspetta(380); })
                     .then(function () { t.classList.remove('scelta'); sposta(t, caselle[+t.dataset.id]); dopoMossa(); return aspetta(520); });
              });
              return q;
            })
            .then(function () { return aspetta(1500); });
        });
        return p.then(function () {
          tavola.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'center' });
          return racconta('E quando il serpente si morde la coda, al centro resta l\'UOMO.');
        });
      }
      play.addEventListener('click', function () {
        if (inCorso) return;
        inCorso = true; play.disabled = true; azzera();
        cammina().then(function () { inCorso = false; play.disabled = false; play.textContent = '↻ Riguarda'; });
      });
      aggiornaVassoio();
    }
  }

  document.querySelectorAll('[data-puzzle]').forEach(function (el) { new Puzzle(el); });
})();
