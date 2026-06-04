# Suite banner integration

Visual spec: **`../propart-blend-banner-suite-mockup.html`**  
Shared CSS: **`../propart-suite-header.css`** (requires **`../propart-generic-theme.css`**)  
Canonical URLs: **`../propart-suite-canonical.js`** + **`../propart-suite-directory.js`**

## HTML skeleton (per app)

Replace `APP_ID`, titles, and tool buttons. Mark current app with `is-current` on its `.btn-suite`.

```html
<link rel="stylesheet" href="/propart-generic-theme.css" />
<link rel="stylesheet" href="/propart-suite-header.css" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />

<header class="suite-banner-card" role="banner">
  <div class="suite-banner-top">
    <div class="suite-banner-brand">
      <a href="https://www.propart.app/"><img src="/PropArt-May2.svg" width="320" height="96" alt="PropArt™" /></a>
    </div>
    <div class="suite-banner-meta">
      <h2>App display name</h2>
      <p>One-line subtitle for this tool</p>
    </div>
    <div class="suite-banner-utils">
      <button type="button" class="suite-banner-util-btn" data-propart-theme-toggle>Theme</button>
      <button type="button" class="suite-banner-util-btn" id="propartSignInBtn">Sign in</button>
    </div>
  </div>
  <div class="suite-banner-pill">
    <div class="suite-banner-pill__suite" data-propart-suite-nav></div>
    <div class="suite-banner-pill__divider" aria-hidden="true"></div>
    <div class="suite-banner-pill__tools"><!-- app-specific icons --></div>
  </div>
</header>

<script src="/propart-suite-canonical.js"></script>
<script src="/propart-suite-directory.js"></script>
<script src="/propart-suite-nav.js"></script>
```

**Creator** already uses `.header-suitebar` — migrate to this structure when convenient (layout has tools panel).

## Path-hosted copies

After editing upstream, copy into `PropArt-Directory/{CropperTool,BlendVisualizer,Hub,Studio,POD,CaneDesigner}/` and deploy Hosting.
