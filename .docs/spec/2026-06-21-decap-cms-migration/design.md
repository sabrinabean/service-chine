# Decap CMS Migration — Design Spec

> **Date:** 2026-06-21
> **Branch:** From `main`
> **Goal:** Replace Keystatic with Decap CMS, deploy on Cloudflare (Astro + decap-proxy)

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────┐
│  GitHub Repository (service-chine)                   │
│                                                      │
│  proxy/                  src/                        │
│  ├── src/index.ts        ├── pages/admin.astro       │
│  ├── wrangler.jsonc      ├── content/  (4 collections)│
│  └── package.json        ├── content.config.ts       │
│                          └── public/admin/config.yml │
└──────────────┬──────────────────────┬────────────────┘
               │                      │
     ┌─────────▼─────────┐   ┌────────▼──────────┐
     │ Cloudflare Worker #1  │ Cloudflare Worker #2  │
     │ decap-proxy          │ Astro site             │
     │ decap-proxy.<zone>   │ service-chine.<zone>   │
     │                      │                        │
     │ GitHub OAuth proxy   │ /admin → Decap CMS     │
     │ /auth → OAuth flow   │ Static pages + content │
     └──────────────────────┴────────────────────────┘
```

### Changes summary

| Layer | Before (Keystatic) | After (Decap CMS) |
|---|---|---|
| CMS entry | `/keystatic` (Astro integration) | `/admin` (Astro page + npm package) |
| Content config | `keystatic.config.ts` | `public/admin/config.yml` |
| Content validation | `keystatic.config.ts` schema | `src/content.config.ts` Zod (unchanged) |
| OAuth proxy | Keystatic built-in GitHub OAuth | `proxy/` directory — independent Worker |
| Deployment | 1 Worker | 2 Workers (proxy + site) |
| Dependencies | `@keystatic/core`, `@keystatic/astro` | `decap-cms-app` |

---

## 2. Content Collections Mapping

### 2.1 blog

| Keystatic (TypeScript) | Decap CMS config.yml (YAML) |
|---|---|
| `title: fields.slug()` | `{name: title, widget: string}` |
| `description: fields.text()` | `{name: description, widget: text}` |
| `pubDate: fields.date()` | `{name: pubDate, widget: datetime}` |
| `updatedDate: fields.date()` | `{name: updatedDate, widget: datetime, required: false}` |
| `thumbnail: fields.image()` | `{name: thumbnail, widget: image}` |
| `category: fields.relationship()` | `{name: category, widget: relation, collection: categories, value_field: title, search_fields: [title]}` |
| `author: fields.object({slug, name})` | `{name: authorSlug, widget: string}` + `{name: authorName, widget: string}` |
| `content: fields.mdx()` | `{name: body, widget: markdown}` |

### 2.2 categories

| Keystatic | Decap CMS config.yml |
|---|---|
| `title: fields.slug()` | `{name: title, widget: string}` |
| `description: fields.text()` | `{name: description, widget: text, required: false}` |
| `order: fields.integer()` | `{name: order, widget: number, valueType: int, default: 0}` |
| `thumbnail: fields.image()` | `{name: thumbnail, widget: image, required: false}` |
| `content: fields.mdx()` | `{name: body, widget: markdown, required: false}` |

### 2.3 service

| Keystatic | Decap CMS config.yml |
|---|---|
| `title: fields.slug()` | `{name: title, widget: string}` |
| `description: fields.text()` | `{name: description, widget: text}` |
| `pubDate: fields.date()` | `{name: pubDate, widget: datetime}` |
| `updatedDate: fields.date()` | `{name: updatedDate, widget: datetime, required: false}` |
| `thumbnail: fields.image()` | `{name: thumbnail, widget: image, required: false}` |
| `featured: fields.checkbox()` | `{name: featured, widget: boolean, default: false}` |
| `content: fields.mdx()` | `{name: body, widget: markdown}` |

### 2.4 team

| Keystatic | Decap CMS config.yml |
|---|---|
| `title: fields.slug()` | `{name: title, widget: string}` |
| `description: fields.text()` | `{name: description, widget: text}` |
| `pubDate: fields.date()` | `{name: pubDate, widget: datetime}` |
| `updatedDate: fields.date()` | `{name: updatedDate, widget: datetime, required: false}` |
| `thumbnail: fields.image()` | `{name: thumbnail, widget: image, required: false}` |
| `featured: fields.checkbox()` | `{name: featured, widget: boolean, default: false}` |
| `rating: fields.integer()` | `{name: rating, widget: number, valueType: int, default: 5}` |
| `content: fields.mdx()` | `{name: body, widget: markdown}` |

### Key differences

- Keystatic nested `author: object({slug, name})` → flattened to `authorSlug` + `authorName` in Decap.
- Keystatic `fields.relationship()` → Decap `widget: relation` with `value_field` and `search_fields`.
- `image` widget needs `media_folder` / `public_folder` configured per collection. See §2.5 below.
- Keystatic `fields.slug()` auto-generates a slugified filename from title. Decap uses `slug` option in collection config (e.g., `slug: "{{title}}"`).
- Decap writes frontmatter fields; `content.config.ts` Zod schema remains unchanged for read-time validation.

### 2.5 Image media paths

| Collection | Keystatic `directory` | Keystatic `publicPath` | Decap `media_folder` | Decap `public_folder` |
|---|---|---|---|---|
| blog | `src/assets/images/blog` | `../../assets/images/blog/` | `src/assets/images/blog` | `/assets/images/blog` |
| categories | `src/assets/images/categories` | `../../assets/images/categories/` | `src/assets/images/categories` | `/assets/images/categories` |
| service | `src/assets/images/service` | `../../assets/images/service/` | `src/assets/images/service` | `/assets/images/service` |
| team | `src/assets/images/team` | `../../assets/images/team/` | `src/assets/images/team` | `/assets/images/team` |

> **Note:** Existing content files use relative paths like `../../assets/news/b1.jpg`. Decap's image widget stores paths relative to `public_folder`. Existing image paths in frontmatter may need normalization during migration. To be verified against actual file contents.

---

## 3. Admin Page (`src/pages/admin.astro`)

**Dependency:** `npm install decap-cms-app`

```astro
---
// Static generation — no SSR needed for the admin shell
---
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <link href="/admin/config.yml" type="text/yaml" rel="cms-config-url" />
    <title>Service Chine — Gestion de contenu</title>
  </head>
  <body>
    <script>
      // decap-cms-app auto-initializes and takes over the page
      import 'decap-cms-app';
    </script>
  </body>
</html>
```

**Key points:**
- `config.yml` lives at `public/admin/config.yml` — served as a static asset by Astro.
- `<link rel="cms-config-url">` tells Decap where to find configuration.
- `import 'decap-cms-app'` is bundled by Astro/Vite — version locked in `package.json`.
- No React component authoring needed — import triggers auto-mount.

---

## 4. OAuth Proxy (`proxy/`)

### 4.1 Directory structure

```
proxy/
├── package.json          # wrangler + hono dependencies only
├── tsconfig.json
├── wrangler.jsonc        # Worker configuration
└── src/
    └── index.ts          # decap-proxy source (~200 lines Hono routes)
```

### 4.2 Cloudflare environment variables (Dashboard → Worker → Variables)

| Variable | Purpose |
|---|---|
| `GITHUB_OAUTH_ID` | GitHub OAuth App Client ID |
| `GITHUB_OAUTH_SECRET` | GitHub OAuth App Client Secret |
| `GITHUB_REPO_PRIVATE` | `"true"` (repository is private) |
| `ORIGIN_URL` | Astro site URL (for CORS) |

### 4.3 OAuth flow

```
User → /admin (Decap CMS)
        │
        │ Click "Login with GitHub"
        ▼
Decap CMS → proxy/auth → GitHub OAuth authorization page
        │
        │ User authorizes
        ▼
GitHub → proxy/callback → exchange token → return access_token
        │
        ▼
Decap CMS ← receives token ← reads/writes repo content via GitHub API
```

### 4.4 `config.yml` backend section

```yaml
backend:
  name: github
  branch: main
  repo: sabrinabean/service-chine
  base_url: https://decap-proxy.service-chine.pages.dev
  auth_endpoint: /auth
```

### 4.5 Source origin

Forked from [sterlingwes/decap-proxy](https://github.com/sterlingwes/decap-proxy) — core logic is ~200 lines of Hono routes. Adapted to this project's paths and settings. Not installed as npm dependency; source is vendored in the repository for full control.

---

## 5. Deployment Changes (`.github/workflows/deploy.yml`)

**Before:** Single job — `build` + `wrangler deploy`.

**After:** Two jobs, sequential:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: workers-deploy
  cancel-in-progress: true

jobs:
  deploy-proxy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: 'proxy/package-lock.json'
      - run: cd proxy && npm ci
      - name: Deploy OAuth Proxy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: proxy
          command: deploy

  deploy-site:
    needs: deploy-proxy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --compatibility-flag nodejs_compat
```

### New Cloudflare secrets for proxy Worker

| Secret | Where |
|---|---|
| `GITHUB_OAUTH_ID` | GitHub OAuth App → Client ID |
| `GITHUB_OAUTH_SECRET` | GitHub OAuth App → Client Secret |
| `GITHUB_REPO_PRIVATE` | `"true"` |

Stored in GitHub repo **Secrets** → injected by Action. Can alternatively be set in Cloudflare Dashboard → Worker → Variables and Secrets.

### Removed items

| Item | Reason |
|---|---|
| `@keystatic/core` | No longer used |
| `@keystatic/astro` | No longer used |
| `keystatic.config.ts` | Replaced by `public/admin/config.yml` |
| `keystatic()` integration in astro.config.mjs | No longer needed |
| Keystatic-specific Cloudflare env vars | No longer needed |

### May also be removable (evaluate)

- `prerenderEnvironment: 'node'` in `astro.config.mjs` — only needed for Keystatic's broken CommonJS deps.
- `optimizeDeps.exclude: ['cloudflare:sockets', ...]` — may be Keystatic-specific.
- `@astrojs/markdoc` — if no longer needed (Keystatic used `.mdoc` but content is `.md`).

---

## 6. Testing Plan

| Stage | Test | Method |
|---|---|---|
| Local | `npm run dev` starts, `/admin` loads without errors | Browser |
| Local | All existing pages render: home, blog/[*], service/[*], team/[*], about, contact | Manual check |
| Local | `config.yml` has no YAML errors; Decap CMS parses it | Browser `/admin` → console |
| Local | `npm run build` succeeds | Terminal |
| Staging | decap-proxy Worker deployed; `GET /auth` responds | curl |
| Staging | GitHub OAuth flow: Login → Authorize → Enter CMS | Browser |
| Staging | Create/edit an article; commit pushes to repo | Edit + Save |
| Staging | Commit triggers Action; site auto-deploys updated content | Push → wait → verify |
| Staging | All 4 collections editable in CMS | Verify each |

---

## 7. Risks & Mitigations

### 7.1 File format compatibility — ⚠️ MEDIUM
Current files use YAML frontmatter + Markdown body. Decap's `body` widget writes to the body portion. If any existing file has a non-empty `content:` frontmatter field (written by Keystatic), Decap may show duplicate body content.
**Mitigation:** Audit all existing `.md` files before migration. Remove any `content:` frontmatter fields.

### 7.2 author field flattening — ⚠️ LOW
Keystatic nested `author: { slug, name }` → flattened to `authorSlug` + `authorName`. All Astro components referencing `data.author.slug` / `.name` must be updated.
**Mitigation:** Grep for `author.slug` and `author.name` across the codebase; update to new flat field names.

### 7.3 category relation widget — LOW
Decap's `widget: relation` uses `value_field: title` (slug). No image field filtering needed — works as-is.

### 7.4 `/admin` route & static asset serving — LOW
`config.yml` is in `public/admin/` (Astro serves as static). `admin.astro` generates `/admin/index.html`. Paths match.

### 7.5 decap-cms-app + Astro/Vite 6 compatibility — LOW
`decap-cms-app` is a pure frontend React app; import triggers initialization. It does not depend on Astro or React version. Risk is Vite bundling of CommonJS modules, but decap-cms-app provides ESM entry point.

### 7.6 decap-proxy upstream stability — RESOLVED
Source is vendored into `proxy/` directory, not installed as an npm dependency. Core logic is ~200 lines. Maintenance is manageable.

---

## 8. Deployment Documentation

Documents will be created at `docs/superpowers/specs/2026-06-21-decap-cms-migration/`:

| Doc | Content |
|---|---|
| `README.md` | Overview + quick links |
| `setup-oauth-app.md` | GitHub OAuth App creation steps |
| `deploy-proxy.md` | decap-proxy Worker deployment + variable configuration |
| `deploy-site.md` | Astro site deployment (including config.yml reference) |
| `post-migration.md` | Post-migration verification checklist, rollback plan |
| `troubleshooting.md` | Common issues and solutions |

---

## 9. Implementation Order

1. Create branch from `main`
2. Remove Keystatic dependencies and config
3. Create `public/admin/config.yml`
4. Create `src/pages/admin.astro`
5. Update Astro components for author field flattening
6. Set up `proxy/` directory with decap-proxy source
7. Update `.github/workflows/deploy.yml`
8. Write deployment documentation
9. Test locally (`npm run dev`, `npm run build`)
10. Deploy to staging and verify OAuth flow
