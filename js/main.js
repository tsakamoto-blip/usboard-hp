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

  // ---- Last line: drop one character at a time ----
  var dc = document.querySelector('.philosophy .body p.dropchars');
  if (dc && !reduce) {
    var txt = dc.textContent;
    dc.textContent = '';
    for (var c = 0; c < txt.length; c++) {
      var sp = document.createElement('span');
      sp.className = 'ch';
      sp.textContent = txt.charAt(c);
      sp.style.animationDelay = (c * 0.06).toFixed(2) + 's';
      dc.appendChild(sp);
    }
    reveal([dc], { threshold: 0.6 });
  }

  // ---- Brand rows: slide in from their side (L/R/L/R), once only ----
  reveal(document.querySelectorAll('.brand'), { threshold: 0.28, rootMargin: '0px 0px -12% 0px' });

  // ---- Company card: gentle rise ----
  reveal(document.querySelectorAll('.co-card'), { threshold: 0.25 });

  // ---- Message photostack: flutter down + pin ----
  // Wrapped here, but revealed only once its headline finishes typing (below),
  // so the photos settle onto a stable layout.
  var stack = document.querySelector('.msg-photostack');
  if (stack) {
    [].slice.call(stack.children).forEach(function (node) {
      if (node.tagName !== 'IMG') return;
      var snap = document.createElement('span');
      snap.className = 'snap' + (node.className ? ' ' + node.className : '');
      node.className = '';
      stack.insertBefore(snap, node);
      snap.appendChild(node);
    });
  }
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
          setTimeout(step, 45 + Math.random() * 45);
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
    if (stack) stack.classList.add('in');
  }

  [].slice.call(document.querySelectorAll('.typeconv')).forEach(function (el) {
    var spec = el.getAttribute('data-type') || '';
    // Each "|" segment is  ROMAJI::日本語[::br]  — br adds a line break after it.
    var segs = spec ? spec.split('|').map(function (part) {
      var b = part.split('::');
      return { r: b[0], f: b[1] || '', br: b[2] === 'br' };
    }) : [];
    // What this headline releases once it finishes typing.
    var onDone = null;
    if (el.closest('.msg-hero')) { onDone = function () { if (heroPhoto) heroPhoto.classList.add('shown'); }; }
    else if (el.closest('.msg-band')) { onDone = function () { if (stack) stack.classList.add('in'); }; }
    if (reduce || !hasIO || !segs.length) { if (onDone) onDone(); return; } // leave the final text as-is
    el.innerHTML = '<span class="compose"></span>';
    var done = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !done) { done = true; io.unobserve(el); typeConvert(el, segs, onDone); }
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
