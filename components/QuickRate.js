'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase, CATEGORIES19 } from '../lib/supabase';
import RatePanel from './RatePanel';

const PROVINCES = [
  'All provinces', 'Western Cape', 'Eastern Cape', 'KwaZulu-Natal', 'Gauteng',
  'Mpumalanga', 'Limpopo', 'North West', 'Free State', 'Northern Cape',
];

export default function QuickRate() {
  const [courses, setCourses] = useState(null);
  const [q, setQ] = useState('');
  const [province, setProvince] = useState('All provinces');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    supabase
      .from('courses')
      .select('id, slug, name, town, province, holes')
      .order('name')
      .then(({ data }) => setCourses(data || []));
  }, []);

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
            <button key={c.id} className="search-result" onClick={() => { setSelected(c); setQ(''); }}>
              <span>
                <strong>{c.name}</strong>
                {(c.holes ?? 18) < 18 && <span className="badge">{c.holes} holes</span>}
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
            <button className="btn" onClick={() => setSelected(null)}>
              Change course
            </button>
          </div>
          <div className="two-col" style={{ marginTop: 18 }}>
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
