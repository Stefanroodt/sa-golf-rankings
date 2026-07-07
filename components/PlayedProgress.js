'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PlayedProgress() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ count: mine }, { count: total }] = await Promise.all([
        supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('user_id', u.user.id),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
      ]);
      if (mine !== null && total) setStats({ mine, total });
    })();
  }, []);

  if (!stats) return null;

  return (
    <Link href="/profile" className="played-progress">
      <span className="played-progress-label">
        {stats.mine}/{stats.total} courses rated and played
      </span>
      <span className="progress-track on-light">
        <span
          className="progress-fill"
          style={{ width: `${Math.min(100, (stats.mine / stats.total) * 100)}%` }}
        />
      </span>
    </Link>
  );
}
