'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase, CATEGORIES } from '../lib/supabase';

function StarInput({ value, onChange }) {
  return (
    <span className="star-input">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} stars (tap left half for ${n - 0.5})`}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const leftHalf = e.clientX - rect.left < rect.width / 2 && e.clientX !== 0;
            onChange(Math.max(1, leftHalf ? n - 0.5 : n));
          }}
        >
          <span className="star-base">★</span>
          <span
            className="star-fill"
            style={{ width: value >= n ? '100%' : value >= n - 0.5 ? '50%' : '0%' }}
          >
            ★
          </span>
        </button>
      ))}
    </span>
  );
}

export default function RatePanel({
  course,
  kind = 'course',
  categories = CATEGORIES,
  title = 'Rate this course',
}) {
  const router = useRouter();
  const table = kind === 'nineteenth' ? 'nineteenth_ratings' : 'ratings';
  const inputCats = categories.filter((c) => c.key !== 'overall');
  const empty = Object.fromEntries(inputCats.map((c) => [c.key, 0]));
  const [user, setUser] = useState(undefined);
  const [form, setForm] = useState(empty);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState([]);
  const [prefilled, setPrefilled] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (u.user) {
        const { data: mine } = await supabase
          .from(table).select('*')
          .eq('course_id', course.id).eq('user_id', u.user.id).maybeSingle();
        if (mine) {
          setForm(Object.fromEntries(inputCats.map(({ key }) => [key, Number(mine[key])])));
          setComment(mine.comment || '');
          setHasExisting(true);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  async function submit(e) {
    e.preventDefault();
    setStatus(null);
    const unrated = inputCats.filter(({ key }) => !form[key]).map(({ key }) => key);
    if (unrated.length) {
      setMissing(unrated);
      setStatus({ type: 'error', msg: 'Almost there — the categories marked below still need stars.' });
      return;
    }
    setMissing([]);
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    let result;
    try {
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ kind, course_id: course.id, ...form, comment }),
      });
      result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Something went wrong.');
    } catch (e2) {
      setSaving(false);
      setStatus({ type: 'error', msg: e2.message });
      return;
    }
    setSaving(false);
    let msg = result.suspect
      ? 'Thanks — your rating was recorded and is pending review.'
      : 'Your rating is in. Thanks for shaping the list!';
    if (!result.suspect && kind === 'course') {
      const { count } = await supabase
        .from('ratings').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      const milestones = [
        [1, 'Opening Drive'], [9, 'Front Nine'], [18, 'Back Nine'],
        [50, 'Halfway House'], [100, 'Century Club'], [250, 'Grand Tour'],
      ];
      const hit = milestones.find(([g]) => g === count);
      const next = milestones.find(([g]) => g > (count || 0));
      if (hit) msg = `Badge earned: ${hit[1]}! Your rating is in.`;
      else if (next) msg = `Your rating is in — ${next[0] - count} more for the ${next[1]} badge.`;
    }
    setStatus({ type: 'success', msg });
    setHasExisting(true);
    window.dispatchEvent(new Event('pinhigh:rated'));
    router.refresh();
  }

  async function removeRating() {
    if (!window.confirm(`Remove your ${kind === 'nineteenth' ? '19th hole' : 'course'} rating for ${course.name}? This can't be undone.`)) return;
    setSaving(true);
    const { error } = await supabase
      .from(table).delete()
      .eq('course_id', course.id).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      setStatus({ type: 'error', msg: `Could not remove: ${error.message}` });
      return;
    }
    setForm(empty);
    setComment('');
    setHasExisting(false);
    setStatus({ type: 'success', msg: 'Rating removed.' });
    window.dispatchEvent(new Event('pinhigh:rated'));
    router.refresh();
  }

  const is19 = kind === 'nineteenth';
  return (
    <div className={`card${is19 ? ' card-nineteenth' : ''}`}>
      <span className={`panel-tag${is19 ? ' panel-tag-19' : ''}`}>
        {is19 ? '🍺 The bar' : '⛳ The golf'}
      </span>
      <h2 style={{ marginTop: 6 }}>{title}</h2>
      <p className="notice" style={{ marginTop: 2 }}>
        {is19
          ? 'Separate from the course rating — this one is for the drinks, food and vibe after your round.'
          : 'This rates the golf itself: value, conditions, greens, layout, halfway house and staff.'}
      </p>
      {user === undefined ? (
        <p className="notice">Checking sign-in…</p>
      ) : !user ? (
        <>
          <p className="notice">Sign in to add your rating — it takes 30 seconds.</p>
          <Link href="/auth" className="btn btn-gold">Sign in / create account</Link>
        </>
      ) : (
        <form onSubmit={submit}>
          {!inputCats.some(({ key }) => form[key]) && (
            <p className="notice" style={{ marginTop: 0, marginBottom: 12 }}>
              First rating? Tap the stars for each category — 1 star is poor, 5 is
              world class. Tap a star&apos;s left half for half points (e.g. 4.5).
              Your overall score is calculated automatically.
            </p>
          )}
          {inputCats.map(({ key, label, hint }) => (
            <div className="rate-row" key={key}>
              <label style={missing.includes(key) ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>
                {label}
                {missing.includes(key) && ' *'}
                <span className="tip" tabIndex={0} aria-label={hint}>
                  ⓘ<span className="tip-box">{hint}</span>
                </span>
              </label>
              <StarInput
                value={form[key]}
                onChange={(v) => {
                  setForm((f) => {
                    if (inputCats.every(({ key: k }) => !f[k])) {
                      setPrefilled(true);
                      return Object.fromEntries(inputCats.map(({ key: k }) => [k, v]));
                    }
                    return { ...f, [key]: v };
                  });
                  setMissing([]);
                }}
              />
            </div>
          ))}
          {prefilled && (
            <p className="notice" style={{ marginTop: 4 }}>
              We set every category to your first score — adjust any that differ.
            </p>
          )}
          {inputCats.every(({ key }) => form[key]) && (
            <div className="rate-row" style={{ borderTop: '1px solid var(--cream-dark)', paddingTop: 10 }}>
              <label style={{ fontWeight: 700 }}>Overall</label>
              <span className="score-big" style={{ fontSize: 18 }}>
                {(
                  inputCats.reduce((s, { key }) => s + form[key], 0) / inputCats.length
                ).toFixed(2)}
                <span className="stars" style={{ marginLeft: 8, fontSize: 14 }}>★</span>
              </span>
            </div>
          )}
          <textarea
            placeholder="Optional: a sentence or two…"
            value={comment} onChange={(e) => setComment(e.target.value)} maxLength={600}
          />
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Submit rating'}</button>
          <p className="notice">
            One rating per golfer — submitting again updates yours.
            {hasExisting && (
              <>
                {' '}Rated the wrong course?{' '}
                <button type="button" className="report-link" onClick={removeRating} disabled={saving}>
                  Remove my rating
                </button>
              </>
            )}
          </p>
          {status && <p className={status.type}>{status.msg}</p>}
        </form>
      )}
    </div>
  );
}
