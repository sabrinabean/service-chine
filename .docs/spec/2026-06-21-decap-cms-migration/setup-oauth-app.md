# Setup GitHub OAuth App

> Prerequisite: GitHub account that owns the repository (`sabrinabean`).

## Step 1: Create OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**
2. Fill in:
   - **Application name:** `Service Chine CMS`
   - **Homepage URL:** `https://service-chine.pages.dev`
   - **Application description:** `Decap CMS OAuth for service-chine content management`
   - **Authorization callback URL:** `https://decap-proxy.<zone>/callback?provider=github`
     > Replace `<zone>` with the actual Cloudflare zone/workers.dev domain.
     > This is the **proxy URL**, NOT the site URL!
3. Click **Register application**

## Step 2: Generate Client Secret

1. On the OAuth App page, click **Generate a new client secret**
2. Copy both:
   - **Client ID** → becomes `GITHUB_OAUTH_ID`
   - **Client Secret** → becomes `GITHUB_OAUTH_SECRET` (shown only once!)

## Step 3: Configure Proxy Worker's base_url in config.yml

The `config.yml` at `public/admin/config.yml` must reference the proxy's actual URL:

```yaml
backend:
  name: github
  branch: main
  repo: sabrinabean/service-chine
  base_url: https://decap-proxy.<zone>  # ← UPDATE THIS after proxy is deployed
  auth_endpoint: /auth
```

> Update this value AFTER the proxy Worker is deployed and you know its URL.

## Step 4: Add Secrets to GitHub

1. Go to repo → Settings → Secrets and variables → Actions
2. Add:
   - `OAUTH_CLIENT_ID` = OAuth App Client ID
   - `OAUTH_CLIENT_SECRET` = OAuth App Client Secret

> **Note:** GitHub does not allow secret names to start with `GITHUB_`. We use `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` here. Inside the Worker, the variables are still named `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET` — the deploy workflow maps `OAUTH_CLIENT_*` secret → `GITHUB_OAUTH_*` env var.

These are used by the GitHub Action to deploy the proxy Worker with the right secrets.

## Account Consistency

The OAuth App, repository, and CMS login user MUST all be under the same GitHub account (`sabrinabean`). If not, Decap CMS will get 404 errors when trying to read/write content.
