'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';

// Live group round: one scorer can capture the whole fourball.
// Leaderboard ranks on gross strokes (to-par over holes completed).
export default function GroupRound({ params }) {
  const code = (params.code || '').toUpperCase();
  const [round, setRound] = useState(undefined);
  const [players, setPlayers] = useState([]);
  const [card, setCard] = useState([]);
  const [user, setUser] = useState(null);
  const [note, setNote] = useState(null);
  const [savedRound, setSavedRound] = useState(false);
  const dirty = useRef({});   // playerId -> true while local edits not yet pushed
  const timers = useRef({});  // playerId -> debounce timer

  // Initial load
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      const { data: r } = await supabase
        .from('group_rounds')
        .select('id, code, course_id, created_by, played_at, status, courses(name, slug)')
        .eq('code', code)
        .single();
      setRound(r || null);
      if (!r) return;
      const [{ data: ps }, { data: sc }] = await Promise.all([
        supabase.from('group_players').select('*').eq('group_round_id', r.id).order('created_at'),
        supabase.from('scorecards').select('hole, par').eq('course_id', r.course_id).order('hole'),
      ]);
      setPlayers(ps || []);
      setCard(sc || []);
    })();
  }, [code]);

  // Live-ish leaderboard: poll for other players' scores
  useEffect(() => {
    if (!round) return;
    const t = setInterval(async () => {
      const { data: ps } = await supabase
        .from('group_players').select('*').eq('group_round_id', round.id).order('created_at');
      if (!ps) return;
      setPlayers((cur) =>
        ps.map((p) => (dirty.current[p.id] ? cur.find((c) => c.id === p.id) || p : p))
      );
      const { data: r } = await supabase
        .from('group_rounds').select('status').eq('id', round.id).single();
      if (r && r.status !== round.status) setRound((x) => ({ ...x, status: r.status }));
    }, 10000);
    return () => clearInterval(t);
  }, [round]);

  const isCreator = user && round && round.created_by === user.id;
  const canEdit = (p) => round?.status === 'live' && user && (isCreator || p.user_id === user.id);
  const myPlayer = user ? players.find((p) => p.user_id === user.id) : null;

  function setScore(p, hole, val) {
    setPlayers((cur) =>
      cur.map((x) =>
        x.id === p.id ? { ...x, hole_scores: { ...x.hole_scores, [hole]: val } } : x
      )
    );
    dirty.current[p.id] = true;
    clearTimeout(timers.current[p.id]);
    timers.current[p.id] = setTimeout(async () => {
      setPlayers((cur) => {
        const fresh = cur.find((x) => x.id === p.id);
        if (fresh) {
          const clean = Object.fromEntries(
            Object.entries(fresh.hole_scores).filter(([, v]) => parseInt(v, 10) > 0)
              .map(([h, v]) => [h, parseInt(v, 10)])
          );
          supabase.from('group_players').update({ hole_scores: clean }).eq('id', p.id)
            .then(() => { dirty.current[p.id] = false; });
        }
        return cur;
      });
    }, 700);
  }

  const parOf = useMemo(() => Object.fromEntries(card.map((h) => [h.hole, h.par])), [card]);

  const board = useMemo(() => {
    return players
      .map((p) => {
        let total = 0, thru = 0, par = 0;
        for (const [h, v] of Object.entries(p.hole_scores || {})) {
          const s = parseInt(v, 10);
          if (s > 0 && parOf[h]) { total += s; par += parOf[h]; thru += 1; }
        }
        return { ...p, total, thru, toPar: total - par };
      })
      .sort((a, b) =>
        (a.thru === 0) - (b.thru === 0) || a.toPar - b.toPar || b.thru - a.thru
      );
  }, [players, parOf]);

  async function joinRound() {
    if (!user || !round || players.length >= 4) return;
    const myName =
      user.user_metadata?.display_name || user.user_metadata?.full_name || user.email.split('@')[0];
    const { data } = await supabase
      .from('group_players')
      .insert({ group_round_id: round.id, name: myName, user_id: user.id })
      .select('*').single();
    if (data) setPlayers((cur) => [...cur, data]);
  }

  async function finishRound() {
    if (!isCreator) return;
    if (!confirm('Finish this round? Scores lock for everyone.')) return;
    await supabase.from('group_rounds').update({ status: 'final' }).eq('id', round.id);
    setRound((r) => ({ ...r, status: 'final' }));
  }

  async function saveToMyScores() {
    const me = board.find((p) => p.user_id === user?.id);
    if (!me || me.thru !== card.length) return;
    const { error } = await supabase.from('rounds').insert({
      user_id: user.id,
      course_id: round.course_id,
      played_at: round.played_at,
      total_score: me.total,
      hole_scores: me.hole_scores,
    });
    if (!error) { setSavedRound(true); setNote('Saved to My scores.'); }
    else setNote('Could not save — maybe already saved?');
  }

  function share() {
    const url = `https://pinhigh.co.za/group/${round.code}`;
    if (navigator.share) navigator.share({ title: 'Pin High group round', url }).catch(() => {});
    else {
      navigator.clipboard?.writeText(url);
      setNote('Link copied — send it to the fourball.');
    }
  }

  if (round === undefined)
    return <div className="container"><p className="notice" style={{ margin: '40px 0' }}>Loading…</p></div>;
  if (round === null)
    return (
      <div className="container" style={{ maxWidth: 560, margin: '48px auto' }}>
        <div className="card">
          <h2>Round not found</h2>
          <p className="notice">Check the code — or <Link href="/group" style={{ textDecoration: 'underline' }}>start a new group round</Link>.</p>
        </div>
      </div>
    );

  const fmtPar = (v, thru) => (thru === 0 ? '—' : v === 0 ? 'E' : v > 0 ? `+${v}` : `${v}`);

  return (
    <div className="container" style={{ maxWidth: 720, margin: '28px auto 60px' }}>
      <Link href="/group" className="back-link" style={{ display: 'inline-block', marginBottom: 12 }}>← Group rounds</Link>
      <h1 style={{ fontSize: 24, marginBottom: 2 }}>
        {round.courses.name}
        {round.status === 'final' && <span className="badge badge-played" style={{ marginLeft: 8 }}>Final</span>}
      </h1>
      <div className="meta-sub" style={{ marginBottom: 14 }}>
        {new Date(round.played_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
        {' · '}Code: <strong>{round.code}</strong>
        {' · '}
        <button onClick={share} style={{ background: 'none', border: 'none', color: 'var(--gold)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, padding: 0 }}>
          Share leaderboard
        </button>
      </div>

      {/* Leaderboard — gross strokes */}
      <div className="card" style={{ background: 'var(--green-deep)', color: 'var(--cream)' }}>
        <h2 style={{ color: 'var(--cream)' }}>🏆 Leaderboard · gross</h2>
        <div className="grp-row grp-head">
          <span />
          <span>Player</span>
          <span style={{ textAlign: 'right' }}>Thru</span>
          <span style={{ textAlign: 'right' }}>Gross score</span>
          <span style={{ textAlign: 'right' }}>To par</span>
        </div>
        {board.map((p, i) => (
          <div key={p.id} className="grp-row">
            <span className="grp-pos">{p.thru === 0 ? '·' : i + 1}</span>
            <span className="grp-name">
              {p.name}{p.user_id === user?.id ? ' (you)' : ''}
            </span>
            <span className="grp-thru">{p.thru === 0 ? 'not started' : `thru ${p.thru}`}</span>
            <span className="grp-gross">{p.thru === 0 ? '' : p.total}</span>
            <span className={`grp-topar ${p.toPar > 0 ? 'over' : p.toPar < 0 ? 'under' : ''}`}>
              {fmtPar(p.toPar, p.thru)}
            </span>
          </div>
        ))}
      </div>

      {user && !myPlayer && players.length < 4 && round.status === 'live' && (
        <p className="notice" style={{ marginTop: 10 }}>
          Playing in this fourball?{' '}
          <button onClick={joinRound} className="btn btn-gold" style={{ marginLeft: 6 }}>Join the round</button>
        </p>
      )}
      {!user && (
        <p className="notice" style={{ marginTop: 10 }}>
          <Link href="/auth" style={{ textDecoration: 'underline' }}>Sign in</Link> to score — or just watch the leaderboard.
        </p>
      )}

      {/* Scoring grid */}
      {card.length > 0 && players.length > 0 && (
        <div className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
          <h2>📋 Scores</h2>
          {user && (isCreator ? (
            <p className="notice" style={{ marginTop: 0 }}>You&apos;re the scorer — enter scores for the whole fourball.</p>
          ) : myPlayer ? (
            <p className="notice" style={{ marginTop: 0 }}>You can enter your own scores.</p>
          ) : null)}
          <table className="grp-grid">
            <thead>
              <tr>
                <th className="grp-hole-h">Hole</th>
                {players.map((p) => (
                  <th key={p.id}>{p.name.split(' ')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {card.map((h) => (
                <tr key={h.hole}>
                  <td className="grp-hole">
                    <strong>{h.hole}</strong> <span className="meta-sub">Par {h.par}</span>
                  </td>
                  {players.map((p) => (
                    <td key={p.id}>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="15"
                        placeholder={h.par}
                        disabled={!canEdit(p)}
                        value={p.hole_scores?.[h.hole] ?? ''}
                        onChange={(e) => setScore(p, h.hole, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {isCreator && round.status === 'live' && (
          <button className="btn" onClick={finishRound}>Finish round</button>
        )}
        {myPlayer && !savedRound &&
          board.find((p) => p.id === myPlayer.id)?.thru === card.length && card.length > 0 && (
          <button className="btn btn-gold" onClick={saveToMyScores}>Save my score to My scores</button>
        )}
      </div>
      {note && <p className="notice" style={{ marginTop: 8 }}>{note}</p>}
    </div>
  );
}
