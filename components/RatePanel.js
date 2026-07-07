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

const empty = { overall: 0, value: 0, conditions: 0, layout: 0, clubhouse: 0, staff: 0 };

export default function RatePanel({ course }) {
  const router = useRouter();
  const [user, setUser] = useState(undefined); // undefined = loading
  const [form, setForm] = useState(empty);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (u.user) {
        const { data: mine } = await supabase
          .from('ratings').select('*')
          .eq('course_id', course.id).eq('user_id', u.user.id).maybeSingle();
        if (mine) {
          setForm({
            overall: mine.overall, value: mine.value, conditions: mine.conditions,
            layout: mine.layout, clubhouse: mine.clubhouse, staff: mine.staff,
          });
          setComment(mine.comment || '');
        }
      }
    })();
  }, [course.id]);

  async function submit(e) {
    e.preventDefault();
    setStatus(null);
    if (CATEGORIES.some(({ key }) => !form[key])) {
      setStatus({ type: 'error', msg: 'Please rate every category (1–5 stars).' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('ratings').upsert(
      {
        course_id: course.id,
        user_id: user.id,
        display_name: user.user_metadata?.display_name || user.email.split('@')[0],
        ...form,
        comment: comment.trim() || null,
      },
      { onConflict: 'course_id,user_id' }
    );
    setSaving(false);
    if (error) setStatus({ type: 'error', msg: error.message });
    else {
      setStatus({ type: 'success', msg: 'Your rating is in. Thanks for shaping the list!' });
      router.refresh();
    }
  }

  return (
    <div className="card">
      <h2>Rate this course</h2>
      {user === undefined ? (
        <p className="notice">Checking sign-in…</p>
      ) : !user ? (
        <>
          <p className="notice">Sign in to add your rating — it takes 30 seconds.</p>
          <Link href="/auth" className="btn btn-gold">Sign in / create account</Link>
        </>
      ) : (
        <form onSubmit={submit}>
          {CATEGORIES.map(({ key, label }) => (
            <div className="rate-row" key={key}>
              <label>{label}</label>
              <StarInput value={form[key]} onChange={(v) => setForm((f) => ({ ...f, [key]: v }))} />
            </div>
          ))}
          <textarea
            placeholder="Optional: a sentence or two about your round…"
            value={comment} onChange={(e) => setComment(e.target.value)} maxLength={600}
          />
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Submit rating'}</button>
          <p className="notice">One rating per golfer per course — submitting again updates yours.</p>
          {status && <p className={status.type}>{status.msg}</p>}
        </form>
      )}
    </div>
  );
}
