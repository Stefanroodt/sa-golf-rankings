'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name.trim() || email.split('@')[0] } },
      });
      setBusy(false);
      if (error) return setStatus({ type: 'error', msg: error.message });
      if (data.session) router.push('/');
      else setStatus({ type: 'success', msg: 'Check your email to confirm your account, then sign in.' });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setStatus({ type: 'error', msg: error.message });
      router.push('/');
    }
  }

  return (
    <div className="container auth-wrap">
      <div className="card">
        <div className="tabs">
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>
            Sign in
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            Create account
          </button>
        </div>
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <input
              placeholder="Display name (shown with your ratings)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn" disabled={busy} style={{ width: '100%', marginTop: 4 }}>
            {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
          {status && <p className={status.type}>{status.msg}</p>}
        </form>
      </div>
    </div>
  );
}
