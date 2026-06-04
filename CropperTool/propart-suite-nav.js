/**
 * Renders suite pill links from PROPART_SUITE_NAV + PROPART_SUITE_CANONICAL.
 * Requires propart-suite-canonical.js loaded first.
 */
(function () {
  function renderSuiteNav(container, currentId) {
    if (!container || !window.PROPART_SUITE_NAV) return;
    container.innerHTML = '';
    var dot = document.createElement('span');
    dot.className = 'pill-dot';
    dot.setAttribute('aria-hidden', 'true');
    container.appendChild(dot);

    window.PROPART_SUITE_NAV.forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'btn-suite' + (item.id === currentId ? ' is-current' : '');
      a.href = item.href;
      a.title = item.title;
      a.textContent = item.label;
      if (item.id === 'directory') {
        a.setAttribute('data-propart-suite-directory', '');
      }
      container.appendChild(a);
    });

    if (typeof window.getPropArtSuiteDirectoryHref === 'function') {
      document.querySelectorAll('a[data-propart-suite-directory]').forEach(function (a) {
        a.href = window.getPropArtSuiteDirectoryHref();
      });
    }
  }

  function boot() {
    document.querySelectorAll('[data-propart-suite-nav]').forEach(function (el) {
      var current = el.getAttribute('data-propart-suite-current') || '';
      renderSuiteNav(el, current);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
