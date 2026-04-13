import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    author: z.string(),
    readTime: z.string(),
    coverImage: z.string(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };
