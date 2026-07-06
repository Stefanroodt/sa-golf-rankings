'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase, CATEGORIES } from '../../../lib/supabase';

function StarInput({ value, onChange }) {
  return (
    <span className="star-input">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= value ? 'on' : ''}
          onClick={() => onChange(n)}
          aria-label={`${n} stars`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

const emptyRating = { overall: 0, value: 0, conditions: 0, layout: 0, pace: 0, staff: 0 };

export default function CoursePage() {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyRating);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState(null); // {type:'error'|'success', msg}
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function load() {
    const { data: c } = await supabase.from('courses').select('*').eq('slug', slug).single();
    if (!c) { setNotFound(true); return; }
    setCourse(c);
    const { data: r } = await supabase
      .from('ratings')
      .select('*')
      .eq('course_id', c.id)
      .order('created_at', { ascending: false });
    setRatings(r || []);
    const { data: u } = await supabase.auth.getUser();
    setUser(u.user);
    if (u.user && r) {
      const mine = r.find((x) => x.user_id === u.user.id);
      if (mine) {
        setForm({
          overall: mine.overall, value: mine.value, conditions: mine.conditions,
          layout: mine.layout, pace: mine.pace, staff: mine.staff,
        });
        setComment(mine.comment || '');
      }
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  const avg = (key) =>
    ratings.length ? ratings.reduce((s, r) => s + r[key], 0) / ratings.length : 0;

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
      load();
    }
  }

  if (notFound) return <div className="container"><p className="notice" style={{ margin: '40px 0' }}>Course not found. <Link href="/">Back to rankings</Link></p></div>;
  if (!course) return <div className="container"><p className="notice" style={{ margin: '40px 0' }}>Loading…</p></div>;

  return (
    <>
      <section className="course-head">
        <div className="container">
          <Link href="/" className="back-link">← Back to rankings</Link>
          <h1>{course.name}</h1>
          <div className="meta">
            {course.town}, {course.province}
            {course.designer ? ` · Designed by ${course.designer}` : ''} · {course.access}
          </div>
        </div>
      </section>

      <div className="container two-col">
        <div>
          <div className="card">
            <h2>About</h2>
            <p style={{ fontSize: 14 }}>{course.description}</p>
          </div>

          <div className="card">
            <h2>
              Golfer ratings{' '}
              <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--muted)' }}>
                ({ratings.length} rating{ratings.length === 1 ? '' : 's'})
              </span>
            </h2>
            {ratings.length === 0 && (
              <p className="notice">No ratings yet — be the first to rate this course.</p>
            )}
            {ratings.length > 0 &&
              CATEGORIES.map(({ key, label }) => (
                <div className="cat-row" key={key}>
                  <span className="cat-label">{label}</span>
                  <div className="cat-bar">
                    <div className="cat-fill" style={{ width: `${(avg(key) / 5) * 100}%` }} />
                  </div>
                  <span className="cat-val">{avg(key).toFixed(1)}</span>
                </div>
              ))}
          </div>

          {ratings.some((r) => r.comment) && (
            <div className="card">
              <h2>What golfers say</h2>
              {ratings.filter((r) => r.comment).map((r) => (
                <div className="review" key={r.id}>
                  <span className="who">
                    {r.display_name}
                    <span className="stars" style={{ marginLeft: 8 }}>
                      {'★'.repeat(r.overall)}
                    </span>
                    <span className="when">
                      {new Date(r.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' })}
                    </span>
                  </span>
                  <p>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <h2>Rate this course</h2>
            {!user ? (
              <>
                <p className="notice">Sign in to add your rating — it takes 30 seconds.</p>
                <Link href="/auth" className="btn btn-gold">Sign in / create account</Link>
              </>
            ) : (
              <form onSubmit={submit}>
                {CATEGORIES.map(({ key, label }) => (
                  <div className="rate-row" key={key}>
                    <label>{label}</label>
                    <StarInput
                      value={form[key]}
                      onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                    />
                  </div>
                ))}
                <textarea
                  placeholder="Optional: a sentence or two about your round…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={600}
                />
                <button className="btn" disabled={saving}>
                  {saving ? 'Saving…' : 'Submit rating'}
                </button>
                <p className="notice">One rating per golfer per course — submitting again updates yours.</p>
                {status && <p className={status.type}>{status.msg}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
