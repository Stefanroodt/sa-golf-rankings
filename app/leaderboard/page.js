import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { computeBadges, earnedBadges, topBadgeName } from '../../lib/badges';

export const revalidate = 300;

export const metadata = {
  title: 'Badges leaderboard | Pin High',
  description:
    'South Africa\'s most travelled raters — golfers ranked by badges earned on Pin High, from Opening Drive to Province Master.',
  alternates: { canonical: '/leaderboard' },
};

const db = () =>
  createClient(
    'https://mwotoycsaphyipbgyecn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13b3RveWNzYXBoeWlwYmd5ZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTQwNjUsImV4cCI6MjA5ODg3MDA2NX0.sYE8SEc6Kl8-2ElBSPH-V8C7JxQVJkA0x-_iUugXI2s',
    {
      auth: { persistSession: false },
      global: { fetch: (u, o) => fetch(u, { ...o, signal: AbortSignal.timeout(8000) }) },
    }
  );

async function getLeaderboard() {
  try {
    const client = db();
    const [{ data: ratings }, { data: r19 }, { data: photos }, { data: allCourses }] =
      await Promise.all([
        client.from('ratings').select('user_id, display_name, suspect, courses(province)'),
        client.from('nineteenth_ratings').select('user_id, suspect'),
        client.from('photos').select('user_id'),
        client.from('courses').select('province'),
      ]);

    const provinceTotals = {};
    for (const c of allCourses || []) provinceTotals[c.province] = (provinceTotals[c.province] || 0) + 1;

    const users = {};
    const ensure = (id, name) => {
      if (!users[id]) users[id] = { id, name: name || 'Golfer', n: 0, n19: 0, nPhotos: 0, byProvince: {} };
      if (name) users[id].name = name;
      return users[id];
    };
    for (const r of ratings || []) {
      if (r.suspect) continue;
      const u = ensure(r.user_id, r.display_name);
      u.n++;
      const p = r.courses?.province;
      if (p) u.byProvince[p] = (u.byProvince[p] || 0) + 1;
    }
    for (const r of r19 || []) {
      if (r.suspect) continue;
      ensure(r.user_id).n19++;
    }
    for (const ph of photos || []) ensure(ph.user_id).nPhotos++;

    return Object.values(users)
      .map((u) => {
        const badges = computeBadges({ ...u, provinceTotals });
        return {
          id: u.id,
          name: u.name,
          n: u.n,
          n19: u.n19,
          earned: earnedBadges(badges).length,
          top: topBadgeName(badges),
        };
      })
      .filter((u) => u.earned > 0)
      .sort((a, b) => b.earned - a.earned || b.n - a.n || a.name.localeCompare(b.name))
      .slice(0, 50);
  } catch {
    return [];
  }
}

export default async function Leaderboard() {
  const rows = await getLeaderboard();

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>The badges leaderboard.</h1>
          <p>
            South Africa&apos;s most travelled raters — ranked by badges earned,
            from Opening Drive to Province Master. Rate more courses, climb the board.
          </p>
        </div>
      </section>
      <div className="container">
        <ol className="rank-list" style={{ marginTop: 24 }}>
          {rows.length === 0 && (
            <p className="notice" style={{ margin: '24px 0 48px' }}>
              No badge holders yet — <Link href="/rate" style={{ textDecoration: 'underline' }}>rate a course</Link> to claim the first one.
            </p>
          )}
          {rows.map((u, i) => (
            <li key={u.id}>
              <Link href={`/golfer/${u.id}`} className="rank-card">
                <div className={`rank-num${i < 3 ? ' top' : ''}`}>{i + 1}</div>
                <div className="rank-info">
                  <h3>{u.name}</h3>
                  <div className="meta">
                    {u.top ? `${u.top} · ` : ''}
                    {u.n} course{u.n === 1 ? '' : 's'} rated
                    {u.n19 > 0 ? ` · ${u.n19} 19th hole${u.n19 === 1 ? '' : 's'}` : ''}
                  </div>
                </div>
                <div className="rank-score">
                  <div className="score-big">{u.earned}</div>
                  <div className="score-sub">badge{u.earned === 1 ? '' : 's'}</div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
        <p className="notice" style={{ textAlign: 'center', marginBottom: 48 }}>
          Your badges live on your <Link href="/profile" style={{ textDecoration: 'underline' }}>profile</Link>.
        </p>
      </div>
    </>
  );
}
