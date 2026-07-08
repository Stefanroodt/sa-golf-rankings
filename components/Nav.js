'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Nav() {
  const [user, setUser] = useState(null);
  const [played, setPlayed] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setPlayed(null); return; }
    (async () => {
      const [{ count: mine }, { count: total }] = await Promise.all([
        supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
      ]);
      if (mine !== null && total !== null) setPlayed({ mine, total });
    })();
  }, [user]);

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="26" height="26" viewBox="0 0 96 96" aria-hidden="true">
            <circle cx="48" cy="48" r="48" fill="#0a2318" />
            <path d="M18,74 Q48,63 78,74" fill="none" stroke="#2c6b4c" strokeWidth="2.5" />
            <ellipse cx="48" cy="78" rx="9" ry="3" fill="#081c13" />
            <rect x="46.5" y="16" width="3" height="62" rx="1.5" fill="#f7f3e9" />
            <polygon points="49.5,16 78,26.5 49.5,37" fill="#c9a227" />
            <circle cx="29" cy="72" r="5.5" fill="#f7f3e9" />
          </svg>
          Pin<span>High</span>
        </Link>
        <div className="nav-links">
          <Link href="/">Rankings</Link>
          <Link href="/19th-holes">19th Holes</Link>
          <Link href="/blog">Blog</Link>
          {user ? (
            <>
              {played && (
                <Link href="/profile" className="played-pill" title="Courses you've played & rated">
                  ⛳ {played.mine}/{played.total}
                </Link>
              )}
              <Link href="/profile" style={{ opacity: 0.9 }}>
                {user.user_metadata?.display_name || user.user_metadata?.full_name || user.email}
              </Link>
              <a
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  await supabase.auth.signOut();
                }}
              >
                Sign out
              </a>
            </>
          ) : (
            <Link href="/auth">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
