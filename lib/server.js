import { createClient } from '@supabase/supabase-js';

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

// Mauritius lives in the same table as a region of its own — it has its own
// rankings page and never mixes into the South African national list.
export const REGIONS = [...PROVINCES, 'Mauritius'];

export const provinceSlug = (p) => p.toLowerCase().replace(/\s+/g, '-');
export const provinceFromSlug = (s) => REGIONS.find((p) => provinceSlug(p) === s);

// Never let a network hiccup take a page down — degrade to empty data.
async function safe(fn, fallback) {
  try { return await fn(); } catch { return fallback; }
}

export async function getRankings(province, view = 'course_rankings') {
  return safe(async () => {
  let q = db().from(view).select('*').eq('hide_from_rankings', false);
  if (province) q = q.eq('province', province);
  else q = q.eq('country', 'South Africa'); // national rankings are SA-only
  const { data, error } = await q;
  if (error || !data) return [];
  // Straight average, ties broken by number of ratings.
  return data
    .map((c) => ({ ...c, score: Number(c.avg_overall) || 0 }))
    .sort((a, b) => b.score - a.score || b.n_ratings - a.n_ratings || a.name.localeCompare(b.name));
  }, []);
}

export async function getCourse(slug) {
  return safe(async () => {
    const { data } = await db().from('courses').select('*').eq('slug', slug).single();
    return data;
  }, null);
}

export async function getRatings(courseId, table = 'ratings') {
  return safe(async () => {
    const { data } = await db()
      .from(table).select('*').eq('course_id', courseId).eq('suspect', false)
      .order('created_at', { ascending: false });
    return data || [];
  }, []);
}

export async function getRecentRatings(limit = 6) {
  return safe(async () => {
    const { data } = await db()
      .from('ratings')
      .select('display_name, overall, comment, created_at, courses(name, slug)')
      .eq('suspect', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }, []);
}

export async function getTopReviewers(limit = 5) {
  return safe(async () => {
    const { data } = await db().from('ratings').select('display_name').eq('suspect', false);
    if (!data) return [];
    const counts = {};
    for (const r of data) counts[r.display_name] = (counts[r.display_name] || 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, n]) => ({ name, n }));
  }, []);
}

export async function getPhotos(courseId) {
  return safe(async () => {
    const { data } = await db()
      .from('photos')
      .select('id, path, display_name, created_at')
      .eq('course_id', courseId)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(24);
    return data || [];
  }, []);
}

export const photoUrl = (path) =>
  `https://mwotoycsaphyipbgyecn.supabase.co/storage/v1/object/public/course-photos/${path}`;

export async function getScorecardCourses() {
  return safe(async () => {
    // One aggregated row per course from the DB view — no row-cap issues.
    const { data } = await db()
      .from('scorecard_courses')
      .select('id, slug, name, town, province, country, holes, par')
      .order('name');
    return data || [];
  }, []);
}

export async function getScorecard(courseId) {
  return safe(async () => {
    const { data } = await db()
      .from('scorecards')
      .select('hole, par, stroke_index')
      .eq('course_id', courseId)
      .order('hole');
    return data || [];
  }, []);
}

export async function getAllSlugs() {
  return safe(async () => {
    const { data } = await db().from('courses').select('slug');
    return (data || []).map((c) => c.slug);
  }, []);
}
