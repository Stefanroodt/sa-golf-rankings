'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Your game in numbers — built from hole-by-hole rounds only.
// Par 3/4/5 averages, score distribution, and strokes gained vs the
// whole Pin High field (community per-hole averages).
export default function ScoringStats() {
  const [user, setUser] = useState(undefined);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (!u.user) return;

      const { data: rounds } = await supabase
        .from('rounds')
        .select('course_id, hole_scores, total_score')
        .eq('user_id', u.user.id)
        .not('hole_scores', 'is', null);
      if (!rounds || rounds.length === 0) { setStats({ empty: true }); return; }

      const ids = [...new Set(rounds.map((r) => r.course_id))];
      const [{ data: cards }, { data: field }] = await Promise.all([
        supabase.from('scorecards').select('course_id, hole, par').in('course_id', ids),
        supabase.from('course_hole_stats').select('course_id, hole, n, avg_score').in('course_id', ids),
      ]);

      const parOf = {};
      for (const c of cards || []) parOf[`${c.course_id}:${c.hole}`] = c.par;
      const fieldAvg = {};
      for (const f of field || []) fieldAvg[`${f.course_id}:${f.hole}`] = { avg: Number(f.avg_score), n: f.n };

      // Per par-type buckets + distribution + strokes gained vs field
      const types = { 3: { holes: 0, strokes: 0, gained: 0, gN: 0 }, 4: { holes: 0, strokes: 0, gained: 0, gN: 0 }, 5: { holes: 0, strokes: 0, gained: 0, gN: 0 } };
      const dist = { eagle: 0, birdie: 0, par: 0, bogey: 0, double: 0 };
      let holesTotal = 0;

      for (const r of rounds) {
        for (const [hole, raw] of Object.entries(r.hole_scores || {})) {
          const score = parseInt(raw, 10);
          const par = parOf[`${r.course_id}:${hole}`];
          if (!score || !par || !types[par]) continue;
          const t = types[par];
          t.holes += 1;
          t.strokes += score;
          holesTotal += 1;
          const f = fieldAvg[`${r.course_id}:${hole}`];
          if (f && f.n >= 2) { t.gained += f.avg - score; t.gN += 1; }
          const d = score - par;
          if (d <= -2) dist.eagle += 1;
          else if (d === -1) dist.birdie += 1;
          else if (d === 0) dist.par += 1;
          else if (d === 1) dist.bogey += 1;
          else dist.double += 1;
        }
      }
      if (!holesTotal) { setStats({ empty: true }); return; }

      // Strongest par type = best average vs par
      let best = null;
      for (const p of [3, 4, 5]) {
        const t = types[p];
        if (!t.holes) continue;
        const vsPar = t.strokes / t.holes - p;
        if (!best || vsPar < best.vsPar) best = { par: p, vsPar };
      }

      const gainedTotal = types[3].gained + types[4].gained + types[5].gained;
      const gainedN = types[3].gN + types[4].gN + types[5].gN;

      setStats({
        rounds: rounds.length,
        holesTotal,
        types,
        dist,
        best,
        // strokes gained vs field, scaled to a full 18 holes
        gainedPer18: gainedN ? (gainedTotal / gainedN) * 18 : null,
      });
    })();
  }, []);

  if (user === undefined || user === null || !stats) return null;

  if (stats.empty)
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <h2>📊 Your game in numbers</h2>
        <p className="notice">
          Score a round <strong>hole by hole</strong> to unlock your stats — par 3/4/5 averages,
          birdie counts and strokes gained on the field.{' '}
          <Link href="/scorecard" style={{ textDecoration: 'underline' }}>Pick a scorecard →</Link>
        </p>
      </div>
    );

  const fmtVs = (v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2));
  const typeMeta = { 3: 'Par 3s', 4: 'Par 4s', 5: 'Par 5s' };
  const distMeta = [
    ['eagle', '🦅 Eagle+', '#c9a227'],
    ['birdie', '🐦 Birdies', '#4c9a6a'],
    ['par', '✅ Pars', '#1a4a34'],
    ['bogey', 'Bogeys', '#b0885a'],
    ['double', 'Double+', '#a05a4b'],
  ];

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 style={{ marginBottom: 2 }}>📊 Your game in numbers</h2>
      <p className="notice" style={{ marginTop: 2 }}>
        Your average score on par 3s, 4s and 5s — from the {stats.rounds} round{stats.rounds === 1 ? '' : 's'} you
        scored <strong>hole-by-hole</strong> ({stats.holesTotal} holes). Rounds logged as a total only
        aren&apos;t counted here.
      </p>

      <div className="stat-grid">
        {[3, 4, 5].map((p) => {
          const t = stats.types[p];
          if (!t.holes) return null;
          const avg = t.strokes / t.holes;
          const vsPar = avg - p;
          const isBest = stats.best && stats.best.par === p;
          return (
            <div key={p} className={`stat-tile${isBest ? ' stat-best' : ''}`}>
              <div className="stat-label">{typeMeta[p]}{isBest ? ' 💪' : ''}</div>
              <div className="stat-value">{avg.toFixed(2)}</div>
              <div className={`stat-sub ${vsPar > 0 ? 'over' : 'under'}`}>
                {fmtVs(vsPar)} vs par · {t.holes} holes
              </div>
            </div>
          );
        })}
      </div>
      {stats.best && (
        <p className="notice" style={{ margin: '6px 0 0' }}>
          💪 Your money holes: <strong>{typeMeta[stats.best.par]}</strong> — closest to par.
        </p>
      )}

      <div className="dist-bar" aria-hidden="true">
        {distMeta.map(([k, , color]) =>
          stats.dist[k] ? (
            <span key={k} style={{ flex: stats.dist[k], background: color }} />
          ) : null
        )}
      </div>
      <div className="dist-legend">
        {distMeta.map(([k, label, color]) => (
          <span key={k} className="dist-chip">
            <span className="dist-dot" style={{ background: color }} />
            {label}: <strong>{stats.dist[k]}</strong>
          </span>
        ))}
      </div>

      {stats.gainedPer18 != null && (
        <div className="gained-row">
          <span className="gained-label">Strokes gained vs the Pin High field</span>
          <span className={`gained-value ${stats.gainedPer18 >= 0 ? 'under' : 'over'}`}>
            {stats.gainedPer18 >= 0 ? '▲' : '▼'} {Math.abs(stats.gainedPer18).toFixed(1)} per round
          </span>
        </div>
      )}
    </div>
  );
}
