import { getAllSlugs, PROVINCES, provinceSlug } from '../lib/server';

const BASE = 'https://sa-golf-rankings.vercel.app';

export default async function sitemap() {
  const slugs = await getAllSlugs();
  return [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
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
