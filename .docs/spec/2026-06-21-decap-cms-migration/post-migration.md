# Post-Migration Verification Checklist

Run these checks after deploying both the proxy Worker and the Astro site.

## 1. Proxy Worker

- [ ] `curl https://decap-proxy.<zone>/` returns "Hello 👋"
- [ ] `curl -I https://decap-proxy.<zone>/auth?provider=github` returns HTTP 301
- [ ] Proxy Worker secrets (GITHUB_OAUTH_ID, GITHUB_OAUTH_SECRET) are set in Cloudflare Dashboard

## 2. Astro Site — Static Pages

- [ ] Home page loads: `https://service-chine.pages.dev/`
- [ ] Blog list page: `/blog/1`
- [ ] Individual blog post: `/blog/<slug>`
- [ ] Service list: `/service/1`
- [ ] Individual service: `/service/<slug>`
- [ ] Team list: `/team/1`
- [ ] Individual team member: `/team/<slug>`
- [ ] About page: `/about`
- [ ] Contact page: `/contact`
- [ ] Policy page: `/policy`
- [ ] Terms page: `/terms`
- [ ] 404 page works for non-existent routes

## 3. Decap CMS — Admin Page

- [ ] `https://service-chine.pages.dev/admin/` loads without JavaScript errors
- [ ] `config.yml` is served and valid: `curl https://service-chine.pages.dev/admin/config.yml`
- [ ] Login button shows "Login with GitHub" (not Netlify Identity)

## 4. Decap CMS — Authentication

- [ ] Clicking "Login with GitHub" redirects to GitHub authorization page
- [ ] After authorization, redirected back to CMS editor
- [ ] CMS shows collections: Catégories, Articles, Services, Équipe

## 5. Decap CMS — Content Editing

- [ ] Can view existing blog articles in the CMS
- [ ] Can view existing categories
- [ ] Can view existing services
- [ ] Can view existing team members
- [ ] Can create a new article (save as draft)
- [ ] Can edit an existing article's body content
- [ ] Can upload an image via the image widget

## 6. Publishing Flow

- [ ] Publishing a change pushes a commit to the `main` branch
- [ ] Commit triggers the GitHub Action
- [ ] Action deploys successfully (both proxy and site jobs)
- [ ] Updated content appears on the live site

## Rollback Plan

If something goes wrong:

### Option 1: Revert the branch
```bash
git checkout main
git branch -D decap-cms-migration
```
Then re-deploy from main (which still has Keystatic).

### Option 2: Revert specific commits
```bash
git revert <commit-hash>  # Revert the migration commits
git push
```

### Option 3: Restore Keystatic manually
1. Re-install `@keystatic/core`, `@keystatic/astro`, `@astrojs/markdoc`
2. Restore `keystatic.config.ts` from git history
3. Restore `astro.config.mjs` keystatic integration
4. Restore original `.github/workflows/deploy.yml`
5. Re-deploy

## Notes

- Existing content files are NOT modified by this migration — they remain as `.md` with YAML frontmatter.
- If Decap CMS shows unexpected fields in the editor, check `config.yml` field names against the actual frontmatter keys.
- The `publish_mode: editorial_workflow` setting creates draft PRs instead of direct commits. Change to `simple` if direct commits are preferred.
