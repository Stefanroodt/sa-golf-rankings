'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PhotoReportButton({ photoId }) {
  const [state, setState] = useState('idle');

  async function report() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setState('signin'); return; }
    await supabase.from('photo_reports').insert({
      photo_id: photoId, reporter_id: u.user.id,
    });
    setState('done');
  }

  if (state === 'done') return <span className="report-link">Reported</span>;
  if (state === 'signin') return <span className="report-link">Sign in to report</span>;
  return <button className="report-link" onClick={report}>Report</button>;
}
