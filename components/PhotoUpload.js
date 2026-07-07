'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

async function resizeImage(file, maxDim = 1600, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export default function PhotoUpload({ courseId }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [user, setUser] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(null);
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', msg: 'Please choose an image file.' });
      return;
    }
    setBusy(true);
    try {
      const blob = await resizeImage(file);
      const path = `${courseId}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('course-photos')
        .upload(path, blob, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const { error: rowErr } = await supabase.from('photos').insert({
        course_id: courseId,
        user_id: user.id,
        display_name: user.user_metadata?.display_name || user.email.split('@')[0],
        path,
      });
      if (rowErr) throw rowErr;
      setStatus({ type: 'success', msg: 'Photo added — thanks!' });
      router.refresh();
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Upload failed.' });
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="card">
      <h2>Add a photo</h2>
      {user === undefined ? (
        <p className="notice">Checking sign-in…</p>
      ) : !user ? (
        <>
          <p className="notice">Sign in to share a photo of this course.</p>
          <Link href="/auth" className="btn">Sign in</Link>
        </>
      ) : (
        <>
          <p className="notice" style={{ marginTop: 0 }}>
            Played here recently? Share the view — photos are resized
            automatically.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={busy}
            style={{ fontSize: 13 }}
          />
          {busy && <p className="notice">Uploading…</p>}
          {status && <p className={status.type}>{status.msg}</p>}
        </>
      )}
    </div>
  );
}
