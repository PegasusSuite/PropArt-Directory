# PropArt™ path hosting runbook (`propart.app/<App>`)

**Purpose:** Keep canonical URLs on **`https://propart.app`** (e.g. `/CropperTool`, `/Studio`) instead of redirecting visitors to **`*.web.app`** hosts. This repo’s Firebase site **`propart-directory`** serves the suite apps from folder prefixes configured in **`firebase.json`**.

**Project:** Firebase **`ps---propartsuite`** · Hosting site **`propart-directory`**

---

## 1. Canonical paths (source of truth)

| Public URL path | Folder on this repo | App |
|-----------------|---------------------|-----|
| `/Hub` | `Hub/` | Creator Space (copy of Creator `public/`) |
| `/Studio` | `Studio/` | Studio (`PropArt-Studio` `public/`) |
| `/POD` | `POD/` | POD / CardArt (`PropArt-POD` `public/`) |
| `/BlendVisualizer` | `BlendVisualizer/` | Color Blend (`PropArt-Color-Blend-Visualizer` `app/`) |
| `/CaneDesigner` | `CaneDesigner/` | Cane (`PropArt-Cane-Design-System` **`dist/`** build) |
| `/CropperTool` | `CropperTool/` | Cropper (`PropArt-Cropper-Tool` `public/`) |

Lowercase shortcuts (**`/studio`**, **`/cropper`**, etc.) are **`301`** redirects to these canonical paths — see **`firebase.json`** → **`redirects`**.

---

## 2. When you update an upstream app

1. Build or export deployable static files from the **source repo** (e.g. `npm run build` for Vite apps → use **`dist/`**).
2. **Copy** the deployable tree into the matching folder under **`PropArt-Directory`** (`Hub/`, `Studio/`, …), replacing files as needed.
3. Confirm **`index.html`** works under a subpath:
   - Prefer **`<base href="/FolderName/">`** when the upstream app assumes `/`-root asset URLs.
   - Prefer **relative** `src=` / `href=` for local assets where possible.
4. Deploy Hosting:

```bash
cd PropArt-Directory
firebase deploy --only hosting --project ps---propartsuite
```

5. Verify (hard refresh or incognito):

- `https://propart.app/Hub`
- `https://propart.app/Studio`
- `https://propart.app/POD`
- `https://propart.app/BlendVisualizer`
- `https://propart.app/CaneDesigner`
- `https://propart.app/CropperTool`

Then aliases:

- `https://propart.app/hub` → `/Hub`
- `https://propart.app/studio` → `/Studio`
- `https://propart.app/pod` → `/POD`
- `https://propart.app/blend` → `/BlendVisualizer`
- `https://propart.app/cane` → `/CaneDesigner`
- `https://propart.app/cropper` → `/CropperTool`

Also spot-check **`https://www.propart.app/...`** if both apex and `www` point at this Hosting site.

---

## 3. Routing configuration (`firebase.json`)

Two sections matter:

1. **`redirects`** — map lowercase paths → canonical casing (`/studio` → `/Studio`).
2. **`rewrites`** — serve each canonical path’s SPA shell:

```json
"rewrites": [
  { "source": "/Hub", "destination": "/Hub/index.html" },
  { "source": "/Studio", "destination": "/Studio/index.html" },
  { "source": "/POD", "destination": "/POD/index.html" },
  { "source": "/BlendVisualizer", "destination": "/BlendVisualizer/index.html" },
  { "source": "/CaneDesigner", "destination": "/CaneDesigner/index.html" },
  { "source": "/CropperTool", "destination": "/CropperTool/index.html" }
]
```

After editing **`firebase.json`**, redeploy Hosting.

---

## 4. Repo hygiene for deploy commits

- Commit **`firebase.json`** and only the app folders you intentionally refreshed (`Hub/`, `Studio/`, …).
- Avoid bundling unrelated local edits (`README-SUITE-URLS.md`, experiments under **`Hub/`**) into the same commit unless they belong with the release.
- **`firebase.json` must stay valid JSON** — merge conflict markers (`<<<<<<<`) break deploy immediately.

---

## 5. Common failures

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| Blank page, 404 on `/assets/...` | App built with absolute `/assets/` paths | Rebuild with **`base`** in Vite, or fix **`index.html`** + copied **`dist`** |
| Old UI after deploy | CDN/browser cache | Hard refresh, incognito, or wait for CDN propagation |
| `firebase deploy` parse error | Broken **`firebase.json`** | Remove conflict markers; validate JSON |
| Only apex works, not `www` | DNS / Hosting domain attachment | Firebase Console → Hosting → custom domains for **`propart-directory`** |

---

## 6. Refresh cadence (when upstream apps ship)

| Step | Action |
|------|--------|
| 1 | Tag/release in source repo (Cropper, Studio, Cane, POD, Blend, Creator). |
| 2 | `npm run brand:sync` in **PropArt-Creator-Space** if SVGs changed in `Assets/`. |
| 3 | Copy deployable tree into the matching **`PropArt-Directory/`** folder. |
| 4 | Spot-check favicon (`/favicon.svg`) and `propart-suite-directory.js` (`PUBLIC` = `https://www.propart.app/`). |
| 5 | `firebase deploy --only hosting --project ps---propartsuite` |
| 6 | Verify canonical paths on `https://propart.app/...` (incognito). |

**Glaze:** removed from the suite (2026-06). Do not re-import glaze clients into path-hosted copies.

## 7. Related docs

- **`SESSION_HANDOFF.md`** in **PropArt-Creator-Space** (`main`) — suite-wide checkpoints including **`propart.app` canonical path hosting**.
- **`docs/BRAND_AND_HOSTING.md`** in **PropArt-Creator-Space** — `www` owner, favicon origin, enhancement order.
- **`docs/INCIDENT_RECOVERY_PLAYBOOK.md`** in **PropArt-Creator-Space** — outage/compromise escalation.
- **`public/MOBILE_AND_BRAND_COLLATERAL_WHITEPAPER.md`** in **PropArt-Creator-Space** — mobile and PWA tiers, print collateral (business cards, letterhead), QR policy, and per-app checklist when copying builds into this repo for path-hosted deploys.

---

*Last updated: 2026-06-04*
