'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Nav() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="logo">
          Fairway<span>Rank</span> ZA
        </Link>
        <div className="nav-links">
          <Link href="/">Rankings</Link>
          {user ? (
            <>
              <Link href="/profile" style={{ opacity: 0.9 }}>
                {user.user_metadata?.display_name || user.email}
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
