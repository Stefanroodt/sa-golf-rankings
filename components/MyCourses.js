'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { computeBadges, earnedBadges } from '../lib/badges';
import BragCard from './BragCard';

const PROVINCES = [
  'All provinces', 'Western Cape', 'Eastern Cape', 'KwaZulu-Natal', 'Gauteng',
  'Mpumalanga', 'Limpopo', 'North West', 'Free State', 'Northern Cape', 'Mauritius',
];
const PAGE = 30;

export default function MyCourses() {
  const [user, setUser] = useState(undefined);
  const [courses, setCourses] = useState(null);
  const [mine, setMine] = useState({});
  const [province, setProvince] = useState('All provinces');
  const [view, setView] = useState('all');
  const [sortBy, setSortBy] = useState('A–Z');
  const [page, setPage] = useState(0);
  const [extras, setExtras] = useState({ n19: 0, nPhotos: 0, nFirsts: 0 });
  const [rounds, setRounds] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (!u.user) return;
      const [{ data: cs }, { data: rs }] = await Promise.all([
        supabase.from('courses').select('id, slug, name, town, province, country, holes').order('name'),
        supabase.from('ratings').select('course_id, overall').eq('user_id', u.user.id),
      ]);
      setCourses(cs || []);
      const m = {};
      for (const r of rs || []) m[r.course_id] = Number(r.overall);
      setMine(m);
      const [{ count: n19 }, { count: nPhotos }, { count: nFirsts }] = await Promise.all([
        supabase.from('nineteenth_ratings').select('id', { count: 'exact', head: true }).eq('user_id', u.user.id),
        supabase.from('photos').select('id', { count: 'exact', head: true }).eq('user_id', u.user.id),
        supabase.from('first_raters').select('course_id', { count: 'exact', head: true }).eq('user_id', u.user.id),
      ]);
      setExtras({ n19: n19 || 0, nPhotos: nPhotos || 0, nFirsts: nFirsts || 0 });
      const { data: rds } = await supabase
        .from('rounds').select('id, course_id, played_at, total_score')
        .eq('user_id', u.user.id)
        .order('played_at', { ascending: false })
        .limit(100);
      setRounds(rds || []);
    })();
  }, []);

  const provinceCounts = useMemo(() => {
    const t = {};
    for (const c of courses || []) {
      t[c.province] = t[c.province] || { total: 0, rated: 0 };
      t[c.province].total++;
      if (mine[c.id] != null) t[c.province].rated++;
    }
    return t;
  }, [courses, mine]);

  if (user === undefined || (user && !courses))
    return <p className="notice" style={{ margin: '40px 0' }}>Loading…</p>;

  if (!user)
    return (
      <div className="auth-wrap">
        <div className="card">
          <h2>Your course card</h2>
          <p className="notice">Sign in to see which courses you&apos;ve rated — and which are still waiting.</p>
          <Link href="/auth" className="btn btn-gold">Sign in / create account</Link>
        </div>
      </div>
    );

  const allRated = Object.keys(mine).length;
  const saCourses = courses.filter((c) => c.country !== 'Mauritius');
  const ratedTotal = saCourses.filter((c) => mine[c.id] != null).length; // SA number — the identity
  const muTotal = courses.length - saCourses.length;
  const muRated = allRated - ratedTotal;

  const byProvince = {};
  const provTotals = {};
  let best = null; // best SA course — the brag card is an SA card
  for (const c of courses) {
    provTotals[c.province] = (provTotals[c.province] || 0) + 1;
    if (mine[c.id] != null) {
      byProvince[c.province] = (byProvince[c.province] || 0) + 1;
      if (c.country !== 'Mauritius' && (!best || mine[c.id] > best.overall))
        best = { name: c.name, overall: mine[c.id] };
    }
  }
  const earned = earnedBadges(
    computeBadges({
      n: allRated, n19: extras.n19, nPhotos: extras.nPhotos, nFirsts: extras.nFirsts,
      byProvince, provinceTotals: provTotals,
    })
  );
  const inProvince =
    province === 'All provinces'
      ? saCourses
      : courses.filter((c) => c.province === province);
  const ratedSorters = {
    'A–Z': (a, b) => a.name.localeCompare(b.name),
    'My highest first': (a, b) => mine[b.id] - mine[a.id] || a.name.localeCompare(b.name),
    'My lowest first': (a, b) => mine[a.id] - mine[b.id] || a.name.localeCompare(b.name),
  };
  const ratedList = inProvince.filter((c) => mine[c.id] != null).sort(ratedSorters[sortBy]);
  const unratedList = inProvince.filter((c) => mine[c.id] == null);
  const filtered =
    view === 'rated' ? ratedList
    : view === 'unrated' ? unratedList
    : [...ratedList, ...unratedList]; // rated first, still-to-rate underneath
  const pages = Math.ceil(filtered.length / PAGE);
  const shown = filtered.slice(page * PAGE, (page + 1) * PAGE);

  // Scores: rounds at rated courses are visible; the rest stay locked until rated
  const courseById = Object.fromEntries(courses.map((c) => [c.id, c]));
  const visibleRounds = rounds.filter((r) => mine[r.course_id] != null && courseById[r.course_id]);
  const lockedRounds = rounds.length - visibleRounds.length;
  const bestByCourse = {};
  for (const r of visibleRounds) {
    if (!bestByCourse[r.course_id] || r.total_score < bestByCourse[r.course_id])
      bestByCourse[r.course_id] = r.total_score;
  }
  const shownRated = shown.filter((c) => mine[c.id] != null);
  const shownUnrated = shown.filter((c) => mine[c.id] == null);

  return (
    <>
      <div className="card" style={{ marginTop: 20 }}>
        <h2>
          {ratedTotal}/{saCourses.length} courses rated and played
        </h2>
        <div className="progress-track on-light">
          <div className="progress-fill" style={{ width: `${Math.min(100, (ratedTotal / saCourses.length) * 100)}%` }} />
        </div>
        {muRated > 0 && (
          <p className="notice" style={{ margin: '6px 0 0' }}>
            🏝️ Plus {muRated}/{muTotal} in Mauritius
          </p>
        )}
        <BragCard
          name={user.user_metadata?.display_name || user.user_metadata?.full_name || user.email.split('@')[0]}
          rated={ratedTotal}
          total={saCourses.length}
          badgeCount={earned.length}
          badgeNames={[...earned].sort((a, b) => b.goal - a.goal).map((b) => b.name)}
          bestCourse={best}
        />
        <div className="chip-row" style={{ marginTop: 14 }}>
          {PROVINCES.map((p) => {
            const c = p === 'All provinces'
              ? { rated: ratedTotal, total: saCourses.length }
              : provinceCounts[p] || { rated: 0, total: 0 };
            return (
              <button
                key={p}
                className="chip"
                style={province === p ? { background: 'var(--green-mid)', color: 'var(--cream)' } : undefined}
                onClick={() => { setProvince(p); setPage(0); }}
              >
                {p === 'All provinces' ? 'All SA' : p === 'Mauritius' ? '🏝️ Mauritius' : p} {c.rated}/{c.total}
              </button>
            );
          })}
        </div>
        <div className="chip-row" style={{ marginTop: 10, alignItems: 'center' }}>
          {[['unrated', 'Still to rate'], ['rated', 'Rated by me'], ['all', 'Everything']].map(([v, label]) => (
            <button
              key={v}
              className="chip"
              style={view === v ? { background: 'var(--gold)', color: 'var(--green-deep)' } : undefined}
              onClick={() => { setView(v); setPage(0); }}
            >
              {label}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
            style={{ padding: '7px 10px', border: '1px solid var(--cream-dark)', borderRadius: 20, fontSize: 13, background: '#fff', color: 'var(--ink)', marginLeft: 'auto' }}
          >
            {Object.keys(ratedSorters).map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {(visibleRounds.length > 0 || lockedRounds > 0) && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>📋 My scores</h2>
          {visibleRounds.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--muted)', fontSize: 12 }}>
                  <th style={{ padding: '6px 8px 6px 0', fontWeight: 700 }}>Course</th>
                  <th style={{ padding: '6px 8px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {visibleRounds.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--cream-dark)' }}>
                    <td style={{ padding: '8px 8px 8px 0' }}>
                      <Link href={`/course/${courseById[r.course_id].slug}`} style={{ textDecoration: 'underline' }}>
                        {courseById[r.course_id].name}
                      </Link>
                    </td>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                      {new Date(r.played_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>
                      {r.total_score}
                      {r.total_score === bestByCourse[r.course_id] &&
                        visibleRounds.filter((x) => x.course_id === r.course_id).length > 1 && (
                          <span className="badge badge-played" style={{ marginLeft: 6 }}>Best</span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {lockedRounds > 0 && (
            <p className="notice" style={{ marginTop: 10, borderLeft: '3px solid var(--gold)', paddingLeft: 10 }}>
              🔒 {lockedRounds} round{lockedRounds === 1 ? '' : 's'} hidden — rate those courses to see the scores here.
            </p>
          )}
          <p className="notice" style={{ marginTop: 10 }}>
            Log a round from any course page — open a course below and tap “+ Log a round”.
          </p>
        </div>
      )}

      <div style={{ margin: '16px 0 48px' }}>
        {shownRated.length > 0 && (
          <p className="notice" style={{ margin: '4px 0 8px', fontWeight: 700 }}>
            ★ Rated by me ({ratedList.length})
          </p>
        )}
        {shownRated.map((c) => (
          <Link key={c.id} href={`/course/${c.slug}`} className="search-result">
            <span>
              <strong>{c.name}</strong>
              {(c.holes ?? 18) < 18 && <span className="badge">{c.holes} holes</span>}
              <br />
              <span className="meta-sub">{c.town}, {c.province}</span>
            </span>
            <span className="pick" style={{ color: 'var(--gold)' }}>★ {mine[c.id].toFixed(2)}</span>
          </Link>
        ))}
        {shownUnrated.length > 0 && (
          <p className="notice" style={{ margin: '16px 0 8px', fontWeight: 700 }}>
            Still to rate ({unratedList.length})
          </p>
        )}
        {shownUnrated.map((c) => (
          <Link key={c.id} href={`/rate?course=${c.slug}`} className="search-result">
            <span>
              <strong>{c.name}</strong>
              {(c.holes ?? 18) < 18 && <span className="badge">{c.holes} holes</span>}
              <br />
              <span className="meta-sub">{c.town}, {c.province}</span>
            </span>
            <span className="pick">Rate →</span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="notice">
            {view === 'unrated'
              ? 'Nothing left to rate here — you’ve covered this province!'
              : 'No courses match this filter yet.'}
          </p>
        )}
        {pages > 1 && (
          <div className="pager" style={{ margin: '20px 0 0' }}>
            <button className="btn" disabled={page === 0} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0 }); }}>
              ‹ Previous
            </button>
            <span className="pager-info">Page {page + 1} of {pages} · {filtered.length} courses</span>
            <button className="btn" disabled={page + 1 >= pages} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0 }); }}>
              Next ›
            </button>
          </div>
        )}
      </div>
    </>
  );
}
