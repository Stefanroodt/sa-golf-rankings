'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

async function resizeImage(file, maxDim = 1600, quality = 0.82) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      'This photo format isn\'t supported by your browser (iPhone HEIC photos often aren\'t). Please convert it to JPEG or PNG and try again.'
    );
  }
  if (!bitmap.width || !bitmap.height) throw new Error('Could not read this image — try a different photo.');
  for (const dim of [maxDim, 1200, 800]) {
    const scale = Math.min(1, dim / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size > 0 && blob.size < 4.5 * 1024 * 1024) return blob;
  }
  throw new Error('Could not process this image — try a smaller photo.');
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
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setStatus(null);
    setBusy(true);
    let ok = 0;
    let failMsg = null;
    for (let i = 0; i < files.length; i++) {
      setStatus({ type: 'success', msg: `Uploading ${i + 1} of ${files.length}…` });
      try {
        const blob = await resizeImage(files[i]);
        if (!blob) throw new Error('could not process this image');
        const path = `${courseId}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from('course-photos')
          .upload(path, blob, { contentType: 'image/jpeg' });
        if (upErr) throw upErr;
        const { error: rowErr } = await supabase.from('photos').insert({
          course_id: courseId,
          user_id: user.id,
          display_name:
            user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            user.email.split('@')[0],
          path,
        });
        if (rowErr) throw rowErr;
        ok++;
      } catch (err) {
        failMsg = err?.message || err?.error || 'upload failed';
      }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
    if (ok && !failMsg) {
      setStatus({ type: 'success', msg: ok === 1 ? 'Photo added — thanks!' : `${ok} photos added — thanks!` });
    } else if (ok && failMsg) {
      setStatus({ type: 'success', msg: `${ok} added, some failed (${failMsg}).` });
    } else {
      setStatus({ type: 'error', msg: `Upload failed: ${failMsg}` });
    }
    if (ok) router.refresh();
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
            multiple
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
