# Deploy OAuth Proxy (decap-proxy)

The proxy is an independent Cloudflare Worker at `proxy/`.

## Directory Structure

```
proxy/
├── package.json
├── package-lock.json
├── tsconfig.json
├── wrangler.jsonc          # Worker config
└── src/
    ├── index.ts            # Main Worker entry point
    └── oauth.ts            # GitHub OAuth client
```

## Pre-Flight: GitHub Secrets

Ensure these are set in repo → Settings → Secrets and variables → Actions:

- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Option A: Deploy via GitHub Action (recommended)

Push to `main` (or manually trigger the `deploy-proxy` job in Actions). The workflow:

1. Checks out the repo
2. Installs proxy dependencies (`cd proxy && npm ci`)
3. Runs `wrangler deploy` with OAuth secrets injected
4. The proxy Worker is live at `decap-proxy.<account>.workers.dev`

## Option B: Deploy manually from local

```bash
cd proxy
npm ci

# Set secrets
npx wrangler secret put GITHUB_OAUTH_ID
npx wrangler secret put GITHUB_OAUTH_SECRET

# Deploy
npx wrangler deploy
```

## Verify Deployment

```bash
# Check the worker is alive
curl https://decap-proxy.<zone>/
# Should return: "Hello 👋"

# Check auth endpoint
curl -I https://decap-proxy.<zone>/auth?provider=github
# Should return HTTP 301 (redirect to GitHub)
```

## Update config.yml

After deployment, update `public/admin/config.yml` `backend.base_url` to the proxy's actual URL:

```yaml
backend:
  base_url: https://decap-proxy.<zone>
```

## Environment Variables (set in Cloudflare Dashboard)

| Variable | Type | Value |
|---|---|---|
| `GITHUB_OAUTH_ID` | Secret | OAuth App Client ID |
| `GITHUB_OAUTH_SECRET` | Secret | OAuth App Client Secret |
| `GITHUB_REPO_PRIVATE` | Plain text | `"1"` (set in wrangler.jsonc vars) |

## How It Works

```
Decap CMS (/admin)
  │ Login with GitHub clicked
  ▼
GET proxy/auth?provider=github
  │ Redirect to GitHub OAuth page
  ▼
GitHub Authorization page
  │ User approves
  ▼
GET proxy/callback?code=...
  │ Exchange code for token
  ▼
POST to GitHub token endpoint → access_token
  │ Return token to Decap via window.opener.postMessage
  ▼
Decap CMS authenticated — reads/writes repo via GitHub API
```
