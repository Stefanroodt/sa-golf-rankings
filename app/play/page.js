'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { canSeeHandicap } from '../../lib/handicap';
import Onboarding from '../../components/Onboarding';

const HUB_STEPS = [
  {
    sel: null,
    title: 'Welcome to Pin High 👋',
    text: 'This is your home base. Quick tour of what you can do — it takes 20 seconds.',
    next: 'Show me',
  },
  {
    sel: '.hub-menu a[href^="/scorecard"]',
    title: 'Score your rounds 📋',
    text: 'Real hole-by-hole scorecards for 170+ courses. Track every round and see your best at each course.',
  },
  {
    sel: '.hub-btn-group',
    title: 'Play a group round 👥',
    text: 'One scorer captures the whole fourball. Share the code and everyone follows a live leaderboard — gross, net &amp; Stableford points, updating shot by shot.',
  },
  {
    sel: '.hub-menu a[href="/"]',
    title: 'Rate the courses you play ★',
    text: 'Score them on condition, greens, layout, value and more. Every rating moves the national rankings — and earns you badges.',
  },
  {
    sel: '.hub-btn-handicap',
    title: 'Your Pin High Number 🏌️',
    text: 'One reliable number that tracks your game, built from your logged rounds using official course ratings. Log 3 rounds and your number appears.',
  },
  {
    sel: '.played-pill',
    title: 'Everything you, up here 🏅',
    text: 'Tap your name any time for your badges, ratings, courses and scores.',
    next: 'Got it — let&#39;s play',
  },
];

export default function PlayHub() {
  const [name, setName] = useState(null);
  const [canHandicap, setCanHandicap] = useState(false);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        setName(u.user_metadata?.display_name || u.user_metadata?.full_name || u.email.split('@')[0]);
        setCanHandicap(canSeeHandicap(u.email));
        setUid(u.id);
      }
    });
  }, []);

  return (
    <div className="container hub-wrap">
      {uid && <Onboarding steps={HUB_STEPS} storageKey={`ph-hub-tour-v2-${uid}`} />}
      <h1 className="hub-title">{name ? `Welcome back, ${name}.` : 'Welcome to Pin High.'}</h1>
      <p className="hub-sub">What are we doing today?</p>

      <div className="hub-menu">
        <Link href="/scorecard" className="hub-btn">
          <span className="hub-btn-title">Scorecard</span>
          <span className="hub-btn-sub">Start scoring your round</span>
        </Link>

        <Link href="/group" className="hub-btn hub-btn-group">
          <span className="hub-btn-title">Group round 👥</span>
          <span className="hub-btn-sub">Score a fourball · live leaderboard</span>
        </Link>

        <Link href="/" className="hub-btn">
          <span className="hub-btn-title">Course Ratings</span>
          <span className="hub-btn-sub">Rate &amp; browse courses</span>
        </Link>

        {canHandicap ? (
          <Link href="/handicap" className="hub-btn hub-btn-handicap">
            <span className="hub-btn-title">Pin High Number</span>
            <span className="hub-btn-sub">The number that tracks your game — preview</span>
          </Link>
        ) : (
          <span className="hub-btn hub-btn-soon hub-btn-handicap" aria-disabled="true">
            <span className="hub-btn-title">Pin High Number</span>
            <span className="hub-btn-sub">The number that tracks your game — coming soon</span>
          </span>
        )}
      </div>

      <p className="hub-foot">
        <Link href="/my-courses" style={{ textDecoration: 'underline' }}>Your ratings, courses &amp; scores →</Link>
      </p>
    </div>
  );
}
