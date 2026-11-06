(function () {
  document.documentElement.classList.add('js');
  var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cielo stellato
  var c = document.getElementById('stelle');
  if (c && c.getContext) {
    var ctx = c.getContext('2d'), stelle = [], w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function dimensiona() {
      w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
      var n = Math.round((innerWidth * innerHeight) / 4200);
      stelle = [];
      for (var i = 0; i < n; i++) stelle.push({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.2 + .2) * dpr, f: Math.random() * 6.28, v: Math.random() * .02 + .004, d: Math.random() * .25 + .05 });
    }
    function disegna(t) {
      ctx.clearRect(0, 0, w, h);
      var sy = window.scrollY * dpr;
      for (var i = 0; i < stelle.length; i++) {
        var s = stelle[i], a = .35 + .65 * Math.abs(Math.sin(s.f + t * s.v * .06));
        var y = (s.y - sy * s.d) % h; if (y < 0) y += h;
        ctx.globalAlpha = a; ctx.fillStyle = i % 9 === 0 ? '#f6d892' : '#fff';
        ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.283); ctx.fill();
      }
      if (!ridotto) requestAnimationFrame(disegna);
    }
    dimensiona(); addEventListener('resize', dimensiona); requestAnimationFrame(disegna);
    if (ridotto) addEventListener('scroll', function () { requestAnimationFrame(disegna); }, { passive: true });
  }

  // Testata
  var testata = document.querySelector('.testata');
  function suScroll() { testata && testata.classList.toggle('scrollata', scrollY > 30); }
  addEventListener('scroll', suScroll, { passive: true }); suScroll();

  // Menu mobile
  var t = document.querySelector('.menu-toggle'), nav = document.getElementById('menu');
  if (t && nav) {
    t.addEventListener('click', function () { var o = nav.classList.toggle('aperto'); t.setAttribute('aria-expanded', o); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nav.classList.remove('aperto'); t.setAttribute('aria-expanded', 'false'); } });
  }

  // Comparsa allo scroll
  var els = document.querySelectorAll('.rivela');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }); }, { threshold: .12 });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('visto'); });

  // Luce che segue il mouse sulle carte
  document.querySelectorAll('.carta').forEach(function (el) {
    el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });
})();
// Uroboro della home: anelli a 3px dal serpente sullo schermo, testo che gira in senso opposto alle tacche
(function () {
  var svg = document.querySelector('svg.uroboro'); if (!svg) return;
  var CX = 575.4, CY = 392.2, A = 292.2, B = 266.5, W = 694, MARGINE = 3, TESTO = 21;
  var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anelli = svg.querySelectorAll('.anello-1 ellipse'), giro = svg.querySelector('#giro-testo'), tp = svg.querySelector('textPath'), meta = 0;
  function misura() {
    var px = svg.getBoundingClientRect().width / W; if (!px) return;
    var g = MARGINE / px;
    anelli.forEach(function (e) { var o = g + parseFloat(e.dataset.off); e.setAttribute('rx', A + o); e.setAttribute('ry', B + o); });
    var rx = A + g + TESTO, ry = B + g + TESTO, sx = CX - rx, dx = CX + rx, arco = ' A' + rx + ' ' + ry + ' 0 1 1 ';
    giro.setAttribute('d', 'M' + sx + ' ' + CY + arco + dx + ' ' + CY + arco + sx + ' ' + CY + arco + dx + ' ' + CY + arco + sx + ' ' + CY);
    var tot = giro.getTotalLength(); meta = tot / 2;
    tp.setAttribute('textLength', meta); tp.setAttribute('startOffset', meta);
  }
  misura(); addEventListener('resize', misura);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(misura);
  if (ridotto) return;
  function gira(t) { if (meta) tp.setAttribute('startOffset', meta * (1 - (t / 80000) % 1)); requestAnimationFrame(gira); }
  requestAnimationFrame(gira);
})();
