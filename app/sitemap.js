import { getAllSlugs, PROVINCES, provinceSlug } from '../lib/server';
import { POSTS } from '../lib/posts';

const BASE = 'https://pinhigh.co.za';

export default async function sitemap() {
  const slugs = await getAllSlugs();
  return [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/19th-holes`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.5 },
    ...POSTS.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
    ...PROVINCES.map((p) => ({
      url: `${BASE}/province/${provinceSlug(p)}`,
      changeFrequency: 'daily',
      priority: 0.8,
    })),
    ...slugs.map((s) => ({
      url: `${BASE}/course/${s}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    })),
  ];
}
