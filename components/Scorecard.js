'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Digital scorecard: anyone signed in can log a score, but your scoring
// history for a course only unlocks once you've rated that course.
// `returnTo` — if set, saving a round navigates there (e.g. back to /handicap).
export default function Scorecard({ course, scorecard = [], autoOpen = false, returnTo = null }) {
  const router = useRouter();
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
  const [hcp, setHcp] = useState('');
  const [mode, setMode] = useState('full'); // full | front | back
  const wrapRef = useRef(null);

  useEffect(() => {
    if (autoOpen) {
      setEntryOpen(true);
      const t = setTimeout(() => wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
      return () => clearTimeout(t);
    }
  }, [autoOpen]);

  const hasCard = scorecard.length >= 9;
  const is18 = scorecard.length >= 18;
  const coursePar = useMemo(
    () => (hasCard ? scorecard.reduce((s, h) => s + h.par, 0) : null),
    [scorecard, hasCard]
  );

  // The holes being scored right now — full card, or one nine of an 18-hole course
  const activeCard = useMemo(() => {
    if (mode === 'front') return scorecard.filter((h) => h.hole <= 9);
    if (mode === 'back') return scorecard.filter((h) => h.hole >= 10);
    return scorecard;
  }, [scorecard, mode]);

  const hasSI = useMemo(
    () => hasCard && activeCard.length > 0 && activeCard.every((h) => h.stroke_index),
    [activeCard, hasCard]
  );
  const hcpNum = /^-?\d+$/.test(hcp.trim()) ? parseInt(hcp, 10) : null;

  // Strokes received on a hole. Over 9 holes a player gets ~half their handicap,
  // so we scale the divisor to the number of holes being scored.
  const scoringHoles = activeCard.length || 18;
  const strokesFor = (si) => {
    if (hcpNum == null || !si) return 0;
    const H = mode === 'full' ? hcpNum : Math.round(hcpNum / 2); // half strokes on a nine
    if (H >= 0) return Math.floor(H / scoringHoles) + (siRank(si) <= H % scoringHoles ? 1 : 0);
    return siRank(si) > scoringHoles + H ? -1 : 0;
  };
  // Rank the played holes' stroke indexes 1..N so a nine allocates cleanly
  const siRank = useMemo(() => {
    const order = [...activeCard].filter((h) => h.stroke_index).sort((a, b) => a.stroke_index - b.stroke_index);
    const map = {};
    order.forEach((h, i) => { map[h.stroke_index] = i + 1; });
    return (si) => map[si] || si;
  }, [activeCard]);

  useEffect(() => {
    (async () => {
      const { data: teeData } = await supabase
        .from('course_tees')
        .select('tee, gender, par, course_rating, slope')
        .eq('course_id', course.id)
        .order('course_rating', { ascending: false });
      const ts = teeData || [];
      setTees(ts);
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
        supabase.from('rounds').select('id, played_at, total_score, hole_scores, holes_played, nine')
          .eq('user_id', u.user.id).eq('course_id', course.id)
          .order('played_at', { ascending: false }).limit(30),
      ]);
      setHasRated((r || []).length > 0);
      setRounds(rd || []);
    })();
  }, [course.id]);

  useEffect(() => {
    const onRated = () => setHasRated(true);
    window.addEventListener('pinhigh:rated', onRated);
    return () => window.removeEventListener('pinhigh:rated', onRated);
  }, []);

  const holesTotal = useMemo(
    () => activeCard.reduce((s, h) => s + (parseInt(holes[h.hole], 10) || 0), 0),
    [holes, activeCard]
  );
  const holesFilled = useMemo(
    () => activeCard.filter((h) => parseInt(holes[h.hole], 10) > 0).length,
    [holes, activeCard]
  );
  const filledPar = useMemo(
    () => activeCard.reduce((s, h) => s + (parseInt(holes[h.hole], 10) > 0 ? h.par : 0), 0),
    [holes, activeCard]
  );
  const toPar = holesTotal - filledPar;
  const toParStr = toPar === 0 ? 'E' : toPar > 0 ? `+${toPar}` : `${toPar}`;

  const netStats = useMemo(() => {
    if (!hasSI || hcpNum == null) return null;
    let net = 0, pts = 0;
    for (const h of activeCard) {
      const score = parseInt(holes[h.hole], 10);
      if (!(score > 0)) continue;
      const rec = strokesFor(h.stroke_index);
      net += score - rec;
      pts += Math.max(0, 2 - (score - rec - h.par));
    }
    return { net, pts };
  }, [holes, activeCard, hasSI, hcpNum]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveRound() {
    if (!user) return;
    const usingHoles = hasCard && activeCard.length > 0 && holesFilled === activeCard.length;
    const score = usingHoles ? holesTotal : parseInt(total, 10);
    const minScore = mode === 'full' ? 18 : 9;
    if (!score || score < minScore || score > 200) {
      setNote(`Enter a valid total score (${minScore}–200).`);
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
      holes_played: mode === 'full' ? 18 : 9,
      nine: mode === 'full' ? null : mode,
      hole_scores: usingHoles
        ? Object.fromEntries(activeCard.map((h) => [h.hole, parseInt(holes[h.hole], 10)]))
        : null,
      tee_name: tee ? tee.tee : null,
      course_rating: tee ? tee.course_rating : null,
      slope: tee ? tee.slope : null,
      playing_handicap: hcpNum,
      points: usingHoles && netStats ? netStats.pts : null,
    });
    setBusy(false);
    if (error) {
      setNote('Could not save the round — try again.');
      return;
    }
    if (returnTo) {
      router.push(returnTo);
      return;
    }
    setHoles({});
    setTotal('');
    setEntryOpen(false);
    setNote(hasRated ? 'Round saved.' : 'Round saved — rate this course to see your scoring history.');
    const { data: rd } = await supabase.from('rounds')
      .select('id, played_at, total_score, hole_scores, holes_played, nine')
      .eq('user_id', user.id).eq('course_id', course.id)
      .order('played_at', { ascending: false }).limit(30);
    setRounds(rd || []);
  }

  async function deleteRound(id) {
    if (!confirm('Delete this round?')) return;
    await supabase.from('rounds').delete().eq('id', id);
    setRounds((r) => (r || []).filter((x) => x.id !== id));
  }

  // Best 18-hole score at this course (9-hole rounds aren't comparable)
  const full18 = (rounds || []).filter((r) => r.holes_played !== 9);
  const best = full18.length ? Math.min(...full18.map((r) => r.total_score)) : null;

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

              {is18 && (
                <div className="holes-switch" role="tablist" aria-label="Holes played">
                  {[['full', '18 holes'], ['front', 'Front 9'], ['back', 'Back 9']].map(([m, label]) => (
                    <button
                      key={m}
                      className={mode === m ? 'active' : ''}
                      onClick={() => { setMode(m); setHoles({}); setTotal(''); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

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
                    {mode === 'full'
                      ? 'Course rating & slope for this tee — used for your Pin High Number.'
                      : 'For a nine we use half the course rating and the same slope — your Number counts it as an 18-hole equivalent.'}
                  </span>
                </label>
              )}

              {hasSI && (
                <label className="notice" style={{ display: 'block', marginBottom: 8 }}>
                  Playing handicap{' '}
                  <input
                    type="number"
                    inputMode="numeric"
                    min="-10"
                    max="54"
                    value={hcp}
                    placeholder="e.g. 14"
                    onChange={(e) => setHcp(e.target.value)}
                    style={{ marginLeft: 6, width: 80, padding: '9px 10px', border: '1px solid var(--cream-dark)', borderRadius: 8, fontSize: 16 }}
                  />
                  <span style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                    Optional — adds your net score and Stableford points as you go
                    {mode !== 'full' ? ' (half strokes over nine holes)' : ''}.
                  </span>
                </label>
              )}

              {hasCard ? (
                <>
                  <div className="holes-grid">
                    {activeCard.map((h) => (
                      <label key={h.hole} className="hole-cell">
                        <span className="hole-num">{h.hole}</span>
                        <span className="hole-par">
                          Par {h.par}{h.stroke_index ? ` · S${h.stroke_index}` : ''}
                          {hcpNum != null && h.stroke_index && strokesFor(h.stroke_index) > 0 ? (
                            <span className="hole-dots">{'•'.repeat(Math.min(3, strokesFor(h.stroke_index)))}</span>
                          ) : null}
                        </span>
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
                      Running total · {holesFilled}/{activeCard.length} holes
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
                  {netStats && holesFilled > 0 && (
                    <div className="run-net">
                      <span>Net <strong>{netStats.net}</strong></span>
                      <span>Stableford <strong>{netStats.pts} pts</strong></span>
                    </div>
                  )}
                  {holesFilled < activeCard.length && (
                    <p className="notice" style={{ margin: '4px 0 0' }}>
                      Fill every hole for a full card, or just enter your total below.
                    </p>
                  )}
                </>
              ) : null}

              {(!hasCard || holesFilled !== activeCard.length) && (
                <label className="notice" style={{ display: 'block', margin: '6px 0' }}>
                  Total score{mode !== 'full' ? ' (9 holes)' : ''}{' '}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={mode === 'full' ? 18 : 9}
                    max="200"
                    value={total}
                    placeholder={mode === 'full' ? 'e.g. 87' : 'e.g. 44'}
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
                {rounds.map((r) => {
                  const nine = r.holes_played === 9;
                  return (
                    <div key={r.id} className="review" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span>
                        <strong>{r.total_score}</strong>
                        {nine ? (
                          <span className="meta-sub"> · 9 holes{r.nine ? ` (${r.nine})` : ''}</span>
                        ) : coursePar ? (
                          <span className="meta-sub"> ({r.total_score - coursePar >= 0 ? '+' : ''}{r.total_score - coursePar})</span>
                        ) : null}
                        {!nine && r.total_score === best && <span className="badge badge-played" style={{ marginLeft: 8 }}>Best</span>}
                      </span>
                      <span className="meta-sub">
                        {new Date(r.played_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        <button onClick={() => deleteRound(r.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                          delete
                        </button>
                      </span>
                    </div>
                  );
                })}
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
