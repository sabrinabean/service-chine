import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      thumbnail: image().optional(),
      category: z.string(),
      author: z.object({
        slug: z.string(),
        name: z.string(),
      }),
    }),
});

const categories = defineCollection({
  loader: glob({
    base: './src/content/categories',
    pattern: '**/*.{md,mdx}',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      order: z.number().default(0),
      thumbnail: image().optional(),
    }),
});

// ====== 新增 pages 集合 ======
const pages = defineCollection({
  loader: glob({
    base: './src/content/pages',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    path: z.string().optional(), // 支持自定义路径
    date: z.date().optional(),
  }),
});

export const collections = {
  blog,
  categories,
  pages,  // ← 别忘了加这一行
};
