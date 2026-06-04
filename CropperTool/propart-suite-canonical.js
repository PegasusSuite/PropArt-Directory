/**
 * PropArt™ suite — canonical URLs (single source for copy into each app).
 * Keep in sync across repos; see README-SUITE-URLS.md and docs/SUITE_BANNER_INTEGRATION.md.
 */
(function (global) {
  var CANONICAL = {
    directory: 'https://www.propart.app/',
    directoryHosting: 'https://propart-directory.web.app/',
    creator: 'https://propart-creator.web.app/',
    studio: 'https://propart.app/Studio',
    studioHosting: 'https://propart-studio.web.app/',
    cropper: 'https://propart.app/CropperTool',
    cropperHosting: 'https://propart-cropper.web.app/',
    blend: 'https://propart.app/BlendVisualizer',
    blendHosting: 'https://propart-color-blend.web.app/',
    cane: 'https://propart.app/CaneDesigner',
    caneHosting: 'https://propart-cane.web.app/',
    pod: 'https://propart.app/POD',
    podHosting: 'https://propart-pod.web.app/',
    favicon: 'https://propart-directory.web.app/favicon.svg',
    about: 'https://propart-creator.web.app/about.html',
    products: 'https://propart-creator.web.app/products.html',
    pricing: 'https://propart-creator.web.app/#pricing',
    supportEmail: 'support@propart.app',
    koFi: 'https://ko-fi.com/propartsuite'
  };

  var SUITE_NAV = [
    { id: 'directory', label: '⌂', title: 'Directory', href: CANONICAL.directory },
    { id: 'creator', label: 'Cs', title: 'Creator Space', href: CANONICAL.creator },
    { id: 'studio', label: 'St', title: 'Studio', href: CANONICAL.studio },
    { id: 'cropper', label: 'Cr', title: 'Cropper', href: CANONICAL.cropper },
    { id: 'blend', label: 'B', title: 'Color Blend', href: CANONICAL.blend },
    { id: 'cane', label: 'K', title: 'Cane', href: CANONICAL.cane },
    { id: 'pod', label: 'P', title: 'POD', href: CANONICAL.pod }
  ];

  if (typeof global !== 'undefined') {
    global.PROPART_SUITE_CANONICAL = CANONICAL;
    global.PROPART_SUITE_NAV = SUITE_NAV;
  }
})(typeof window !== 'undefined' ? window : globalThis);
