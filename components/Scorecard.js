'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Digital scorecard: anyone signed in can log a score, but your scoring
// history for a course only unlocks once you've rated that course.
export default function Scorecard({ course, scorecard = [], autoOpen = false }) {
  const [user, setUser] = useState(undefined);
  const [hasRated, setHasRated] = useState(false);
  const [rounds, setRounds] = useState(null);
  const [holes, setHoles] = useState({}); // hole -> score
  const [total, setTotal] = useState('');
  const [playedAt, setPlayedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [tees, setTees] = useState([]);
  const [teeIdx, setTeeIdx] = useState('');
  const wrapRef = useRef(null);

  // Arriving from the Scorecard hub (/course/slug?score=1): open entry and scroll to it
  useEffect(() => {
    if (autoOpen) {
      setEntryOpen(true);
      const t = setTimeout(() => wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
      return () => clearTimeout(t);
    }
  }, [autoOpen]);

  const hasCard = scorecard.length >= 9;
  const coursePar = useMemo(
    () => (hasCard ? scorecard.reduce((s, h) => s + h.par, 0) : null),
    [scorecard, hasCard]
  );

  useEffect(() => {
    (async () => {
      const { data: teeData } = await supabase
        .from('course_tees')
        .select('tee, gender, par, course_rating, slope')
        .eq('course_id', course.id)
        .order('course_rating', { ascending: false });
      const ts = teeData || [];
      setTees(ts);
      // Default to men's White, else first men's, else first
      if (ts.length) {
        const def = ts.findIndex((t) => t.gender === 'M' && /white/i.test(t.tee));
        const men = ts.findIndex((t) => t.gender === 'M');
        setTeeIdx(String(def >= 0 ? def : men >= 0 ? men : 0));
      }
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (!u.user) return;
      const [{ data: r }, { data: rd }] = await Promise.all([
        supabase.from('ratings').select('id').eq('user_id', u.user.id).eq('course_id', course.id).limit(1),
        supabase.from('rounds').select('id, played_at, total_score, hole_scores')
          .eq('user_id', u.user.id).eq('course_id', course.id)
          .order('played_at', { ascending: false }).limit(30),
      ]);
      setHasRated((r || []).length > 0);
      setRounds(rd || []);
    })();
  }, [course.id]);

  // Unlock history live when they rate via the panel on the same page
  useEffect(() => {
    const onRated = () => setHasRated(true);
    window.addEventListener('pinhigh:rated', onRated);
    return () => window.removeEventListener('pinhigh:rated', onRated);
  }, []);

  const holesTotal = useMemo(
    () => Object.values(holes).reduce((s, v) => s + (parseInt(v, 10) || 0), 0),
    [holes]
  );
  const holesFilled = useMemo(
    () => Object.values(holes).filter((v) => parseInt(v, 10) > 0).length,
    [holes]
  );
  // Par of the holes filled so far, so the running score-to-par makes sense
  const filledPar = useMemo(
    () => scorecard.reduce((s, h) => s + (parseInt(holes[h.hole], 10) > 0 ? h.par : 0), 0),
    [holes, scorecard]
  );
  const toPar = holesTotal - filledPar;
  const toParStr = toPar === 0 ? 'E' : toPar > 0 ? `+${toPar}` : `${toPar}`;

  async function saveRound() {
    if (!user) return;
    const usingHoles = hasCard && holesFilled === scorecard.length;
    const score = usingHoles ? holesTotal : parseInt(total, 10);
    if (!score || score < 18 || score > 200) {
      setNote('Enter a valid total score (18–200).');
      return;
    }
    setBusy(true);
    setNote(null);
    const tee = tees[parseInt(teeIdx, 10)] || null;
    const { error } = await supabase.from('rounds').insert({
      user_id: user.id,
      course_id: course.id,
      played_at: playedAt,
      total_score: score,
      hole_scores: usingHoles
        ? Object.fromEntries(scorecard.map((h) => [h.hole, parseInt(holes[h.hole], 10)]))
        : null,
      tee_name: tee ? tee.tee : null,
      course_rating: tee ? tee.course_rating : null,
      slope: tee ? tee.slope : null,
    });
    setBusy(false);
    if (error) {
      setNote('Could not save the round — try again.');
      return;
    }
    setHoles({});
    setTotal('');
    setEntryOpen(false);
    setNote(hasRated ? 'Round saved.' : 'Round saved — rate this course to see your scoring history.');
    // refresh history
    const { data: rd } = await supabase.from('rounds')
      .select('id, played_at, total_score, hole_scores')
      .eq('user_id', user.id).eq('course_id', course.id)
      .order('played_at', { ascending: false }).limit(30);
    setRounds(rd || []);
  }

  async function deleteRound(id) {
    if (!confirm('Delete this round?')) return;
    await supabase.from('rounds').delete().eq('id', id);
    setRounds((r) => (r || []).filter((x) => x.id !== id));
  }

  const best = rounds && rounds.length ? Math.min(...rounds.map((r) => r.total_score)) : null;

  return (
    <div className="card" ref={wrapRef}>
      <h2 style={{ marginBottom: 2 }}>
        📋 Scorecard
        {coursePar && (
          <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--muted)' }}> · Par {coursePar}</span>
        )}
      </h2>
      <p className="notice" style={{ marginTop: 2 }}>
        Track your rounds here{hasCard ? ' — hole by hole' : ''}. Your scores are private to you.
      </p>

      {user === undefined ? (
        <p className="notice">Checking sign-in…</p>
      ) : !user ? (
        <p className="notice">
          <Link href="/auth" style={{ textDecoration: 'underline' }}>Sign in</Link> to track your scores here.
        </p>
      ) : (
        <>
          {!entryOpen && (
            <button className="btn btn-gold" onClick={() => { setEntryOpen(true); setNote(null); }}>
              + Log a round
            </button>
          )}

          {entryOpen && (
            <div style={{ marginTop: 10 }}>
              <label className="notice" style={{ display: 'block', marginBottom: 6 }}>
                Date played{' '}
                <input
                  type="date"
                  value={playedAt}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setPlayedAt(e.target.value)}
                  style={{ marginLeft: 6, padding: '9px 10px', border: '1px solid var(--cream-dark)', borderRadius: 8, fontSize: 16 }}
                />
              </label>

              {tees.length > 0 && (
                <label className="notice" style={{ display: 'block', marginBottom: 8 }}>
                  Tees played{' '}
                  <select
                    value={teeIdx}
                    onChange={(e) => setTeeIdx(e.target.value)}
                    style={{ marginLeft: 6, padding: '9px 10px', border: '1px solid var(--cream-dark)', borderRadius: 8, fontSize: 16, background: '#fff', color: 'var(--ink)' }}
                  >
                    {tees.map((t, i) => (
                      <option key={i} value={i}>
                        {t.tee}{t.gender === 'W' ? ' ♀' : ''} · {t.course_rating}/{t.slope}
                      </option>
                    ))}
                  </select>
                  <span style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                    Course rating &amp; slope for this tee — used for your Pin High Number.
                  </span>
                </label>
              )}

              {hasCard ? (
                <>
                  <div className="holes-grid">
                    {scorecard.map((h) => (
                      <label key={h.hole} className="hole-cell">
                        <span className="hole-num">{h.hole}</span>
                        <span className="hole-par">Par {h.par}</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="15"
                          value={holes[h.hole] ?? ''}
                          placeholder={h.par}
                          onChange={(e) => setHoles((s) => ({ ...s, [h.hole]: e.target.value }))}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="run-total">
                    <span className="run-total-label">
                      Running total · {holesFilled}/{scorecard.length} holes
                    </span>
                    <span className="run-total-value">
                      {holesTotal || 0}
                      {holesFilled > 0 && (
                        <span className={`run-total-par ${toPar > 0 ? 'over' : toPar < 0 ? 'under' : 'even'}`}>
                          {toParStr}
                        </span>
                      )}
                    </span>
                  </div>
                  {holesFilled < scorecard.length && (
                    <p className="notice" style={{ margin: '4px 0 0' }}>
                      Fill every hole for a full card, or just enter your total below.
                    </p>
                  )}
                </>
              ) : null}

              {(!hasCard || holesFilled !== scorecard.length) && (
                <label className="notice" style={{ display: 'block', margin: '6px 0' }}>
                  Total score{' '}
                  <input
                    type="number"
                    inputMode="numeric"
                    min="18"
                    max="200"
                    value={total}
                    placeholder="e.g. 87"
                    onChange={(e) => setTotal(e.target.value)}
                    style={{ marginLeft: 6, width: 96, padding: '9px 10px', border: '1px solid var(--cream-dark)', borderRadius: 8, fontSize: 16 }}
                  />
                </label>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-gold" onClick={saveRound} disabled={busy}>
                  {busy ? 'Saving…' : 'Save round'}
                </button>
                <button className="btn" onClick={() => setEntryOpen(false)}>Cancel</button>
              </div>
            </div>
          )}

          {note && <p className="notice" style={{ marginTop: 8 }}>{note}</p>}

          {/* History — unlocked by rating this course */}
          {rounds && rounds.length > 0 && (
            hasRated ? (
              <div style={{ marginTop: 14 }}>
                <p className="notice" style={{ fontWeight: 700, marginBottom: 6 }}>
                  Your rounds here{best ? ` · best: ${best}${coursePar ? ` (${best - coursePar >= 0 ? '+' : ''}${best - coursePar})` : ''}` : ''}
                </p>
                {rounds.map((r) => (
                  <div key={r.id} className="review" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span>
                      <strong>{r.total_score}</strong>
                      {coursePar ? <span className="meta-sub"> ({r.total_score - coursePar >= 0 ? '+' : ''}{r.total_score - coursePar})</span> : null}
                      {r.total_score === best && <span className="badge badge-played" style={{ marginLeft: 8 }}>Best</span>}
                    </span>
                    <span className="meta-sub">
                      {new Date(r.played_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      <button onClick={() => deleteRound(r.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                        delete
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="notice" style={{ marginTop: 14, borderLeft: '3px solid var(--gold)', paddingLeft: 10 }}>
                🔒 You have {rounds.length} round{rounds.length === 1 ? '' : 's'} logged here.{' '}
                <strong>Rate this course</strong> to unlock your scoring history.
              </p>
            )
          )}
        </>
      )}
    </div>
  );
}
