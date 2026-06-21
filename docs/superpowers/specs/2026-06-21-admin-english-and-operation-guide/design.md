# Admin English UI + Operation Guide — Design Spec

> **Date:** 2026-06-21
> **Branch:** From `main`
> **Goal:** Switch the Decap CMS admin UI to English (while site content stays French), and produce a Chinese operation guide in `.docs/operation/` explaining how categories & articles map to the site.

---

## 1. Background & Problem

The site is an **Astro 6** static site deployed on **Cloudflare**, with **Decap CMS** as the content editor. Decap CMS is loaded by `src/pages/admin.astro` (via `decap-cms-app`); its editable structure and field labels are defined by `public/admin/config.yml`. GitHub OAuth is handled by a separate Cloudflare Worker in `proxy/`.

Two problems to solve:

1. **Admin UI is in French.** The site must be French (for visitors), but the operators manage it through the admin. French admin labels make daily operation harder than necessary. Operators want the **admin UI in English**; the **content they type stays French**.

2. **No operation documentation.** Operators have no guide explaining the admin, and specifically how **categories** relate to **articles** on the site. This matters because the category mechanism has a real pitfall (see §2).

### Key distinction enforced throughout

| | Language | Source |
|---|---|---|
| **Admin UI** (Decap shell) | 🇬🇧 English | `config.yml` `locale` + field `label`s |
| **Site content** (what visitors see) | 🇫🇷 French | The data operators type into those English-labelled fields |

The English work touches **labels and UI chrome only**, never the content data.

---

## 2. Findings (explored before designing)

### 2.1 Where the admin text comes from

- `config.yml` line 15: `locale: "fr"` → drives Decap's built-in strings (buttons, date pickers, editorial workflow labels, validation messages).
- Every `label:` / `label_singular:` in `config.yml` → drives collection names and field labels (currently French: `Catégories`, `Titre`, `Image à la une`, …).
- `src/pages/admin.astro`: `<html lang="fr">` and a French `<title>`.

`proxy/` has **no UI text** — it only exchanges OAuth codes/tokens. Out of scope.

### 2.2 The category ↔ article mechanism (core of the guide)

- **A category is a file.** `src/content/categories/cleaning.md` holds `{ title: "Conseils d'entretien", order: 1 }`. The **filename** (`cleaning`) is the identity; `title` is the French display string.
- **An article references a category by filename.** Blog frontmatter `category: cleaning` (see `b1.md`) stores the **filename**, not the title.
- **The resolver keys by filename.** `src/utils/categories.ts` → `getCategoryMap()` builds `Map<entry.id, {slug, title}>` keyed on the **file id (filename)**. `resolveCategory(slug)` reads that map; components `NewsCard.astro` and `BlogPost.astro` call it to render the badge + build `/blog/<slug>` link. If no file matches, it falls back to `{ slug, title: slug }` (raw slug as title — the visible symptom of a broken link).

### 2.3 ⚠️ Defect: relation stores the title, not the filename

`config.yml` (lines 55–61) configures the blog category relation with `value_field: title`:

```yaml
- label: "Catégorie"
  name: category
  widget: relation
  collection: categories
  value_field: title            # ← stores the category TITLE in frontmatter
  search_fields: [title]
  display_fields: [title]
```

The resolver reads by **filename**, but new posts created in the CMS would store the **title** (`"Conseils d'entretien"`). Mismatch → fallback → badge shows the raw title string and links to `/blog/Conseils d'entretien` (404).

The existing 4 posts work only because someone hand-wrote filenames (`cleaning`, `cat-1`, `cat-2`) into the markdown.

**Fix:** `value_field: title` → `value_field: "{{slug}}"` so Decap stores the filename, matching the resolver. `display_fields: [title]` stays — operators still **see** French titles in the dropdown; Decap just **stores** the filename behind the scenes. `search_fields: [title]` stays.

> Note: Decap's `{{slug}}` for a relation resolves to the entry's **filename** (the file name without extension), which equals Astro content collection `entry.id` here. Verified against how `getCategoryMap()` keys its map.

### 2.4 ⚠️ Known limitation: no category listing page (documented, not fixed)

Even with the relation fixed, there is **no `/blog/<category>` listing page** in `src/pages/blog/` — only `[...page].astro` (index, paginated) and `[...slug].astro` (article detail). So a category badge link like `/blog/cleaning` currently 404s.

Per the chosen scope ("Fix + document"), this spec **documents the limitation for operators but does not add the page**. Listed in §6 as out-of-scope follow-up.

### 2.5 Image/media paths (verified against real tree)

Real structure: `src/assets/{categories,news,services,team,fonts}`. Existing frontmatter uses relative `../../assets/news/b1.jpg` etc.

`config.yml` is already correct for images (root `media_folder: "src/assets"`, per-collection `public_folder: "../../assets/<bucket>"`). The earlier migration spec's `images/blog` table was stale and is superseded by this. No image-path change needed; the guide just records the correct buckets:

| Collection | Image bucket |
|---|---|
| Articles (blog) | `src/assets/news/` |
| Categories | `src/assets/categories/` |
| Services | `src/assets/services/` |
| Team | `src/assets/team/` |

---

## 3. Scope of Work

### 3.1 Task 1 — Admin UI → English

**`public/admin/config.yml`**
1. `locale: "fr"` → `locale: "en"`.
2. Translate all French `label` / `label_singular` to English (full mapping in §4).
3. Fix the category relation: `value_field: title` → `value_field: "{{slug}}"` (`display_fields: [title]`, `search_fields: [title]` unchanged).
4. Translate the French header comments to English.

**`src/pages/admin.astro`** (3 lines)
- `<html lang="fr">` → `<html lang="en">`.
- `<title>Service Chine — Gestion de contenu</title>` → `<title>Service Chine — Content Management</title>`.

**Out of scope:** `proxy/`, `src/content.config.ts`, all site components, all content data (stays French).

### 3.2 Task 2 — Operation guide

**`.docs/operation/admin-operation-guide.md`** — one Chinese-language Markdown file, under the repo's existing `.docs/` root convention (matching `.docs/spec/`).

Sections:
1. **概述与登录 (Overview & login)** — `/admin` access, GitHub OAuth, editorial workflow states (Draft / In review / Ready / Published).
2. **⚠️ 核心规则:界面英文,内容法语 (UI English, content French)** — the golden rule; per-collection label→content table.
3. **分类机制 (Category mechanism)** — category is a file; articles reference by filename; resolver keys by filename; concrete `b1.md → cleaning → badge → /blog/cleaning` example.
4. **各集合操作 (Per-collection)** — Categories / Articles / Services / Team; every field with English label, French content, required-flag, example.
5. **图片/媒体规则 (Images/media)** — per-collection buckets, upload behaviour, format/size guidance.
6. **文章↔分类工作流 (Article↔Category workflow)** — create category first → filename is the slug → create article → pick from dropdown; **do not rename category files** (breaks existing articles).
7. **发布与上线 (Publish & go-live)** — save → push `main` → Cloudflare rebuild → live in ~30s–2min; verify on the live site.
8. **常见问题 (FAQ/troubleshooting)** — renamed-category breakage; badge showing raw slug; the missing category listing page (known limitation, not a bug to chase).

---

## 4. Task 1 — Full label translation table

### 4.1 Collections (`name` / `label` / `label_singular`)

| `name` (unchanged) | `label` (FR → EN) | `label_singular` (FR → EN) |
|---|---|---|
| `categories` | Catégories → **Categories** | Catégorie → **Category** |
| `blog` | Articles → **Articles** | Article → **Article** |
| `service` | Services → **Services** | Service → **Service** |
| `team` | Équipe → **Team** | Membre → **Member** |

### 4.2 Field labels (FR → EN)

| French | English |
|---|---|
| Titre | Title |
| Nom | Name |
| Description | Description |
| Ordre d'affichage | Display order |
| Image à la une | Featured image |
| Photo | Photo |
| Contenu | Content |
| Date de publication | Publish date |
| Date de mise à jour | Updated date |
| Catégorie | Category |
| Auteur | Author |
| Identifiant | Identifier |
| Mis en avant | Featured |
| Note | Rating |
| Lettres, chiffres, tirets et underscores uniquement (pattern message) | Letters, numbers, dashes and underscores only |

### 4.3 Category relation fix

```yaml
# before
- label: "Catégorie"
  name: category
  widget: relation
  collection: categories
  value_field: title
  search_fields: [title]
  display_fields: [title]

# after
- label: "Category"
  name: category
  widget: relation
  collection: categories
  value_field: "{{slug}}"
  search_fields: [title]
  display_fields: [title]
```

`name` values (`title`, `pubDate`, `updatedDate`, `thumbnail`, `category`, `author`, `featured`, `rating`, `order`, `body`, `description`) are **unchanged** — they are frontmatter keys consumed by `content.config.ts` and the components.

---

## 5. Verification Plan

| Check | Method | Pass criterion |
|---|---|---|
| Admin loads in English | `npm run dev` → open `/admin` | All UI chrome, buttons, date picker, field labels in English |
| `config.yml` is valid YAML | Decap parses without console error | No red errors in `/admin` console |
| Existing posts still resolve categories | Visit `/blog/<each post>` + blog index | Badge shows French title, no raw-slug fallback |
| New post stores filename | In CMS, create test post, pick a category, save | Frontmatter `category:` = filename (e.g. `cleaning`), not title |
| `admin.astro` English | View page source at `/admin` | `<html lang="en">`, English `<title>` |
| Build still passes | `npm run build` | Exit 0 |
| Guide accuracy | Reviewer reads guide vs live `/admin` | Every described field/flow matches reality |

---

## 6. Out of Scope / Follow-up

- **Add `/blog/<category>` listing page** so category badge links resolve to a real filtered list. Currently 404; documented for operators as a known limitation, not built here.
- **French sample content.** Existing `.md` files are English/Lorem (legacy theme data). Converting them to real French is a separate content task, not part of the UI/guide work.
- **`proxy/` changes.** None — OAuth only.

---

## 7. Open Notes

- **Decap `{{slug}}` semantics** rely on it resolving to the entry filename. This is the standard Decap behaviour for folder collections with `slug: "{{title}}"`; to be confirmed during implementation by creating a test post and inspecting the committed frontmatter.
