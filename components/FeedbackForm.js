'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('feedback').insert({
      message: message.trim(),
      email: email.trim() || u.user?.email || null,
      user_id: u.user?.id || null,
    });
    setBusy(false);
    if (error) setStatus({ type: 'error', msg: 'Could not send — try again.' });
    else {
      setStatus({ type: 'success', msg: 'Thanks — feedback received!' });
      setMessage('');
      setEmail('');
      setTimeout(() => { setOpen(false); setStatus(null); }, 1500);
    }
  }

  return (
    <>
      <button className="hero-feedback" onClick={() => setOpen(true)}>
        Give feedback
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
            <h2>Help make Pin High better</h2>
            <p className="notice" style={{ marginTop: 4 }}>
              Wrong course detail? Missing course? An idea? Tell us.
            </p>
            <form onSubmit={submit}>
              <textarea
                placeholder="Your feedback…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                autoFocus
                required
              />
              <input
                type="email"
                placeholder="Email (optional, if you'd like a reply)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid var(--cream-dark)',
                  borderRadius: 8, fontSize: 14, marginTop: 8,
                }}
              />
              <button className="btn" disabled={busy || !message.trim()}>
                {busy ? 'Sending…' : 'Send feedback'}
              </button>
              {status && <p className={status.type}>{status.msg}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
