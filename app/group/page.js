'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

// Start a group round (one scorer for the fourball) or join one with a code.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const makeCode = () =>
  Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

export default function GroupStart() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [courses, setCourses] = useState([]);
  const [q, setQ] = useState('');
  const [course, setCourse] = useState(null);
  const [names, setNames] = useState(['', '', '']);
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase
      .from('scorecard_courses')
      .select('id, name, town, province, par')
      .order('name')
      .then(({ data }) => setCourses(data || []));
  }, []);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term || course) return [];
    return courses
      .filter((c) => c.name.toLowerCase().includes(term) || (c.town || '').toLowerCase().includes(term))
      .slice(0, 8);
  }, [q, courses, course]);

  async function start() {
    if (!user || !course) return;
    setBusy(true);
    setErr(null);
    const myName =
      user.user_metadata?.display_name || user.user_metadata?.full_name || user.email.split('@')[0];

    // Create the round (retry once on code collision)
    let round = null;
    for (let i = 0; i < 2 && !round; i++) {
      const { data, error } = await supabase
        .from('group_rounds')
        .insert({ code: makeCode(), course_id: course.id, created_by: user.id })
        .select('id, code')
        .single();
      if (data) round = data;
      else if (error && error.code !== '23505') break;
    }
    if (!round) {
      setBusy(false);
      setErr('Could not start the round — try again.');
      return;
    }

    const players = [
      { group_round_id: round.id, name: myName, user_id: user.id },
      ...names
        .map((n) => n.trim())
        .filter(Boolean)
        .slice(0, 3)
        .map((n) => ({ group_round_id: round.id, name: n })),
    ];
    await supabase.from('group_players').insert(players);
    router.push(`/group/${round.code}`);
  }

  return (
    <div className="container" style={{ maxWidth: 560, margin: '32px auto 60px' }}>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>👥 Group round</h1>
      <p className="notice" style={{ marginTop: 0 }}>
        One scorer, the whole fourball, a live leaderboard. Score for your mates — or share the
        code and everyone watches the standings shot by shot.
      </p>

      <div className="card">
        <h2>Start a round</h2>
        {user === undefined ? (
          <p className="notice">Checking sign-in…</p>
        ) : !user ? (
          <p className="notice">
            <Link href="/auth" style={{ textDecoration: 'underline' }}>Sign in</Link> to start a
            group round.
          </p>
        ) : (
          <>
            <label className="notice" style={{ display: 'block', marginBottom: 8 }}>
              Course{' '}
              {course ? (
                <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
                  {course.name}{' '}
                  <button
                    onClick={() => { setCourse(null); setQ(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}
                  >
                    change
                  </button>
                </span>
              ) : (
                <input
                  value={q}
                  placeholder="Search course…"
                  onChange={(e) => setQ(e.target.value)}
                  style={{ marginLeft: 6, padding: '9px 10px', border: '1px solid var(--cream-dark)', borderRadius: 8, fontSize: 16, width: 'min(300px, 100%)' }}
                />
              )}
            </label>
            {shown.map((c) => (
              <button
                key={c.id}
                className="search-result"
                style={{ width: '100%', textAlign: 'left', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => setCourse(c)}
              >
                <span>
                  <strong>{c.name}</strong>
                  <br />
                  <span className="meta-sub">{c.town}, {c.province} · Par {c.par}</span>
                </span>
                <span className="pick" style={{ color: 'var(--gold)' }}>Pick →</span>
              </button>
            ))}

            <p className="notice" style={{ margin: '10px 0 6px' }}>
              Your fourball — you&apos;re in automatically. Add up to three mates (no account needed):
            </p>
            {names.map((n, i) => (
              <input
                key={i}
                value={n}
                placeholder={`Player ${i + 2} name`}
                onChange={(e) => setNames((s) => s.map((x, j) => (j === i ? e.target.value : x)))}
                style={{ display: 'block', width: 'min(300px, 100%)', marginBottom: 6, padding: '9px 10px', border: '1px solid var(--cream-dark)', borderRadius: 8, fontSize: 16 }}
              />
            ))}

            <button className="btn btn-gold" style={{ marginTop: 10 }} onClick={start} disabled={!course || busy}>
              {busy ? 'Starting…' : 'Start round →'}
            </button>
            {err && <p className="notice" style={{ color: '#a05a4b' }}>{err}</p>}
          </>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Join with a code</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={joinCode}
            placeholder="e.g. K7KPk"
            onChange={(e) => setJoinCode(e.target.value)}
            style={{ padding: '9px 10px', border: '1px solid var(--cream-dark)', borderRadius: 8, fontSize: 16, width: 140, textTransform: 'uppercase' }}
          />
          <button
            className="btn"
            onClick={() => joinCode.trim() && router.push(`/group/${joinCode.trim().toUpperCase()}`)}
          >
            Open leaderboard →
          </button>
        </div>
      </div>
    </div>
  );
}
