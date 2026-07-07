'use client';

import Link from 'next/link';
import { useState } from 'react';

const PAGE = 20;

function Stars({ value }) {
  const full = Math.round(value);
  return <span className="stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>;
}

export default function RankingsExplorer({ courses, provinces, hideProvinceFilter }) {
  const [province, setProvince] = useState('All provinces');
  const [holes, setHoles] = useState('All courses');
  const [sort, setSort] = useState('Ranking');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const sorters = {
    'Ranking': (a, b) => b.score - a.score || b.n_ratings - a.n_ratings || a.name.localeCompare(b.name),
    'Most rated': (a, b) => b.n_ratings - a.n_ratings || b.score - a.score,
    'Best value': (a, b) => (b.avg_value ?? 0) - (a.avg_value ?? 0) || b.n_ratings - a.n_ratings,
    'Best conditions': (a, b) => (b.avg_conditions ?? 0) - (a.avg_conditions ?? 0) || b.n_ratings - a.n_ratings,
    'Best layout': (a, b) => (b.avg_layout ?? 0) - (a.avg_layout ?? 0) || b.n_ratings - a.n_ratings,
    'Best clubhouse': (a, b) => (b.avg_clubhouse ?? 0) - (a.avg_clubhouse ?? 0) || b.n_ratings - a.n_ratings,
    'Best staff': (a, b) => (b.avg_staff ?? 0) - (a.avg_staff ?? 0) || b.n_ratings - a.n_ratings,
    'A–Z': (a, b) => a.name.localeCompare(b.name),
  };

  const visible = courses
    .filter(
      (c) =>
        (province === 'All provinces' || c.province === province) &&
        (holes === 'All courses' ||
          (holes === '18-hole' ? (c.holes ?? 18) >= 18 : (c.holes ?? 18) < 18)) &&
        (c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.town.toLowerCase().includes(query.toLowerCase()))
    )
    .sort(sorters[sort]);

  return (
    <>
      <div className="controls">
        {!hideProvinceFilter && (
          <select value={province} onChange={(e) => { setProvince(e.target.value); setPage(0); }}>
            {['All provinces', ...provinces].map((p) => <option key={p}>{p}</option>)}
          </select>
        )}
        <select value={holes} onChange={(e) => { setHoles(e.target.value); setPage(0); }}>
          {['All courses', '18-hole', '9-hole'].map((h) => <option key={h}>{h}</option>)}
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(0); }}>
          {Object.keys(sorters).map((s) => <option key={s}>{s}</option>)}
        </select>
        <input
          placeholder="Search course or town…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
        />
      </div>

      <ol className="rank-list">
        {visible.slice(page * PAGE, (page + 1) * PAGE).map((c, i) => (
          <li key={c.id}>
            <Link href={`/course/${c.slug}`} className="rank-card">
              <div className={`rank-num${page === 0 && i < 3 && sort === 'Ranking' ? ' top' : ''}`}>
                {page * PAGE + i + 1}
              </div>
              <div className="rank-info">
                <h3>
                  {c.name}
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
                    <div className="score-sub">{c.n_ratings} rating{c.n_ratings === 1 ? '' : 's'}</div>
                  </>
                ) : (
                  <div className="unrated">No ratings yet — be first</div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ol>

      {visible.length > PAGE && (
        <div className="pager">
          <button
            className="btn"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            ‹ Previous
          </button>
          <span className="pager-info">
            Page {page + 1} of {Math.ceil(visible.length / PAGE)} · {visible.length} courses
          </span>
          <button
            className="btn"
            disabled={(page + 1) * PAGE >= visible.length}
            onClick={() => setPage(page + 1)}
          >
            Next ›
          </button>
        </div>
      )}
    </>
  );
}
