'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { canSeeHandicap } from '../lib/handicap';

export default function Nav() {
  const [user, setUser] = useState(null);
  const [played, setPlayed] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Keep our own in-app trail so "Back" never leaves the site
  // (browser history may point at whatever page the visitor came from).
  useEffect(() => {
    try {
      const url = window.location.pathname + window.location.search;
      const st = JSON.parse(sessionStorage.getItem('ph-stack') || '[]');
      if (st[st.length - 1] !== url) {
        st.push(url);
        sessionStorage.setItem('ph-stack', JSON.stringify(st.slice(-25)));
      }
    } catch {}
  }, [pathname]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setPlayed(null); return; }
    const fetchCounts = async () => {
      const [{ count: mine }, { count: total }] = await Promise.all([
        supabase
          .from('ratings')
          .select('id, courses!inner(id)', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('courses.country', 'South Africa')
          .eq('courses.hide_from_rankings', false),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('country', 'South Africa').eq('hide_from_rankings', false),
      ]);
      if (mine !== null && total !== null) setPlayed({ mine, total });
    };
    fetchCounts();
    window.addEventListener('pinhigh:rated', fetchCounts);
    return () => window.removeEventListener('pinhigh:rated', fetchCounts);
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
          <Link href="/scorecard">Scorecard</Link>
          {user && canSeeHandicap(user.email) && <Link href="/handicap">Pin High Number</Link>}
          {user ? (
            <>
              <span className="nav-user-wrap">
                <button
                  type="button"
                  className="played-pill"
                  onClick={() => setMenuOpen((o) => !o)}
                  title="Your badges, ratings and courses"
                >
                  ⛳ {user.user_metadata?.display_name || user.user_metadata?.full_name || user.email.split('@')[0]}
                  {played ? ` · ${played.mine}/${played.total}` : ''}
                </button>
                {menuOpen && (
                  <>
                    <span className="nav-menu-backdrop" onClick={() => setMenuOpen(false)} />
                    <span className="nav-menu">
                      <Link href="/profile" className="chip" onClick={() => setMenuOpen(false)}>
                        🏅 Badges
                      </Link>
                      <Link href="/my-courses" className="chip" onClick={() => setMenuOpen(false)}>
                        ⛳ Ratings, Courses &amp; Scores
                      </Link>
                      {canSeeHandicap(user.email) && (
                        <Link href="/handicap" className="chip" onClick={() => setMenuOpen(false)}>
                          🏌️ Pin High Number
                        </Link>
                      )}
                    </span>
                  </>
                )}
              </span>
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
