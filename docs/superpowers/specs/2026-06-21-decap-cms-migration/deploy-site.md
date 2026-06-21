# Deploy Astro Site (Decap CMS)

## What Changed

### Removed
- `@keystatic/core`, `@keystatic/astro` dependencies
- `@astrojs/markdoc` (no longer needed)
- `keystatic.config.ts`
- `keystatic()` from `astro.config.mjs` integrations
- Keystatic-related Cloudflare env vars

### Added
- `decap-cms-app` npm dependency
- `src/pages/admin.astro` — CMS admin page
- `public/admin/config.yml` — CMS configuration
- `proxy/` directory — OAuth proxy Worker

## config.yml Reference

Located at `public/admin/config.yml`. Contains:

- **Backend:** GitHub backend pointing to decap-proxy
- **4 Collections:** blog, categories, service, team
- **Media:** Images stored under `src/assets/{collection}/`
- **File format:** YAML frontmatter + Markdown body (matches existing content)

### Publishing workflow

`publish_mode: editorial_workflow` is enabled. This means content changes go through a draft → review → publish flow with PR-based workflow. If you prefer direct commits (like Keystatic was doing), change to:

```yaml
publish_mode: simple
```

## Accessing the CMS

Visit `https://service-chine.pages.dev/admin/`

1. Click **Login with GitHub**
2. Authorize the OAuth App
3. You're redirected to the CMS editor

## Astro Content Validation

`src/content.config.ts` Zod schemas are unchanged. They continue to validate content at read time. Decap CMS is responsible for writing valid frontmatter.

## Image Handling

Decap's image widget uploads to the collection-specific media folder:

| Collection | Upload to | Frontmatter path |
|---|---|---|
| blog | `src/assets/news/` | `../../assets/news/<file>` |
| service | `src/assets/services/` | `../../assets/services/<file>` |
| team | `src/assets/team/` | `../../assets/team/<file>` |
| categories | `src/assets/categories/` | `../../assets/categories/<file>` |

## Deploy

Push to `main`. The GitHub Action will:
1. Deploy the proxy Worker first
2. Then build and deploy the Astro site

The site build uses the same `wrangler deploy --compatibility-flag nodejs_compat` as before.
