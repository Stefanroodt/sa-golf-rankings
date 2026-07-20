'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const PROVINCES = [
  'All', 'Western Cape', 'Eastern Cape', 'KwaZulu-Natal', 'Gauteng',
  'Mpumalanga', 'Limpopo', 'North West', 'Free State', 'Northern Cape', 'Mauritius',
];

export default function ScorecardPicker({ courses }) {
  const [q, setQ] = useState('');
  const [prov, setProv] = useState('All');

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return courses.filter(
      (c) =>
        (prov === 'All' || c.province === prov) &&
        (!term || c.name.toLowerCase().includes(term) || (c.town || '').toLowerCase().includes(term))
    );
  }, [courses, q, prov]);

  return (
    <>
      <div className="controls" style={{ marginTop: 8 }}>
        <select value={prov} onChange={(e) => setProv(e.target.value)}>
          {PROVINCES.map((p) => <option key={p}>{p === 'All' ? 'All provinces' : p}</option>)}
        </select>
        <input
          placeholder="Search course or town…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <p className="notice" style={{ margin: '4px 0 8px' }}>
        {shown.length} course{shown.length === 1 ? '' : 's'} with a full hole-by-hole scorecard
      </p>

      <div style={{ marginBottom: 48 }}>
        {shown.map((c) => (
          <Link key={c.id} href={`/score/${c.slug}`} className="search-result">
            <span>
              <strong>{c.name}</strong>
              {c.holes < 18 && <span className="badge">{c.holes} holes</span>}
              <br />
              <span className="meta-sub">
                {c.town}, {c.province} · Par {c.par}
              </span>
            </span>
            <span className="pick" style={{ color: 'var(--gold)' }}>Score →</span>
          </Link>
        ))}
        {shown.length === 0 && (
          <p className="notice">
            No scorecard match. Every course still lets you log a total score — find it in the{' '}
            <Link href="/" style={{ textDecoration: 'underline' }}>rankings</Link>.
          </p>
        )}
      </div>
    </>
  );
}
