# Decap CMS Migration — Deployment Overview

> **Date:** 2026-06-21
> **Branch:** `decap-cms-migration`
> **Status:** Implementation complete, pending deployment

## Quick Reference

| Service | URL | Config |
|---|---|---|
| Astro Site | `https://service-chine.pages.dev` | `src/pages/admin.astro` |
| Decap CMS Admin | `https://service-chine.pages.dev/admin` | `public/admin/config.yml` |
| OAuth Proxy | `https://decap-proxy.<zone>` | `proxy/wrangler.jsonc` |

## Architecture

```
GitHub Repo (sabrinabean/service-chine)
  │
  ├── proxy/ (decap-proxy Worker source)
  │     └── Cloudflare Worker → OAuth /auth, /callback
  │
  └── src/  (Astro site source)
        └── Cloudflare Worker → Static site + /admin (Decap CMS)
```

## Deployment Documents

| Doc | Purpose |
|---|---|
| [setup-oauth-app.md](setup-oauth-app.md) | GitHub OAuth App creation |
| [deploy-proxy.md](deploy-proxy.md) | Proxy Worker deployment + secrets |
| [deploy-site.md](deploy-site.md) | Astro site deployment |
| [post-migration.md](post-migration.md) | Verification checklist + rollback |
| [troubleshooting.md](troubleshooting.md) | Common issues and solutions |

## Quick Start

1. Create GitHub OAuth App → see [setup-oauth-app.md](setup-oauth-app.md)
2. Deploy proxy Worker → see [deploy-proxy.md](deploy-proxy.md)
3. Deploy Astro site → see [deploy-site.md](deploy-site.md)
4. Verify everything → see [post-migration.md](post-migration.md)

## New GitHub Secrets Required

| Secret | Value |
|---|---|
| `OAUTH_CLIENT_ID` | GitHub OAuth App Client ID |
| `OAUTH_CLIENT_SECRET` | GitHub OAuth App Client Secret |
