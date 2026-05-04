# PropArt™ suite — Directory URL (tool switching)

Every suite app should expose **one** canonical link to the **PropArt Directory** (carousel of tools) so users can jump between Cropper, Color Blend, Cane Design System, Creator Space, etc.

## Canonical URLs

| Kind | URL |
|------|-----|
| **Canonical (custom domain)** | `https://www.propart.app/` (apex `https://propart.app/` when DNS connected) |
| **Firebase Hosting (site)** | `https://propart-directory.web.app/` |
| **GitHub Pages (legacy mirror)** | `https://pegasussuite.github.io/PropArt-Directory/` |
| **Local file** (same machine, `file://` pages only) | `file:///C:/Projects/Git/PropArt-Directory/index.html` |

Hosted apps **cannot** open `file://` from `https://` (browser security). The shared script `propart-suite-directory.js` picks `PUBLIC` vs `LOCAL_FILE` automatically.

## Canonical masthead asset (copy into other sites)

- **`propart-lockup-horizontal.svg`** — butterfly + outlined **PropArt™** + tagline (**TOOLS FOR POLYMER CLAY ARTISTS**), transparent background. Used by **`index.html`** on [propart.app](https://www.propart.app/).
- **Mirror / source name in monorepo:** `Assets/PropArtLogo-TextMarkIconTagline.svg` (same cleaned SVG; keep in sync when the mark changes). Suite apps can copy **`propart-lockup-horizontal.svg`** from this directory repo into `public/` / `static/` and reference it from headers or marketing pages.

## Where this lives in repos

- **`propart-suite-directory.js`** (this repo root — copy into each static app’s `public/` / `app/` as needed).
- **`PropArt-Cropper-Tool/public/js/propart-suite-directory.js`** — Suite header button (`data-propart-suite-directory`).
- **`PropArt-Color-Blend-Visualizer/app/propart-suite-directory.js`** — Suite modal first row.
- **`PropArt-Cane-Design-System/src/lib/propartSuiteDirectory.js`** — React `Suite` chip.

Change **`PUBLIC`** in each copy when you use Firebase Hosting or a custom domain for the Directory instead of GitHub Pages.

## Publish the Directory

1. **Primary:** from this repo, `firebase deploy --only hosting` (project `ps---propartsuite`, site `propart-directory`). Confirm `https://propart-directory.web.app/` and your custom domain (`https://www.propart.app/`).
2. **Optional mirror:** GitHub → **Settings → Pages** → deploy from `master` / root so `https://pegasussuite.github.io/PropArt-Directory/` stays available for bookmarks.
