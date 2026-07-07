'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ProfilePage() {
  const [user, setUser] = useState(undefined);
  const [ratings, setRatings] = useState([]);
  const [total, setTotal] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (u.user) {
        const [{ data: r }, { count }] = await Promise.all([
          supabase
            .from('ratings')
            .select('overall, comment, created_at, courses(name, slug, town, province)')
            .eq('user_id', u.user.id)
            .order('created_at', { ascending: false }),
          supabase.from('courses').select('id', { count: 'exact', head: true }),
        ]);
        setRatings(r || []);
        setTotal(count);
      }
    })();
  }, []);

  if (user === undefined)
    return <div className="container"><p className="notice" style={{ margin: '40px 0' }}>Loading…</p></div>;
  if (!user)
    return (
      <div className="container auth-wrap">
        <div className="card">
          <h2>Your profile</h2>
          <p className="notice">Sign in to see your ratings and played-courses list.</p>
          <Link href="/auth" className="btn btn-gold">Sign in / create account</Link>
        </div>
      </div>
    );

  return (
    <>
      <section className="course-head">
        <div className="container">
          <h1>{user.user_metadata?.display_name || user.email}</h1>
          <div className="meta">
            {ratings.length} course{ratings.length === 1 ? '' : 's'} played &amp; rated
            {total ? ` of ${total}` : ''}
          </div>
          {total > 0 && (
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (ratings.length / total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </section>
      <div className="container" style={{ margin: '28px auto 60px' }}>
        <div className="card">
          <h2>Your ratings</h2>
          {ratings.length === 0 && (
            <p className="notice">
              Nothing yet — find a course you&apos;ve played on the <Link href="/" style={{ textDecoration: 'underline' }}>rankings</Link> and rate it.
            </p>
          )}
          {ratings.map((r, i) => (
            <div className="review" key={i}>
              <span className="who">
                <Link href={`/course/${r.courses.slug}`} style={{ textDecoration: 'underline' }}>
                  {r.courses.name}
                </Link>
                <span className="stars" style={{ marginLeft: 8 }}>{'★'.repeat(r.overall)}</span>
                <span className="when">
                  {r.courses.town}, {r.courses.province} · {new Date(r.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' })}
                </span>
              </span>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
