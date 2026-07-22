'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Your logged rounds — course, date, score. A round is only visible once
// you've rated that course (same gate as the course-page scorecard).
export default function MyScores() {
  const [user, setUser] = useState(undefined);
  const [rounds, setRounds] = useState([]);
  const [ratedIds, setRatedIds] = useState(new Set());

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (!u.user) return;
      const [{ data: rds }, { data: rts }] = await Promise.all([
        supabase
          .from('rounds')
          .select('id, course_id, played_at, total_score, courses(name, slug)')
          .eq('user_id', u.user.id)
          .order('played_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('ratings').select('course_id').eq('user_id', u.user.id),
      ]);
      setRounds(rds || []);
      setRatedIds(new Set((rts || []).map((r) => r.course_id)));
    })();
  }, []);

  if (user === undefined || !user) return null;
  if (rounds.length === 0) return null;

  const visible = rounds.filter((r) => ratedIds.has(r.course_id) && r.courses);
  const locked = rounds.length - visible.length;
  const best = {};
  for (const r of visible) {
    if (!best[r.course_id] || r.total_score < best[r.course_id]) best[r.course_id] = r.total_score;
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h2>📋 My scores</h2>
      {visible.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)', fontSize: 12 }}>
              <th style={{ padding: '6px 8px 6px 0', fontWeight: 700 }}>Course</th>
              <th style={{ padding: '6px 8px', fontWeight: 700 }}>Date</th>
              <th style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--cream-dark)' }}>
                <td style={{ padding: '8px 8px 8px 0' }}>
                  <Link href={`/course/${r.courses.slug}`} style={{ textDecoration: 'underline' }}>
                    {r.courses.name}
                  </Link>
                </td>
                <td style={{ padding: '8px', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                  {new Date(r.played_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>
                  {r.total_score}
                  {r.total_score === best[r.course_id] &&
                    visible.filter((x) => x.course_id === r.course_id).length > 1 && (
                      <span className="badge badge-played" style={{ marginLeft: 6 }}>Best</span>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {locked > 0 && (
        <p className="notice" style={{ marginTop: 10, borderLeft: '3px solid var(--gold)', paddingLeft: 10 }}>
          🔒 {locked} round{locked === 1 ? '' : 's'} hidden — rate those courses to see the scores here.
        </p>
      )}
    </div>
  );
}
