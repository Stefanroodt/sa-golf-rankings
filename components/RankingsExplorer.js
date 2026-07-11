'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const PAGE = 20;

function Stars({ value }) {
  const full = Math.round(value);
  return <span className="stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>;
}

const METRIC_SETS = {
  course: {
    'Best value': 'avg_value',
    'Best conditions': 'avg_conditions',
    'Best greens': 'avg_greens',
    'Best layout': 'avg_layout',
    'Best halfway house': 'avg_clubhouse',
    'Best staff': 'avg_staff',
  },
  nineteenth: {
    'Best atmosphere': 'avg_atmosphere',
    'Best drinks': 'avg_drinks',
    'Best food': 'avg_food',
    'Best view': 'avg_view',
    'Best service': 'avg_service',
  },
};

export default function RankingsExplorer({ courses, provinces, hideProvinceFilter, kind = 'course' }) {
  const [province, setProvince] = useState('All provinces');
  const [holes, setHoles] = useState('All courses');
  const [sort, setSort] = useState('Ranking');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const topRef = useRef(null);
  const pathname = usePathname();
  const restored = useRef(false);

  // Restore filters + page from the URL (so back-navigation lands where you were)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('prov')) setProvince(sp.get('prov'));
    if (sp.get('holes')) setHoles(sp.get('holes'));
    if (sp.get('sort')) setSort(sp.get('sort'));
    if (sp.get('q')) setQuery(sp.get('q'));
    const p = parseInt(sp.get('page') || '1', 10);
    if (p > 1) setPage(p - 1);
    restored.current = true;
  }, []);

  // Mirror state into the URL without triggering navigation
  useEffect(() => {
    if (!restored.current) return;
    const sp = new URLSearchParams();
    if (province !== 'All provinces') sp.set('prov', province);
    if (holes !== 'All courses') sp.set('holes', holes);
    if (sort !== 'Ranking') sp.set('sort', sort);
    if (query) sp.set('q', query);
    if (page > 0) sp.set('page', String(page + 1));
    const qs = sp.toString();
    window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);
  }, [province, holes, sort, query, page, pathname]);

  const goToPage = (p) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
  };

  const metricMap = METRIC_SETS[kind] || METRIC_SETS.course;
  const sorters = {
    'Ranking': (a, b) => b.score - a.score || b.n_ratings - a.n_ratings || a.name.localeCompare(b.name),
    'Most rated': (a, b) => b.n_ratings - a.n_ratings || b.score - a.score,
    ...Object.fromEntries(
      Object.entries(metricMap).map(([label, col]) => [
        label,
        (a, b) => (Number(b[col]) || 0) - (Number(a[col]) || 0) || b.n_ratings - a.n_ratings,
      ])
    ),
    'A–Z': (a, b) => a.name.localeCompare(b.name),
  };

  const metricKey = metricMap[sort] || 'avg_overall';
  const metricLabel = metricMap[sort] ? sort.replace('Best ', '') : 'overall';

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
      <div className="controls" ref={topRef} style={{ scrollMarginTop: 16 }}>
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
                    <div className="score-big">{Number(c[metricKey] ?? 0).toFixed(1)}</div>
                    <Stars value={Number(c[metricKey] ?? 0)} />
                    <div className="score-sub">
                      {metricLabel} · {c.n_ratings} rating{c.n_ratings === 1 ? '' : 's'}
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

      {visible.length > PAGE && (
        <div className="pager">
          <button
            className="btn"
            disabled={page === 0}
            onClick={() => goToPage(page - 1)}
          >
            ‹ Previous
          </button>
          <span className="pager-info">
            Page {page + 1} of {Math.ceil(visible.length / PAGE)} · {visible.length} courses
          </span>
          <button
            className="btn"
            disabled={(page + 1) * PAGE >= visible.length}
            onClick={() => goToPage(page + 1)}
          >
            Next ›
          </button>
        </div>
      )}
    </>
  );
}
