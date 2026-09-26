(function () {
  var docEl = document.documentElement;
  docEl.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // ---- Hero slideshow ----
  var slides = [].slice.call(document.querySelectorAll('.hero-slide'));
  var dots = [].slice.call(document.querySelectorAll('.hero-dots button'));
  var i = 0, timer = null;
  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
  }
  function start() {
    if (timer) clearInterval(timer);
    timer = setInterval(function () { show(i + 1); }, 6000);
  }
  dots.forEach(function (d) {
    d.addEventListener('click', function () { show(+d.dataset.i); start(); });
  });
  if (slides.length) start();

  // ---- Scroll helpers ----
  // reveal once: add .in the first time an element enters view
  function reveal(els, opts) {
    els = [].slice.call(els);
    if (!els.length) return;
    if (!hasIO || reduce) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, opts || { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  // reveal every time: toggle .in on enter/leave so it replays on each scroll
  function revealEach(els, opts) {
    els = [].slice.call(els);
    if (!els.length) return;
    if (!hasIO || reduce) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('in', en.isIntersecting); });
    }, opts || { threshold: 0.28, rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  // ---- Accent bars paint left -> right ----
  reveal(document.querySelectorAll('.rule'));

  // ---- ABOUT philosophy: paper flutter ----
  reveal(document.querySelectorAll('.philosophy'), { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });

  // ---- Last line: drop one character at a time, then draw the underline ----
  var dc = document.querySelector('.philosophy .body p.dropchars');
  // Gate the msg-hero headline: it may not start typing until this line's
  // animation has finished, or the line has scrolled fully out of view.
  var gateOpen = reduce || !hasIO || !dc;
  var gateWaiters = [];
  function openGate() { if (gateOpen) return; gateOpen = true; gateWaiters.forEach(function (f) { f(); }); gateWaiters = []; }
  function onGate(fn) { if (gateOpen) fn(); else gateWaiters.push(fn); }
  if (dc && !reduce) {
    var ci = 0;
    // Split characters inside each phrase span (.ln) so the mobile line break
    // between them is preserved; fall back to the whole element otherwise.
    var lns = [].slice.call(dc.querySelectorAll('.ln'));
    var targets = lns.length ? lns : [dc];
    targets.forEach(function (el2) {
      var t = el2.textContent;
      el2.textContent = '';
      for (var k = 0; k < t.length; k++) {
        var sp = document.createElement('span');
        sp.className = 'ch';
        sp.textContent = t.charAt(k);
        sp.style.animationDelay = (ci * 0.06).toFixed(2) + 's';
        ci++;
        el2.appendChild(sp);
      }
    });
    var lineDelay = (ci - 1) * 60 + 500 + 120; // after the last char lands
    if (hasIO) {
      var dio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          dio.unobserve(dc);
          dc.classList.add('in');
          setTimeout(function () { dc.classList.add('line-in'); setTimeout(openGate, 850); }, lineDelay);
        });
      }, { threshold: 0.6 });
      dio.observe(dc);
      // Open the gate early once the line is scrolled fully above the viewport.
      var offIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting && en.boundingClientRect.bottom <= 0) { openGate(); offIO.disconnect(); }
        });
      }, { threshold: 0 });
      offIO.observe(dc);
    } else {
      dc.classList.add('in', 'line-in');
    }
  }

  // ---- Brand rows: slide in from their side (L/R/L/R), once only ----
  reveal(document.querySelectorAll('.brand'), { threshold: 0.28, rootMargin: '0px 0px -12% 0px' });

  // ---- Company card: gentle rise ----
  reveal(document.querySelectorAll('.co-card'), { threshold: 0.25 });

  // ---- Message photo carousel: auto-advancing, snap scroll, dots ----
  (function initCarousel() {
    var car = document.querySelector('.msg-carousel');
    if (!car) return;
    var track = car.querySelector('.mc-track');
    var dotsWrap = car.querySelector('.mc-dots');
    var cslides = [].slice.call(track.querySelectorAll('.mc-slide'));
    if (cslides.length < 2) return;
    var cur = 0, ctimer = null, paused = false, sst = null;
    var cdots = cslides.map(function (_, k) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'スライド ' + (k + 1));
      b.addEventListener('click', function () { goTo(k, true); });
      dotsWrap.appendChild(b); return b;
    });
    function setActive(k) { cur = k; cdots.forEach(function (d, j) { d.classList.toggle('on', j === k); }); }
    function goTo(k, user) {
      k = (k + cslides.length) % cslides.length;
      track.scrollTo({ left: k * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
      setActive(k);
      if (user) restart();
    }
    // Keep the active dot in sync with manual swipes.
    track.addEventListener('scroll', function () {
      clearTimeout(sst);
      sst = setTimeout(function () { setActive(Math.round(track.scrollLeft / track.clientWidth)); }, 90);
    }, { passive: true });
    // Auto-advance (disabled under reduced motion), paused while interacting.
    function startAuto() { if (reduce) return; stopAuto(); ctimer = setInterval(function () { if (!paused) goTo(cur + 1, false); }, 3200); }
    function stopAuto() { if (ctimer) { clearInterval(ctimer); ctimer = null; } }
    function restart() { stopAuto(); startAuto(); }
    ['pointerdown', 'pointerenter'].forEach(function (ev) { track.addEventListener(ev, function () { paused = true; }); });
    ['pointerup', 'pointerleave'].forEach(function (ev) { track.addEventListener(ev, function () { paused = false; }); });
    setActive(0);
    startAuto();
  })();
  var heroPhoto = document.querySelector('.msg-hero .msg-photo');

  // ---- Message headlines: type romaji, then convert to Japanese, one
  //      segment at a time (like committing each IME conversion). ----
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function typeConvert(el, segs, onDone) {
    var committed = '';           // already-converted HTML
    function runSeg(si) {
      if (si >= segs.length) { el.innerHTML = committed; if (onDone) onDone(); return; }
      var seg = segs[si], n = 0;
      (function step() {
        if (n <= seg.r.length) {
          el.innerHTML = committed + '<span class="compose">' + esc(seg.r.slice(0, n)) + '</span>';
          n++;
          setTimeout(step, 35 + Math.random() * 35);
        } else {
          setTimeout(function () {
            el.innerHTML = committed + '<span class="compose converting">' + esc(seg.r) + '</span>';
            setTimeout(function () {
              committed += seg.f + (seg.br ? '<br>' : '');
              runSeg(si + 1);
            }, 260);
          }, 320);
        }
      })();
    }
    runSeg(0);
  }

  // With animations off (or no IO), just show the held-back photos.
  if (reduce || !hasIO) {
    if (heroPhoto) heroPhoto.classList.add('shown');
  }

  [].slice.call(document.querySelectorAll('.typeconv')).forEach(function (el) {
    var spec = el.getAttribute('data-type') || '';
    // Each "|" segment is  ROMAJI::日本語[::br]  — br adds a line break after it.
    var segs = spec ? spec.split('|').map(function (part) {
      var b = part.split('::');
      return { r: b[0], f: b[1] || '', br: b[2] === 'br' };
    }) : [];
    // onStart: neighbouring photos appear as the title starts typing.
    // onDone: the body copy appears once the title has finished.
    var wrap = el.closest('.msg-hero-text') || el.closest('.msg-bandtext');
    var copy = wrap ? wrap.querySelector('.msg-copy') : null;
    var onStart = null, onDone = function () { if (copy) copy.classList.add('copy-in'); };
    if (reduce || !hasIO || !segs.length) { if (onDone) onDone(); return; } // leave the final text as-is
    el.innerHTML = '<span class="compose"></span>';
    var gated = !!el.closest('.msg-hero'); // the first headline waits on the gate
    var done = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !done) {
          done = true; io.unobserve(el);
          var begin = function () { if (onStart) onStart(); typeConvert(el, segs, onDone); };
          if (gated) onGate(begin); else begin();
        }
      });
    }, { threshold: 0.6 });
    io.observe(el);
  });

  // ---- Message portrait swaps on hover ----
  var mphoto = document.querySelector('.msg-hero .msg-photo');
  if (mphoto) {
    var ms = [].slice.call(mphoto.querySelectorAll('.ph'));
    var mi = 0;
    function mshow(n) {
      mi = (n + ms.length) % ms.length;
      ms.forEach(function (s, k) { s.classList.toggle('on', k === mi); });
    }
    mshow(0);
    mphoto.addEventListener('mouseenter', function () { mshow(mi + 1); });
  }
})();
