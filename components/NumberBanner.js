'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Homepage banner: Pin High Number early interest — captures an email.
export default function NumberBanner() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [err, setErr] = useState(null);
  const [uid, setUid] = useState(null);

  // Hide permanently once they've signed up (flag set on success)
  useEffect(() => {
    try {
      setHidden(!!localStorage.getItem('ph-number-interest'));
    } catch {
      setHidden(false);
    }
  }, []);

  // Prefill for signed-in golfers
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email);
        setUid(data.user.id);
      }
    });
  }, []);

  async function submit(e) {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(em)) {
      setErr('That email doesn&apos;t look right — try again.');
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await supabase.from('number_interest').insert({ email: em, user_id: uid });
    setBusy(false);
    // Unique violation = already signed up — treat as success
    if (error && error.code !== '23505') {
      setErr('Could not save that — try again.');
      return;
    }
    try { localStorage.setItem('ph-number-interest', '1'); } catch {}
    setDone(true);
  }

  if (hidden) return null;

  return (
    <div className="number-banner">
      {done ? (
        <p className="nb-done">⛳ You&apos;re on the list — we&apos;ll be in touch soon.</p>
      ) : !open ? (
        <button className="nb-cta" onClick={() => setOpen(true)}>
          <span className="nb-text">
            <strong>🏌️ The Pin High Number is here.</strong> One reliable number that tracks your
            game — built from your rounds and the real difficulty of the courses you play.
          </span>
          <span className="nb-btn">I&apos;m interested →</span>
        </button>
      ) : (
        <form className="nb-form" onSubmit={submit}>
          <input
            type="email"
            inputMode="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <button type="submit" className="nb-btn" disabled={busy}>
            {busy ? 'Saving…' : 'Count me in'}
          </button>
          {err && <span className="nb-err" dangerouslySetInnerHTML={{ __html: err }} />}
        </form>
      )}
    </div>
  );
}
