'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase, CATEGORIES19 } from '../lib/supabase';
import RatePanel from './RatePanel';

const PROVINCES = [
  'All provinces', 'Western Cape', 'Eastern Cape', 'KwaZulu-Natal', 'Gauteng',
  'Mpumalanga', 'Limpopo', 'North West', 'Free State', 'Northern Cape',
];

export default function QuickRate() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState(null);
  const [q, setQ] = useState('');
  const [province, setProvince] = useState('All provinces');
  const [selected, setSelected] = useState(null);
  const [myRated, setMyRated] = useState(new Set());
  const [justRated, setJustRated] = useState(false);

  useEffect(() => {
    supabase
      .from('course_rankings')
      .select('id, slug, name, town, province, holes, n_ratings')
      .order('name')
      .then(({ data }) => setCourses(data || []));
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from('ratings').select('course_id').eq('user_id', u.user.id);
      if (data) setMyRated(new Set(data.map((r) => r.course_id)));
    })();
  }, []);

  // Deep link: /rate?course=slug
  useEffect(() => {
    const slug = searchParams.get('course');
    if (slug && courses && !selected) {
      const c = courses.find((x) => x.slug === slug);
      if (c) setSelected(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, searchParams]);

  // After a successful rating, offer the next course
  useEffect(() => {
    const onRated = () => {
      setJustRated(true);
      if (selected) setMyRated((s) => new Set([...s, selected.id]));
    };
    window.addEventListener('pinhigh:rated', onRated);
    return () => window.removeEventListener('pinhigh:rated', onRated);
  }, [selected]);

  const searching = q.trim().length > 1 || province !== 'All provinces';
  const matches =
    searching && courses
      ? courses
          .filter(
            (c) =>
              (province === 'All provinces' || c.province === province) &&
              (q.trim().length <= 1 ||
                c.name.toLowerCase().includes(q.toLowerCase()) ||
                c.town.toLowerCase().includes(q.toLowerCase()))
          )
          .slice(0, 10)
      : [];

  const popular = courses
    ? [...courses].sort((a, b) => b.n_ratings - a.n_ratings).filter((c) => c.n_ratings > 0).slice(0, 6)
    : [];

  const suggestions =
    selected && courses
      ? courses
          .filter((c) => c.id !== selected.id && !myRated.has(c.id) && c.province === selected.province)
          .sort((a, b) => b.n_ratings - a.n_ratings)
          .slice(0, 3)
      : [];

  const pick = (c) => {
    setSelected(c);
    setJustRated(false);
    setQ('');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {!selected && (
        <div className="card" style={{ marginTop: 24 }}>
          <h2>Find your course</h2>
          <div className="controls" style={{ margin: '0 0 4px' }}>
            <select value={province} onChange={(e) => setProvince(e.target.value)}>
              {PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <input
            className="rate-search"
            placeholder="Start typing a course or town… e.g. Fancourt, Knysna, Benoni"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          {!courses && searching && <p className="notice">Loading courses…</p>}
          {matches.map((c) => (
            <button key={c.id} className="search-result" onClick={() => pick(c)}>
              <span>
                <strong>{c.name}</strong>
                {(c.holes ?? 18) < 18 && <span className="badge">{c.holes} holes</span>}
                {myRated.has(c.id) && <span className="badge badge-played">✓ Rated</span>}
                <br />
                <span className="meta-sub">{c.town}, {c.province}</span>
              </span>
              <span className="pick">Rate →</span>
            </button>
          ))}
          {courses && searching && matches.length === 0 && (
            <p className="notice">
              No match — try a shorter search, or check the{' '}
              <Link href="/" style={{ textDecoration: 'underline' }}>full rankings</Link>.
            </p>
          )}
          {!searching && popular.length > 0 && (
            <>
              <p className="notice" style={{ marginTop: 8 }}>Popular right now:</p>
              <div className="chip-row">
                {popular.map((c) => (
                  <button key={c.id} className="chip" onClick={() => pick(c)}>
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {selected && (
        <>
          <div className="card" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <h2 style={{ marginBottom: 2 }}>{selected.name}</h2>
              <span className="meta-sub">
                {selected.town}, {selected.province} ·{' '}
                <Link href={`/course/${selected.slug}`} style={{ textDecoration: 'underline' }}>
                  view course page
                </Link>
              </span>
            </div>
            <button className="btn" onClick={() => { setSelected(null); setJustRated(false); }}>
              Change course
            </button>
          </div>

          {justRated && suggestions.length > 0 && (
            <div className="card" style={{ marginTop: 14, borderColor: 'var(--gold)' }}>
              <h2>Keep the streak going</h2>
              <p className="notice" style={{ marginTop: 0 }}>
                Played any of these {selected.province} courses? One tap:
              </p>
              <div className="chip-row">
                {suggestions.map((c) => (
                  <button key={c.id} className="chip" onClick={() => pick(c)}>
                    {c.name} →
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="notice" style={{ margin: '14px 0 0', textAlign: 'center' }}>
            Two separate ratings: ⛳ the course (the golf) and 🍺 the 19th hole
            (the bar afterwards). Do either — or both.
          </p>
          <div className="two-col" style={{ marginTop: 14 }}>
            <RatePanel course={selected} />
            <RatePanel
              course={selected}
              kind="nineteenth"
              categories={CATEGORIES19}
              title="Rate the 19th hole"
            />
          </div>
          <p className="notice" style={{ textAlign: 'center', marginBottom: 48 }}>
            Rate one or both — every rating moves the rankings.
          </p>
        </>
      )}
    </div>
  );
}
