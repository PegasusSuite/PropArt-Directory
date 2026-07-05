# PropArt™ Directory (static)

Public suite hub (`index.html` + assets). Deployed to **[propart.app](https://propart.app/)** via your DNS/hosting choice.

## GitHub Pages (optional — fixes "repo updated, site old" drift)

1. Repo **Settings** → **Pages** → **Build and deployment** → source: **GitHub Actions** (not "Deploy from a branch").
2. Push to **`master`** — workflow **Deploy Directory to GitHub Pages** runs (see `.github/workflows/deploy-github-pages.yml`).
3. **Custom domain:** **Pages** → **Custom domain** → `propart.app` / `www.propart.app`; DNS at your registrar/Cloudflare per [GitHub Pages custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

If you use **Cloudflare Pages** or another host instead, disable or ignore this workflow and deploy there.

## Firebase Hosting mirror (`propart-directory`)

From this repo, against project **`ps---propartsuite`**:

```bash
firebase deploy --only hosting --project ps---propartsuite
```

**`firebase.json`** defines **301** short paths and **path-hosted** app folders on **`propart-directory`** (same model as [www.propart.app](https://www.propart.app/)):

| Path | Resolves to |
|------|-------------|
| `/creator`, `/hub` | `/Hub` |
| `/studio` | `/Studio` |
| `/cropper` | `/CropperTool` |
| `/blend` | `/BlendVisualizer` |
| `/cane` | `/CaneDesigner` |
| `/pod`, `/cardart` | `/POD` |

**`/api/*`** (checkout, contact, downloads, Stripe webhook) rewrites to Cloud Functions on this Hosting site. See **`README-SUITE-URLS.md`**.

**`.nojekyll`** — present so GitHub Pages does not ignore paths that start with `_` if you add them later.
