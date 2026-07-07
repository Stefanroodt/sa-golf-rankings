'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ReportButton({ ratingId }) {
  const [state, setState] = useState('idle'); // idle | done | error

  async function report() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setState('error'); return; }
    const { error } = await supabase.from('reports').insert({
      rating_id: ratingId, reporter_id: u.user.id,
    });
    setState(error ? 'done' : 'done'); // duplicate reports also read as done
  }

  if (state === 'done') return <span className="report-link">Reported — thanks</span>;
  if (state === 'error') return <span className="report-link">Sign in to report</span>;
  return (
    <button className="report-link" onClick={report}>Report</button>
  );
}
