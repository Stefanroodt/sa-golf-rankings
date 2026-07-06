'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase, weightedScore } from '../lib/supabase';

const PROVINCES = [
  'All provinces', 'Western Cape', 'Eastern Cape', 'KwaZulu-Natal', 'Gauteng',
  'Mpumalanga', 'Limpopo', 'North West', 'Free State', 'Northern Cape',
];

function Stars({ value }) {
  const full = Math.round(value);
  return <span className="stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>;
}

export default function Home() {
  const [courses, setCourses] = useState(null);
  const [province, setProvince] = useState('All provinces');
  const [holes, setHoles] = useState('All courses');
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from('course_rankings')
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setCourses(data);
      });
  }, []);

  const ranked = useMemo(() => {
    if (!courses) return [];
    const rated = courses.filter((c) => c.n_ratings > 0);
    const globalAvg = rated.length
      ? rated.reduce((s, c) => s + Number(c.avg_overall), 0) / rated.length
      : 3.5;
    return courses
      .map((c) => ({
        ...c,
        score: weightedScore(Number(c.avg_overall), c.n_ratings, globalAvg),
      }))
      .sort((a, b) => b.score - a.score || b.n_ratings - a.n_ratings || a.name.localeCompare(b.name));
  }, [courses]);

  const visible = ranked.filter(
    (c) =>
      (province === 'All provinces' || c.province === province) &&
      (holes === 'All courses' ||
        (holes === '18-hole' ? (c.holes ?? 18) >= 18 : (c.holes ?? 18) < 18)) &&
      (c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.town.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>South Africa&apos;s golf courses, ranked by golfers.</h1>
          <p>
            No panels, no politics — every position on this list is decided by
            ratings from people who actually played the course. Played one?
            Add your rating.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="controls">
          <select value={province} onChange={(e) => setProvince(e.target.value)}>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select value={holes} onChange={(e) => setHoles(e.target.value)}>
            {['All courses', '18-hole', '9-hole'].map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
          <input
            placeholder="Search course or town…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && <p className="error">Couldn&apos;t load courses: {error}</p>}
        {!courses && !error && <p className="notice">Loading rankings…</p>}

        <ol className="rank-list">
          {visible.map((c, i) => (
            <li key={c.id}>
              <Link href={`/course/${c.slug}`} className="rank-card">
                <div className={`rank-num${i < 3 ? ' top' : ''}`}>{i + 1}</div>
                <div className="rank-info">
                  <h3>
                    {c.name}
                    <span className="badge">{c.access}</span>
                    {(c.holes ?? 18) < 18 && <span className="badge">{c.holes} holes</span>}
                  </h3>
                  <div className="meta">
                    {c.town}, {c.province}
                    {c.designer ? ` · ${c.designer}` : ''}
                  </div>
                </div>
                <div className="rank-score">
                  {c.n_ratings > 0 ? (
                    <>
                      <div className="score-big">{Number(c.avg_overall).toFixed(1)}</div>
                      <Stars value={Number(c.avg_overall)} />
                      <div className="score-sub">
                        {c.n_ratings} rating{c.n_ratings === 1 ? '' : 's'}
                      </div>
                    </>
                  ) : (
                    <div className="unrated">No ratings yet — be first</div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
