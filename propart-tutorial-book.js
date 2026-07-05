/**
 * PropArt Tutorial Book v1 — compose, edit, PDF export, Vault save.
 * Requires PropArtPlatform + jsPDF (loaded on demand).
 */
(function (global) {
  'use strict';

  function api(path, options) {
    if (!global.PropArtPlatform) return Promise.reject(new Error('PropArtPlatform not loaded'));
    var base = global.PropArtPlatform.baseUrl || 'https://api.propart.app';
    return fetch(base + path, Object.assign({ mode: 'cors', credentials: 'omit' }, options || {})).then(
      function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error((j && (j.error || j.message)) || r.statusText);
          return j;
        });
      }
    );
  }

  function compose(projectId) {
    return api('/api/v1/projects/' + encodeURIComponent(projectId) + '/tutorial-book');
  }

  function saveDraft(projectId, draft) {
    return api('/api/v1/projects/' + encodeURIComponent(projectId) + '/tutorial-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft: draft }),
    });
  }

  function loadJsPdf() {
    if (global.jspdf && global.jspdf.jsPDF) return Promise.resolve(global.jspdf.jsPDF);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = function () {
        resolve(global.jspdf.jsPDF);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function exportPdf(draft, filename) {
    return loadJsPdf().then(function (jsPDF) {
      var doc = new jsPDF({ unit: 'pt', format: 'letter' });
      var margin = 54;
      var width = doc.internal.pageSize.getWidth() - margin * 2;
      var y = margin;

      function line(text, opts) {
        var size = (opts && opts.size) || 11;
        var bold = opts && opts.bold;
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        var lines = doc.splitTextToSize(String(text || ''), width);
        if (y + lines.length * (size + 4) > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(lines, margin, y);
        y += lines.length * (size + 4) + (opts && opts.gap ? opts.gap : 6);
      }

      line(draft.title || 'Tutorial', { size: 20, bold: true, gap: 4 });
      line(draft.subtitle || 'PropArt™ Tutorial Chapter', { size: 12, gap: 14 });

      if (draft.materials && draft.materials.length) {
        line('Materials', { size: 14, bold: true, gap: 8 });
        draft.materials.forEach(function (m) {
          var amt = m.amount ? ' — ' + m.amount : '';
          line('• ' + (m.name || 'Clay') + amt);
        });
        y += 8;
      }

      line('Steps', { size: 14, bold: true, gap: 8 });
      (draft.steps || []).forEach(function (s, i) {
        line(String(i + 1) + '. ' + (s.title || 'Step'), { bold: true, gap: 2 });
        line(s.body || '');
        y += 4;
      });

      line('— Generated with PropArt™ Tutorial Book', { size: 9, gap: 0 });
      var name = (filename || draft.title || 'propart-tutorial').replace(/[^\w\-]+/g, '-').slice(0, 80);
      doc.save(name + '.pdf');
      return { ok: true, filename: name + '.pdf' };
    });
  }

  function renderEditor(container, draft, onChange) {
    if (!container || !draft) return;
    var esc = function (s) {
      return String(s || '')
        .replace(/&/g, '&')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
    };

    var materialsHtml = (draft.materials || [])
      .map(function (m, i) {
        return (
          '<div class="tb-row" data-mat="' +
          i +
          '"><input type="text" data-field="name" value="' +
          esc(m.name) +
          '" placeholder="Color name" /><input type="text" data-field="amount" value="' +
          esc(m.amount) +
          '" placeholder="Amount" /></div>'
        );
      })
      .join('');

    var stepsHtml = (draft.steps || [])
      .map(function (s, i) {
        return (
          '<article class="tb-step" data-step="' +
          i +
          '"><label>Step ' +
          (i + 1) +
          '</label><input type="text" data-field="title" value="' +
          esc(s.title) +
          '" /><textarea data-field="body" rows="3">' +
          esc(s.body) +
          '</textarea></article>'
        );
      })
      .join('');

    container.innerHTML =
      '<div class="tb-editor">' +
      '<label class="tb-label">Chapter title</label><input type="text" id="tb-title" value="' +
      esc(draft.title) +
      '" />' +
      '<h3 class="tb-h">Materials</h3><div id="tb-materials">' +
      materialsHtml +
      '</div>' +
      '<h3 class="tb-h">Steps</h3><div id="tb-steps">' +
      stepsHtml +
      '</div>' +
      '<p class="tb-meta">' +
      (draft.sources ? draft.sources.length : 0) +
      ' Vault source(s) · composed ' +
      esc((draft.composedAt || '').slice(0, 19)) +
      '</p></div>';

    function readDraft() {
      draft.title = container.querySelector('#tb-title').value;
      draft.materials = [];
      container.querySelectorAll('[data-mat]').forEach(function (row) {
        draft.materials.push({
          name: row.querySelector('[data-field="name"]').value,
          amount: row.querySelector('[data-field="amount"]').value,
        });
      });
      draft.steps = [];
      container.querySelectorAll('[data-step]').forEach(function (row, idx) {
        draft.steps.push({
          order: idx + 1,
          title: row.querySelector('[data-field="title"]').value,
          body: row.querySelector('[data-field="body"]').value,
        });
      });
      if (onChange) onChange(draft);
      return draft;
    }

    container.querySelectorAll('input, textarea').forEach(function (el) {
      el.addEventListener('input', readDraft);
    });

    return readDraft;
  }

  global.PropArtTutorialBook = {
    compose: compose,
    saveDraft: saveDraft,
    exportPdf: exportPdf,
    renderEditor: renderEditor,
    SCHEMA: 'tutorial-book-v1',
  };
})(typeof window !== 'undefined' ? window : globalThis);
