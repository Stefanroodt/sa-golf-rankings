import { createClient } from '@supabase/supabase-js';
import { weightedScore } from './supabase';

// Server-side data helpers (anon key + RLS; read-only usage).
const db = () =>
  createClient(
    'https://mwotoycsaphyipbgyecn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13b3RveWNzYXBoeWlwYmd5ZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTQwNjUsImV4cCI6MjA5ODg3MDA2NX0.sYE8SEc6Kl8-2ElBSPH-V8C7JxQVJkA0x-_iUugXI2s',
    {
      auth: { persistSession: false },
      global: {
        fetch: (url, opts) =>
          fetch(url, { ...opts, signal: AbortSignal.timeout(8000) }),
      },
    }
  );

export const PROVINCES = [
  'Western Cape', 'Eastern Cape', 'KwaZulu-Natal', 'Gauteng', 'Mpumalanga',
  'Limpopo', 'North West', 'Free State', 'Northern Cape',
];

export const provinceSlug = (p) => p.toLowerCase().replace(/\s+/g, '-');
export const provinceFromSlug = (s) => PROVINCES.find((p) => provinceSlug(p) === s);

// Never let a network hiccup take a page down — degrade to empty data.
async function safe(fn, fallback) {
  try { return await fn(); } catch { return fallback; }
}

export async function getRankings(province) {
  return safe(async () => {
  let q = db().from('course_rankings').select('*');
  if (province) q = q.eq('province', province);
  const { data, error } = await q;
  if (error || !data) return [];
  const rated = data.filter((c) => c.n_ratings > 0);
  const globalAvg = rated.length
    ? rated.reduce((s, c) => s + Number(c.avg_overall), 0) / rated.length
    : 3.5;
  return data
    .map((c) => ({ ...c, score: weightedScore(Number(c.avg_overall), c.n_ratings, globalAvg) }))
    .sort((a, b) => b.score - a.score || b.n_ratings - a.n_ratings || a.name.localeCompare(b.name));
  }, []);
}

export async function getCourse(slug) {
  return safe(async () => {
    const { data } = await db().from('courses').select('*').eq('slug', slug).single();
    return data;
  }, null);
}

export async function getRatings(courseId) {
  return safe(async () => {
    const { data } = await db()
      .from('ratings').select('*').eq('course_id', courseId)
      .order('created_at', { ascending: false });
    return data || [];
  }, []);
}

export async function getRecentRatings(limit = 6) {
  return safe(async () => {
    const { data } = await db()
      .from('ratings')
      .select('display_name, overall, comment, created_at, courses(name, slug)')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }, []);
}

export async function getTopReviewers(limit = 5) {
  return safe(async () => {
    const { data } = await db().from('ratings').select('display_name');
    if (!data) return [];
    const counts = {};
    for (const r of data) counts[r.display_name] = (counts[r.display_name] || 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, n]) => ({ name, n }));
  }, []);
}

export async function getAllSlugs() {
  return safe(async () => {
    const { data } = await db().from('courses').select('slug');
    return (data || []).map((c) => c.slug);
  }, []);
}
