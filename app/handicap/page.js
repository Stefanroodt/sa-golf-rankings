'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { HANDICAP_PREVIEW as ALLOW } from '../../lib/handicap';

// How many of the best differentials to average, scaled to how many rounds
// you have — mirrors the WHS "best 8 of last 20" idea in a simplified way.
function bestCount(n) {
  if (n < 3) return 0;
  if (n <= 5) return 1;
  if (n <= 8) return 2;
  if (n <= 11) return 3;
  if (n <= 14) return 4;
  if (n <= 16) return 5;
  if (n <= 18) return 6;
  if (n === 19) return 7;
  return 8;
}

export default function HandicapPage() {
  const [user, setUser] = useState(undefined);
  const [rounds, setRounds] = useState([]);
  const [parByCourse, setParByCourse] = useState({});

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (!u.user || !ALLOW.includes(u.user.email)) return;
      const { data: rds } = await supabase
        .from('rounds')
        .select('id, course_id, played_at, total_score, tee_name, course_rating, slope, courses(name, slug)')
        .eq('user_id', u.user.id)
        .order('played_at', { ascending: false })
        .limit(50);
      setRounds(rds || []);
      const ids = [...new Set((rds || []).map((r) => r.course_id))];
      if (ids.length) {
        const { data: cards } = await supabase
          .from('scorecard_courses')
          .select('id, par')
          .in('id', ids);
        const map = {};
        for (const c of cards || []) map[c.id] = c.par;
        setParByCourse(map);
      }
    })();
  }, []);

  const calc = useMemo(() => {
    // WHS-style differential where we have course rating + slope for the tee played:
    //   diff = (score - course rating) * 113 / slope
    // Otherwise fall back to a simple score-minus-par differential.
    const diffs = rounds
      .map((r) => {
        if (r.course_rating && r.slope) {
          return { ...r, diff: Math.round(((r.total_score - Number(r.course_rating)) * 113 / r.slope) * 10) / 10, whs: true };
        }
        const par = parByCourse[r.course_id];
        if (par && par >= 66 && par <= 74) return { ...r, diff: r.total_score - par, whs: false };
        return null;
      })
      .filter(Boolean);
    const last20 = diffs.slice(0, 20);
    const k = bestCount(last20.length);
    const best = [...last20].sort((a, b) => a.diff - b.diff).slice(0, k);
    const index = k ? Math.round((best.reduce((s, x) => s + x.diff, 0) / k) * 10) / 10 : null;
    const bestIds = new Set(best.map((x) => x.id));
    return { diffs, last20, k, index, bestIds };
  }, [rounds, parByCourse]);

  if (user === undefined)
    return <div className="container"><p className="notice" style={{ margin: '40px 0' }}>Loading…</p></div>;

  if (!user)
    return (
      <div className="container auth-wrap">
        <div className="card">
          <h2>Pin High Number</h2>
          <p className="notice">Sign in to see your handicap index.</p>
          <Link href="/auth" className="btn btn-gold">Sign in</Link>
        </div>
      </div>
    );

  // Preview gate — everyone except the allow-list sees "coming soon"
  if (!ALLOW.includes(user.email))
    return (
      <div className="container" style={{ maxWidth: 560, margin: '48px auto' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>🏌️ Pin High Number</h2>
          <p className="notice" style={{ marginTop: 8 }}>
            Your unofficial Pin High handicap — coming soon. Keep logging your rounds and it will be
            ready to calculate the moment it launches.
          </p>
          <Link href="/scorecard" className="btn btn-gold" style={{ marginTop: 14 }}>Log a round →</Link>
        </div>
      </div>
    );

  const fmt = (d) => (d > 0 ? `+${d}` : `${d}`);
  const idxStr = calc.index == null ? '—' : (calc.index >= 0 ? '+' : '') + calc.index.toFixed(1);

  return (
    <div className="container" style={{ maxWidth: 620, margin: '32px auto 60px' }}>
      <div className="score-badge-preview" style={{ marginBottom: 6, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--gold)' }}>
        Preview · visible only to you
      </div>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>🏌️ Your Pin High Number</h1>
      <p className="notice" style={{ marginTop: 0 }}>
        An unofficial handicap-style index from your logged rounds, using each course&apos;s rating and
        slope for the tee you played — (score − rating) × 113 ÷ slope. Not a GolfRSA handicap, but the
        same maths behind one. It moves as you play.
      </p>

      <div className="card" style={{ textAlign: 'center', marginTop: 16, background: 'var(--green-deep)', color: 'var(--cream)' }}>
        <div style={{ fontSize: 13, color: '#cfe0d5', letterSpacing: '.1em', textTransform: 'uppercase' }}>Pin High Number</div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, color: 'var(--gold)' }}>{idxStr}</div>
        {calc.index == null ? (
          <p className="notice" style={{ color: '#cfe0d5' }}>
            Log at least 3 full 18-hole rounds at courses with a scorecard to get your number.
            You have {calc.diffs.length}.
          </p>
        ) : (
          <p className="notice" style={{ color: '#cfe0d5' }}>
            Average of the best {calc.k} of your last {calc.last20.length} round{calc.last20.length === 1 ? '' : 's'}.
          </p>
        )}
      </div>

      {calc.diffs.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Rounds used</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)', fontSize: 12 }}>
                <th style={{ padding: '6px 8px 6px 0', fontWeight: 700 }}>Course</th>
                <th style={{ padding: '6px 8px', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>Score</th>
                <th style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right' }}>Diff</th>
              </tr>
            </thead>
            <tbody>
              {calc.last20.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--cream-dark)', opacity: calc.bestIds.has(r.id) ? 1 : 0.5 }}>
                  <td style={{ padding: '8px 8px 8px 0' }}>
                    <Link href={`/course/${r.courses.slug}`} style={{ textDecoration: 'underline' }}>
                      {r.courses.name}
                    </Link>
                    {r.tee_name && <span className="meta-sub"> · {r.tee_name}</span>}
                    {calc.bestIds.has(r.id) && <span className="badge badge-played" style={{ marginLeft: 6 }}>counted</span>}
                  </td>
                  <td style={{ padding: '8px', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                    {new Date(r.played_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{r.total_score}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>{fmt(r.diff)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="notice" style={{ marginTop: 10 }}>
            Faded rows aren&apos;t counted in your current number — only your best {calc.k} are.
          </p>
        </div>
      )}

      <p className="notice" style={{ marginTop: 16 }}>
        <Link href="/scorecard?from=handicap" style={{ textDecoration: 'underline' }}>Log another round →</Link>
      </p>
    </div>
  );
}
