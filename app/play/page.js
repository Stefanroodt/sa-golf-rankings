'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { canSeeHandicap } from '../../lib/handicap';

export default function PlayHub() {
  const [name, setName] = useState(null);
  const [canHandicap, setCanHandicap] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        setName(u.user_metadata?.display_name || u.user_metadata?.full_name || u.email.split('@')[0]);
        setCanHandicap(canSeeHandicap(u.email));
      }
    });
  }, []);

  return (
    <div className="container hub-wrap">
      <h1 className="hub-title">{name ? `Welcome back, ${name}.` : 'Welcome to Pin High.'}</h1>
      <p className="hub-sub">What are we doing today?</p>

      <div className="hub-menu">
        <Link href="/scorecard" className="hub-btn">
          <span className="hub-btn-title">Scorecard</span>
          <span className="hub-btn-sub">Start scoring your round</span>
        </Link>

        <Link href="/" className="hub-btn">
          <span className="hub-btn-title">Course Ratings</span>
          <span className="hub-btn-sub">Rate &amp; browse courses</span>
        </Link>

        {canHandicap ? (
          <Link href="/handicap" className="hub-btn">
            <span className="hub-btn-title">Pin High Number</span>
            <span className="hub-btn-sub">Your handicap — preview</span>
          </Link>
        ) : (
          <span className="hub-btn hub-btn-soon" aria-disabled="true">
            <span className="hub-btn-title">Pin High Number</span>
            <span className="hub-btn-sub">Your handicap — coming soon</span>
          </span>
        )}
      </div>

      <p className="hub-foot">
        <Link href="/my-courses" style={{ textDecoration: 'underline' }}>Your ratings, courses &amp; scores →</Link>
      </p>
    </div>
  );
}
