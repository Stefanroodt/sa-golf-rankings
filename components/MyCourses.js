'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const PROVINCES = [
  'All provinces', 'Western Cape', 'Eastern Cape', 'KwaZulu-Natal', 'Gauteng',
  'Mpumalanga', 'Limpopo', 'North West', 'Free State', 'Northern Cape',
];
const PAGE = 30;

export default function MyCourses() {
  const [user, setUser] = useState(undefined);
  const [courses, setCourses] = useState(null);
  const [mine, setMine] = useState({});
  const [province, setProvince] = useState('All provinces');
  const [view, setView] = useState('unrated');
  const [page, setPage] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (!u.user) return;
      const [{ data: cs }, { data: rs }] = await Promise.all([
        supabase.from('courses').select('id, slug, name, town, province, holes').order('name'),
        supabase.from('ratings').select('course_id, overall').eq('user_id', u.user.id),
      ]);
      setCourses(cs || []);
      const m = {};
      for (const r of rs || []) m[r.course_id] = Number(r.overall);
      setMine(m);
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

  const ratedTotal = Object.keys(mine).length;
  const filtered = courses.filter(
    (c) =>
      (province === 'All provinces' || c.province === province) &&
      (view === 'all' || (view === 'rated' ? mine[c.id] != null : mine[c.id] == null))
  );
  const pages = Math.ceil(filtered.length / PAGE);
  const shown = filtered.slice(page * PAGE, (page + 1) * PAGE);

  return (
    <>
      <div className="card" style={{ marginTop: 20 }}>
        <h2>
          {ratedTotal}/{courses.length} courses rated and played
        </h2>
        <div className="progress-track on-light">
          <div className="progress-fill" style={{ width: `${Math.min(100, (ratedTotal / courses.length) * 100)}%` }} />
        </div>
        <div className="chip-row" style={{ marginTop: 14 }}>
          {PROVINCES.map((p) => {
            const c = p === 'All provinces'
              ? { rated: ratedTotal, total: courses.length }
              : provinceCounts[p] || { rated: 0, total: 0 };
            return (
              <button
                key={p}
                className="chip"
                style={province === p ? { background: 'var(--green-mid)', color: 'var(--cream)' } : undefined}
                onClick={() => { setProvince(p); setPage(0); }}
              >
                {p === 'All provinces' ? 'All' : p} {c.rated}/{c.total}
              </button>
            );
          })}
        </div>
        <div className="chip-row" style={{ marginTop: 10 }}>
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
        </div>
      </div>

      <div style={{ margin: '16px 0 48px' }}>
        {shown.map((c) =>
          mine[c.id] != null ? (
            <Link key={c.id} href={`/course/${c.slug}`} className="search-result">
              <span>
                <strong>{c.name}</strong>
                {(c.holes ?? 18) < 18 && <span className="badge">{c.holes} holes</span>}
                <br />
                <span className="meta-sub">{c.town}, {c.province}</span>
              </span>
              <span className="pick" style={{ color: 'var(--gold)' }}>★ {mine[c.id].toFixed(2)}</span>
            </Link>
          ) : (
            <Link key={c.id} href={`/rate?course=${c.slug}`} className="search-result">
              <span>
                <strong>{c.name}</strong>
                {(c.holes ?? 18) < 18 && <span className="badge">{c.holes} holes</span>}
                <br />
                <span className="meta-sub">{c.town}, {c.province}</span>
              </span>
              <span className="pick">Rate →</span>
            </Link>
          )
        )}
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
