/**
 * PropArt™ suite directory — 3D coverflow carousel (vanilla JS).
 *
 * Expected DOM (see index.html):
 * - Section: .suite-carousel-section
 * - Track:   #suiteCarouselTrack with .suite-carousel-slide children
 * - Shell:   .suite-coverflow-shell (touch swipe target)
 * - Live:    #suite-carousel-live (optional aria-live)
 * - Dots:    .suite-carousel-dots
 * - Buttons: .suite-carousel-prev, .suite-carousel-next
 *
 * Slide titles are read from the first h2 inside each slide.
 * Pair with the suite page CSS for .is-active / .is-left / .is-right / .is-hidden.
 */
(function () {
  var section = document.querySelector('.suite-carousel-section');
  var track = document.getElementById('suiteCarouselTrack');
  var shell = section ? section.querySelector('.suite-coverflow-shell') : null;
  var live = document.getElementById('suite-carousel-live');
  var dotsHost = section ? section.querySelector('.suite-carousel-dots') : null;
  var prevBtn = section ? section.querySelector('.suite-carousel-prev') : null;
  var nextBtn = section ? section.querySelector('.suite-carousel-next') : null;
  if (!section || !track || !dotsHost || !prevBtn || !nextBtn || !shell) return;

  var slides = Array.prototype.slice.call(track.querySelectorAll('.suite-carousel-slide'));
  var titles = slides.map(function (li) {
    var h = li.querySelector('h2');
    return h ? h.textContent.replace(/\s+/g, ' ').trim() : 'Application';
  });
  var i = 0;
  var n = slides.length;
  var reduced =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var AUTOPLAY_MS = 5000;
  var autoplayTimer = null;
  var pointerInsideCarousel = false;
  var tabVisible = !document.hidden;

  function clearAutoplay() {
    if (autoplayTimer !== null) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    clearAutoplay();
    if (reduced || n <= 1 || !tabVisible || pointerInsideCarousel) return;
    try {
      if (section.matches && section.matches(':focus-within')) return;
    } catch (e) {}
    autoplayTimer = setInterval(function () {
      go((i + 1) % n, false);
    }, AUTOPLAY_MS);
  }

  function announce() {
    if (live) live.textContent = 'Showing ' + (i + 1) + ' of ' + n + ': ' + titles[i] + '.';
  }

  function applyCoverflow() {
    var left = (i - 1 + n) % n;
    var right = (i + 1) % n;
    slides.forEach(function (slide, j) {
      slide.classList.remove('is-active', 'is-left', 'is-right', 'is-hidden');
      if (j === i) slide.classList.add('is-active');
      else if (j === left) slide.classList.add('is-left');
      else if (j === right) slide.classList.add('is-right');
      else slide.classList.add('is-hidden');
    });
  }

  function setDots() {
    dotsHost.innerHTML = '';
    for (var d = 0; d < n; d++) {
      (function (idx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'suite-carousel-dot';
        b.setAttribute('aria-selected', idx === i ? 'true' : 'false');
        if (idx === i) b.setAttribute('aria-current', 'true');
        b.setAttribute('aria-label', 'Show ' + titles[idx]);
        b.addEventListener('click', function () {
          go(idx, true);
        });
        dotsHost.appendChild(b);
      })(d);
    }
  }

  function go(index, announceIt) {
    i = Math.max(0, Math.min(n - 1, index));
    if (reduced) {
      slides.forEach(function (slide, j) {
        slide.classList.remove('is-active', 'is-left', 'is-right', 'is-hidden');
        if (j === i) slide.classList.add('is-active');
        else slide.classList.add('is-hidden');
      });
    } else applyCoverflow();
    setDots();
    if (announceIt) announce();
    startAutoplay();
  }

  slides.forEach(function (slide) {
    slide.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) return;
      if (slide.classList.contains('is-left')) {
        go((i - 1 + n) % n, true);
      } else if (slide.classList.contains('is-right')) {
        go((i + 1) % n, true);
      }
    });
  });

  prevBtn.addEventListener('click', function () {
    go((i - 1 + n) % n, true);
  });
  nextBtn.addEventListener('click', function () {
    go((i + 1) % n, true);
  });

  section.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go((i - 1 + n) % n, true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go((i + 1) % n, true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      go(0, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      go(n - 1, true);
    }
  });

  var swipeStartX = null;
  shell.addEventListener(
    'touchstart',
    function (e) {
      if (!e.changedTouches || !e.changedTouches.length) return;
      swipeStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  shell.addEventListener(
    'touchend',
    function (e) {
      if (swipeStartX === null || !e.changedTouches || !e.changedTouches.length) return;
      var endX = e.changedTouches[0].clientX;
      var dx = endX - swipeStartX;
      swipeStartX = null;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) go((i + 1) % n, false);
      else go((i - 1 + n) % n, false);
    },
    { passive: true }
  );

  section.addEventListener('mouseenter', function () {
    pointerInsideCarousel = true;
    clearAutoplay();
  });
  section.addEventListener('mouseleave', function () {
    pointerInsideCarousel = false;
    startAutoplay();
  });
  section.addEventListener('focusin', function () {
    clearAutoplay();
  });
  section.addEventListener('focusout', function () {
    setTimeout(startAutoplay, 0);
  });
  document.addEventListener('visibilitychange', function () {
    tabVisible = !document.hidden;
    if (tabVisible) startAutoplay();
    else clearAutoplay();
  });

  go(0, false);
})();
