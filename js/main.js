(function () {
  // Hero slideshow
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

  // Group rows reveal on scroll
  var rows = [].slice.call(document.querySelectorAll('.brand'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });
    rows.forEach(function (r) { io.observe(r); });
  } else {
    rows.forEach(function (r) { r.classList.add('in'); });
  }

  // Message portrait swaps on hover
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
