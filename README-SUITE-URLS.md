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

## Canonical brand SVGs (copy into other sites)

Use these **Final** exports from `Assets/` (copied beside directory pages for deploy):

| File | Use |
|------|-----|
| **`PropArtTextLogoTagline-Final.svg`** | Full horizontal lockup: butterfly + **PropArt™** + product tagline. **`index.html`** masthead on [propart.app](https://www.propart.app/). |
| **`PropArtTextLogo-Final.svg`** | Butterfly + wordmark + ™ (no tagline line). **`login-modal-splash.html`** brand row. |
| **`PropArtLogo-Final.svg`** | Butterfly only; **`rel="icon"`** on directory pages. |

**Legacy aliases in `Assets/`** (same pixels as the Finals when freshly synced): `propart-lockup-horizontal.svg` ↔ tagline Final, `propart-logo.svg` ↔ logo Final. Prefer the **`PropArt*Final.svg`** names in new work.

## Where this lives in repos

- **`propart-suite-directory.js`** (this repo root — copy into each static app’s `public/` / `app/` as needed).
- **`PropArt-Cropper-Tool/public/js/propart-suite-directory.js`** — Suite header button (`data-propart-suite-directory`).
- **`PropArt-Color-Blend-Visualizer/app/propart-suite-directory.js`** — Suite modal first row.
- **`PropArt-Cane-Design-System/src/lib/propartSuiteDirectory.js`** — React `Suite` chip.

Change **`PUBLIC`** in each copy when you use Firebase Hosting or a custom domain for the Directory instead of GitHub Pages.

## Publish the Directory

1. **Primary:** from this repo, `firebase deploy --only hosting` (project `ps---propartsuite`, site `propart-directory`). Confirm `https://propart-directory.web.app/` and your custom domain (`https://www.propart.app/`).
2. **Optional mirror:** GitHub → **Settings → Pages** → deploy from `master` / root so `https://pegasussuite.github.io/PropArt-Directory/` stays available for bookmarks.
