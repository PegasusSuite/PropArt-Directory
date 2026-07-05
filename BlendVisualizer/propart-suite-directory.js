/**
 * PropArt™ suite — canonical Directory URL for tool switching.
 * Copy this file into each app's static folder (same contents) or load from this repo when co-deployed.
 *
 * Public hub: Firebase / custom domain for PropArt Directory (keep in sync with PropArt-Directory/propart-suite-directory.js).
 * Local dev: opening any suite HTML via file:// resolves to LOCAL_FILE.
 */
(function () {
  var PUBLIC = 'https://www.propart.app/';
  var LOCAL_FILE = 'file:///C:/Projects/Git/PropArt-Directory/index.html';

  function getSuiteDirectoryHref() {
    if (typeof location === 'undefined') return PUBLIC;
    return location.protocol === 'file:' ? LOCAL_FILE : PUBLIC;
  }

  if (typeof window !== 'undefined') {
    window.PROPART_SUITE_DIRECTORY_PUBLIC = PUBLIC;
    window.PROPART_SUITE_DIRECTORY_LOCAL_FILE = LOCAL_FILE;
    window.getPropArtSuiteDirectoryHref = getSuiteDirectoryHref;
  }

  function applyDataAttributes() {
    document.querySelectorAll('a[data-propart-suite-directory]').forEach(function (a) {
      a.href = getSuiteDirectoryHref();
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyDataAttributes);
    } else {
      applyDataAttributes();
    }
  }
})();
