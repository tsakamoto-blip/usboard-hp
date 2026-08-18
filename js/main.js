(() => {
  const AUTO_ADVANCE_MS = 6000;
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;

  let current = 0;
  let timer = null;

  function show(index) {
    current = index;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
  }

  function restartTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => show((current + 1) % slides.length), AUTO_ADVANCE_MS);
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      show(Number(dot.dataset.goto));
      restartTimer();
    });
  });

  restartTimer();
})();
