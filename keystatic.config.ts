import { config, fields, collection } from '@keystatic/core';

/**
 * Configuration Keystatic — alignée sur src/content.config.ts.
 *
 * Règle d'or : chaque collection Keystatic doit refléter EXACTEMENT le schéma
 * Astro correspondant, afin que les fichiers écrits par Keystatic soient lisibles
 * par les pages du thème sans modification.
 *
 * Storage : `local` pour la validation en local (étape 2).
 * → Pour la mise en ligne, passer à `kind: 'github'` (voir deployment-isolated-environment.md).
 */
export default config({
  storage: {
    kind: 'github',
    repo: 'sabrinabean/service-chine',  // 仓库 owner/name;直推 main(无感发布)
    // branchPrefix 留空 = 直推 main;未来需审核工作流时设为 'keystatic/'
  },
  ui: {
    brand: { name: 'Service Chine' },
  },
  collections: {
    // ── Catégories (collection indépendante, référencée par blog.service) ──
    categories: collection({
      label: 'Catégories',
      slugField: 'title',
      path: 'src/content/categories/*',
      // format contentField 写入 .md(YAML frontmatter + Markdown body),与现有文件格式一致。
      // 注意:之前 data: 'yaml' 与 .md 文件格式不匹配,Keystatic API 读文件时抛异常(返回 HTML 错误页),
      // 前端 JSON.parse 报 "Unexpected token '<'"。
      format: { contentField: 'content' },
      columns: ['title'],
      entryLayout: 'content',
      schema: {
        title: fields.slug({
          name: { label: 'Titre de la catégorie', validation: { length: { min: 1 } } },
        }),
        description: fields.text({ label: 'Description', multiline: true }),
        order: fields.integer({ label: "Ordre d'affichage", defaultValue: 0 }),
        thumbnail: fields.image({
          label: 'Image à la une',
          directory: 'src/assets/images/categories',
          publicPath: '../../assets/images/categories/',
        }),
        content: fields.mdx({
          label: 'Contenu',
          extension: 'md',
          options: { formatting: true, links: true },
        }),
      },
    }),

    // ── Blog (catégorie = slug référençant categories) ──
    blog: collection({
      label: 'Articles',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      columns: ['title', 'category', 'pubDate'],
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Titre' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        pubDate: fields.date({
          label: 'Date de publication',
          validation: { isRequired: true },
        }),
        updatedDate: fields.date({ label: 'Date de mise à jour' }),
        thumbnail: fields.image({
          label: 'Image à la une',
          directory: 'src/assets/images/blog',
          publicPath: '../../assets/images/blog/',
        }),
        // category référence la collection categories par son slug
        category: fields.relationship({
          label: 'Catégorie',
          collection: 'categories',
          validation: { isRequired: true },
        }),
        author: fields.object({
          label: 'Auteur',
          schema: {
            slug: fields.text({ label: 'Identifiant auteur' }),
            name: fields.text({ label: "Nom de l'auteur" }),
          },
        }),
        content: fields.mdx({
          label: 'Contenu',
          extension: 'md',
          options: {
            formatting: true,
            dividers: true,
            links: true,
            images: {
              directory: 'src/assets/images/blog',
              publicPath: '../../assets/images/blog/',
            },
          },
        }),
      },
    }),

    // ── Services ──
    service: collection({
      label: 'Services',
      slugField: 'title',
      path: 'src/content/service/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Titre' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        pubDate: fields.date({ label: 'Date de publication' }),
        updatedDate: fields.date({ label: 'Date de mise à jour' }),
        thumbnail: fields.image({
          label: 'Image à la une',
          directory: 'src/assets/images/service',
          publicPath: '../../assets/images/service/',
        }),
        featured: fields.checkbox({ label: 'Mis en avant', defaultValue: false }),
        content: fields.mdx({
          label: 'Contenu',
          extension: 'md',
          options: { formatting: true, links: true },
        }),
      },
    }),

    // ── Équipe ──
    team: collection({
      label: 'Équipe',
      slugField: 'title',
      path: 'src/content/team/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Nom' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        pubDate: fields.date({ label: 'Date de publication' }),
        updatedDate: fields.date({ label: 'Date de mise à jour' }),
        thumbnail: fields.image({
          label: 'Photo',
          directory: 'src/assets/images/team',
          publicPath: '../../assets/images/team/',
        }),
        featured: fields.checkbox({ label: 'Mis en avant', defaultValue: false }),
        rating: fields.integer({ label: 'Note', defaultValue: 5 }),
        content: fields.mdx({
          label: 'Contenu',
          extension: 'md',
          options: { formatting: true, links: true },
        }),
      },
    }),
  },
});
