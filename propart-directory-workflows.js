/**
 * PROPRIETARY & CONFIDENTIAL — PropArt™, Pegasus Suite LLC.
 * Workflow-first Directory hero (Create · Produce · Sell).
 */
(function () {
  'use strict';

  var WORKFLOWS = [
    {
      id: 'create',
      title: 'Create',
      hint: 'Pick colors and design your cane — start here.',
      icon: '◇',
      primary: { label: 'Open Color Blend', url: 'https://propart-color-blend.web.app/' },
      secondary: { label: 'Open Cane Design', url: 'https://propart-cane.web.app/' },
      classroom: true,
    },
    {
      id: 'produce',
      title: 'Produce',
      hint: 'Plan slabs, slice sheets, and track inventory.',
      icon: '▤',
      primary: { label: 'Open Studio', url: 'https://propart-studio.web.app/' },
      secondary: { label: 'Open Cropper', url: 'https://propart-cropper.web.app/' },
      classroom: true,
    },
    {
      id: 'publish',
      title: 'Publish',
      hint: 'Sketch to tutorial — compose a book chapter from your project.',
      icon: '✎',
      primary: { label: 'Tutorial Book', url: './tutorial-book.html' },
      secondary: { label: 'Creator Space', url: 'https://propart-creator.web.app/' },
      classroom: true,
    },
    {
      id: 'sell',
      title: 'Sell',
      hint: 'Shop, POD decks, and publish your work.',
      icon: '◈',
      primary: { label: 'Open Creator Space', url: 'https://propart-creator.web.app/' },
      secondary: { label: 'Open CardArt / POD', url: 'https://propart-pod.web.app/' },
      commerce: true,
    },
  ];

  var APP_URLS = {
    blend: 'https://propart-color-blend.web.app/',
    visualizer: 'https://propart-color-blend.web.app/',
    cane: 'https://propart-cane.web.app/',
    studio: 'https://propart-studio.web.app/',
    cropper: 'https://propart-cropper.web.app/',
    creator: 'https://propart-creator.web.app/',
    pod: 'https://propart-pod.web.app/',
  };

  function ctx(url) {
    return window.PropArtUx ? window.PropArtUx.appendContext(url) : url;
  }

  function withActiveProject(url) {
    try {
      var id = localStorage.getItem('propart_active_project_id');
      if (!id) return ctx(url);
      var u = new URL(url, window.location.href);
      u.searchParams.set('propart_project', id);
      return ctx(u.toString());
    } catch (e) {
      return ctx(url);
    }
  }

  function readLocalRecent() {
    try {
      return JSON.parse(localStorage.getItem('propart_recent_projects') || '[]');
    } catch (e) {
      return [];
    }
  }

  function resumeUrlForProject(p) {
    var meta = p.metadata || {};
    var lastApp = p.lastApp || meta.lastApp || meta.sourceApp || 'blend';
    if (lastApp === 'visualizer') lastApp = 'blend';
    var base = APP_URLS[lastApp] || APP_URLS.blend;
    try {
      var u = new URL(base, window.location.href);
      u.searchParams.set('propart_project', p.id);
      return ctx(u.toString());
    } catch (e) {
      return ctx(base + '?propart_project=' + encodeURIComponent(p.id));
    }
  }

  function normalizeRecentEntry(p) {
    if (!p || !p.id) return null;
    return {
      id: p.id,
      title: p.title || 'My project',
      lastApp: p.lastApp || (p.metadata && (p.metadata.lastApp || p.metadata.sourceApp)) || null,
      metadata: p.metadata || {},
    };
  }

  function mergeRecentLists(apiList, localList) {
    var out = [];
    var seen = {};
    function add(item) {
      var n = normalizeRecentEntry(item);
      if (!n || seen[n.id]) return;
      seen[n.id] = true;
      out.push(n);
    }
    (apiList || []).forEach(add);
    (localList || []).forEach(add);
    return out.slice(0, 5);
  }

  function render() {
    var mount = document.getElementById('directoryWorkflows');
    if (!mount) return;

    var classroom = window.PropArtUx && window.PropArtUx.isClassroom();
    var list = WORKFLOWS.filter(function (wf) {
      if (classroom && wf.commerce) return false;
      return true;
    });

    mount.innerHTML = list
      .map(function (wf) {
        return (
          '<article class="workflow-card" data-workflow="' +
          wf.id +
          '">' +
          '<div class="workflow-card__icon" aria-hidden="true">' +
          wf.icon +
          '</div>' +
          '<h3 class="workflow-card__title">' +
          wf.title +
          '</h3>' +
          '<p class="workflow-card__hint">' +
          wf.hint +
          '</p>' +
          '<div class="workflow-card__actions">' +
          '<a class="workflow-card__cta" href="' +
          (wf.id === 'publish' ? withActiveProject(wf.primary.url) : ctx(wf.primary.url)) +
          '">' +
          wf.primary.label +
          '</a>' +
          '<a class="workflow-card__cta workflow-card__cta--ghost" href="' +
          ctx(wf.secondary.url) +
          '">' +
          wf.secondary.label +
          '</a>' +
          '</div></article>'
        );
      })
      .join('');
  }

  var UX_LABELS = { surface: 'Simple', guided: 'Guided', power: 'All apps' };
  var UX_INTRO = {
    surface: 'Pick Create, Produce, or Sell. Shop and licensing links stay in the header.',
    guided: 'Pick a path below — your project and palette carry across apps when you save.',
    power: 'Browse every app in the carousel and full grid. Shift+click in Command Center for handoff.',
  };

  function renderIntro() {
    var el = document.getElementById('directoryIntro');
    if (!el || !window.PropArtUx) return;
    if (window.PropArtUx.isClassroom()) {
      el.textContent = 'Classroom mode — Create and Produce tools only.';
      return;
    }
    var lvl = window.PropArtUx.getLevel();
    el.textContent = UX_INTRO[lvl] || UX_INTRO.guided;
  }

  function renderUxToggle() {
    var mount = document.getElementById('propartUxToggle');
    if (!mount || !window.PropArtUx) return;
    if (window.PropArtUx.isClassroom()) {
      mount.innerHTML = '<span class="workflow-classroom-badge">Classroom mode</span>';
      return;
    }

    mount.innerHTML =
      '<span class="propart-ux-level-toggle" role="group" aria-label="Experience level">' +
      window.PropArtUx.LEVELS.map(function (lvl) {
        var label = UX_LABELS[lvl] || lvl;
        var pressed = window.PropArtUx.getLevel() === lvl;
        return (
          '<button type="button" data-ux-level="' +
          lvl +
          '" aria-pressed="' +
          (pressed ? 'true' : 'false') +
          '" title="' +
          (UX_INTRO[lvl] || lvl) +
          '">' +
          label +
          '</button>'
        );
      }).join('') +
      '</span>';

    mount.querySelectorAll('[data-ux-level]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-ux-level');
        window.PropArtUx.setLevel(next);
        renderUxToggle();
        renderIntro();
        render();
      });
    });
  }

  function paintRecent(list) {
    var mount = document.getElementById('directoryRecentProjects');
    if (!mount) return;
    if (!list.length) {
      mount.innerHTML = '';
      mount.style.display = 'none';
      return;
    }
    mount.style.display = 'block';
    var sessions = list
      .map(function (p) {
        var href = resumeUrlForProject(p);
        var label = p.title || 'My project';
        var hint = p.lastApp ? ' title="Resume in ' + p.lastApp + '"' : '';
        return (
          '<a class="directory-recent__session" href="' +
          href +
          '"' +
          hint +
          '>' +
          label +
          '</a>'
        );
      })
      .join('');
    mount.innerHTML =
      '<p class="directory-recent__label">Continue where you left off</p><div class="directory-recent__sessions">' +
      sessions +
      '</div>';
  }

  function renderRecent() {
    var local = readLocalRecent();

    function finish(apiList) {
      paintRecent(mergeRecentLists(apiList, local));
    }

    if (window.PropArtPlatform && window.PropArtPlatform.listProjects) {
      window.PropArtPlatform.listProjects(8)
        .then(finish)
        .catch(function () {
          finish([]);
        });
      return;
    }

    if (window.PropArtEnsureDefaultProject || typeof window.PropArtListProjectAssets === 'function') {
      var load =
        window.PropArtPlatform
          ? Promise.resolve(window.PropArtPlatform)
          : new Promise(function (resolve, reject) {
              if (!window.PropArtEnsureDefaultProject) {
                reject(new Error('no bridge'));
                return;
              }
              var s = document.createElement('script');
              s.src = 'https://api.propart.app/client/propart-platform.js';
              s.onload = function () {
                resolve(window.PropArtPlatform);
              };
              s.onerror = reject;
              document.head.appendChild(s);
            });
      load
        .then(function (P) {
          return P.listProjects(8);
        })
        .then(finish)
        .catch(function () {
          finish([]);
        });
      return;
    }

    finish([]);
  }

  function init() {
    render();
    renderIntro();
    renderUxToggle();
    renderRecent();
    document.addEventListener('propart-ux-level-change', function () {
      renderIntro();
      renderUxToggle();
      render();
    });
    document.addEventListener('propart-project-change', renderRecent);
    document.addEventListener('propart-vault-saved', renderRecent);
    window.addEventListener('storage', function (e) {
      if (e.key === 'propart_recent_projects') renderRecent();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
