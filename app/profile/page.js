'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { computeBadges, earnedBadges } from '../../lib/badges';
import BadgeGrid from '../../components/BadgeGrid';

function weekKey(d) {
  const date = new Date(d);
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const week = Math.floor(((date - jan1) / 86400000 + jan1.getDay()) / 7);
  return `${date.getFullYear()}-${week}`;
}

function computeStreak(dates) {
  if (!dates.length) return 0;
  const weeks = new Set(dates.map(weekKey));
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 520; i++) {
    const d = new Date(now.getTime() - i * 7 * 86400000);
    if (weeks.has(weekKey(d))) streak++;
    else if (i > 0) break;
    else if (!weeks.has(weekKey(d))) break;
  }
  return streak;
}

export default function ProfilePage() {
  const [user, setUser] = useState(undefined);
  const [ratings, setRatings] = useState([]);
  const [total, setTotal] = useState(null);
  const [n19, setN19] = useState(0);
  const [dates19, setDates19] = useState([]);
  const [nPhotos, setNPhotos] = useState(0);
  const [nFirsts, setNFirsts] = useState(0);
  const [provinceTotals, setProvinceTotals] = useState({});
  const [myPhotos, setMyPhotos] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (u.user) {
        const [{ data: r }, { count }, { data: r19 }, { count: photos }, { data: allCourses }, { count: firsts }] =
          await Promise.all([
            supabase
              .from('ratings')
              .select('overall, comment, created_at, course_id, courses(name, slug, town, province)')
              .eq('user_id', u.user.id)
              .order('created_at', { ascending: false }),
            supabase.from('courses').select('id', { count: 'exact', head: true }),
            supabase.from('nineteenth_ratings').select('created_at').eq('user_id', u.user.id),
            supabase.from('photos').select('id', { count: 'exact', head: true }).eq('user_id', u.user.id),
            supabase.from('courses').select('province'),
            supabase.from('first_raters').select('course_id', { count: 'exact', head: true }).eq('user_id', u.user.id),
          ]);
        const { data: ph } = await supabase
          .from('photos').select('id, path, course_id')
          .eq('user_id', u.user.id).eq('hidden', false)
          .order('created_at', { ascending: false });
        setMyPhotos(ph || []);
        setRatings(r || []);
        setTotal(count);
        setN19((r19 || []).length);
        setDates19((r19 || []).map((x) => x.created_at));
        setNPhotos(photos || 0);
        setNFirsts(firsts || 0);
        const totals = {};
        for (const c of allCourses || []) totals[c.province] = (totals[c.province] || 0) + 1;
        setProvinceTotals(totals);
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
          <p className="notice">Sign in to see your ratings, badges and played-courses list.</p>
          <Link href="/auth" className="btn btn-gold">Sign in / create account</Link>
        </div>
      </div>
    );

  const n = ratings.length;
  const byProvince = {};
  for (const r of ratings) {
    const p = r.courses?.province;
    if (p) byProvince[p] = (byProvince[p] || 0) + 1;
  }
  const streak = computeStreak([...ratings.map((r) => r.created_at), ...dates19]);
  const badges = computeBadges({ n, n19, nPhotos, byProvince, provinceTotals, nFirsts });
  const earned = earnedBadges(badges);

  const PHOTO_BASE = 'https://mwotoycsaphyipbgyecn.supabase.co/storage/v1/object/public/course-photos/';
  const photosByCourse = {};
  for (const p of myPhotos) {
    (photosByCourse[p.course_id] = photosByCourse[p.course_id] || []).push(p);
  }
  const ratedCourseIds = new Set(ratings.map((r) => r.course_id));
  const unattachedPhotos = myPhotos.filter((p) => !ratedCourseIds.has(p.course_id));

  return (
    <>
      <section className="course-head">
        <div className="container">
          <h1>{user.user_metadata?.display_name || user.user_metadata?.full_name || user.email}</h1>
          <div className="meta">
            {n} course{n === 1 ? '' : 's'} played &amp; rated{total ? ` of ${total}` : ''} ·{' '}
            {earned.length} badge{earned.length === 1 ? '' : 's'}
            {streak > 1 ? ` · ${streak}-week rating streak` : ''}
          </div>
          {total > 0 && (
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (n / total) * 100)}%` }}
              />
            </div>
          )}
          <p style={{ marginTop: 10 }}>
            <Link href="/my-courses" style={{ color: 'var(--gold)', textDecoration: 'underline', fontSize: 14 }}>
              See your full course card — rated and still to rate →
            </Link>
          </p>
        </div>
      </section>
      <div className="container" style={{ margin: '28px auto 60px' }}>
        <div className="card">
          <h2>
            Badges{' '}
            <Link href="/leaderboard" style={{ fontSize: 13, fontWeight: 400, textDecoration: 'underline', color: 'var(--muted)' }}>
              — see the leaderboard
            </Link>
          </h2>
          <BadgeGrid badges={badges} />
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <h2>Your ratings</h2>
          {ratings.length === 0 && (
            <p className="notice">
              Nothing yet — find a course you&apos;ve played on the{' '}
              <Link href="/rate" style={{ textDecoration: 'underline' }}>rate page</Link> and get your first badge.
            </p>
          )}
          {ratings.map((r, i) => (
            <div className="review" key={i}>
              <span className="who">
                <Link href={`/course/${r.courses.slug}`} style={{ textDecoration: 'underline' }}>
                  {r.courses.name}
                </Link>
                <span className="stars" style={{ marginLeft: 8 }}>{'★'.repeat(Math.round(r.overall))}</span>
                <span className="when">
                  {r.courses.town}, {r.courses.province} · {new Date(r.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' })}
                </span>
              </span>
              {r.comment && <p>{r.comment}</p>}
              {photosByCourse[r.course_id]?.length > 0 && (
                <div className="mini-thumbs">
                  {photosByCourse[r.course_id].map((p) => (
                    <a key={p.id} href={PHOTO_BASE + p.path} target="_blank" rel="noopener noreferrer">
                      <img src={PHOTO_BASE + p.path} alt="Your photo" loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {unattachedPhotos.length > 0 && (
          <div className="card" style={{ marginTop: 18 }}>
            <h2>Your other photos</h2>
            <p className="notice" style={{ marginTop: 0 }}>
              Uploaded at courses you haven&apos;t rated yet.
            </p>
            <div className="mini-thumbs">
              {unattachedPhotos.map((p) => (
                <a key={p.id} href={PHOTO_BASE + p.path} target="_blank" rel="noopener noreferrer">
                  <img src={PHOTO_BASE + p.path} alt="Your photo" loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
