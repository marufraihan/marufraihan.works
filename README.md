# marufraihan.works

Website and CMS for Maruf Raihan Works.

- **Website**: `web/` (Next.js, exported as static pages, hosted on Cloudflare Pages)
- **CMS**: `studio/` (Sanity Studio, served at `/admin`)
- **Wix import**: `import/` (one-time copy of all projects, photos and videos from the old site)

## Everyday use

1. Open **marufraihan.works/admin** and sign in.
2. Edit or add a project, then press **Publish**.
3. The site rebuilds by itself and the change is live in about 3–5 minutes.

Views in the CMS:
- **Content**: projects, journal, homepage, studio page, team, contact details, extra redirects.
- **Table**: every project in one spreadsheet. Edit cells, tick "Homepage", then **Publish changes**.
- **Edit on page**: the page next to its fields, updating as you type.

Tips:
- Photos: drag a folder of JPGs into **Photos & drawings**, drag to reorder, click a photo to set its layout (full width, half, drawing) and caption.
- Experiential and Film projects automatically use the dark page style.
- Long films go on YouTube or Vimeo; paste the link in **Film**. Short muted loops (under 20 MB) can be uploaded.
- Old Wix links keep working through each project's **Old Wix addresses** field.

## One-time setup

### 1. Sanity (sanity.io/manage → your project)
1. **Datasets**: make sure a dataset called `production` exists and is **Public**.
2. **API → CORS origins → Add**: add each of these with **Allow credentials** ticked:
   `https://marufraihan.works`, `https://www.marufraihan.works`, `https://marufraihan-works.pages.dev`
3. **API → Tokens → Add API token**: name `GitHub`, permission **Editor**. Copy it (shown once).

### 2. Cloudflare (dash.cloudflare.com)
1. **Account ID**: open **Workers & Pages**; the Account ID is in the right-hand column. Copy it.
2. **API token**: profile icon → **My Profile → API Tokens → Create Token → Create Custom Token**.
   Permission: **Account → Cloudflare Pages → Edit**. Create and copy the token.

### 3. GitHub (this repository → Settings → Secrets and variables → Actions)
- **Variables** tab → New variable: `SANITY_PROJECT_ID` = `wgudx0eu`
- **Secrets** tab → New secret, three times:
  - `SANITY_WRITE_TOKEN` (from Sanity)
  - `CLOUDFLARE_API_TOKEN` (from Cloudflare)
  - `CLOUDFLARE_ACCOUNT_ID` (from Cloudflare)
- Optional: `WEB3FORMS_KEY` (free key from web3forms.com) so the contact form sends email. Without it, the form opens the visitor's email app.

### 4. Import from Wix
**Actions** tab → **Import from Wix** → **Run workflow**. It takes roughly 20–60 minutes.
When it finishes, the site is published to `https://marufraihan-works.pages.dev`.
The run's **import-results** download contains a report and any videos too large for the CMS.

### 5. Publish automatically when you press Publish
1. GitHub → profile → **Settings → Developer settings → Fine-grained tokens → Generate new token**.
   Repository access: only `marufraihan.works`. Permissions: **Contents: Read and write**. Copy it.
2. Sanity → **API → Webhooks → Create webhook**:
   - URL: `https://api.github.com/repos/marufraihan/marufraihan.works/dispatches`
   - Dataset: `production`, Trigger on: Create, Update, Delete
   - Filter: `_type in ["project", "post", "home", "studioPage", "settings", "member", "redirect"]`
   - Projection: `{"event_type": "sanity-publish"}`
   - HTTP method: POST. Leave "Drafts" off.
   - HTTP headers: `Authorization` = `Bearer <the GitHub token>`, `Accept` = `application/vnd.github+json`

### 6. Move the domain (last step, after checking the new site)
1. Cloudflare → **Add a domain** → `marufraihan.works` → Free plan. Cloudflare copies the existing DNS records.
   **Check that the MX (email) records are in the list** so mail@marufraihan.works keeps working.
2. Namecheap → Domain List → marufraihan.works → **Nameservers: Custom DNS** → paste the two Cloudflare nameservers.
3. Cloudflare → Workers & Pages → `marufraihan-works` → **Custom domains** → add `marufraihan.works` and `www.marufraihan.works`.
4. When the new site loads on the domain, cancel the Wix plan.

## Costs
Sanity Free plan (100 GB storage, 100 GB/month delivery), Cloudflare Pages Free, GitHub Actions (free for public repositories). No card needed.

## For developers
- `studio`: `npm i && npm run dev` (needs `SANITY_STUDIO_PROJECT_ID`)
- `web`: `npm i && npm run build` (reads published content from Sanity at build time). `SANITY_FIXTURE=path.json` builds from local test data.
- `import`: `npm i && node import.mjs --dry`
- Deploys: `.github/workflows/deploy.yml` (push, CMS webhook, daily). Several publishes within a minute become one build.
