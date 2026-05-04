# PropArt™ Directory (static)

Public suite hub (`index.html` + assets). Deployed to **[propart.app](https://propart.app/)** via your DNS/hosting choice.

## GitHub Pages (optional — fixes “repo updated, site old” drift)

1. Repo **Settings** → **Pages** → **Build and deployment** → source: **GitHub Actions** (not “Deploy from a branch”).
2. Push to **`master`** — workflow **Deploy Directory to GitHub Pages** runs (see `.github/workflows/deploy-github-pages.yml`).
3. **Custom domain:** **Pages** → **Custom domain** → `propart.app` / `www.propart.app`; DNS at your registrar/Cloudflare per [GitHub Pages custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

If you use **Cloudflare Pages** or another host instead, disable or ignore this workflow and deploy there.
