import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Prerendered at build time so /sitemap.xml is a real static file that stays
// in sync with the blog content collection.
export const prerender = true;

const SITE = 'https://horizon-gh.com';

const STATIC_ROUTES = [
  { path: '/', priority: '1.0' },
  { path: '/services', priority: '0.9' },
  { path: '/pricing', priority: '0.9' },
  { path: '/blog', priority: '0.8' },
  { path: '/contact', priority: '0.8' },
  { path: '/es/', priority: '0.9' },
  { path: '/es/services', priority: '0.8' },
  { path: '/es/pricing', priority: '0.8' },
  { path: '/es/blog', priority: '0.7' },
  { path: '/es/contact', priority: '0.7' },
];

export const GET: APIRoute = async () => {
  const [enPosts, esPosts] = await Promise.all([
    getCollection('blog_en'),
    getCollection('blog_es'),
  ]);

  const urls = STATIC_ROUTES.map((route) => ({
    loc: `${SITE}${route.path === '/' ? '/' : route.path}`,
    priority: route.priority,
  }));

  for (const post of enPosts) {
    urls.push({ loc: `${SITE}/blog/${post.id}`, priority: '0.6' });
  }
  for (const post of esPosts) {
    urls.push({ loc: `${SITE}/es/blog/${post.id}`, priority: '0.6' });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
