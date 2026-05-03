# PropArt™ suite — Directory URL (tool switching)

Every suite app should expose **one** canonical link to the **PropArt Directory** (carousel of tools) so users can jump between Cropper, Color Blend, Cane Design System, Creator Space, etc.

## Canonical URLs

| Kind | URL |
|------|-----|
| **Public (hosted)** | `https://pegasussuite.github.io/PropArt-Directory/` |
| **Local file** (same machine, `file://` pages only) | `file:///C:/Projects/Git/PropArt-Directory/index.html` |

Hosted apps **cannot** open `file://` from `https://` (browser security). The shared script `propart-suite-directory.js` picks `PUBLIC` vs `LOCAL_FILE` automatically.

## Where this lives in repos

- **`propart-suite-directory.js`** (this repo root — copy into each static app’s `public/` / `app/` as needed).
- **`PropArt-Cropper-Tool/public/js/propart-suite-directory.js`** — Suite header button (`data-propart-suite-directory`).
- **`PropArt-Color-Blend-Visualizer/app/propart-suite-directory.js`** — Suite modal first row.
- **`PropArt-Cane-Design-System/src/lib/propartSuiteDirectory.js`** — React `Suite` chip.

Change **`PUBLIC`** in each copy when you use Firebase Hosting or a custom domain for the Directory instead of GitHub Pages.

## Enable the public Directory

1. GitHub → **PropArt-Directory** → **Settings → Pages** → deploy from `master` / root (or `/docs`).
2. Confirm `https://pegasussuite.github.io/PropArt-Directory/` loads `index.html`.

Until Pages is live, **Suite** links from Firebase apps may **404** until you either enable Pages or update **`PUBLIC`** to your real Directory URL everywhere above.
