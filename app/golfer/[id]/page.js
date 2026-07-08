import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import BadgeGrid from '../../../components/BadgeGrid';
import { computeBadges, earnedBadges } from '../../../lib/badges';

export const revalidate = 60;

const db = () =>
  createClient(
    'https://mwotoycsaphyipbgyecn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13b3RveWNzYXBoeWlwYmd5ZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTQwNjUsImV4cCI6MjA5ODg3MDA2NX0.sYE8SEc6Kl8-2ElBSPH-V8C7JxQVJkA0x-_iUugXI2s',
    {
      auth: { persistSession: false },
      global: { fetch: (u, o) => fetch(u, { ...o, signal: AbortSignal.timeout(8000) }) },
    }
  );

async function getGolfer(id) {
  try {
    const client = db();
    const [{ data: ratings }, { data: r19 }, { count: nPhotos }, { data: allCourses }] =
      await Promise.all([
        client
          .from('ratings')
          .select('overall, comment, created_at, display_name, courses(name, slug, town, province)')
          .eq('user_id', id).eq('suspect', false)
          .order('created_at', { ascending: false }),
        client.from('nineteenth_ratings').select('id').eq('user_id', id).eq('suspect', false),
        client.from('photos').select('id', { count: 'exact', head: true }).eq('user_id', id),
        client.from('courses').select('province'),
      ]);
    if (!ratings?.length && !r19?.length) return null;

    const provinceTotals = {};
    for (const c of allCourses || []) provinceTotals[c.province] = (provinceTotals[c.province] || 0) + 1;
    const byProvince = {};
    for (const r of ratings || []) {
      const p = r.courses?.province;
      if (p) byProvince[p] = (byProvince[p] || 0) + 1;
    }
    return {
      name: ratings?.[0]?.display_name || 'Golfer',
      ratings: ratings || [],
      n19: (r19 || []).length,
      nPhotos: nPhotos || 0,
      byProvince,
      provinceTotals,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const g = await getGolfer(params.id);
  if (!g) return {};
  return {
    title: `${g.name} — ratings & badges | Pin High`,
    description: `${g.name} has rated ${g.ratings.length} South African golf courses on Pin High.`,
  };
}

export default async function GolferPage({ params }) {
  const g = await getGolfer(params.id);
  if (!g) notFound();

  const badges = computeBadges({
    n: g.ratings.length, n19: g.n19, nPhotos: g.nPhotos,
    byProvince: g.byProvince, provinceTotals: g.provinceTotals,
  });
  const earned = earnedBadges(badges);

  return (
    <>
      <section className="course-head">
        <div className="container">
          <Link href="/leaderboard" className="back-link">← Leaderboard</Link>
          <h1>{g.name}</h1>
          <div className="meta">
            {g.ratings.length} course{g.ratings.length === 1 ? '' : 's'} rated · {g.n19} 19th
            hole{g.n19 === 1 ? '' : 's'} · {earned.length} badge{earned.length === 1 ? '' : 's'}
          </div>
        </div>
      </section>
      <div className="container" style={{ margin: '28px auto 60px' }}>
        <div className="card">
          <h2>Badges</h2>
          <BadgeGrid badges={badges} />
        </div>
        {g.ratings.length > 0 && (
          <div className="card" style={{ marginTop: 18 }}>
            <h2>Recent ratings</h2>
            {g.ratings.slice(0, 15).map((r, i) => (
              <div className="review" key={i}>
                <span className="who">
                  <Link href={`/course/${r.courses.slug}`} style={{ textDecoration: 'underline' }}>
                    {r.courses.name}
                  </Link>
                  <span className="stars" style={{ marginLeft: 8 }}>{'★'.repeat(Math.round(r.overall))}</span>
                  <span className="when">{r.courses.town}, {r.courses.province}</span>
                </span>
                {r.comment && <p>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
