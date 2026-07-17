# Keystatic 内容编辑(对齐 ProCleaning)

> 基于 ProCleaning 真实的 `src/content.config.ts` 写 Keystatic 配置。核心原则:**Keystatic schema 必须与主题 collection 逐字段对齐**,这样 Keystatic 编辑/写入的文件能直接被主题页面读取,无需改页面代码。

---

## 接入步骤(每步必做)

1. **加集成与包**
   ```bash
   npx astro add react markdoc
   npm install @keystatic/core @keystatic/astro
   ```
2. **改 `astro.config.mjs`**:在 `integrations` 数组加 `keystatic()`,并加 Cloudflare adapter(见 `architecture.md`):
   ```js
   import react from '@astrojs/react';
   import markdoc from '@astrojs/markdoc';
   import keystatic from '@keystatic/astro';
   import cloudflare from '@astrojs/cloudflare';

   export default defineConfig({
     output: 'static',          // Keystatic 用 on-demand 处理 admin,主体仍 static
     adapter: cloudflare(),
     integrations: [mdx(), sitemap(), icon(), react(), markdoc(), keystatic()],
     // ...保留主题原有的 vite/fonts 配置
   });
   ```
3. **建 `keystatic.config.ts`**(见下文完整配置)。
4. **本地验证**:`npm run dev` → 访问 `http://localhost:4321/keystatic` → 能看到 blog/service/team 三个 collection。
5. **GitHub 模式**:把 `storage.kind` 从 `'local'` 切到 `'github'`(见下文),配 OAuth 环境变量,部署后线上 `/keystatic` 可登录编辑。

---

## ProCleaning 现有 schema(实测,来自 `src/content.config.ts`)

```ts
// 主题原有 —— blog
schema: { title, description, pubDate, updatedDate?, thumbnail?,
          category: { slug, title },   // ← 内嵌对象,本方案改造
          author:   { slug, name } }
// 主题原有 —— service
schema: { title, description, pubDate, updatedDate?, thumbnail?, featured }
// 主题原有 —— team
schema: { title, description, pubDate, updatedDate?, thumbnail?, featured, rating }
// loader: glob({ base: './src/content/<x>', pattern: '**/*.{md,mdx}' })
```

---

## 完整 `keystatic.config.ts`(可直接用)

```ts
import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: '<github-owner>/service-chine',  // ← 改成你的仓库
    branchPrefix: undefined,                // ← 直推 main(无感发布)
  },
  ui: { brand: { name: 'Service Chine' } },
  collections: {
    // ── categories:本方案新增的独立分类集合 ───────────────────────
    categories: collection({
      label: 'Catégories',
      slugField: 'title',
      path: 'src/content/categories/*',
      format: { data: 'yaml' },            // 分类只有 frontmatter,无正文
      schema: {
        title: fields.slug({ name: { label: 'Titre de la catégorie',
                                      validation: { length: { min: 1 } } } }),
        description: fields.text({ label: 'Description', multiline: true }),
      },
    }),

    // ── blog:对齐主题,category 改为 relationship ──────────────────
    blog: collection({
      label: 'Articles',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },  // 正文用 contentField
      columns: ['title', 'category', 'pubDate'],
      entryLayout: 'content',
      schema: {
        title:       fields.slug({ name: { label: 'Titre' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        pubDate:     fields.date({ label: 'Date de publication',
                                   validation: { isRequired: true } }),
        updatedDate: fields.date({ label: 'Date de mise à jour' }),
        thumbnail:   fields.image({ label: 'Image à la une',
                                    directory: 'src/assets/images/blog',
                                    publicPath: '/src/assets/images/blog/' }),
        // category 由主题的 {slug,title} 改为引用独立 categories collection
        category:    fields.relationship({ label: 'Catégorie',
                                           collection: 'categories',
                                           validation: { isRequired: true } }),
        author: fields.object({
          label: 'Auteur',
          schema: {
            slug: fields.text({ label: 'Identifiant auteur' }),
            name: fields.text({ label: 'Nom de l\'auteur' }),
          },
        }),
        content: fields.mdx({ label: 'Contenu', extension: 'md',
                              options: { formatting: true, links: true, images: true } }),
      },
    }),

    // ── service:对齐主题 ─────────────────────────────────────────
    service: collection({
      label: 'Services',
      slugField: 'title',
      path: 'src/content/service/*',
      format: { contentField: 'content' },
      schema: {
        title:       fields.slug({ name: { label: 'Titre' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        pubDate:     fields.date({ label: 'Date de publication' }),
        updatedDate: fields.date({ label: 'Date de mise à jour' }),
        thumbnail:   fields.image({ label: 'Image à la une',
                                    directory: 'src/assets/images/service',
                                    publicPath: '/src/assets/images/service/' }),
        featured:    fields.checkbox({ label: 'Mis en avant', defaultValue: false }),
        content:     fields.mdx({ label: 'Contenu', extension: 'md' }),
      },
    }),

    // ── team:对齐主题 ────────────────────────────────────────────
    team: collection({
      label: 'Équipe',
      slugField: 'title',
      path: 'src/content/team/*',
      format: { contentField: 'content' },
      schema: {
        title:       fields.slug({ name: { label: 'Nom' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        pubDate:     fields.date({ label: 'Date de publication' }),
        updatedDate: fields.date({ label: 'Date de mise à jour' }),
        thumbnail:   fields.image({ label: 'Photo',
                                    directory: 'src/assets/images/team',
                                    publicPath: '/src/assets/images/team/' }),
        featured:    fields.checkbox({ label: 'Mis en avant', defaultValue: false }),
        rating:      fields.integer({ label: 'Note', defaultValue: 5 }),
        content:     fields.mdx({ label: 'Contenu', extension: 'md' }),
      },
    }),
  },
});
```

---

## 关键对齐说明(逐点,实施时对照)

### 1. 内容格式:`fields.mdx({ extension: 'md' })`
- 主题 loader 是 `**/*.{md,mdx}`;Keystatic 默认写 Markdoc(`.mdoc`),**必须**用 `extension: 'md'` 写 `.md`,否则主题读取不到。
- 正文用 `format: { contentField: 'content' }`,正文存在 `content` 字段 → Keystatic 把正文写在 frontmatter 下方(标准 MD/MDX 布局)。

### 2. 图片字段:`fields.image()` ↔ 主题的 `image()`
- 主题用 Astro 原生 `image()`(走图片优化);Keystatic 对应用 `fields.image()`,配 `directory`(源码存放)与 `publicPath`(引用路径)。
- **务必让 `publicPath` 指向主题 `getEntry` 后能被 `image()` 解析的路径**。落地时:先在主题里看一个已有内容的 `thumbnail` 是怎么写的,据此确定 `publicPath`,再配 Keystatic。

### 3. category 改造:内嵌对象 → 独立 collection(本方案增强)
- 主题 blog 的 `category: { slug, title }` 是写在每篇文章 frontmatter 里的重复字符串。
- 本方案改为**独立 `categories` collection** + `fields.relationship('categories')`。好处:分类可枚举、可在 Keystatic 集中管理、避免拼写漂移。
- **代价**:需同步改主题 `content.config.ts` 里 blog 的 schema(category 由 object 改为 `{ slug: z.string() }` 字符串引用),以及主题渲染分类标题处从 `category.title` 改为按 slug 查 `categories` collection 取 title。这是**唯一需要动主题读取代码**的地方,见 `implementation-checklist.md` 阶段 3。

### 4. 直推 main(`branchPrefix: undefined`)
- 编辑者保存 = 直接 commit `main`,Cloudflare 自动重建 → 无感发布。
- 牺牲审核护栏换取"所见即上线"。未来需要审核工作流时,改为 `branchPrefix: 'keystatic/'`(走 PR)。

---

## GitHub 模式配置(线上 `/keystatic` 可编辑)

切到 `storage.kind: 'github'` 后,需在 Cloudflare 配置这些 secret(并按 Keystatic 官方 *connect-to-github* 文档建 GitHub OAuth App):

| 变量 | 用途 |
|---|---|
| `KEYSTATIC_GITHUB_CLIENT_ID` | GitHub OAuth App 的 Client ID |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | GitHub OAuth App 的 Client Secret |
| `KEYSTATIC_SECRET` | Keystatic 会话加密密钥(随机长串) |

> OAuth App 的 Callback URL 指向线上 `/api/keystatic/github/oauth/callback`(由 `@keystatic/astro` 提供)。

---

## 法语在内容层的体现

- 所有 `label`、校验提示为法语(`Titre`/`Description`/`Date de publication`/`Catégorie`/`Mis en avant`/`Image à la une` 等)。
- 字段值(标题/正文)由编辑者填法语。
- 不做多语言镜像字段(单法语,无切换)。

---

## 日常编辑工作流

1. 浏览器开 `https://<域名>/keystatic` → GitHub OAuth 登录。
2. 选 `Articles`/`Services`/`Catégories` → 新建或编辑。
3. 填法语标题/描述/正文,选 `Catégorie`,设 `Date de publication`。
4. 保存 → Keystatic 直推 `main` → Cloudflare 自动重建 → 约 30s–2min 上线。
5. 回滚:任一条目都是一次 commit,可在 GitHub 界面 `Revert`.
