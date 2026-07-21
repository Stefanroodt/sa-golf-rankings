'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// Playing handicap calculator — WHS course handicap from official tee
// ratings, times the competition allowance:
//   Course Handicap  = index × (slope ÷ 113) + (CR − par)
//   Playing Handicap = Course Handicap × allowance
const ALLOWANCES = [
  ['100', 'Singles / medal — 100%'],
  ['95', 'Alliance / stableford — 95%'],
  ['90', '4BBB matchplay — 90%'],
  ['85', 'Betterball strokeplay — 85%'],
  ['75', 'Mixed events — 75%'],
  ['50', 'Foursomes — 50%'],
];

const inputStyle = {
  padding: '9px 10px',
  border: '1px solid var(--cream-dark)',
  borderRadius: 8,
  fontSize: 16,
  background: '#fff',
  color: 'var(--ink)',
};

export default function PlayingHandicap({ defaultIndex = null }) {
  const [courses, setCourses] = useState([]);
  const [q, setQ] = useState('');
  const [course, setCourse] = useState(null);
  const [tees, setTees] = useState([]);
  const [teeIdx, setTeeIdx] = useState('');
  const [index, setIndex] = useState(defaultIndex != null ? String(defaultIndex) : '');
  const [allowance, setAllowance] = useState('100');

  useEffect(() => {
    if (defaultIndex != null && index === '') setIndex(String(defaultIndex));
  }, [defaultIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase
      .from('courses_with_tees')
      .select('id, name, town, province')
      .order('name')
      .then(({ data }) => setCourses(data || []));
  }, []);

  // Match typed text to a course (exact name from the datalist)
  useEffect(() => {
    const hit = courses.find((c) => c.name.toLowerCase() === q.trim().toLowerCase());
    setCourse(hit || null);
  }, [q, courses]);

  useEffect(() => {
    if (!course) { setTees([]); setTeeIdx(''); return; }
    supabase
      .from('course_tees')
      .select('tee, gender, par, course_rating, slope')
      .eq('course_id', course.id)
      .order('course_rating', { ascending: false })
      .then(({ data }) => {
        const ts = data || [];
        setTees(ts);
        const white = ts.findIndex((t) => t.gender === 'M' && /white/i.test(t.tee));
        const men = ts.findIndex((t) => t.gender === 'M');
        setTeeIdx(ts.length ? String(white >= 0 ? white : men >= 0 ? men : 0) : '');
      });
  }, [course]);

  const result = useMemo(() => {
    const idx = parseFloat(index);
    const tee = tees[parseInt(teeIdx, 10)];
    if (isNaN(idx) || !tee || !tee.slope || !tee.course_rating) return null;
    let ch = idx * (tee.slope / 113);
    if (tee.par) ch += Number(tee.course_rating) - tee.par;
    const ph = Math.round(ch * (parseInt(allowance, 10) / 100));
    return { tee, ch, ph };
  }, [index, tees, teeIdx, allowance]);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 style={{ marginBottom: 2 }}>🎯 Playing handicap</h2>
      <p className="notice" style={{ marginTop: 2 }}>
        What you play off today — your index adjusted for the course, the tees and the format.
      </p>

      <label className="notice" style={{ display: 'block', marginBottom: 8 }}>
        Handicap index{' '}
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          value={index}
          placeholder="e.g. 14.3"
          onChange={(e) => setIndex(e.target.value)}
          style={{ ...inputStyle, marginLeft: 6, width: 96 }}
        />
        {defaultIndex != null && (
          <span style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
            Pre-filled with your Pin High Number — overwrite it with your official index if you have one.
          </span>
        )}
      </label>

      <label className="notice" style={{ display: 'block', marginBottom: 8 }}>
        Course{' '}
        <input
          list="ph-course-list"
          value={q}
          placeholder="Start typing a course…"
          onChange={(e) => setQ(e.target.value)}
          style={{ ...inputStyle, marginLeft: 6, width: 'min(320px, 100%)' }}
        />
        <datalist id="ph-course-list">
          {courses.map((c) => (
            <option key={c.id} value={c.name}>{c.town}, {c.province}</option>
          ))}
        </datalist>
      </label>

      {course && tees.length > 0 && (
        <label className="notice" style={{ display: 'block', marginBottom: 8 }}>
          Tees{' '}
          <select value={teeIdx} onChange={(e) => setTeeIdx(e.target.value)} style={{ ...inputStyle, marginLeft: 6 }}>
            {tees.map((t, i) => (
              <option key={i} value={i}>
                {t.tee}{t.gender === 'W' ? ' ♀' : ''} · CR {t.course_rating} / Slope {t.slope}{t.par ? ` · Par ${t.par}` : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="notice" style={{ display: 'block', marginBottom: 8 }}>
        Allowance{' '}
        <select value={allowance} onChange={(e) => setAllowance(e.target.value)} style={{ ...inputStyle, marginLeft: 6 }}>
          {ALLOWANCES.map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </label>

      {result && (
        <div className="gained-row" style={{ marginTop: 12 }}>
          <span>
            <span className="gained-label" style={{ display: 'block' }}>
              Playing handicap · {course.name} · {result.tee.tee}{result.tee.gender === 'W' ? ' ♀' : ''} · {allowance}%
            </span>
            <span className="gained-label" style={{ fontSize: 12, opacity: 0.8 }}>
              Course handicap {result.ch.toFixed(1)}
            </span>
          </span>
          <span className="gained-value under" style={{ fontSize: 34 }}>
            {result.ph}
          </span>
        </div>
      )}
      {!result && index !== '' && course && (
        <p className="notice" style={{ marginTop: 8 }}>Pick your tees to see your playing handicap.</p>
      )}
    </div>
  );
}
