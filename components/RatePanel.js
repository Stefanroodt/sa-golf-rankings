'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase, CATEGORIES } from '../lib/supabase';

function StarInput({ value, onChange }) {
  return (
    <span className="star-input">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={n <= value ? 'on' : ''}
          onClick={() => onChange(n)} aria-label={`${n} stars`}>★</button>
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
  const empty = Object.fromEntries(categories.map((c) => [c.key, 0]));
  const [user, setUser] = useState(undefined);
  const [form, setForm] = useState(empty);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (u.user) {
        const { data: mine } = await supabase
          .from(table).select('*')
          .eq('course_id', course.id).eq('user_id', u.user.id).maybeSingle();
        if (mine) {
          setForm(Object.fromEntries(categories.map(({ key }) => [key, Number(mine[key])])));
          setComment(mine.comment || '');
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  async function submit(e) {
    e.preventDefault();
    setStatus(null);
    const unrated = categories.filter(({ key }) => !form[key]).map(({ key }) => key);
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
    setStatus({
      type: 'success',
      msg: result.suspect
        ? 'Thanks — your rating was recorded and is pending review.'
        : 'Your rating is in. Thanks for shaping the list!',
    });
    router.refresh();
  }

  return (
    <div className="card">
      <h2>{title}</h2>
      {user === undefined ? (
        <p className="notice">Checking sign-in…</p>
      ) : !user ? (
        <>
          <p className="notice">Sign in to add your rating — it takes 30 seconds.</p>
          <Link href="/auth" className="btn btn-gold">Sign in / create account</Link>
        </>
      ) : (
        <form onSubmit={submit}>
          {!categories.some(({ key }) => form[key]) && (
            <p className="notice" style={{ marginTop: 0, marginBottom: 12 }}>
              First rating? Tap the stars for each category — 1 star is poor, 5 is
              world class. Hover the ⓘ if you&apos;re unsure what something means.
            </p>
          )}
          {categories.map(({ key, label, hint }) => (
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
                  setForm((f) => ({ ...f, [key]: v }));
                  setMissing((m) => m.filter((k) => k !== key));
                }}
              />
            </div>
          ))}
          <textarea
            placeholder="Optional: a sentence or two…"
            value={comment} onChange={(e) => setComment(e.target.value)} maxLength={600}
          />
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Submit rating'}</button>
          <p className="notice">One rating per golfer — submitting again updates yours.</p>
          {status && <p className={status.type}>{status.msg}</p>}
        </form>
      )}
    </div>
  );
}
