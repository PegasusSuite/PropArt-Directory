# PropArt™ suite — Directory URL (tool switching)

Every suite app should expose **one** canonical link to the **PropArt Directory** (grid of tools) so users can jump between Cropper, Color Blend, Cane Design System, Creator Space, etc.

## Canonical URLs

| Kind | URL |
|------|-----|
| **Canonical (custom domain)** | `https://www.propart.app/` (apex `https://propart.app/` when DNS connected) |
| **Firebase Hosting (site)** | `https://propart-directory.web.app/` |
| **Creator (shop / API)** | `https://propart-creator.web.app/` — not the suite `www` host |
| **GitHub Pages (legacy mirror)** | `https://pegasussuite.github.io/PropArt-Directory/` — bookmarks only; **do not** reference in new HTML |
| **Local file** (same machine, `file://` pages only) | `file:///C:/Projects/Git/PropArt-Directory/index.html` |

Hosted apps **cannot** open `file://` from `https://` (browser security). The shared script `propart-suite-directory.js` picks `PUBLIC` vs `LOCAL_FILE` automatically.

## Short paths (Directory Hosting → suite apps)

When **`www.propart.app`** or **`propart-directory.web.app`** serves this repo, **`firebase.json`** **301** redirects these paths to each Firebase app (see **`SESSION_HANDOFF.md`** in **PropArt-Creator-Space**):

| Path | App |
|------|-----|
| `/creator` | Creator Space |
| `/studio` | Studio |
| `/cropper` | Cropper |
| `/blend` or `/color-blend` | Color Blend |
| `/cane` | Cane Design |
| `/pod` or `/cardart` | POD CardArt |

**`index.html`** carousel/grid CTAs use these **relative** paths so links work on the Directory host before and after custom DNS. Footer **About / Shop / Pricing** still deep-link to **`propart-creator.web.app`** (no path redirect for those routes).

## Favicon and lockups

| Context | Use |
|---------|-----|
| Pages on **`propart-directory`** / **`propart.app`** | `/favicon.svg` (site root) |
| Standalone **`*.web.app`** apps | `https://propart-directory.web.app/favicon.svg` |

Sync Finals from `Assets/` into this repo: from **`PropArt-Creator-Space`**, run **`npm run brand:sync`**. See **`PropArt-Creator-Space/docs/BRAND_AND_HOSTING.md`**.

## Canonical brand SVGs (copy into other sites)

Use these **Final** exports from `Assets/` (copied beside directory pages for deploy):

| File | Use |
|------|-----|
| **`PropArtTextLogoTagline-Final.svg`** | Full horizontal lockup: butterfly + **PropArt™** + product tagline. **`index.html`** masthead on [propart.app](https://www.propart.app/). |
| **`PropArtTextLogo-Final.svg`** | Butterfly + wordmark + ™ (no tagline line). **`login-modal-splash.html`** brand row. |
| **`PropArtLogo-Final.svg`** | Butterfly only; section icons. |
| **`favicon.svg`** | Tab icon — deploy at site root. |

**Legacy aliases in `Assets/`** (same pixels as the Finals when freshly synced): `propart-lockup-horizontal.svg` ↔ tagline Final, `propart-logo.svg` ↔ logo Final. Prefer the **`PropArt*Final.svg`** names in new work.

## Where this lives in repos

- **`propart-suite-directory.js`** (this repo root — copy into each static app’s `public/` / `app/` as needed). **`PUBLIC`** = `https://www.propart.app/`.
- **`PropArt-Cropper-Tool/public/js/propart-suite-directory.js`** — Suite header button (`data-propart-suite-directory`).
- **`PropArt-Color-Blend-Visualizer/app/propart-suite-directory.js`** — Suite modal first row.
- **`PropArt-Cane-Design-System/src/lib/propartSuiteDirectory.js`** — React `Suite` chip.

## Publish the Directory

1. **Primary:** from this repo, `firebase deploy --only hosting` (project `ps---propartsuite`, site `propart-directory`). Confirm `https://propart-directory.web.app/` and custom domain (`https://www.propart.app/`).
2. **Path-hosted apps:** after upstream releases, copy into `Hub/`, `Studio/`, `CropperTool/`, … then redeploy (see **`docs/PROPART_PATH_HOSTING_RUNBOOK.md`**).
3. **Optional mirror:** GitHub Pages on `master` — do not use as favicon or Directory link target in suite HTML.

## Support PropArt™

Tips and ongoing support for the suite: **[Ko-fi — PropArt Suite](https://ko-fi.com/propartsuite)**.
