# PropArt™ Directory (static)

Public suite hub (`index.html` + assets). Deployed to **[propart.app](https://propart.app/)** via your DNS/hosting choice.

## GitHub Pages (optional — fixes “repo updated, site old” drift)

1. Repo **Settings** → **Pages** → **Build and deployment** → source: **GitHub Actions** (not “Deploy from a branch”).
2. Push to **`master`** — workflow **Deploy Directory to GitHub Pages** runs (see `.github/workflows/deploy-github-pages.yml`).
3. **Custom domain:** **Pages** → **Custom domain** → `propart.app` / `www.propart.app`; DNS at your registrar/Cloudflare per [GitHub Pages custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

If you use **Cloudflare Pages** or another host instead, disable or ignore this workflow and deploy there.

## Firebase Hosting mirror (`propart-directory`)

From this repo, against project **`ps---propartsuite`**:

```bash
firebase deploy --only hosting --project ps---propartsuite
```

**`firebase.json`** defines **301** short paths on that site only (not on GitHub Pages unless you duplicate config there):

| Path on `propart-directory.web.app` | Redirects to |
|-------------------------------------|----------------|
| `/creator` | `https://propart-creator.web.app/` |
| `/studio` | `https://propart-studio.web.app/` |
| `/cropper` | `https://propart-cropper.web.app/` |
| `/blend`, `/color-blend` | `https://propart-color-blend.web.app/` |
| `/cane` | `https://propart-cane.web.app/` |
| `/pod`, `/cardart` | `https://propart-pod.web.app/` (CardArt / POD) |

Useful for short links and bookmarks; **`propart.app`** DNS should still point at **one** primary host (Pages vs Firebase vs other).

**`.nojekyll`** — present so GitHub Pages does not ignore paths that start with `_` if you add them later.
